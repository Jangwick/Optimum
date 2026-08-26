import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import { recordActivity } from './activity.service.js';
import { autoAdvanceStatus, assertClaimAccess } from './claim.service.js';
import type { AuthUser } from '../middleware/auth.js';

interface InvestigationInput {
  summary: string;
  findings?: string;
  startedAt?: string | Date;
  completedAt?: string | Date | null;
}

function toDateOrNull(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export async function listInvestigations(
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
    prisma.investigation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { completedBy: { select: { id: true, firstName: true, lastName: true } } },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.investigation.count({ where }),
  ]);

  return { items, count, page: Number(page), limit: Number(limit) };
}

export async function createInvestigation(claimId: number | string, data: InvestigationInput, user: AuthUser) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);
  assertClaimAccess(user, claim);

  const completedAt = toDateOrNull(data.completedAt);
  const inv = await prisma.investigation.create({
    data: {
      claimId: Number(claimId),
      summary: data.summary,
      findings: data.findings ?? null,
      startedAt: data.startedAt ? new Date(data.startedAt) : new Date(),
      completedAt,
      completedById: completedAt ? user.id : null,
    },
    include: { completedBy: { select: { id: true, firstName: true, lastName: true } } },
  });
  await logAction('INVESTIGATION_CREATED', 'Investigation', inv.id, user.id, { claimId: Number(claimId) });
  await recordActivity(Number(claimId), 'INVESTIGATION_CREATED', 'Investigation created', user.id);
  await autoAdvanceStatus(Number(claimId), 'INVESTIGATION', user.id);
  return inv;
}

export async function updateInvestigation(id: number, data: InvestigationInput, user: AuthUser) {
  const inv = await prisma.investigation.findUnique({ where: { id }, include: { claim: true } });
  if (!inv) throw new AppError('Investigation not found', 404);
  assertClaimAccess(user, inv.claim);

  const update: Prisma.InvestigationUncheckedUpdateInput = {};
  if (data.summary !== undefined) update.summary = data.summary;
  if (data.findings !== undefined) update.findings = data.findings ?? null;
  if (data.startedAt !== undefined) update.startedAt = new Date(data.startedAt);
  if (data.completedAt !== undefined) {
    const completedAt = toDateOrNull(data.completedAt);
    update.completedAt = completedAt;
    update.completedById = completedAt ? user.id : null;
  }

  const updated = await prisma.investigation.update({
    where: { id },
    data: update,
    include: { completedBy: { select: { id: true, firstName: true, lastName: true } } },
  });
  await logAction('INVESTIGATION_UPDATED', 'Investigation', id, user.id, { claimId: updated.claimId });
  await recordActivity(updated.claimId, 'INVESTIGATION_UPDATED', 'Investigation updated', user.id);
  return updated;
}

export async function deleteInvestigation(id: number, user: AuthUser) {
  const inv = await prisma.investigation.findUnique({ where: { id }, include: { claim: true } });
  if (!inv) throw new AppError('Investigation not found', 404);
  assertClaimAccess(user, inv.claim);
  await logAction('INVESTIGATION_DELETED', 'Investigation', id, user.id, { claimId: inv.claimId });
  await recordActivity(inv.claimId, 'INVESTIGATION_DELETED', 'Investigation deleted', user.id);
  await prisma.investigation.delete({ where: { id } });
}
