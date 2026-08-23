import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import { recordActivity } from './activity.service.js';
import { autoAdvanceStatus } from './claim.service.js';
import path from 'path';
import fs from 'fs';

export async function listInspections(claimId) {
  return prisma.inspection.findMany({
    where: { claimId: Number(claimId) },
    orderBy: { scheduledAt: 'desc' },
    include: { photos: true, inspector: { select: { id: true, firstName: true, lastName: true } } },
  });
}

export async function createInspection(claimId, data, userId) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);

  const inspection = await prisma.inspection.create({
    data: {
      claimId: Number(claimId),
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      conductedAt: data.conductedAt ? new Date(data.conductedAt) : null,
      location: data.location,
      findings: data.findings,
      notes: data.notes,
      inspectorId: data.inspectorId ? Number(data.inspectorId) : null,
    },
    include: { photos: true },
  });
  await recordActivity(claimId, 'INSPECTION_CREATED', `Inspection scheduled${data.location ? ` at ${data.location}` : ''}`, userId);

  // Sync claim.dateInspected when an inspection has a conductedAt date
  if (data.conductedAt) {
    await prisma.claim.update({ where: { id: Number(claimId) }, data: { dateInspected: new Date(data.conductedAt) } });
    await autoAdvanceStatus(claimId, 'INSPECTION_COMPLETED', userId);
  } else {
    await autoAdvanceStatus(claimId, 'INSPECTION_SCHEDULED', userId);
  }

  return inspection;
}

export async function updateInspection(id, data, userId) {
  const inspection = await prisma.inspection.findUnique({ where: { id } });
  if (!inspection) throw new AppError('Inspection not found', 404);

  const update = {};
  if (data.scheduledAt !== undefined) update.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
  if (data.conductedAt !== undefined) update.conductedAt = data.conductedAt ? new Date(data.conductedAt) : null;
  if (data.location !== undefined) update.location = data.location;
  if (data.findings !== undefined) update.findings = data.findings;
  if (data.notes !== undefined) update.notes = data.notes;
  if (data.inspectorId !== undefined) update.inspectorId = data.inspectorId ? Number(data.inspectorId) : null;

  const updated = await prisma.inspection.update({ where: { id }, data: update, include: { photos: true } });
  if (data.conductedAt && !inspection.conductedAt) {
    await recordActivity(inspection.claimId, 'INSPECTION_COMPLETED', 'Inspection completed', userId);
  } else {
    await recordActivity(inspection.claimId, 'INSPECTION_UPDATED', 'Inspection updated', userId);
  }

  // Sync claim.dateInspected to the latest inspection's conductedAt
  if (data.conductedAt) {
    const latest = await prisma.inspection.findFirst({
      where: { claimId: inspection.claimId, conductedAt: { not: null } },
      orderBy: { conductedAt: 'desc' },
    });
    if (latest?.conductedAt) {
      await prisma.claim.update({ where: { id: inspection.claimId }, data: { dateInspected: latest.conductedAt } });
    }
    await autoAdvanceStatus(inspection.claimId, 'INSPECTION_COMPLETED', userId);
  }

  return updated;
}

export async function deleteInspection(id, userId) {
  const inspection = await prisma.inspection.findUnique({ where: { id } });
  if (!inspection) throw new AppError('Inspection not found', 404);
  const claimId = inspection.claimId;
  await prisma.inspection.delete({ where: { id } });
  await recordActivity(claimId, 'INSPECTION_DELETED', 'Inspection deleted', userId);
}

export async function uploadPhoto(inspectionId, file, caption, userId) {
  const inspection = await prisma.inspection.findUnique({ where: { id: inspectionId } });
  if (!inspection) throw new AppError('Inspection not found', 404);

  const photo = await prisma.inspectionPhoto.create({
    data: {
      inspectionId,
      fileName: path.basename(file.filename),
      originalName: file.originalname,
      mimeType: file.mimetype,
      path: file.path,
      size: file.size,
      caption: caption || null,
      uploadedById: userId,
    },
  });

  await logAction('INSPECTION_PHOTO_UPLOADED', 'InspectionPhoto', photo.id, userId, { inspectionId });
  await recordActivity(inspection.claimId, 'INSPECTION_PHOTO_UPLOADED', `Inspection photo uploaded: ${file.originalname}`, userId);
  return photo;
}

export async function getPhoto(photoId) {
  const photo = await prisma.inspectionPhoto.findUnique({ where: { id: Number(photoId) } });
  if (!photo) throw new AppError('Photo not found', 404);
  if (!fs.existsSync(photo.path)) throw new AppError('Photo file not found', 404);
  return photo;
}

export async function deletePhoto(photoId, userId) {
  const photo = await prisma.inspectionPhoto.findUnique({
    where: { id: Number(photoId) },
    include: { inspection: { select: { claimId: true } } },
  });
  if (!photo) throw new AppError('Photo not found', 404);
  const claimId = photo.inspection.claimId;
  // Delete file from disk
  try { fs.unlinkSync(photo.path); } catch { /* file may already be gone */ }
  await prisma.inspectionPhoto.delete({ where: { id: Number(photoId) } });
  await logAction('INSPECTION_PHOTO_DELETED', 'InspectionPhoto', photoId, userId, { claimId });
  await recordActivity(claimId, 'INSPECTION_PHOTO_DELETED', `Inspection photo deleted: ${photo.originalName}`, userId);
}
