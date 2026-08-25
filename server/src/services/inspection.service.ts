import fs from 'fs';
import type { Express } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import { recordActivity } from './activity.service.js';
import { autoAdvanceStatus, assertClaimAccess } from './claim.service.js';
import { resolveFilePath } from '../utils/file-path.js';
import type { AuthUser } from '../middleware/auth.js';

interface InspectionData {
  scheduledAt?: string | null;
  conductedAt?: string | null;
  location?: string | null;
  findings?: string | null;
  notes?: string | null;
  inspectorId?: number | string | null;
}

export async function listInspections(claimId: number | string, user: AuthUser) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);
  assertClaimAccess(user, claim);

  return prisma.inspection.findMany({
    where: { claimId: Number(claimId) },
    orderBy: { scheduledAt: 'desc' },
    include: {
      photos: {
        select: {
          id: true,
          fileName: true,
          originalName: true,
          mimeType: true,
          size: true,
          caption: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      inspector: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function createInspection(claimId: number | string, data: InspectionData, user: AuthUser) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);
  assertClaimAccess(user, claim);

  const createData: Prisma.InspectionUncheckedCreateInput = {
    claimId: Number(claimId),
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
    conductedAt: data.conductedAt ? new Date(data.conductedAt) : null,
    location: data.location ?? null,
    findings: data.findings ?? null,
    notes: data.notes ?? null,
    inspectorId: data.inspectorId ? Number(data.inspectorId) : null,
  };

  const inspection = await prisma.inspection.create({
    data: createData,
    include: { photos: true },
  });
  await recordActivity(Number(claimId), 'INSPECTION_CREATED', `Inspection scheduled${data.location ? ` at ${data.location}` : ''}`, user.id);

  // Sync claim.dateInspected when an inspection has a conductedAt date
  if (data.conductedAt) {
    await prisma.claim.update({ where: { id: Number(claimId) }, data: { dateInspected: new Date(data.conductedAt) } });
    await autoAdvanceStatus(Number(claimId), 'INSPECTION_COMPLETED', user.id);
  } else {
    await autoAdvanceStatus(Number(claimId), 'INSPECTION_SCHEDULED', user.id);
  }

  return inspection;
}

export async function updateInspection(id: number, data: InspectionData, user: AuthUser) {
  const inspection = await prisma.inspection.findUnique({ where: { id }, include: { claim: true } });
  if (!inspection) throw new AppError('Inspection not found', 404);
  assertClaimAccess(user, inspection.claim);

  const update: Prisma.InspectionUncheckedUpdateInput = {};
  if (data.scheduledAt !== undefined) update.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
  if (data.conductedAt !== undefined) update.conductedAt = data.conductedAt ? new Date(data.conductedAt) : null;
  if (data.location !== undefined) update.location = data.location;
  if (data.findings !== undefined) update.findings = data.findings;
  if (data.notes !== undefined) update.notes = data.notes;
  if (data.inspectorId !== undefined) update.inspectorId = data.inspectorId ? Number(data.inspectorId) : null;

  const updated = await prisma.inspection.update({ where: { id }, data: update, include: { photos: true } });
  if (data.conductedAt && !inspection.conductedAt) {
    await recordActivity(inspection.claimId, 'INSPECTION_COMPLETED', 'Inspection completed', user.id);
  } else {
    await recordActivity(inspection.claimId, 'INSPECTION_UPDATED', 'Inspection updated', user.id);
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
    await autoAdvanceStatus(inspection.claimId, 'INSPECTION_COMPLETED', user.id);
  }

  return updated;
}

export async function deleteInspection(id: number, user: AuthUser) {
  const inspection = await prisma.inspection.findUnique({ where: { id }, include: { claim: true } });
  if (!inspection) throw new AppError('Inspection not found', 404);
  assertClaimAccess(user, inspection.claim);
  const { claimId } = inspection;
  await prisma.inspection.delete({ where: { id } });
  await recordActivity(claimId, 'INSPECTION_DELETED', 'Inspection deleted', user.id);
}

export async function uploadPhoto(inspectionId: number, file: Express.Multer.File, caption: string | undefined, user: AuthUser) {
  const inspection = await prisma.inspection.findUnique({ where: { id: inspectionId }, include: { claim: true } });
  if (!inspection) throw new AppError('Inspection not found', 404);
  assertClaimAccess(user, inspection.claim);

  const photo = await prisma.inspectionPhoto.create({
    data: {
      inspectionId,
      fileName: file.originalname,
      originalName: file.originalname,
      mimeType: file.mimetype,
      path: '',
      data: new Uint8Array(file.buffer),
      size: file.size,
      caption: caption || null,
      uploadedById: user.id,
    },
    select: {
      id: true,
      inspectionId: true,
      fileName: true,
      originalName: true,
      mimeType: true,
      size: true,
      caption: true,
      uploadedById: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await logAction('INSPECTION_PHOTO_UPLOADED', 'InspectionPhoto', photo.id, user.id, { inspectionId });
  await recordActivity(inspection.claimId, 'INSPECTION_PHOTO_UPLOADED', `Inspection photo uploaded: ${file.originalname}`, user.id);
  return photo;
}

// 1x1 transparent PNG placeholder for missing legacy photos
const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAlT0yiRAAAAAElFTkSuQmCC',
  'base64'
);

type PhotoWithBuffer = Prisma.InspectionPhotoGetPayload<{
  select: {
    id: true;
    inspectionId: true;
    fileName: true;
    originalName: true;
    mimeType: true;
    size: true;
    caption: true;
    uploadedById: true;
    createdAt: true;
    updatedAt: true;
    path: true;
    data: true;
  };
}> & { buffer: Buffer; isPlaceholder?: boolean };

export async function getPhoto(photoId: number | string, user: AuthUser): Promise<PhotoWithBuffer> {
  const photo = await prisma.inspectionPhoto.findUnique({
    where: { id: Number(photoId) },
    select: {
      id: true,
      inspectionId: true,
      fileName: true,
      originalName: true,
      mimeType: true,
      size: true,
      caption: true,
      uploadedById: true,
      createdAt: true,
      updatedAt: true,
      path: true,
      data: true,
    },
  });
  if (!photo) throw new AppError('Photo not found', 404);

  const inspection = await prisma.inspection.findUnique({
    where: { id: photo.inspectionId },
    include: { claim: true },
  });
  if (!inspection) throw new AppError('Inspection not found', 404);
  assertClaimAccess(user, inspection.claim);

  // Prefer BLOB data stored in the database (persistent across deploys)
  if (photo.data) {
    return { ...photo, buffer: Buffer.from(photo.data) } as PhotoWithBuffer;
  }

  // Fall back to disk for legacy records
  const resolved = resolveFilePath(photo.path);
  if (resolved && fs.existsSync(resolved)) {
    return { ...photo, buffer: fs.readFileSync(resolved) } as PhotoWithBuffer;
  }

  // File is missing (ephemeral filesystem lost it) — return placeholder
  // so the <img> doesn't show a broken image icon
  return { ...photo, buffer: PLACEHOLDER_PNG, mimeType: 'image/png', isPlaceholder: true } as PhotoWithBuffer;
}

export async function deletePhoto(photoId: number | string, user: AuthUser) {
  const photo = await prisma.inspectionPhoto.findUnique({
    where: { id: Number(photoId) },
    select: { id: true, originalName: true, mimeType: true, path: true, inspectionId: true },
  });
  if (!photo) throw new AppError('Photo not found', 404);

  const inspection = await prisma.inspection.findUnique({
    where: { id: photo.inspectionId },
    include: { claim: true },
  });
  if (!inspection) throw new AppError('Inspection not found', 404);
  assertClaimAccess(user, inspection.claim);

  const claimId = inspection.claimId;
  // Clean up legacy disk file if it exists
  if (photo.path) {
    const resolved = resolveFilePath(photo.path);
    if (resolved) {
      try {
        fs.unlinkSync(resolved);
      } catch {
        /* file may already be gone */
      }
    }
  }
  await prisma.inspectionPhoto.delete({ where: { id: Number(photoId) } });
  await logAction('INSPECTION_PHOTO_DELETED', 'InspectionPhoto', Number(photoId), user.id, { claimId });
  await recordActivity(claimId, 'INSPECTION_PHOTO_DELETED', `Inspection photo deleted: ${photo.originalName}`, user.id);
}
