import { prisma } from '../db/client.js';

/**
 * Returns aggregated analytics data for the Reports page.
 * All queries are scoped by role: engineers/accountants only see their own claims.
 */
export async function getAnalytics(user) {
  const baseWhere = {};
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
  const statusBreakdown = processStatusCounts
    .map((s) => ({
      name: statusMap.get(s.processStatusId)?.name || 'Unknown',
      code: statusMap.get(s.processStatusId)?.code || 'UNKNOWN',
      color: statusMap.get(s.processStatusId)?.color || '#999',
      count: s._count.id,
    }))
    .filter((s) => s.code !== 'UNKNOWN')
    .sort((a, b) => {
      const aOrder = processStatuses.find((p) => p.id === processStatusCounts.find((c) => c.processStatusId === processStatuses.find((ps) => ps.name === a.name)?.id)?.processStatusId)?.sortOrder || 0;
      const bOrder = processStatuses.find((p) => p.id === processStatusCounts.find((c) => c.processStatusId === processStatuses.find((ps) => ps.name === b.name)?.id)?.processStatusId)?.sortOrder || 0;
      return aOrder - bOrder;
    });

  // Build claim type breakdown
  const typeBreakdown = claimTypeCounts
    .map((t) => ({
      name: typeMap.get(t.claimTypeId)?.name || 'Unknown',
      count: t._count.id,
    }))
    .sort((a, b) => b.count - a.count);

  // Build monthly trends
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
  const engineerWorkload = engineerWorkloads
    .map((e) => {
      const eng = engineerMap.get(e.engineerId);
      return {
        name: eng ? `${eng.firstName} ${eng.lastName}`.trim() : 'Unassigned',
        count: e._count.id,
      };
    })
    .sort((a, b) => b.count - a.count);

  // Build top clients
  const topClients = clientCounts
    .map((c) => ({
      name: clientMap.get(c.clientId)?.name || 'Unknown',
      count: c._count.id,
    }))
    .filter((c) => c.name !== 'Unknown');

  // Build aging buckets
  const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  for (const c of agingBuckets) {
    const days = Math.floor((now - new Date(c.dateReceived)) / (1000 * 60 * 60 * 24));
    if (days <= 30) buckets['0-30']++;
    else if (days <= 60) buckets['31-60']++;
    else if (days <= 90) buckets['61-90']++;
    else buckets['90+']++;
  }

  return {
    summary: {
      totalClaims: financialTotals._count.id,
      claimedAmount: Number(financialTotals._sum.claimedAmount || 0),
      estimatedLoss: Number(financialTotals._sum.estimatedLoss || 0),
      actualLoss: Number(financialTotals._sum.actualLoss || 0),
      adjustedLoss: Number(financialTotals._sum.adjustedLoss || 0),
      proposedSettlement: Number(financialTotals._sum.proposedSettlement || 0),
      agreedSettlement: Number(financialTotals._sum.agreedSettlement || 0),
      reserve: Number(financialTotals._sum.reserve || 0),
      totalSettled: Number(settlementTotals._sum.settledAmount || 0),
      settlementCount: settlementTotals._count.id,
      totalInvoiced: Number(invoiceTotals._sum.totalAmount || 0),
      invoiceCount: invoiceTotals._count.id,
      totalPaid: Number(paymentTotals._sum.amount || 0),
      paymentCount: paymentTotals._count.id,
    },
    monthlyTrend: monthLabels,
    statusBreakdown,
    typeBreakdown,
    engineerWorkload,
    topClients,
    agingBuckets: Object.entries(buckets).map(([label, count]) => ({ label, count })),
  };
}
