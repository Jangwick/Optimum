import { prisma } from '../db/client.js';

export async function getDashboard(user) {
  const baseWhere = {};
  if (user.role === 'ENGINEER') baseWhere.engineerId = user.id;
  if (user.role === 'ACCOUNTANT') baseWhere.accountantId = user.id;

  const now = new Date();

  const [claims, statusCounts, openTasksCount, openTasksList, recentActivity] = await Promise.all([
    prisma.claim.findMany({
      where: baseWhere,
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { client: { select: { name: true } }, status: { select: { name: true, code: true } } },
    }),
    prisma.claim.groupBy({
      by: ['statusId'],
      where: baseWhere,
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
  ]);

  const statuses = await prisma.claimStatus.findMany();
  const statusMap = new Map(statuses.map((s) => [s.id, s]));

  const statusBreakdown = statusCounts.map((s) => ({
    status: statusMap.get(s.statusId),
    count: s._count.id,
  }));

  const totals = await prisma.claim.aggregate({
    where: baseWhere,
    _sum: { estimatedLoss: true, reserve: true },
    _count: { id: true },
  });

  const overdueCount = openTasksList.filter((t) => t.dueDate && new Date(t.dueDate) < now).length;

  return {
    counts: {
      total: totals._count.id,
      estimated: Number(totals._sum.estimatedLoss || 0),
      reserve: Number(totals._sum.reserve || 0),
      openTasks: openTasksCount,
      overdueTasks: overdueCount,
    },
    recentClaims: claims.map((c) => ({
      id: c.id,
      claimNumber: c.claimNumber,
      client: c.client?.name,
      status: c.status,
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
