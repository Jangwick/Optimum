import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';

export async function listInspections(claimId) {
  return prisma.inspection.findMany({
    where: { claimId: Number(claimId) },
    orderBy: { scheduledAt: 'desc' },
  });
}

export async function createInspection(claimId, data) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);

  return prisma.inspection.create({
    data: {
      claimId: Number(claimId),
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      conductedAt: data.conductedAt ? new Date(data.conductedAt) : null,
      location: data.location,
      findings: data.findings,
      notes: data.notes,
    },
  });
}

export async function updateInspection(id, data) {
  const inspection = await prisma.inspection.findUnique({ where: { id } });
  if (!inspection) throw new AppError('Inspection not found', 404);

  const update = { ...data };
  if (data.scheduledAt) update.scheduledAt = new Date(data.scheduledAt);
  if (data.conductedAt) update.conductedAt = new Date(data.conductedAt);

  return prisma.inspection.update({ where: { id }, data: update });
}

export async function deleteInspection(id) {
  await prisma.inspection.delete({ where: { id } });
}
