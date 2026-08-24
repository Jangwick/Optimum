import type { AuthUser } from '../middleware/auth.js';
import { prisma } from '../db/client.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Returns aggregated analytics data for the Reports page.
 * All queries are scoped by role: engineers/accountants only see their own claims.
 */
export async function getAnalytics(user: AuthUser) {
  const baseWhere: any = {};
  if (user.role === 'ENGINEER') baseWhere.engineerId = user.id;
  if (user.role === 'ACCOUNTANT') baseWhere.accountantId = user.id;

  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // Run all independent queries in parallel
  const [
    processStatusCounts,
    claimTypeCounts,
    monthlyCounts,
    monthlyLossTotals,
    financialTotals,
    engineerWorkloads,
    settlementTotals,
    invoiceTotals,
    paymentTotals,
    clientCounts,
    agingBuckets,
  ] = await Promise.all([
    // Claims by process status
    prisma.claim.groupBy({
      by: ['processStatusId'],
      where: { ...baseWhere, isCancelled: false },
      _count: { id: true },
    }),

    // Claims by claim type
    prisma.claim.groupBy({
      by: ['claimTypeId'],
      where: { ...baseWhere, claimTypeId: { not: null } },
      _count: { id: true },
    }),

    // Monthly claim counts (last 12 months)
    prisma.claim.findMany({
      where: { ...baseWhere, dateReceived: { gte: twelveMonthsAgo } },
      select: { dateReceived: true },
    }),

    // Monthly estimated loss totals (last 12 months)
    prisma.claim.findMany({
      where: { ...baseWhere, dateReceived: { gte: twelveMonthsAgo }, estimatedLoss: { not: null } },
      select: { dateReceived: true, estimatedLoss: true },
    }),

    // Financial aggregates
    prisma.claim.aggregate({
      where: baseWhere,
      _sum: {
        claimedAmount: true,
        estimatedLoss: true,
        actualLoss: true,
        adjustedLoss: true,
        proposedSettlement: true,
        agreedSettlement: true,
        reserve: true,
      },
      _count: { id: true },
    }),

    // Engineer workload (claims assigned per engineer)
    prisma.claim.groupBy({
      by: ['engineerId'],
      where: { ...baseWhere, engineerId: { not: null }, isCancelled: false },
      _count: { id: true },
    }),

    // Settlement totals
    prisma.settlement.aggregate({
      where: { claim: baseWhere },
      _sum: { settledAmount: true },
      _count: { id: true },
    }),

    // Invoice totals
    prisma.invoice.aggregate({
      where: { claim: baseWhere },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),

    // Payment totals
    prisma.payment.aggregate({
      where: { invoice: { claim: baseWhere } },
      _sum: { amount: true },
      _count: { id: true },
    }),

    // Top clients by claim count
    prisma.claim.groupBy({
      by: ['clientId'],
      where: { ...baseWhere, clientId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),

    // Aging buckets (days since dateReceived for non-closed claims)
    prisma.claim.findMany({
      where: { ...baseWhere, isClosed: false, isCancelled: false },
      select: { id: true, dateReceived: true },
    }),
  ]);

  // Resolve related entities
  const [processStatuses, claimTypes, engineers, clients] = await Promise.all([
    prisma.processStatus.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.claimType.findMany(),
    prisma.user.findMany({
      where: { role: { name: 'ENGINEER' } },
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.client.findMany(),
  ]);

  const statusMap = new Map(processStatuses.map((s) => [s.id, s]));
  const typeMap = new Map(claimTypes.map((t) => [t.id, t]));
  const engineerMap = new Map(engineers.map((e) => [e.id, e]));
  const clientMap = new Map(clients.map((c) => [c.id, c]));

  // Build process status breakdown
  const statusBreakdown: any[] = (processStatusCounts as any[])
    .map((s: any) => ({
      name: statusMap.get(s.processStatusId)?.name || 'Unknown',
      code: statusMap.get(s.processStatusId)?.code || 'UNKNOWN',
      color: statusMap.get(s.processStatusId)?.color || '#999',
      count: s._count.id,
    }))
    .filter((s: any) => s.code !== 'UNKNOWN')
    .sort((a: any, b: any) => {
      const aOrder = processStatuses.find((p) => p.id === (processStatusCounts as any[]).find((c: any) => c.processStatusId === processStatuses.find((ps: any) => ps.name === a.name)?.id)?.processStatusId)?.sortOrder || 0;
      const bOrder = processStatuses.find((p) => p.id === (processStatusCounts as any[]).find((c: any) => c.processStatusId === processStatuses.find((ps: any) => ps.name === b.name)?.id)?.processStatusId)?.sortOrder || 0;
      return aOrder - bOrder;
    });

  // Build claim type breakdown
  const typeBreakdown: any[] = (claimTypeCounts as any[])
    .map((t: any) => ({
      name: typeMap.get(t.claimTypeId)?.name || 'Unknown',
      count: t._count.id,
    }))
    .sort((a: any, b: any) => b.count - a.count);

  // Build monthly trends
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

  for (const c of monthlyCounts) {
    const d = new Date(c.dateReceived);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const entry = monthMap.get(key);
    if (entry) entry.claims += 1;
  }

  for (const c of monthlyLossTotals) {
    const d = new Date(c.dateReceived);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const entry = monthMap.get(key);
    if (entry) entry.estimatedLoss += Number(c.estimatedLoss || 0);
  }

  // Build engineer workload
  const engineerWorkload: any[] = (engineerWorkloads as any[])
    .map((e: any) => {
      const eng = engineerMap.get(e.engineerId);
      return {
        name: eng ? `${eng.firstName} ${eng.lastName}`.trim() : 'Unassigned',
        count: e._count.id,
      };
    })
    .sort((a: any, b: any) => b.count - a.count);

  // Build top clients
  const topClients: any[] = (clientCounts as any[])
    .map((c: any) => ({
      name: clientMap.get(c.clientId)?.name || 'Unknown',
      count: c._count.id,
    }))
    .filter((c: any) => c.name !== 'Unknown');

  // Build aging buckets
  const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  for (const c of agingBuckets as any[]) {
    const days = Math.floor((now.getTime() - new Date(c.dateReceived).getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 30) buckets['0-30']++;
    else if (days <= 60) buckets['31-60']++;
    else if (days <= 90) buckets['61-90']++;
    else buckets['90+']++;
  }

  return {
    summary: {
      totalClaims: (financialTotals as any)._count.id,
      claimedAmount: Number((financialTotals as any)._sum.claimedAmount || 0),
      estimatedLoss: Number((financialTotals as any)._sum.estimatedLoss || 0),
      actualLoss: Number((financialTotals as any)._sum.actualLoss || 0),
      adjustedLoss: Number((financialTotals as any)._sum.adjustedLoss || 0),
      proposedSettlement: Number((financialTotals as any)._sum.proposedSettlement || 0),
      agreedSettlement: Number((financialTotals as any)._sum.agreedSettlement || 0),
      reserve: Number((financialTotals as any)._sum.reserve || 0),
      totalSettled: Number((settlementTotals as any)._sum.settledAmount || 0),
      settlementCount: (settlementTotals as any)._count.id,
      totalInvoiced: Number((invoiceTotals as any)._sum.totalAmount || 0),
      invoiceCount: (invoiceTotals as any)._count.id,
      totalPaid: Number((paymentTotals as any)._sum.amount || 0),
      paymentCount: (paymentTotals as any)._count.id,
    },
    monthlyTrend: monthLabels,
    statusBreakdown,
    typeBreakdown,
    engineerWorkload,
    topClients,
    agingBuckets: Object.entries(buckets).map(([label, count]) => ({ label, count })),
  };
}
