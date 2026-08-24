import { prisma } from '../db/client.js';

export async function getDashboard(user) {
  const baseWhere = {};
  if (user.role === 'ENGINEER') baseWhere.engineerId = user.id;
  if (user.role === 'ACCOUNTANT') baseWhere.accountantId = user.id;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const taskWhere =
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

    // Raw data for monthly volume chart
    prisma.claim.findMany({
      where: { ...baseWhere, dateReceived: { gte: twelveMonthsAgo } },
      select: { dateReceived: true, estimatedLoss: true },
    }),

    // Raw data for aging buckets
    prisma.claim.findMany({
      where: { ...baseWhere, isClosed: false, isCancelled: false },
      select: { dateReceived: true },
    }),

    // Closed claims for average cycle-time calculation
    prisma.claim.findMany({
      where: {
        ...baseWhere,
        isClosed: true,
        isCancelled: false,
        closedAt: { not: null, gte: twelveMonthsAgo },
      },
      select: { dateReceived: true, closedAt: true },
    }),

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

  const processStatuses = await prisma.processStatus.findMany({ orderBy: { sortOrder: 'asc' } });
  const processStatusMap = new Map(processStatuses.map((s) => [s.id, s]));

  const statusBreakdown = processStatusCounts
    .map((s) => ({
      status: processStatusMap.get(s.processStatusId),
      count: s._count.id,
    }))
    .filter((s) => s.status)
    .sort((a, b) => (a.status.sortOrder || 0) - (b.status.sortOrder || 0));

  // Monthly volume buckets (last 12 months)
  const monthLabels = [];
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
  const weekLabels = [];
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

  for (const c of monthlyVolumeRaw) {
    const d = new Date(c.dateReceived);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthEntry = monthMap.get(monthKey);
    if (monthEntry) {
      monthEntry.claims += 1;
      monthEntry.estimatedLoss += Number(c.estimatedLoss || 0);
    }

    const weekStart = new Date(d);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toISOString().slice(0, 10);
    const weekEntry = weekMap.get(weekKey);
    if (weekEntry) {
      weekEntry.claims += 1;
      weekEntry.estimatedLoss += Number(c.estimatedLoss || 0);
    }
  }

  // Aging buckets for open claims
  const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  for (const c of agingRaw) {
    const days = Math.floor((now - new Date(c.dateReceived)) / (1000 * 60 * 60 * 24));
    if (days <= 30) buckets['0-30']++;
    else if (days <= 60) buckets['31-60']++;
    else if (days <= 90) buckets['61-90']++;
    else buckets['90+']++;
  }

  // Average cycle time in days for claims closed in the last 12 months
  let averageCycleTime = null;
  if (closedForCycleTime.length > 0) {
    const totalDays = closedForCycleTime.reduce((sum, c) => {
      const days = Math.floor((new Date(c.closedAt) - new Date(c.dateReceived)) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    averageCycleTime = Math.round((totalDays / closedForCycleTime.length) * 10) / 10;
  }

  return {
    counts: {
      total: totals._count.id,
      active: activeCount,
      estimated: Number(totals._sum.estimatedLoss || 0),
      reserve: Number(totals._sum.reserve || 0),
      openTasks: openTasksCount,
      overdueTasks: overdueTasksCount,
      readOnly: readOnlyCount,
      cancelled: cancelledCount,
      pendingInspections: pendingInspectionsCount,
      settledMTD: Number(settledMTD._sum.settledAmount || 0),
      settledMTDCount: settledMTD._count.id,
      averageCycleTime,
    },
    monthlyVolume: monthLabels,
    weeklyVolume: weekLabels,
    agingBuckets: Object.entries(buckets).map(([label, count]) => ({ label, count })),
    statusBreakdown,
    recentClaims: claims.map((c) => ({
      id: c.id,
      claimNumber: c.claimNumber,
      client: c.client?.name,
      processStatus: c.processStatus,
      status: c.status,
      isReadOnly: c.isReadOnly,
      isCancelled: c.isCancelled,
      createdAt: c.createdAt.toISOString(),
    })),
    openTasksList: openTasksList.map((t) => ({
      ...t,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
    })),
    pendingInspectionsList: pendingInspectionsList.map((i) => ({
      ...i,
      scheduledAt: i.scheduledAt ? i.scheduledAt.toISOString() : null,
      createdAt: i.createdAt.toISOString(),
    })),
    recentActivity,
  };
}
