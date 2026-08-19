import { prisma } from '../db/client.js';

export async function getDashboard(user) {
  const baseWhere = {};
  if (user.role === 'ENGINEER') baseWhere.engineerId = user.id;
  if (user.role === 'ACCOUNTANT') baseWhere.accountantId = user.id;

  const [claims, statusCounts, openTasks, recentActivity] = await Promise.all([
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

  return {
    counts: {
      total: totals._count.id,
      estimated: Number(totals._sum.estimatedLoss || 0),
      reserve: Number(totals._sum.reserve || 0),
      openTasks,
    },
    recentClaims: claims.map((c) => ({
      id: c.id,
      claimNumber: c.claimNumber,
      client: c.client?.name,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
    })),
    statusBreakdown,
    recentActivity,
  };
}
