import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import { createNotification } from './notification.service.js';

export const statusTransitions = {
  NEW: ['ASSIGNED'],
  ASSIGNED: ['INVESTIGATION'],
  INVESTIGATION: ['INSPECTION_SCHEDULED'],
  INSPECTION_SCHEDULED: ['INSPECTION_COMPLETED'],
  INSPECTION_COMPLETED: ['DOCUMENTS_PENDING'],
  DOCUMENTS_PENDING: ['DOCUMENTS_RECEIVED'],
  DOCUMENTS_RECEIVED: ['ASSESSMENT'],
  ASSESSMENT: ['REPORT_DRAFT'],
  REPORT_DRAFT: ['REPORT_SUBMITTED'],
  REPORT_SUBMITTED: ['CLIENT_REVIEW'],
  CLIENT_REVIEW: ['CLARIFICATION_NEEDED', 'SETTLEMENT'],
  CLARIFICATION_NEEDED: ['CLARIFICATION_PROVIDED'],
  CLARIFICATION_PROVIDED: ['CLIENT_REVIEW'],
  SETTLEMENT: ['OFFER_SENT'],
  OFFER_SENT: ['FEE_INVOICED'],
  FEE_INVOICED: ['PAYMENT_RECEIVED'],
  PAYMENT_RECEIVED: ['CLOSED'],
};

function formatMoney(value) {
  if (value === null || value === undefined) return null;
  return Number(value).toFixed(2);
}

function formatClaim(c) {
  return {
    id: c.id,
    claimNumber: c.claimNumber,
    assignmentNumber: c.assignmentNumber,
    policyId: c.policyId,
    policy: c.policy
      ? {
          id: c.policy.id,
          policyNumber: c.policy.policyNumber,
          client: c.policy.client ? { id: c.policy.client.id, name: c.policy.client.name } : null,
          insuranceCompany: c.policy.insuranceCompany
            ? { id: c.policy.insuranceCompany.id, name: c.policy.insuranceCompany.name }
            : null,
        }
      : null,
    clientId: c.clientId,
    client: c.client ? { id: c.client.id, name: c.client.name } : null,
    insuranceCompanyId: c.insuranceCompanyId,
    insuranceCompany: c.insuranceCompany
      ? { id: c.insuranceCompany.id, name: c.insuranceCompany.name }
      : null,
    claimTypeId: c.claimTypeId,
    claimType: c.claimType
      ? { id: c.claimType.id, name: c.claimType.name, code: c.claimType.code }
      : null,
    statusId: c.statusId,
    status: c.status
      ? { id: c.status.id, name: c.status.name, code: c.status.code, color: c.status.color }
      : null,
    processStatusId: c.processStatusId,
    processStatus: c.processStatus
      ? { id: c.processStatus.id, name: c.processStatus.name, code: c.processStatus.code, color: c.processStatus.color }
      : null,
    description: c.description,
    dateOfLoss: c.dateOfLoss?.toISOString(),
    dateReceived: c.dateReceived.toISOString(),
    locationOfLoss: c.locationOfLoss ?? c.classification,
    estimatedLoss: formatMoney(c.estimatedLoss),
    reserve: formatMoney(c.reserve),
    actualLoss: formatMoney(c.actualLoss),
    isClosed: c.isClosed,
    closedAt: c.closedAt?.toISOString(),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    engineerId: c.engineerId,
    engineer: c.engineer
      ? { id: c.engineer.id, fullName: `${c.engineer.firstName} ${c.engineer.lastName}` }
      : null,
    accountantId: c.accountantId,
    accountant: c.accountant
      ? { id: c.accountant.id, fullName: `${c.accountant.firstName} ${c.accountant.lastName}` }
      : null,
    brokerId: c.brokerId,
    broker: c.broker ? { id: c.broker.id, name: c.broker.name, code: c.broker.code } : null,
    brokerReference: c.brokerReference,
    insurerClaimNumber: c.insurerClaimNumber,
    assignedByName: c.assignedByName,
    natureOfLoss: c.natureOfLoss,
    claimedAmount: formatMoney(c.claimedAmount),
    claimedAmountRaw: c.claimedAmountRaw,
    proposedSettlement: formatMoney(c.proposedSettlement),
    proposedSettlementRaw: c.proposedSettlementRaw,
    agreedSettlement: formatMoney(c.agreedSettlement),
    agreedSettlementRaw: c.agreedSettlementRaw,
    reserveRaw: c.reserveRaw,
    policyPeriodText: c.policyPeriodText,
    policyCoverageText: c.policyCoverageText,
    remarksRaw: c.remarksRaw,
    latestStatusRaw: c.latestStatusRaw,
    letterFollowUpRaw: c.letterFollowUpRaw,
    isIncomplete: c.isIncomplete,
    incompleteReasons: c.incompleteReasons,
    importBatchId: c.importBatchId,
    importedAt: c.importedAt?.toISOString(),
    createdById: c.createdById,
    closedById: c.closedById,
  };
}

