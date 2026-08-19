import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';

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
  return fee;
}

export async function updateFee(id, data) {
  const fee = await prisma.fee.findUnique({ where: { id } });
  if (!fee) throw new AppError('Fee not found', 404);

  const update = { ...data };
  if (data.userId !== undefined) update.userId = Number(data.userId);
  if (data.amount !== undefined) update.amount = Number(data.amount);

  return prisma.fee.update({
    where: { id },
    data: update,
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });
}

export async function deleteFee(id) {
  await prisma.fee.delete({ where: { id } });
}
