import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import { recordActivity } from './activity.service.js';
import { autoAdvanceStatus } from './claim.service.js';

interface SettlementInput {
  settlementDate?: string | Date | null;
  settledAmount?: number | string;
  status?: string;
  notes?: string;
}

interface OfferInput {
  offerDate?: string | Date;
  offeredAmount?: number | string;
  status?: string;
  notes?: string;
}

interface OfferResponseInput {
  status: string;
  notes?: string;
}

// Sync settlement and offer data to the claim record
async function syncSettlementToClaim(claimId: number) {
  const [latestOffer, acceptedOffer, settlement] = await Promise.all([
    prisma.offer.findFirst({
      where: { claimId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.offer.findFirst({
      where: { claimId, status: 'ACCEPTED' },
      orderBy: { responseDate: 'desc' },
    }),
    prisma.settlement.findFirst({ where: { claimId } }),
  ]);

  const update: Record<string, unknown> = {};
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
    await prisma.claim.update({ where: { id: claimId }, data: update as Prisma.ClaimUpdateInput });
  }
}

export async function getSettlement(claimId: number | string) {
  return prisma.settlement.findFirst({
    where: { claimId: Number(claimId) },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
  });
}

export async function upsertSettlement(claimId: number | string, data: SettlementInput, userId: number) {
  const existing = await prisma.settlement.findFirst({ where: { claimId: Number(claimId) } });

  const values = {
    settlementDate: data.settlementDate ? new Date(data.settlementDate) : null,
    settledAmount: data.settledAmount ? Number(data.settledAmount) : 0,
    status: data.status || 'PENDING',
    notes: data.notes ?? null,
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

  await logAction('SETTLEMENT_SAVED', 'Settlement', item.id, userId, { claimId: Number(claimId), amount: item.settledAmount });
  await syncSettlementToClaim(Number(claimId));
  await recordActivity(Number(claimId), 'SETTLEMENT_SAVED', `Settlement saved: ${Number(item.settledAmount || 0).toFixed(2)} (${item.status})`, userId);
  await autoAdvanceStatus(Number(claimId), 'SETTLEMENT', userId);
  return item;
}

export async function listOffers(claimId: number | string) {
  return prisma.offer.findMany({
    where: { claimId: Number(claimId) },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      responseBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createOffer(claimId: number | string, data: OfferInput, userId: number) {
  const offer = await prisma.offer.create({
    data: {
      claimId: Number(claimId),
      offerDate: data.offerDate ? new Date(data.offerDate) : new Date(),
      offeredAmount: data.offeredAmount ? Number(data.offeredAmount) : 0,
      status: data.status || 'PENDING',
      notes: data.notes ?? null,
      createdById: userId,
    },
    include: {
      claim: true,
      createdBy: { select: { firstName: true, lastName: true } },
      responseBy: { select: { firstName: true, lastName: true } },
    },
  });
  await logAction('OFFER_CREATED', 'Offer', offer.id, userId, { claimId: Number(claimId), amount: offer.offeredAmount });
  await syncSettlementToClaim(Number(claimId));
  await recordActivity(Number(claimId), 'OFFER_CREATED', `Offer created: ${Number(offer.offeredAmount || 0).toFixed(2)}`, userId);
  await autoAdvanceStatus(Number(claimId), 'OFFER_SENT', userId);
  if (offer.claim?.clientId) {
    // placeholder for client notification
  }
  return offer;
}

export async function respondToOffer(id: number, data: OfferResponseInput, userId: number) {
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