async function generateClaimNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const count = await prisma.claim.count({ where: { createdAt: { gte: new Date(year, 0, 1) } } });
  return `CS-${year}-${String(count + 1).padStart(4, '0')}`;
}

export async function getClaims(filters, user) {
  const {
    search,
    status,
    processStatus,
    claimType,
    clientId,
    engineerId,
    accountantId,
    page = 1,
    limit = 25,
    sortField = 'createdAt',
    sortOrder = 'desc',
  } = filters;
  const where = {};

  if (search) {
    where.OR = [
      { claimNumber: { contains: search } },
      { description: { contains: search } },
      { classification: { contains: search } },
      { client: { name: { contains: search } } },
    ];
  }

  if (status) where.status = { code: status };
  if (processStatus) where.processStatus = { code: processStatus };
  if (claimType) where.claimType = { code: claimType };
  if (clientId) where.clientId = Number(clientId);
  if (engineerId) where.engineerId = Number(engineerId);
  if (accountantId) where.accountantId = Number(accountantId);

  if (user.role === 'ENGINEER') where.engineerId = user.id;
  if (user.role === 'ACCOUNTANT') where.accountantId = user.id;

  const orderBy = {};
  const allowedSort = ['claimNumber', 'dateReceived', 'estimatedLoss', 'reserve', 'createdAt'];
  if (allowedSort.includes(sortField)) {
    orderBy[sortField] = sortOrder === 'asc' ? 'asc' : 'desc';
  } else {
    orderBy.createdAt = 'desc';
  }

  const [items, count] = await Promise.all([
    prisma.claim.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy,
      include: {
        policy: { include: { client: true, insuranceCompany: true } },
        client: true,
        insuranceCompany: true,
        claimType: true,
        status: true,
        processStatus: true,
        broker: true,
        engineer: { select: { id: true, firstName: true, lastName: true } },
        accountant: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.claim.count({ where }),
  ]);

  return { items: items.map(formatClaim), count, page: Number(page), limit: Number(limit) };
}

export async function getClaim(id, user) {
  const claim = await prisma.claim.findUnique({
    where: { id },
    include: {
      policy: { include: { client: true, insuranceCompany: true } },
      client: true,
      insuranceCompany: true,
      claimType: true,
      status: true,
      processStatus: true,
      broker: true,
      engineer: { select: { id: true, firstName: true, lastName: true } },
      accountant: { select: { id: true, firstName: true, lastName: true } },
      assignments: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      insurerPanel: { include: { insuranceCompany: { select: { id: true, name: true, code: true } } } },
      activities: {
        orderBy: { occurredAt: 'desc' },
        take: 20,
        include: { actor: { select: { id: true, firstName: true, lastName: true } } },
      },
      correspondence: {
        orderBy: { sentAt: 'desc' },
        take: 20,
      },
      statusHistory: {
        include: { changedBy: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      },
      processStatusHistory: {
        include: {
          processStatus: true,
          changedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!claim) throw new AppError('Claim not found', 404);

  if (user.role === 'ENGINEER' && claim.engineerId !== user.id) {
    throw new AppError('Forbidden', 403);
  }
  if (user.role === 'ACCOUNTANT' && claim.accountantId !== user.id) {
    throw new AppError('Forbidden', 403);
  }

  const history = claim.statusHistory.map((h) => ({
    id: h.id,
    status: h.status ? { id: h.status.id, name: h.status.name, code: h.status.code } : null,
    notes: h.notes,
    changedBy: h.changedBy ? `${h.changedBy.firstName} ${h.changedBy.lastName}` : null,
    createdAt: h.createdAt.toISOString(),
  }));

  const processHistory = claim.processStatusHistory.map((h) => ({
    id: h.id,
    status: h.processStatus
      ? { id: h.processStatus.id, name: h.processStatus.name, code: h.processStatus.code, color: h.processStatus.color }
      : null,
    notes: h.notes,
    source: h.source,
    isOverride: h.isOverride,
    overrideReason: h.overrideReason,
    changedBy: h.changedBy ? `${h.changedBy.firstName} ${h.changedBy.lastName}` : null,
    createdAt: h.createdAt.toISOString(),
  }));

  const insurerPanel = (claim.insurerPanel || []).map((ci) => ({
    id: ci.id,
    insuranceCompany: ci.insuranceCompany,
    isLead: ci.isLead,
    participationPercent: ci.participationPercent ? Number(ci.participationPercent) : null,
    insurerClaimNumber: ci.insurerClaimNumber,
  }));

  const activities = (claim.activities || []).map((a) => ({
    id: a.id,
    activityType: a.activityType,
    occurredAt: a.occurredAt?.toISOString(),
    description: a.description,
    source: a.source,
    actor: a.actor ? `${a.actor.firstName} ${a.actor.lastName}` : null,
  }));

  const correspondence = (claim.correspondence || []).map((c) => ({
    id: c.id,
    type: c.type,
    sentAt: c.sentAt?.toISOString(),
    receivedAt: c.receivedAt?.toISOString(),
    followUpDate: c.followUpDate?.toISOString(),
    recipient: c.recipient,
    notes: c.notes,
    isHistorical: c.isHistorical,
  }));

  return { ...formatClaim(claim), history, processHistory, insurerPanel, activities, correspondence };
}

export async function createClaim(data, createdBy) {
  const claimNumber = data.claimNumber || (await generateClaimNumber());

  // Resolve policy if provided; otherwise require direct client/insurer
  let policy = null;
  let clientId = null;
  let insuranceCompanyId = null;
  let claimTypeId = null;

  if (data.policyId) {
    policy = await prisma.policy.findUnique({
      where: { id: Number(data.policyId) },
      include: { client: true, insuranceCompany: true, claimType: true },
    });
    if (!policy) throw new AppError('Policy not found', 404);
    clientId = policy.clientId;
    insuranceCompanyId = policy.insuranceCompanyId;
    claimTypeId = data.claimTypeId || policy.claimTypeId;
  } else {
    // Registry-style intake: direct client/insurer/type selection
    clientId = data.clientId ? Number(data.clientId) : null;
    insuranceCompanyId = data.insuranceCompanyId ? Number(data.insuranceCompanyId) : null;
    claimTypeId = data.claimTypeId ? Number(data.claimTypeId) : null;
  }

  const defaultStatus = await prisma.claimStatus.findFirst({ where: { code: 'NEW' } });
  if (!defaultStatus) throw new AppError('Default claim status not found', 500);

  const defaultProcessStatus = await prisma.processStatus.findFirst({ where: { code: 'RECEIVED' } });
  if (!defaultProcessStatus) throw new AppError('Default process status not found', 500);

  const claim = await prisma.claim.create({
    data: {
      claimNumber,
      policyId: policy?.id || null,
      clientId,
      insuranceCompanyId,
      claimTypeId,
      statusId: defaultStatus.id,
      processStatusId: defaultProcessStatus.id,
      createdById: createdBy,
      // Registry fields
      assignmentNumber: data.assignmentNumber || null,
      insurerClaimNumber: data.insurerClaimNumber || null,
      brokerId: data.brokerId ? Number(data.brokerId) : null,
      brokerReference: data.brokerReference || null,
      assignedByName: data.assignedByName || null,
      // Descriptive
      description: data.description || null,
      natureOfLoss: data.natureOfLoss || null,
      locationOfLoss: data.locationOfLoss || null,
      dateOfLoss: data.dateOfLoss ? new Date(data.dateOfLoss) : null,
      classification: data.classification || data.locationOfLoss || null,
      policyPeriodText: data.policyPeriodText || null,
      policyCoverageText: data.policyCoverageText || null,
      // Financial
      estimatedLoss: data.estimatedLoss ? Number(data.estimatedLoss) : 0,
      reserve: data.reserve ? Number(data.reserve) : 0,
      actualLoss: data.actualLoss ? Number(data.actualLoss) : 0,
      claimedAmount: data.claimedAmount ? Number(data.claimedAmount) : null,
      claimedAmountRaw: data.claimedAmountRaw || null,
      reserveRaw: data.reserveRaw || null,
      proposedSettlement: data.proposedSettlement ? Number(data.proposedSettlement) : null,
      proposedSettlementRaw: data.proposedSettlementRaw || null,
      agreedSettlement: data.agreedSettlement ? Number(data.agreedSettlement) : null,
      agreedSettlementRaw: data.agreedSettlementRaw || null,
      // Assignments
      engineerId: data.engineerId ? Number(data.engineerId) : null,
      accountantId: data.accountantId ? Number(data.accountantId) : null,
    },
    include: {
      policy: { include: { client: true, insuranceCompany: true } },
      client: true,
      insuranceCompany: true,
      claimType: true,
      status: true,
      processStatus: true,
      engineer: { select: { id: true, firstName: true, lastName: true } },
      accountant: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  await prisma.claimStatusHistory.create({
    data: {
      claimId: claim.id,
      statusId: defaultStatus.id,
      changedById: createdBy,
      notes: 'Claim registered',
    },
  });

  await prisma.claimProcessStatusHistory.create({
    data: {
      claimId: claim.id,
      processStatusId: defaultProcessStatus.id,
      changedById: createdBy,
      notes: 'Claim registered',
      source: 'USER',
    },
  });

  if (data.engineerId) {
    await prisma.claimAssignment.create({
      data: { claimId: claim.id, userId: Number(data.engineerId), role: 'ENGINEER', assignedById: createdBy },
    });
  }
  if (data.accountantId) {
    await prisma.claimAssignment.create({
      data: { claimId: claim.id, userId: Number(data.accountantId), role: 'ACCOUNTANT', assignedById: createdBy },
    });
  }

  await logAction('CLAIM_CREATED', 'Claim', claim.id, createdBy, { claimNumber: claim.claimNumber });

  if (data.engineerId) {
    await createNotification(Number(data.engineerId), {
      title: 'New claim assignment',
      message: `You have been assigned to claim ${claim.claimNumber}`,
      claimId: claim.id,
    });
  }

  if (data.accountantId) {
    await createNotification(Number(data.accountantId), {
      title: 'New claim assignment',
      message: `You have been assigned to claim ${claim.claimNumber}`,
      claimId: claim.id,
    });
  }

  return formatClaim(claim);
}

export async function updateStatus(claimId, { statusCode, notes = '' }, changedBy) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: { status: true },
  });
  if (!claim) throw new AppError('Claim not found', 404);

  const newStatus = await prisma.claimStatus.findFirst({ where: { code: statusCode } });
  if (!newStatus) throw new AppError('Invalid status', 400);

  if (statusTransitions[claim.status.code]?.includes(statusCode) === false) {
    throw new AppError(`Invalid status transition from ${claim.status.code} to ${statusCode}`, 400);
  }

  const updated = await prisma.claim.update({
    where: { id: claimId },
    data: {
      statusId: newStatus.id,
      isClosed: statusCode === 'CLOSED',
      closedAt: statusCode === 'CLOSED' ? new Date() : null,
      closedById: statusCode === 'CLOSED' ? changedBy : null,
    },
    include: {
      policy: { include: { client: true, insuranceCompany: true } },
      client: true,
      insuranceCompany: true,
      claimType: true,
      status: true,
      processStatus: true,
      engineer: { select: { id: true, firstName: true, lastName: true } },
      accountant: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  await prisma.claimStatusHistory.create({
    data: {
      claimId,
      statusId: newStatus.id,
      changedById: changedBy,
      notes,
    },
  });

  await logAction('STATUS_CHANGED', 'Claim', claimId, changedBy, { from: claim.status.code, to: statusCode, notes });

  const notifyUsers = [updated.engineerId, updated.accountantId].filter(Boolean);
  for (const userId of notifyUsers) {
    await createNotification(userId, {
      title: `Status changed to ${statusCode}`,
      message: `Claim ${updated.claimNumber} moved from ${claim.status.code} to ${statusCode}`,
      claimId,
    });
  }

  return formatClaim(updated);
}

// Update a claim's registry and descriptive fields (not status — use updateStatus/updateProcessStatus)
export async function updateClaim(claimId, data, updatedBy) {
  const claim = await prisma.claim.findUnique({ where: { id: claimId } });
  if (!claim) throw new AppError('Claim not found', 404);

  const updateData = { lastUserModifiedAt: new Date() };

  // Registry fields
  if (data.assignmentNumber !== undefined) updateData.assignmentNumber = data.assignmentNumber;
  if (data.insurerClaimNumber !== undefined) updateData.insurerClaimNumber = data.insurerClaimNumber;
  if (data.brokerId !== undefined) updateData.brokerId = data.brokerId ? Number(data.brokerId) : null;
  if (data.brokerReference !== undefined) updateData.brokerReference = data.brokerReference;
  if (data.assignedByName !== undefined) updateData.assignedByName = data.assignedByName;

  // Relations
  if (data.clientId !== undefined) updateData.clientId = data.clientId ? Number(data.clientId) : null;
  if (data.insuranceCompanyId !== undefined) updateData.insuranceCompanyId = data.insuranceCompanyId ? Number(data.insuranceCompanyId) : null;
  if (data.claimTypeId !== undefined) updateData.claimTypeId = data.claimTypeId ? Number(data.claimTypeId) : null;
  if (data.policyId !== undefined) updateData.policyId = data.policyId ? Number(data.policyId) : null;
  if (data.engineerId !== undefined) updateData.engineerId = data.engineerId ? Number(data.engineerId) : null;
  if (data.accountantId !== undefined) updateData.accountantId = data.accountantId ? Number(data.accountantId) : null;

  // Descriptive
  if (data.description !== undefined) updateData.description = data.description;
  if (data.natureOfLoss !== undefined) updateData.natureOfLoss = data.natureOfLoss;
  if (data.locationOfLoss !== undefined) updateData.locationOfLoss = data.locationOfLoss;
  if (data.classification !== undefined) updateData.classification = data.classification;
  if (data.dateOfLoss !== undefined) updateData.dateOfLoss = data.dateOfLoss ? new Date(data.dateOfLoss) : null;
  if (data.policyPeriodText !== undefined) updateData.policyPeriodText = data.policyPeriodText;
  if (data.policyCoverageText !== undefined) updateData.policyCoverageText = data.policyCoverageText;

  // Financial
  if (data.estimatedLoss !== undefined) updateData.estimatedLoss = data.estimatedLoss ? Number(data.estimatedLoss) : 0;
  if (data.reserve !== undefined) updateData.reserve = data.reserve ? Number(data.reserve) : 0;
  if (data.actualLoss !== undefined) updateData.actualLoss = data.actualLoss ? Number(data.actualLoss) : 0;
  if (data.claimedAmount !== undefined) updateData.claimedAmount = data.claimedAmount ? Number(data.claimedAmount) : null;
  if (data.claimedAmountRaw !== undefined) updateData.claimedAmountRaw = data.claimedAmountRaw;
  if (data.reserveRaw !== undefined) updateData.reserveRaw = data.reserveRaw;
  if (data.proposedSettlement !== undefined) updateData.proposedSettlement = data.proposedSettlement ? Number(data.proposedSettlement) : null;
  if (data.proposedSettlementRaw !== undefined) updateData.proposedSettlementRaw = data.proposedSettlementRaw;
  if (data.agreedSettlement !== undefined) updateData.agreedSettlement = data.agreedSettlement ? Number(data.agreedSettlement) : null;
  if (data.agreedSettlementRaw !== undefined) updateData.agreedSettlementRaw = data.agreedSettlementRaw;

  const updated = await prisma.claim.update({
    where: { id: claimId },
    data: updateData,
    include: {
      policy: { include: { client: true, insuranceCompany: true } },
      client: true,
      insuranceCompany: true,
      claimType: true,
      status: true,
      processStatus: true,
      broker: true,
      engineer: { select: { id: true, firstName: true, lastName: true } },
      accountant: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  await logAction('CLAIM_UPDATED', 'Claim', claimId, updatedBy, { fields: Object.keys(updateData) });
  return formatClaim(updated);
}

// ============================================================================
// Insurer panel CRUD
// ============================================================================

export async function getClaimInsurers(claimId) {
  const claim = await prisma.claim.findUnique({ where: { id: claimId }, select: { id: true } });
  if (!claim) throw new AppError('Claim not found', 404);

  const panel = await prisma.claimInsurer.findMany({
    where: { claimId },
    include: {
      insuranceCompany: { select: { id: true, name: true, code: true } },
    },
    orderBy: { isLead: 'desc' },
  });

  return panel.map((ci) => ({
    id: ci.id,
    insuranceCompany: ci.insuranceCompany,
    isLead: ci.isLead,
    participationPercent: ci.participationPercent ? Number(ci.participationPercent) : null,
    insurerClaimNumber: ci.insurerClaimNumber,
    proposedSettlement: ci.proposedSettlement ? Number(ci.proposedSettlement) : null,
    proposedSettlementRaw: ci.proposedSettlementRaw,
    agreedSettlement: ci.agreedSettlement ? Number(ci.agreedSettlement) : null,
    agreedSettlementRaw: ci.agreedSettlementRaw,
    paidAmount: ci.paidAmount ? Number(ci.paidAmount) : null,
    offerStatus: ci.offerStatus,
    paymentStatus: ci.paymentStatus,
    notes: ci.notes,
  }));
}

export async function addClaimInsurer(claimId, data, addedBy) {
  const claim = await prisma.claim.findUnique({ where: { id: claimId }, select: { id: true } });
  if (!claim) throw new AppError('Claim not found', 404);

  const insurer = await prisma.claimInsurer.create({
    data: {
      claimId,
      insuranceCompanyId: Number(data.insuranceCompanyId),
      isLead: data.isLead || false,
      participationPercent: data.participationPercent ? Number(data.participationPercent) : null,
      insurerClaimNumber: data.insurerClaimNumber || null,
      proposedSettlement: data.proposedSettlement ? Number(data.proposedSettlement) : null,
      proposedSettlementRaw: data.proposedSettlementRaw || null,
      agreedSettlement: data.agreedSettlement ? Number(data.agreedSettlement) : null,
      agreedSettlementRaw: data.agreedSettlementRaw || null,
      paidAmount: data.paidAmount ? Number(data.paidAmount) : null,
      offerStatus: data.offerStatus || null,
      paymentStatus: data.paymentStatus || null,
      notes: data.notes || null,
    },
    include: { insuranceCompany: { select: { id: true, name: true, code: true } } },
  });

  await logAction('CLAIM_INSURER_ADDED', 'Claim', claimId, addedBy, { insurerId: data.insuranceCompanyId });
  return insurer;
}

export async function updateClaimInsurer(claimId, insurerId, data, updatedBy) {
  const existing = await prisma.claimInsurer.findFirst({
    where: { id: insurerId, claimId },
  });
  if (!existing) throw new AppError('Insurer panel entry not found', 404);

  const updateData = {};
  if (data.isLead !== undefined) updateData.isLead = data.isLead;
  if (data.participationPercent !== undefined) updateData.participationPercent = data.participationPercent ? Number(data.participationPercent) : null;
  if (data.insurerClaimNumber !== undefined) updateData.insurerClaimNumber = data.insurerClaimNumber;
  if (data.proposedSettlement !== undefined) updateData.proposedSettlement = data.proposedSettlement ? Number(data.proposedSettlement) : null;
  if (data.proposedSettlementRaw !== undefined) updateData.proposedSettlementRaw = data.proposedSettlementRaw;
  if (data.agreedSettlement !== undefined) updateData.agreedSettlement = data.agreedSettlement ? Number(data.agreedSettlement) : null;
  if (data.agreedSettlementRaw !== undefined) updateData.agreedSettlementRaw = data.agreedSettlementRaw;
  if (data.paidAmount !== undefined) updateData.paidAmount = data.paidAmount ? Number(data.paidAmount) : null;
  if (data.offerStatus !== undefined) updateData.offerStatus = data.offerStatus;
  if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const updated = await prisma.claimInsurer.update({
    where: { id: insurerId },
    data: updateData,
    include: { insuranceCompany: { select: { id: true, name: true, code: true } } },
  });

  await logAction('CLAIM_INSURER_UPDATED', 'Claim', claimId, updatedBy, { insurerId, fields: Object.keys(updateData) });
  return updated;
}

export async function removeClaimInsurer(claimId, insurerId, removedBy) {
  const existing = await prisma.claimInsurer.findFirst({
    where: { id: insurerId, claimId },
  });
  if (!existing) throw new AppError('Insurer panel entry not found', 404);

  await prisma.claimInsurer.delete({ where: { id: insurerId } });
  await logAction('CLAIM_INSURER_REMOVED', 'Claim', claimId, removedBy, { insurerId });
  return { id: insurerId, deleted: true };
}
