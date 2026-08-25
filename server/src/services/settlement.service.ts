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
async function syncSettlementToClaim(claimId: number, tx: Prisma.TransactionClient = prisma) {
  const [latestOffer, acceptedOffer, settlement] = await Promise.all([
    tx.offer.findFirst({
      where: { claimId },
      orderBy: { createdAt: 'desc' },
    }),
    tx.offer.findFirst({
      where: { claimId, status: 'ACCEPTED' },
      orderBy: { responseDate: 'desc' },
    }),
    tx.settlement.findFirst({ where: { claimId } }),
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
    await tx.claim.update({ where: { id: claimId }, data: update });
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

  if (existing) {
    assertClaimAccess(user, existing.claim);
  } else {
    const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
    if (!claim) throw new AppError('Claim not found', 404);
    assertClaimAccess(user, claim);
  }

  const item = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (existing) {
      const updated = await tx.settlement.update({
        where: { id: existing.id },
        data: values,
        include: { claim: true, createdBy: { select: { firstName: true, lastName: true } } },
      });
      await syncSettlementToClaim(Number(claimId), tx);
      return updated;
    }

    const created = await tx.settlement.create({
      data: {
        claimId: Number(claimId),
        createdById: user.id,
        ...values,
      },
      include: { claim: true, createdBy: { select: { firstName: true, lastName: true } } },
    });
    await syncSettlementToClaim(Number(claimId), tx);
    return created;
  }, { maxWait: 5000, timeout: 10000 });

  await logAction('SETTLEMENT_SAVED', 'Settlement', item.id, user.id, { claimId: Number(claimId), amount: Number(item.settledAmount || 0) });
  await recordActivity(Number(claimId), 'SETTLEMENT_SAVED', `Settlement saved: ${Number(item.settledAmount || 0).toFixed(2)} (${item.status})`, user.id);
  await autoAdvanceStatus(Number(claimId), 'SETTLEMENT', user.id);
  return item;
}

export async function listOffers(
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
    prisma.offer.findMany({
      where,
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        responseBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.offer.count({ where }),
  ]);

  return { items, count, page: Number(page), limit: Number(limit) };
}

export async function createOffer(claimId: number | string, data: OfferInput, user: AuthUser) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);
  assertClaimAccess(user, claim);

  const offer = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const created = await tx.offer.create({
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
    await syncSettlementToClaim(Number(claimId), tx);
    return created;
  }, { maxWait: 5000, timeout: 10000 });

  await logAction('OFFER_CREATED', 'Offer', offer.id, user.id, { claimId: Number(claimId), amount: Number(offer.offeredAmount || 0) });
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

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const result = await tx.offer.update({
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
    await syncSettlementToClaim(offer.claimId, tx);
    return result;
  }, { maxWait: 5000, timeout: 10000 });

  await logAction('OFFER_RESPONDED', 'Offer', id, user.id, { status: data.status, amount: Number(offer.offeredAmount || 0) });
  await recordActivity(offer.claimId, 'OFFER_RESPONDED', `Offer ${data.status}: ${Number(offer.offeredAmount || 0).toFixed(2)}`, user.id);

  if (data.status === 'ACCEPTED' && offer.claim?.clientId) {
    // placeholder for client notification
  }

  return updated;
}
