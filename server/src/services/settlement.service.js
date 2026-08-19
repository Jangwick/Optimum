import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';

export async function getSettlement(claimId) {
  return prisma.settlement.findFirst({
    where: { claimId: Number(claimId) },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
  });
}

export async function upsertSettlement(claimId, data, userId) {
  const existing = await prisma.settlement.findFirst({ where: { claimId: Number(claimId) } });

  const values = {
    settlementDate: data.settlementDate ? new Date(data.settlementDate) : null,
    settledAmount: data.settledAmount ? Number(data.settledAmount) : 0,
    status: data.status || 'PENDING',
    notes: data.notes,
  };

  if (existing) {
    return prisma.settlement.update({
      where: { id: existing.id },
      data: values,
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });
  }

  return prisma.settlement.create({
    data: {
      claimId: Number(claimId),
      createdById: userId,
      ...values,
    },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
  });
}

export async function listOffers(claimId) {
  return prisma.offer.findMany({
    where: { claimId: Number(claimId) },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      responseBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createOffer(claimId, data, userId) {
  return prisma.offer.create({
    data: {
      claimId: Number(claimId),
      offerDate: data.offerDate ? new Date(data.offerDate) : new Date(),
      offeredAmount: data.offeredAmount ? Number(data.offeredAmount) : 0,
      status: data.status || 'PENDING',
      notes: data.notes,
      createdById: userId,
    },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      responseBy: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function respondToOffer(id, data, userId) {
  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) throw new AppError('Offer not found', 404);

  return prisma.offer.update({
    where: { id },
    data: {
      status: data.status,
      responseDate: new Date(),
      responseById: userId,
      notes: data.notes ?? offer.notes,
    },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      responseBy: { select: { firstName: true, lastName: true } },
    },
  });
}
