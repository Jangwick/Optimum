import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';

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

  return prisma.investigation.create({
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

  return prisma.investigation.update({
    where: { id },
    data: update,
    include: { completedBy: { select: { id: true, firstName: true, lastName: true } } },
  });
}

export async function deleteInvestigation(id) {
  await prisma.investigation.delete({ where: { id } });
}
