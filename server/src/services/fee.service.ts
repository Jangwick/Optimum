import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import { recordActivity } from './activity.service.js';

interface FeeInput {
  userId?: number | string;
  feeType: string;
  amount: number | string;
  description?: string;
}

// Sync total fees to the claim's actualLoss field
async function syncFeeTotals(claimId: number) {
  const result = await prisma.fee.aggregate({
    where: { claimId },
    _sum: { amount: true },
  });
  const total = result._sum.amount;
  const numericTotal = total ? total.toNumber() : 0;
  await prisma.claim.update({
    where: { id: claimId },
    data: { actualLoss: numericTotal > 0 ? total : null },
  });
}

export async function listFees(claimId: number | string) {
  return prisma.fee.findMany({
    where: { claimId: Number(claimId) },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createFee(claimId: number | string, data: FeeInput, userId: number) {
  const fee = await prisma.fee.create({
    data: {
      claimId: Number(claimId),
      userId: data.userId ? Number(data.userId) : null,
      feeType: data.feeType,
      amount: Number(data.amount),
      description: data.description ?? null,
    },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });
  await logAction('FEE_CREATED', 'Fee', fee.id, userId, { claimId: Number(claimId), amount: Number(fee.amount) });
  await syncFeeTotals(Number(claimId));
  await recordActivity(Number(claimId), 'FEE_CREATED', `Fee created: ${fee.feeType} — ${Number(fee.amount || 0).toFixed(2)}`, userId);
  return fee;
}

export async function updateFee(id: number, data: Partial<FeeInput>, userId: number) {
  const fee = await prisma.fee.findUnique({ where: { id } });
  if (!fee) throw new AppError('Fee not found', 404);

  const update: Prisma.FeeUncheckedUpdateInput = {};
  if (data.userId !== undefined) update.userId = data.userId ? Number(data.userId) : null;
  if (data.feeType !== undefined) update.feeType = data.feeType;
  if (data.amount !== undefined) update.amount = Number(data.amount);
  if (data.description !== undefined) update.description = data.description ?? null;

  const updated = await prisma.fee.update({
    where: { id },
    data: update,
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });
  await syncFeeTotals(fee.claimId);
  await recordActivity(fee.claimId, 'FEE_UPDATED', `Fee updated: ${updated.feeType} — ${Number(updated.amount || 0).toFixed(2)}`, userId);
  return updated;
}

export async function deleteFee(id: number, userId: number) {
  const fee = await prisma.fee.findUnique({ where: { id } });
  if (!fee) throw new AppError('Fee not found', 404);
  const { claimId } = fee;
  await prisma.fee.delete({ where: { id } });
  await syncFeeTotals(claimId);
  await recordActivity(claimId, 'FEE_DELETED', `Fee deleted: ${fee.feeType}`, userId);
}
