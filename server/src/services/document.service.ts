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

interface DocumentData {
  documentCategoryId?: number | string | null;
  description?: string | null;
  isReceived?: string | boolean;
}

interface ChecklistGroup {
  category: Record<string, unknown> | null;
  isRequired: boolean;
  uploaded: Record<string, unknown>[];
}

export async function getDocumentChecklist(claimId: number | string, user: AuthUser): Promise<ChecklistGroup[]> {
  const claim = await prisma.claim.findUnique({
    where: { id: Number(claimId) },
    include: { claimType: { include: { requirements: { include: { documentCategory: true } } } } },
  });
  if (!claim) throw new AppError('Claim not found', 404);
  assertClaimAccess(user, claim);

  const documents = await prisma.document.findMany({
    where: { claimId: Number(claimId) },
    include: { documentCategory: true, uploadedBy: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
    omit: { data: true },
  });

  const requirements = claim.claimType?.requirements || [];

  // Build a map of all categories: required ones + any with uploaded docs
  const categoryMap = new Map<number, ChecklistGroup>();
  for (const req of requirements) {
    if (req.documentCategoryId) {
      categoryMap.set(req.documentCategoryId, {
        category: req.documentCategory as unknown as Record<string, unknown>,
        isRequired: req.isRequired,
        uploaded: [],
      });
    }
  }

  // Add categories from uploaded documents that aren't in requirements
  for (const doc of documents) {
    if (doc.documentCategoryId && !categoryMap.has(doc.documentCategoryId)) {
      categoryMap.set(doc.documentCategoryId, {
        category: doc.documentCategory as unknown as Record<string, unknown>,
        isRequired: false,
        uploaded: [],
      });
    }
  }

  // Add documents with no category to an "Uncategorized" group
  const uncategorizedDocs = documents.filter((d) => !d.documentCategoryId);

  const result: ChecklistGroup[] = Array.from(categoryMap.values()).map((group) => ({
    ...group,
    uploaded: documents
      .filter((d) => d.documentCategoryId && categoryMap.has(d.documentCategoryId) && categoryMap.get(d.documentCategoryId) === group)
      .map((d) => ({
        id: d.id,
        originalName: d.originalName,
        mimeType: d.mimeType,
        size: d.size,
        description: d.description,
        isReceived: d.isReceived,
        receivedAt: d.receivedAt?.toISOString(),
        uploadedBy: d.uploadedBy ? `${d.uploadedBy.firstName} ${d.uploadedBy.lastName}` : null,
        createdAt: d.createdAt.toISOString(),
      })),
  }));

  if (uncategorizedDocs.length > 0) {
    result.push({
      category: null,
      isRequired: false,
      uploaded: uncategorizedDocs.map((d) => ({
        id: d.id,
        originalName: d.originalName,
        mimeType: d.mimeType,
        size: d.size,
        description: d.description,
        isReceived: d.isReceived,
        receivedAt: d.receivedAt?.toISOString(),
        uploadedBy: d.uploadedBy ? `${d.uploadedBy.firstName} ${d.uploadedBy.lastName}` : null,
        createdAt: d.createdAt.toISOString(),
      })),
    });
  }

  return result;
}

export async function uploadDocument(claimId: number | string, file: Express.Multer.File, data: DocumentData, user: AuthUser) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) {
    throw new AppError('Claim not found', 404);
  }
  assertClaimAccess(user, claim);

  const createData: Prisma.DocumentUncheckedCreateInput = {
    claimId: Number(claimId),
    documentCategoryId: data.documentCategoryId ? Number(data.documentCategoryId) : null,
    fileName: file.originalname,
    originalName: file.originalname,
    mimeType: file.mimetype,
    path: '',
    data: new Uint8Array(file.buffer),
    size: file.size,
    description: data.description ?? null,
    uploadedById: user.id,
    isReceived: data.isReceived === 'true' || data.isReceived === true,
    receivedAt: data.isReceived ? new Date() : null,
  };

  const doc = await prisma.document.create({
    data: createData,
    include: { documentCategory: true },
    omit: { data: true },
  });

  await logAction('DOCUMENT_UPLOADED', 'Document', doc.id, user.id, { originalName: doc.originalName, claimId });
  await recordActivity(Number(claimId), 'DOCUMENT_UPLOADED', `Document uploaded: ${doc.originalName}`, user.id);
  await autoAdvanceStatus(Number(claimId), 'DOCUMENTS_PENDING', user.id);
  return doc;
}

export async function markDocumentReceived(claimId: number | string, id: number, user: AuthUser) {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { claim: true },
  });
  if (!doc) throw new AppError('Document not found', 404);
  if (doc.claimId !== Number(claimId)) throw new AppError('Document not found', 404);
  assertClaimAccess(user, doc.claim);

  const updated = await prisma.document.update({
    where: { id },
    data: { isReceived: true, receivedAt: new Date() },
    include: { documentCategory: true },
  });
  await logAction('DOCUMENT_RECEIVED', 'Document', id, user.id, { originalName: updated.originalName, claimId: updated.claimId });
  await recordActivity(updated.claimId, 'DOCUMENT_RECEIVED', `Document marked received: ${updated.originalName}`, user.id);
  await autoAdvanceStatus(updated.claimId, 'DOCUMENTS_RECEIVED', user.id);
  return updated;
}

export async function deleteDocument(claimId: number | string, id: number, user: AuthUser) {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { claim: true },
  });
  if (!doc) throw new AppError('Document not found', 404);
  if (doc.claimId !== Number(claimId)) throw new AppError('Document not found', 404);
  assertClaimAccess(user, doc.claim);

  // Clean up legacy disk file if it exists
  if (doc.path) {
    const resolved = resolveFilePath(doc.path);
    if (resolved) {
      try { fs.unlinkSync(resolved); } catch { /* file may already be gone */ }
    }
  }
  await logAction('DOCUMENT_DELETED', 'Document', id, user.id, { originalName: doc.originalName, claimId: doc.claimId });
  await recordActivity(doc.claimId, 'DOCUMENT_DELETED', `Document deleted: ${doc.originalName}`, user.id);
  await prisma.document.delete({ where: { id } });
}

export async function getDocumentFile(claimId: number | string, id: number, user: AuthUser): Promise<Record<string, unknown>> {
  const doc = await prisma.document.findFirst({
    where: { id, claimId: Number(claimId) },
    include: { claim: true },
  });
  if (!doc) throw new AppError('Document not found', 404);
  assertClaimAccess(user, doc.claim);

  // Prefer BLOB data stored in the database (persistent across deploys)
  if (doc.data) {
    return { ...doc, buffer: Buffer.from(doc.data as Uint8Array) };
  }

  // Fall back to disk for legacy records
  const resolved = resolveFilePath(doc.path);
  if (resolved && fs.existsSync(resolved)) {
    return { ...doc, buffer: fs.readFileSync(resolved) };
  }

  // File is missing (ephemeral filesystem lost it) — return a text placeholder
  const placeholder = Buffer.from(
    `This document ("${doc.originalName}") was uploaded to the server's local disk, ` +
    'which was lost during a redeploy. Please re-upload the file to restore it.'
  );
  return { ...doc, buffer: placeholder, mimeType: 'text/plain', isPlaceholder: true };
}
