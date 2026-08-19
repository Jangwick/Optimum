import { prisma } from '../db/client.js';

export async function getDashboard(user) {
  const baseWhere = {};
  if (user.role === 'ENGINEER') baseWhere.engineerId = user.id;
  if (user.role === 'ACCOUNTANT') baseWhere.accountantId = user.id;

  const now = new Date();

  const [claims, processStatusCounts, openTasksCount, openTasksList, recentActivity, readOnlyCount, cancelledCount, overdueTasksCount] = await Promise.all([
    prisma.claim.findMany({
      where: baseWhere,
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        client: { select: { name: true } },
        processStatus: { select: { name: true, code: true, color: true } },
        status: { select: { name: true, code: true, color: true } },
      },
    }),
    prisma.claim.groupBy({
      by: ['processStatusId'],
      where: { ...baseWhere, isReadOnly: false },
      _count: { id: true },
    }),
    prisma.task.count({
      where: {
        assignedToId: user.id,
        status: { not: 'COMPLETED' },
      },
    }),
    prisma.task.findMany({
      where: {
        assignedToId: user.id,
        status: { not: 'COMPLETED' },
      },
      take: 5,
      orderBy: { dueDate: 'asc' },
      include: {
        claim: { select: { id: true, claimNumber: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
    prisma.claim.count({ where: { ...baseWhere, isReadOnly: true } }),
    prisma.claim.count({ where: { ...baseWhere, isCancelled: true } }),
    prisma.task.count({
      where: {
        assignedToId: user.id,
        status: { not: 'COMPLETED' },
        dueDate: { lt: now },
      },
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

  const totals = await prisma.claim.aggregate({
    where: baseWhere,
    _sum: { estimatedLoss: true, reserve: true },
    _count: { id: true },
  });

  return {
    counts: {
      total: totals._count.id,
      estimated: Number(totals._sum.estimatedLoss || 0),
      reserve: Number(totals._sum.reserve || 0),
      openTasks: openTasksCount,
      overdueTasks: overdueTasksCount,
      readOnly: readOnlyCount,
      cancelled: cancelledCount,
    },
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
    statusBreakdown,
    recentActivity,
  };
}
