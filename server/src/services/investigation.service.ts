import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import { recordActivity } from './activity.service.js';
import { autoAdvanceStatus } from './claim.service.js';

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

export async function listInvestigations(claimId: number | string) {
  return prisma.investigation.findMany({
    where: { claimId: Number(claimId) },
    orderBy: { createdAt: 'desc' },
    include: { completedBy: { select: { id: true, firstName: true, lastName: true } } },
  });
}

export async function createInvestigation(claimId: number | string, data: InvestigationInput, userId: number) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);

  const completedAt = toDateOrNull(data.completedAt);
  const inv = await prisma.investigation.create({
    data: {
      claimId: Number(claimId),
      summary: data.summary,
      findings: data.findings ?? null,
      startedAt: data.startedAt ? new Date(data.startedAt) : new Date(),
      completedAt,
      completedById: completedAt ? userId : null,
    },
    include: { completedBy: { select: { id: true, firstName: true, lastName: true } } },
  });
  await logAction('INVESTIGATION_CREATED', 'Investigation', inv.id, userId, { claimId: Number(claimId) });
  await recordActivity(Number(claimId), 'INVESTIGATION_CREATED', 'Investigation created', userId);
  await autoAdvanceStatus(Number(claimId), 'INVESTIGATION', userId);
  return inv;
}

export async function updateInvestigation(id: number, data: InvestigationInput, userId: number) {
  const inv = await prisma.investigation.findUnique({ where: { id } });
  if (!inv) throw new AppError('Investigation not found', 404);

  const update: Record<string, unknown> = {};
  if (data.summary !== undefined) update.summary = data.summary;
  if (data.findings !== undefined) update.findings = data.findings ?? null;
  if (data.startedAt !== undefined) update.startedAt = new Date(data.startedAt);
  if (data.completedAt !== undefined) {
    const completedAt = toDateOrNull(data.completedAt);
    update.completedAt = completedAt;
    update.completedById = completedAt ? userId : null;
  }

  const updated = await prisma.investigation.update({
    where: { id },
    data: update as Prisma.InvestigationUpdateInput,
    include: { completedBy: { select: { id: true, firstName: true, lastName: true } } },
  });
  await logAction('INVESTIGATION_UPDATED', 'Investigation', id, userId, { claimId: updated.claimId });
  await recordActivity(updated.claimId, 'INVESTIGATION_UPDATED', 'Investigation updated', userId);
  return updated;
}

export async function deleteInvestigation(id: number, userId: number) {
  const inv = await prisma.investigation.findUnique({ where: { id } });
  if (!inv) throw new AppError('Investigation not found', 404);
  await logAction('INVESTIGATION_DELETED', 'Investigation', id, userId, { claimId: inv.claimId });
  await recordActivity(inv.claimId, 'INVESTIGATION_DELETED', 'Investigation deleted', userId);
  await prisma.investigation.delete({ where: { id } });
}
