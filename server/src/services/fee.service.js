import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import { recordActivity } from './activity.service.js';

// Sync total fees to the claim's actualLoss field
async function syncFeeTotals(claimId) {
  const result = await prisma.fee.aggregate({
    where: { claimId: Number(claimId) },
    _sum: { amount: true },
  });
  const total = result._sum.amount || 0;
  await prisma.claim.update({
    where: { id: Number(claimId) },
    data: { actualLoss: total > 0 ? total : null },
  });
}

export async function listFees(claimId) {
  return prisma.fee.findMany({
    where: { claimId: Number(claimId) },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createFee(claimId, data, userId) {
  const fee = await prisma.fee.create({
    data: {
      claimId: Number(claimId),
      userId: data.userId ? Number(data.userId) : null,
      feeType: data.feeType,
      amount: Number(data.amount),
      description: data.description,
    },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });
  await logAction('FEE_CREATED', 'Fee', fee.id, userId, { claimId, amount: fee.amount });
  await syncFeeTotals(claimId);
  await recordActivity(claimId, 'FEE_CREATED', `Fee created: ${fee.feeType} — ${Number(fee.amount || 0).toFixed(2)}`, userId);
  return fee;
}

export async function updateFee(id, data, userId) {
  const fee = await prisma.fee.findUnique({ where: { id } });
  if (!fee) throw new AppError('Fee not found', 404);

  const update = { ...data };
  if (data.userId !== undefined) update.userId = Number(data.userId);
  if (data.amount !== undefined) update.amount = Number(data.amount);

  const updated = await prisma.fee.update({
    where: { id },
    data: update,
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });
  await syncFeeTotals(fee.claimId);
  await recordActivity(fee.claimId, 'FEE_UPDATED', `Fee updated: ${updated.feeType} — ${Number(updated.amount || 0).toFixed(2)}`, userId);
  return updated;
}

export async function deleteFee(id, userId) {
  const fee = await prisma.fee.findUnique({ where: { id } });
  if (!fee) throw new AppError('Fee not found', 404);
  const claimId = fee.claimId;
  await prisma.fee.delete({ where: { id } });
  await syncFeeTotals(claimId);
  await recordActivity(claimId, 'FEE_DELETED', `Fee deleted: ${fee.feeType}`, userId);
}
