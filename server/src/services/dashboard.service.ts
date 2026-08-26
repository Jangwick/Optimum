import type { AuthUser } from '../middleware/auth.js';
import { Prisma } from '../../generated/prisma/client.js';
import type { ProcessStatus } from '../../generated/prisma/client.js';
import { prisma } from '../db/client.js';
import { withRetry } from '../utils/retry.js';
import { referenceDataCache } from '../utils/cache.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function getDashboard(user: AuthUser) {
  const baseWhere: any = {};
  if (user.role === 'ENGINEER') baseWhere.engineerId = user.id;
  if (user.role === 'ACCOUNTANT') baseWhere.accountantId = user.id;

  const roleFilter = baseWhere.engineerId
    ? Prisma.sql`AND engineerId = ${baseWhere.engineerId}`
    : baseWhere.accountantId
      ? Prisma.sql`AND accountantId = ${baseWhere.accountantId}`
      : Prisma.empty;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const taskWhere: any =
    user.role === 'ADMIN'
      ? { status: { not: 'COMPLETED' } }
      : { assignedToId: user.id, status: { not: 'COMPLETED' } };

  const [
    claims,
    processStatusCounts,
    openTasksCount,
    openTasksList,
    recentActivity,
    readOnlyCount,
    cancelledCount,
    overdueTasksCount,
    pendingInspectionsCount,
    pendingInspectionsList,
    settledMTD,
    monthlyVolumeRaw,
    agingRaw,
    closedForCycleTime,
    activeCount,
    totals,
  ] = await Promise.all([
    // Recent claims
    prisma.claim.findMany({
      where: { ...baseWhere, isCancelled: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        client: { select: { name: true } },
        processStatus: { select: { name: true, code: true, color: true } },
        status: { select: { name: true, code: true, color: true } },
      },
    }),

    // Pipeline by process status (active claims only)
    prisma.claim.groupBy({
      by: ['processStatusId'],
      where: { ...baseWhere, isClosed: false, isCancelled: false },
      _count: { id: true },
    }),

    // Open tasks (role-scoped: personal for adjusters, all for admin)
    prisma.task.count({ where: taskWhere }),

    prisma.task.findMany({
      where: taskWhere,
      take: 5,
      orderBy: { dueDate: 'asc' },
      include: {
        claim: { select: { id: true, claimNumber: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
      },
    }),

    // Recent activity
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { firstName: true, lastName: true } } },
    }),

    prisma.claim.count({ where: { ...baseWhere, isReadOnly: true } }),
    prisma.claim.count({ where: { ...baseWhere, isCancelled: true } }),

    // Overdue tasks (using the same role scope as open tasks)
    prisma.task.count({
      where: { ...taskWhere, dueDate: { lt: now } },
    }),

    // Pending inspections
    prisma.inspection.count({
      where: {
        claim: baseWhere,
        conductedAt: null,
        scheduledAt: { not: null },
      },
    }),

    prisma.inspection.findMany({
      where: {
        claim: baseWhere,
        conductedAt: null,
        scheduledAt: { not: null },
      },
      take: 5,
      orderBy: { scheduledAt: 'asc' },
      include: {
        claim: { select: { claimNumber: true } },
        inspector: { select: { firstName: true, lastName: true } },
      },
    }),

    // Settled month-to-date
    prisma.settlement.aggregate({
      where: {
        claim: baseWhere,
        settlementDate: { gte: startOfMonth },
      },
      _sum: { settledAmount: true },
      _count: { id: true },
    }),

    // Monthly & weekly volume aggregation (DB-level, last 12 months)
    withRetry(() =>
      prisma.$queryRaw(
        Prisma.sql`
          SELECT
            DATE_FORMAT(dateReceived, '%Y-%m') AS monthKey,
            DATE_FORMAT(DATE_SUB(DATE(dateReceived), INTERVAL DAYOFWEEK(dateReceived) - 1 DAY), '%Y-%m-%d') AS weekKey,
            COUNT(*) AS claims,
            SUM(estimatedLoss) AS estimatedLoss
          FROM claims
          WHERE dateReceived >= ${twelveMonthsAgo}
            ${roleFilter}
          GROUP BY monthKey, weekKey
        `
      )
    ),

    // Aging buckets for open claims
    withRetry(() =>
      prisma.$queryRaw(
        Prisma.sql`
          SELECT
            IFNULL(SUM(CASE WHEN DATEDIFF(NOW(), dateReceived) <= 30 THEN 1 ELSE 0 END), 0) AS \`0-30\`,
            IFNULL(SUM(CASE WHEN DATEDIFF(NOW(), dateReceived) BETWEEN 31 AND 60 THEN 1 ELSE 0 END), 0) AS \`31-60\`,
            IFNULL(SUM(CASE WHEN DATEDIFF(NOW(), dateReceived) BETWEEN 61 AND 90 THEN 1 ELSE 0 END), 0) AS \`61-90\`,
            IFNULL(SUM(CASE WHEN DATEDIFF(NOW(), dateReceived) > 90 THEN 1 ELSE 0 END), 0) AS \`90+\`
          FROM claims
          WHERE isClosed = 0
            AND isCancelled = 0
            ${roleFilter}
        `
      )
    ),

    // Average cycle time in days for claims closed in the last 12 months
    withRetry(() =>
      prisma.$queryRaw(
        Prisma.sql`
          SELECT AVG(DATEDIFF(closedAt, dateReceived)) AS averageCycleTime
          FROM claims
          WHERE isClosed = 1
            AND isCancelled = 0
            AND closedAt IS NOT NULL
            AND closedAt >= ${twelveMonthsAgo}
            ${roleFilter}
        `
      )
    ),

    // Active claim count
    prisma.claim.count({
      where: { ...baseWhere, isClosed: false, isCancelled: false },
    }),

    // Financial totals (all claims for exposure context)
    prisma.claim.aggregate({
      where: baseWhere,
      _sum: { estimatedLoss: true, reserve: true },
      _count: { id: true },
    }),
  ]);

  const processStatuses = await referenceDataCache.get('processStatuses', () =>
    prisma.processStatus.findMany({ orderBy: { sortOrder: 'asc' } })
  );
  const processStatusMap = new Map(processStatuses.map((s) => [s.id, s]));

  const orderMap = new Map(processStatuses.map((p, i) => [p.id, i]));

  const statusBreakdown = processStatusCounts
    .filter((s): s is { processStatusId: number; _count: { id: number } } => s.processStatusId !== null)
    .map((s) => ({
      status: processStatusMap.get(s.processStatusId),
      count: s._count.id,
    }))
    .filter((s): s is { status: ProcessStatus; count: number } => s.status !== undefined)
    .sort((a, b) => (orderMap.get(a.status.id) ?? 0) - (orderMap.get(b.status.id) ?? 0));

  // Monthly volume buckets (last 12 months)
  const monthLabels: any[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthLabels.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en', { month: 'short', year: '2-digit' }),
      claims: 0,
      estimatedLoss: 0,
    });
  }
  const monthMap = new Map(monthLabels.map((m) => [m.key, m]));

  // Weekly volume buckets (last 12 weeks) — computed from the same 12-month raw data
  const currentWeekStart = new Date(now);
  currentWeekStart.setHours(0, 0, 0, 0);
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
  const weekLabels: any[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7 * i);
    weekLabels.push({
      key: d.toISOString().slice(0, 10),
      label: `Week of ${d.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`,
      claims: 0,
      estimatedLoss: 0,
    });
  }
  const weekMap = new Map(weekLabels.map((w) => [w.key, w]));

  for (const r of monthlyVolumeRaw as any[]) {
    const monthEntry = monthMap.get(r.monthKey);
    if (monthEntry) {
      monthEntry.claims += Number(String(r.claims ?? 0));
      monthEntry.estimatedLoss += Number(String(r.estimatedLoss ?? 0));
    }

    const weekEntry = weekMap.get(r.weekKey);
    if (weekEntry) {
      weekEntry.claims += Number(String(r.claims ?? 0));
      weekEntry.estimatedLoss += Number(String(r.estimatedLoss ?? 0));
    }
  }

  // Aging buckets for open claims
  const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  const agingRow = (agingRaw as any[])[0] ?? {};
  for (const label of Object.keys(buckets) as Array<keyof typeof buckets>) {
    buckets[label] = Number(String(agingRow[label] ?? 0));
  }

  // Average cycle time in days for claims closed in the last 12 months
  const cycleRow = (closedForCycleTime as any[])[0] ?? {};
  let averageCycleTime = null;
  if (cycleRow.averageCycleTime != null) {
    averageCycleTime = Math.round(Number(String(cycleRow.averageCycleTime)) * 10) / 10;
  }

  return {
    counts: {
      total: (totals as any)._count.id,
      active: activeCount,
      estimated: Number((totals as any)._sum.estimatedLoss || 0),
      reserve: Number((totals as any)._sum.reserve || 0),
      openTasks: openTasksCount,
      overdueTasks: overdueTasksCount,
      readOnly: readOnlyCount,
      cancelled: cancelledCount,
      pendingInspections: pendingInspectionsCount,
      settledMTD: Number((settledMTD as any)._sum.settledAmount || 0),
      settledMTDCount: (settledMTD as any)._count.id,
      averageCycleTime,
    },
    monthlyVolume: monthLabels,
    weeklyVolume: weekLabels,
    agingBuckets: Object.entries(buckets).map(([label, count]) => ({ label, count })),
    statusBreakdown,
    recentClaims: (claims as any[]).map((c: any) => ({
      id: c.id,
      claimNumber: c.claimNumber,
      client: c.client?.name,
      processStatus: c.processStatus,
      status: c.status,
      isReadOnly: c.isReadOnly,
      isCancelled: c.isCancelled,
      createdAt: c.createdAt.toISOString(),
    })),
    openTasksList: (openTasksList as any[]).map((t: any) => ({
      ...t,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
    })),
    pendingInspectionsList: (pendingInspectionsList as any[]).map((i: any) => ({
      ...i,
      scheduledAt: i.scheduledAt ? i.scheduledAt.toISOString() : null,
      createdAt: i.createdAt.toISOString(),
    })),
    recentActivity,
  };
}
