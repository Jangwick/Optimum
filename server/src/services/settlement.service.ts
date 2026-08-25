import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import { recordActivity } from './activity.service.js';
import { autoAdvanceStatus, assertClaimAccess } from './claim.service.js';
import type { AuthUser } from '../middleware/auth.js';

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

  const update: Prisma.ClaimUpdateInput = {};
  // proposedSettlement = latest offer amount (if any)
  if (latestOffer?.offeredAmount != null) {
    update.proposedSettlement = latestOffer.offeredAmount;
  }
  // agreedSettlement = accepted offer amount, or settlement agreed amount
  if (acceptedOffer?.offeredAmount != null) {
    update.agreedSettlement = acceptedOffer.offeredAmount;
  } else if (settlement?.status === 'AGREED' && settlement?.settledAmount != null) {
    update.agreedSettlement = settlement.settledAmount;
  }

  if (Object.keys(update).length > 0) {
    await prisma.claim.update({ where: { id: claimId }, data: update });
  }
}

export async function getSettlement(claimId: number | string, user: AuthUser) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);
  assertClaimAccess(user, claim);

  return prisma.settlement.findFirst({
    where: { claimId: Number(claimId) },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
  });
}

export async function upsertSettlement(claimId: number | string, data: SettlementInput, user: AuthUser) {
  const existing = await prisma.settlement.findFirst({
    where: { claimId: Number(claimId) },
    include: { claim: true },
  });

  const values = {
    settlementDate: data.settlementDate ? new Date(data.settlementDate) : null,
    settledAmount: data.settledAmount ? Number(data.settledAmount) : 0,
    status: data.status || 'PENDING',
    notes: data.notes ?? null,
  };

  let item;
  if (existing) {
    assertClaimAccess(user, existing.claim);
    item = await prisma.settlement.update({
      where: { id: existing.id },
      data: values,
      include: { claim: true, createdBy: { select: { firstName: true, lastName: true } } },
    });
  } else {
    const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
    if (!claim) throw new AppError('Claim not found', 404);
    assertClaimAccess(user, claim);
    item = await prisma.settlement.create({
      data: {
        claimId: Number(claimId),
        createdById: user.id,
        ...values,
      },
      include: { claim: true, createdBy: { select: { firstName: true, lastName: true } } },
    });
  }

  await logAction('SETTLEMENT_SAVED', 'Settlement', item.id, user.id, { claimId: Number(claimId), amount: Number(item.settledAmount || 0) });
  await syncSettlementToClaim(Number(claimId));
  await recordActivity(Number(claimId), 'SETTLEMENT_SAVED', `Settlement saved: ${Number(item.settledAmount || 0).toFixed(2)} (${item.status})`, user.id);
  await autoAdvanceStatus(Number(claimId), 'SETTLEMENT', user.id);
  return item;
}

export async function listOffers(claimId: number | string, user: AuthUser) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);
  assertClaimAccess(user, claim);

  return prisma.offer.findMany({
    where: { claimId: Number(claimId) },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      responseBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createOffer(claimId: number | string, data: OfferInput, user: AuthUser) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);
  assertClaimAccess(user, claim);

  const offer = await prisma.offer.create({
    data: {
      claimId: Number(claimId),
      offerDate: data.offerDate ? new Date(data.offerDate) : new Date(),
      offeredAmount: data.offeredAmount ? Number(data.offeredAmount) : 0,
      status: data.status || 'PENDING',
      notes: data.notes ?? null,
      createdById: user.id,
    },
    include: {
      claim: true,
      createdBy: { select: { firstName: true, lastName: true } },
      responseBy: { select: { firstName: true, lastName: true } },
    },
  });
  await logAction('OFFER_CREATED', 'Offer', offer.id, user.id, { claimId: Number(claimId), amount: Number(offer.offeredAmount || 0) });
  await syncSettlementToClaim(Number(claimId));
  await recordActivity(Number(claimId), 'OFFER_CREATED', `Offer created: ${Number(offer.offeredAmount || 0).toFixed(2)}`, user.id);
  await autoAdvanceStatus(Number(claimId), 'OFFER_SENT', user.id);
  if (offer.claim?.clientId) {
    // placeholder for client notification
  }
  return offer;
}

export async function respondToOffer(id: number, data: OfferResponseInput, user: AuthUser) {
  const offer = await prisma.offer.findUnique({ where: { id }, include: { claim: true } });
  if (!offer) throw new AppError('Offer not found', 404);
  assertClaimAccess(user, offer.claim);

  const updated = await prisma.offer.update({
    where: { id },
    data: {
      status: data.status,
      responseDate: new Date(),
      responseById: user.id,
      notes: data.notes ?? offer.notes,
    },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      responseBy: { select: { firstName: true, lastName: true } },
    },
  });

  await logAction('OFFER_RESPONDED', 'Offer', id, user.id, { status: data.status, amount: Number(offer.offeredAmount || 0) });
  await syncSettlementToClaim(offer.claimId);
  await recordActivity(offer.claimId, 'OFFER_RESPONDED', `Offer ${data.status}: ${Number(offer.offeredAmount || 0).toFixed(2)}`, user.id);

  if (data.status === 'ACCEPTED' && offer.claim?.clientId) {
    // placeholder for client notification
  }

  return updated;
}
