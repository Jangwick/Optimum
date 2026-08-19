import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import path from 'path';
import fs from 'fs';

export async function listInspections(claimId) {
  return prisma.inspection.findMany({
    where: { claimId: Number(claimId) },
    orderBy: { scheduledAt: 'desc' },
    include: { photos: true, inspector: { select: { id: true, firstName: true, lastName: true } } },
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
      inspectorId: data.inspectorId ? Number(data.inspectorId) : null,
    },
    include: { photos: true },
  });
}

export async function updateInspection(id, data) {
  const inspection = await prisma.inspection.findUnique({ where: { id } });
  if (!inspection) throw new AppError('Inspection not found', 404);

  const update = {};
  if (data.scheduledAt !== undefined) update.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
  if (data.conductedAt !== undefined) update.conductedAt = data.conductedAt ? new Date(data.conductedAt) : null;
  if (data.location !== undefined) update.location = data.location;
  if (data.findings !== undefined) update.findings = data.findings;
  if (data.notes !== undefined) update.notes = data.notes;
  if (data.inspectorId !== undefined) update.inspectorId = data.inspectorId ? Number(data.inspectorId) : null;

  return prisma.inspection.update({ where: { id }, data: update, include: { photos: true } });
}

export async function deleteInspection(id) {
  await prisma.inspection.delete({ where: { id } });
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
  return photo;
}

export async function getPhoto(photoId) {
  const photo = await prisma.inspectionPhoto.findUnique({ where: { id: Number(photoId) } });
  if (!photo) throw new AppError('Photo not found', 404);
  if (!fs.existsSync(photo.path)) throw new AppError('Photo file not found', 404);
  return photo;
}
