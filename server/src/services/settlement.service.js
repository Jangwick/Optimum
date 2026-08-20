import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import { recordActivity } from './activity.service.js';

// Sync settlement and offer data to the claim record
async function syncSettlementToClaim(claimId) {
  const [latestOffer, acceptedOffer, settlement] = await Promise.all([
    prisma.offer.findFirst({
      where: { claimId: Number(claimId) },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.offer.findFirst({
      where: { claimId: Number(claimId), status: 'ACCEPTED' },
      orderBy: { responseDate: 'desc' },
    }),
    prisma.settlement.findFirst({ where: { claimId: Number(claimId) } }),
  ]);

  const update = {};
  // proposedSettlement = latest offer amount (if any)
  if (latestOffer) {
    update.proposedSettlement = latestOffer.offeredAmount;
  }
  // agreedSettlement = accepted offer amount, or settlement agreed amount
  if (acceptedOffer) {
    update.agreedSettlement = acceptedOffer.offeredAmount;
  } else if (settlement?.status === 'AGREED' && settlement?.settledAmount) {
    update.agreedSettlement = settlement.settledAmount;
  }

  if (Object.keys(update).length > 0) {
    await prisma.claim.update({ where: { id: Number(claimId) }, data: update });
  }
}

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

  let item;
  if (existing) {
    item = await prisma.settlement.update({
      where: { id: existing.id },
      data: values,
      include: { claim: true, createdBy: { select: { firstName: true, lastName: true } } },
    });
  } else {
    item = await prisma.settlement.create({
      data: {
        claimId: Number(claimId),
        createdById: userId,
        ...values,
      },
      include: { claim: true, createdBy: { select: { firstName: true, lastName: true } } },
    });
  }

  await logAction('SETTLEMENT_SAVED', 'Settlement', item.id, userId, { claimId, amount: item.settledAmount });
  await syncSettlementToClaim(claimId);
  await recordActivity(claimId, 'SETTLEMENT_SAVED', `Settlement saved: ${Number(item.settledAmount || 0).toFixed(2)} (${item.status})`, userId);
  return item;
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
  const offer = await prisma.offer.create({
    data: {
      claimId: Number(claimId),
      offerDate: data.offerDate ? new Date(data.offerDate) : new Date(),
      offeredAmount: data.offeredAmount ? Number(data.offeredAmount) : 0,
      status: data.status || 'PENDING',
      notes: data.notes,
      createdById: userId,
    },
    include: {
      claim: true,
      createdBy: { select: { firstName: true, lastName: true } },
      responseBy: { select: { firstName: true, lastName: true } },
    },
  });
  await logAction('OFFER_CREATED', 'Offer', offer.id, userId, { claimId, amount: offer.offeredAmount });
  await syncSettlementToClaim(claimId);
  await recordActivity(claimId, 'OFFER_CREATED', `Offer created: ${Number(offer.offeredAmount || 0).toFixed(2)}`, userId);
  if (offer.claim?.clientId) {
    // placeholder for client notification
  }
  return offer;
}

export async function respondToOffer(id, data, userId) {
  const offer = await prisma.offer.findUnique({ where: { id }, include: { claim: true } });
  if (!offer) throw new AppError('Offer not found', 404);

  const updated = await prisma.offer.update({
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

  await logAction('OFFER_RESPONDED', 'Offer', id, userId, { status: data.status, amount: offer.offeredAmount });
  await syncSettlementToClaim(offer.claimId);
  await recordActivity(offer.claimId, 'OFFER_RESPONDED', `Offer ${data.status}: ${Number(offer.offeredAmount || 0).toFixed(2)}`, userId);

  if (data.status === 'ACCEPTED' && offer.claim?.clientId) {
    // placeholder for client notification
  }

  return updated;
}
