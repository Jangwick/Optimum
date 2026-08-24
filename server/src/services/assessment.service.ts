import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import { recordActivity } from './activity.service.js';
import { autoAdvanceStatus } from './claim.service.js';

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
async function syncAssessmentToClaim(claimId: number) {
  const latest = await prisma.lossAssessment.findFirst({
    where: { claimId },
    orderBy: { assessmentDate: 'desc' },
  });
  if (latest) {
    await prisma.claim.update({
      where: { id: claimId },
      data: { estimatedLoss: latest.totalAmount, reserve: latest.totalAmount },
    });
  } else {
    await prisma.claim.update({
      where: { id: claimId },
      data: { estimatedLoss: null, reserve: null },
    });
  }
}

export async function getAssessments(claimId: number | string) {
  return prisma.lossAssessment.findMany({
    where: { claimId: Number(claimId) },
    include: {
      items: true,
      preparedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAssessment(id: number) {
  const item = await prisma.lossAssessment.findUnique({
    where: { id },
    include: {
      items: true,
      preparedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!item) throw new AppError('Assessment not found', 404);
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

export async function createAssessment(claimId: number | string, data: AssessmentInput, userId: number) {
  const items = computeItems(data.items || []);
  const totalAmount = items.reduce((sum, it) => sum + it.amount, 0);

  const item = await prisma.lossAssessment.create({
    data: {
      claimId: Number(claimId),
      preparedById: userId,
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

  await syncAssessmentToClaim(Number(claimId));
  await logAction('ASSESSMENT_CREATED', 'LossAssessment', item.id, userId, { claimId: Number(claimId), totalAmount });
  await recordActivity(Number(claimId), 'ASSESSMENT_CREATED', `Assessment created for ${totalAmount.toFixed(2)}`, userId);
  await autoAdvanceStatus(Number(claimId), 'ASSESSMENT', userId);
  return item;
}

export async function updateAssessment(id: number, data: AssessmentInput, userId: number) {
  const assessment = await prisma.lossAssessment.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!assessment) throw new AppError('Assessment not found', 404);

  const items = data.items ? computeItems(data.items) : assessment.items.map((it) => ({ ...it, amount: Number(it.amount) }));
  const totalAmount = items.reduce((sum, it) => sum + it.amount, 0);

  await prisma.lossAssessmentItem.deleteMany({ where: { lossAssessmentId: id } });

  const item = await prisma.lossAssessment.update({
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

  await syncAssessmentToClaim(assessment.claimId);
  await logAction('ASSESSMENT_UPDATED', 'LossAssessment', id, userId, { claimId: assessment.claimId, totalAmount });
  await recordActivity(assessment.claimId, 'ASSESSMENT_UPDATED', `Assessment updated to ${totalAmount.toFixed(2)}`, userId);
  return item;
}

export async function deleteAssessment(id: number, userId: number) {
  const assessment = await prisma.lossAssessment.findUnique({ where: { id } });
  if (!assessment) throw new AppError('Assessment not found', 404);
  const { claimId } = assessment;
  await prisma.lossAssessment.delete({ where: { id } });
  await syncAssessmentToClaim(claimId);
  await logAction('ASSESSMENT_DELETED', 'LossAssessment', id, userId, { claimId });
  await recordActivity(claimId, 'ASSESSMENT_DELETED', 'Assessment deleted', userId);
}
