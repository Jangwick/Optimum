import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';

export async function getAssessments(claimId) {
  return prisma.lossAssessment.findMany({
    where: { claimId: Number(claimId) },
    include: {
      items: true,
      preparedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAssessment(id) {
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

function computeItems(items) {
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

export async function createAssessment(claimId, data, userId) {
  const items = computeItems(data.items || []);
  const totalAmount = items.reduce((sum, it) => sum + it.amount, 0);

  const item = await prisma.lossAssessment.create({
    data: {
      claimId: Number(claimId),
      preparedById: userId,
      assessmentDate: data.assessmentDate ? new Date(data.assessmentDate) : new Date(),
      totalAmount,
      depreciation: data.depreciation ? Number(data.depreciation) : 0,
      notes: data.notes,

      items: {
        create: items,
      },
    },
    include: {
      items: true,
      preparedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return item;
}

export async function updateAssessment(id, data, _userId) {
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

  return item;
}

export async function deleteAssessment(id) {
  await prisma.lossAssessment.delete({ where: { id } });
}
