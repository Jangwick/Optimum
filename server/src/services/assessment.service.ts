import { prisma } from '../db/client.js';
import { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import { recordActivity } from './activity.service.js';
import { autoAdvanceStatus, assertClaimAccess } from './claim.service.js';
import type { AuthUser } from '../middleware/auth.js';

interface AssessmentItemInput {
  description: string;
  quantity?: number | string;
  unitCost?: number | string;
  amount?: number | string;
}

interface AssessmentInput {
  assessmentDate?: string | Date;
  items?: AssessmentItemInput[];
  depreciation?: number | string;
  notes?: string;
}

// Sync the latest assessment total to the claim's estimatedLoss and reserve
async function syncAssessmentToClaim(claimId: number, tx: Prisma.TransactionClient = prisma) {
  const latest = await tx.lossAssessment.findFirst({
    where: { claimId },
    orderBy: { assessmentDate: 'desc' },
  });
  if (latest) {
    await tx.claim.update({
      where: { id: claimId },
      data: { estimatedLoss: latest.totalAmount, reserve: latest.totalAmount },
    });
  } else {
    await tx.claim.update({
      where: { id: claimId },
      data: { estimatedLoss: null, reserve: null },
    });
  }
}

export async function getAssessments(claimId: number | string, user: AuthUser) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);
  assertClaimAccess(user, claim);

  return prisma.lossAssessment.findMany({
    where: { claimId: Number(claimId) },
    include: {
      items: true,
      preparedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAssessment(id: number, user: AuthUser) {
  const item = await prisma.lossAssessment.findUnique({
    where: { id },
    include: {
      items: true,
      preparedBy: { select: { id: true, firstName: true, lastName: true } },
      claim: true,
    },
  });
  if (!item) throw new AppError('Assessment not found', 404);
  assertClaimAccess(user, item.claim);
  return item;
}

function computeItems(items: AssessmentItemInput[]) {
  return items.map((it) => {
    const qty = Number(it.quantity || 0);
    const unit = Number(it.unitCost || 0);
    const amount = Number(it.amount || 0) || qty * unit;
    return {
      description: it.description,
      quantity: qty,
      unitCost: unit,
      amount,
    };
  });
}

export async function createAssessment(claimId: number | string, data: AssessmentInput, user: AuthUser) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);
  assertClaimAccess(user, claim);

  const items = computeItems(data.items || []);
  const totalAmount = items.reduce((sum, it) => sum + it.amount, 0);

  const item = await prisma.$transaction(async (tx) => {
    const item = await tx.lossAssessment.create({
      data: {
        claimId: Number(claimId),
        preparedById: user.id,
        assessmentDate: data.assessmentDate ? new Date(data.assessmentDate) : new Date(),
        totalAmount,
        depreciation: data.depreciation ? Number(data.depreciation) : 0,
        notes: data.notes ?? null,

        items: {
          create: items,
        },
      },
      include: {
        items: true,
        preparedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await syncAssessmentToClaim(Number(claimId), tx);
    return item;
  }, { maxWait: 5000, timeout: 10000 });
  await logAction('ASSESSMENT_CREATED', 'LossAssessment', item.id, user.id, { claimId: Number(claimId), totalAmount });
  await recordActivity(Number(claimId), 'ASSESSMENT_CREATED', `Assessment created for ${totalAmount.toFixed(2)}`, user.id);
  await autoAdvanceStatus(Number(claimId), 'ASSESSMENT', user.id);
  return item;
}

export async function updateAssessment(id: number, data: AssessmentInput, user: AuthUser) {
  const assessment = await prisma.lossAssessment.findUnique({
    where: { id },
    include: { items: true, claim: true },
  });
  if (!assessment) throw new AppError('Assessment not found', 404);
  assertClaimAccess(user, assessment.claim);

  const items = data.items ? computeItems(data.items) : assessment.items.map((it) => ({ ...it, amount: Number(it.amount) }));
  const totalAmount = items.reduce((sum, it) => sum + it.amount, 0);

  const item = await prisma.$transaction(async (tx) => {
    await tx.lossAssessmentItem.deleteMany({ where: { lossAssessmentId: id } });

    const item = await tx.lossAssessment.update({
      where: { id },
      data: {
        assessmentDate: data.assessmentDate ? new Date(data.assessmentDate) : assessment.assessmentDate,
        totalAmount,
        depreciation: data.depreciation !== undefined ? Number(data.depreciation) : assessment.depreciation,
        notes: data.notes ?? assessment.notes,
        items: { create: items },
      },
      include: {
        items: true,
        preparedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await syncAssessmentToClaim(assessment.claimId, tx);
    return item;
  }, { maxWait: 5000, timeout: 10000 });
  await logAction('ASSESSMENT_UPDATED', 'LossAssessment', id, user.id, { claimId: assessment.claimId, totalAmount });
  await recordActivity(assessment.claimId, 'ASSESSMENT_UPDATED', `Assessment updated to ${totalAmount.toFixed(2)}`, user.id);
  return item;
}

export async function deleteAssessment(id: number, user: AuthUser) {
  const assessment = await prisma.lossAssessment.findUnique({ where: { id }, include: { claim: true } });
  if (!assessment) throw new AppError('Assessment not found', 404);
  assertClaimAccess(user, assessment.claim);
  const { claimId } = assessment;
  await prisma.$transaction(async (tx) => {
    await tx.lossAssessment.delete({ where: { id } });
    await syncAssessmentToClaim(claimId, tx);
  }, { maxWait: 5000, timeout: 10000 });
  await logAction('ASSESSMENT_DELETED', 'LossAssessment', id, user.id, { claimId });
  await recordActivity(claimId, 'ASSESSMENT_DELETED', 'Assessment deleted', user.id);
}
