import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import { recordActivity } from './activity.service.js';

export async function listInvestigations(claimId) {
  return prisma.investigation.findMany({
    where: { claimId: Number(claimId) },
    orderBy: { createdAt: 'desc' },
    include: { completedBy: { select: { id: true, firstName: true, lastName: true } } },
  });
}

export async function createInvestigation(claimId, data, userId) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);

  const inv = await prisma.investigation.create({
    data: {
      claimId: Number(claimId),
      summary: data.summary,
      findings: data.findings,
      startedAt: data.startedAt ? new Date(data.startedAt) : new Date(),
      completedAt: data.completedAt ? new Date(data.completedAt) : null,
      completedById: data.completedAt ? userId : null,
    },
    include: { completedBy: { select: { id: true, firstName: true, lastName: true } } },
  });
  await logAction('INVESTIGATION_CREATED', 'Investigation', inv.id, userId, { claimId });
  await recordActivity(claimId, 'INVESTIGATION_CREATED', 'Investigation created', userId);
  return inv;
}

export async function updateInvestigation(id, data, userId) {
  const inv = await prisma.investigation.findUnique({ where: { id } });
  if (!inv) throw new AppError('Investigation not found', 404);

  const update = { ...data };
  if (data.startedAt) update.startedAt = new Date(data.startedAt);
  if (data.completedAt) {
    update.completedAt = new Date(data.completedAt);
    update.completedById = userId;
  }

  const updated = await prisma.investigation.update({
    where: { id },
    data: update,
    include: { completedBy: { select: { id: true, firstName: true, lastName: true } } },
  });
  await logAction('INVESTIGATION_UPDATED', 'Investigation', id, userId, { claimId: updated.claimId });
  await recordActivity(updated.claimId, 'INVESTIGATION_UPDATED', 'Investigation updated', userId);
  return updated;
}

export async function deleteInvestigation(id, userId) {
  const inv = await prisma.investigation.findUnique({ where: { id } });
  if (!inv) throw new AppError('Investigation not found', 404);
  await logAction('INVESTIGATION_DELETED', 'Investigation', id, userId, { claimId: inv.claimId });
  await recordActivity(inv.claimId, 'INVESTIGATION_DELETED', 'Investigation deleted', userId);
  await prisma.investigation.delete({ where: { id } });
}
