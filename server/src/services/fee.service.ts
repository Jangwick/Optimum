import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import { recordActivity } from './activity.service.js';
import { assertClaimAccess } from './claim.service.js';
import type { AuthUser } from '../middleware/auth.js';

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

export async function listFees(
  claimId: number | string,
  user: AuthUser,
  pagination: { page?: number | string; limit?: number | string } = {}
) {
  const { page = 1, limit = 20 } = pagination;
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);
  assertClaimAccess(user, claim);

  const where = { claimId: Number(claimId) };

  const [items, count] = await Promise.all([
    prisma.fee.findMany({
      where,
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.fee.count({ where }),
  ]);

  return { items, count, page: Number(page), limit: Number(limit) };
}

export async function createFee(claimId: number | string, data: FeeInput, user: AuthUser) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);
  assertClaimAccess(user, claim);

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
  await logAction('FEE_CREATED', 'Fee', fee.id, user.id, { claimId: Number(claimId), amount: Number(fee.amount) });
  await syncFeeTotals(Number(claimId));
  await recordActivity(Number(claimId), 'FEE_CREATED', `Fee created: ${fee.feeType} — ${Number(fee.amount || 0).toFixed(2)}`, user.id);
  return fee;
}

export async function updateFee(id: number, data: Partial<FeeInput>, user: AuthUser) {
  const fee = await prisma.fee.findUnique({ where: { id }, include: { claim: true } });
  if (!fee) throw new AppError('Fee not found', 404);
  assertClaimAccess(user, fee.claim);

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
  await recordActivity(fee.claimId, 'FEE_UPDATED', `Fee updated: ${updated.feeType} — ${Number(updated.amount || 0).toFixed(2)}`, user.id);
  return updated;
}

export async function deleteFee(id: number, user: AuthUser) {
  const fee = await prisma.fee.findUnique({ where: { id }, include: { claim: true } });
  if (!fee) throw new AppError('Fee not found', 404);
  assertClaimAccess(user, fee.claim);
  const { claimId } = fee;
  await prisma.fee.delete({ where: { id } });
  await syncFeeTotals(claimId);
  await recordActivity(claimId, 'FEE_DELETED', `Fee deleted: ${fee.feeType}`, user.id);
}
