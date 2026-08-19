import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';

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
  const { search, status, claimType, clientId, engineerId, accountantId, page = 1, limit = 25 } = filters;
  const where = {};

  if (search) {
    where.OR = [
      { claimNumber: { contains: search } },
      { description: { contains: search } },
      { classification: { contains: search } },
    ];
  }

  if (status) where.status = { code: status };
  if (claimType) where.claimType = { code: claimType };
  if (clientId) where.clientId = Number(clientId);
  if (engineerId) where.engineerId = Number(engineerId);
  if (accountantId) where.accountantId = Number(accountantId);

  if (user.role === 'ENGINEER') where.engineerId = user.id;
  if (user.role === 'ACCOUNTANT') where.accountantId = user.id;

  const [items, count] = await Promise.all([
    prisma.claim.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        policy: { include: { client: true, insuranceCompany: true } },
        client: true,
        insuranceCompany: true,
        claimType: true,
        status: true,
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
      engineer: { select: { id: true, firstName: true, lastName: true } },
      accountant: { select: { id: true, firstName: true, lastName: true } },
      assignments: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      statusHistory: {
        include: { changedBy: { select: { id: true, firstName: true, lastName: true } } },
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

  return { ...formatClaim(claim), history };
}

export async function createClaim(data, createdBy) {
  const claimNumber = await generateClaimNumber();

  const policy = await prisma.policy.findUnique({
    where: { id: Number(data.policyId) },
    include: { client: true, insuranceCompany: true, claimType: true },
  });
  if (!policy) throw new AppError('Policy not found', 404);

  const defaultStatus = await prisma.claimStatus.findFirst({ where: { code: 'NEW' } });
  if (!defaultStatus) throw new AppError('Default claim status not found', 500);

  const claim = await prisma.claim.create({
    data: {
      claimNumber,
      policyId: policy.id,
      clientId: policy.clientId,
      insuranceCompanyId: policy.insuranceCompanyId,
      claimTypeId: data.claimTypeId || policy.claimTypeId,
      statusId: defaultStatus.id,
      createdById: createdBy,
      description: data.description,
      dateOfLoss: data.dateOfLoss ? new Date(data.dateOfLoss) : null,
      classification: data.locationOfLoss,
      estimatedLoss: data.estimatedLoss ? Number(data.estimatedLoss) : 0,
      reserve: data.reserve ? Number(data.reserve) : 0,
      actualLoss: data.actualLoss ? Number(data.actualLoss) : 0,
      engineerId: data.engineerId ? Number(data.engineerId) : null,
      accountantId: data.accountantId ? Number(data.accountantId) : null,
    },
    include: {
      policy: { include: { client: true, insuranceCompany: true } },
      client: true,
      insuranceCompany: true,
      claimType: true,
      status: true,
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

  return formatClaim(updated);
}
