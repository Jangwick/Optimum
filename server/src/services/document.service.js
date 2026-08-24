import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import { recordActivity } from './activity.service.js';
import { autoAdvanceStatus } from './claim.service.js';
import fs from 'fs';
import { resolveFilePath } from '../utils/file-path.js';

export async function getDocumentChecklist(claimId) {
  const claim = await prisma.claim.findUnique({
    where: { id: Number(claimId) },
    include: { claimType: { include: { requirements: { include: { documentCategory: true } } } } },
  });
  if (!claim) throw new AppError('Claim not found', 404);

  const documents = await prisma.document.findMany({
    where: { claimId: Number(claimId) },
    include: { documentCategory: true, uploadedBy: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
    omit: { data: true },
  });

  const requirements = claim.claimType?.requirements || [];

  // Build a map of all categories: required ones + any with uploaded docs
  const categoryMap = new Map();
  for (const req of requirements) {
    categoryMap.set(req.documentCategoryId, {
      category: req.documentCategory,
      isRequired: req.isRequired,
      uploaded: [],
    });
  }
  // Add categories from uploaded documents that aren't in requirements
  for (const doc of documents) {
    if (doc.documentCategoryId && !categoryMap.has(doc.documentCategoryId)) {
      categoryMap.set(doc.documentCategoryId, {
        category: doc.documentCategory,
        isRequired: false,
        uploaded: [],
      });
    }
  }
  // Add documents with no category to an "Uncategorized" group
  const uncategorizedDocs = documents.filter((d) => !d.documentCategoryId);

  const result = Array.from(categoryMap.values()).map((group) => ({
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

export async function uploadDocument(claimId, file, data, userId) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) {
    throw new AppError('Claim not found', 404);
  }

  const doc = await prisma.document.create({
    data: {
      claimId: Number(claimId),
      documentCategoryId: data.documentCategoryId ? Number(data.documentCategoryId) : null,
      fileName: file.originalname,
      originalName: file.originalname,
      mimeType: file.mimetype,
      path: '',
      data: file.buffer,
      size: file.size,
      description: data.description,
      uploadedById: userId,
      isReceived: data.isReceived === 'true' || data.isReceived === true,
      receivedAt: data.isReceived ? new Date() : null,
    },
    include: { documentCategory: true },
    omit: { data: true },
  });

  await logAction('DOCUMENT_UPLOADED', 'Document', doc.id, userId, { originalName: doc.originalName, claimId });
  await recordActivity(claimId, 'DOCUMENT_UPLOADED', `Document uploaded: ${doc.originalName}`, userId);
  await autoAdvanceStatus(claimId, 'DOCUMENTS_PENDING', userId);
  return doc;
}

export async function markDocumentReceived(id, userId) {
  const doc = await prisma.document.update({
    where: { id },
    data: { isReceived: true, receivedAt: new Date() },
    include: { documentCategory: true },
  });
  await logAction('DOCUMENT_RECEIVED', 'Document', id, userId, { originalName: doc.originalName, claimId: doc.claimId });
  await recordActivity(doc.claimId, 'DOCUMENT_RECEIVED', `Document marked received: ${doc.originalName}`, userId);
  await autoAdvanceStatus(doc.claimId, 'DOCUMENTS_RECEIVED', userId);
  return doc;
}

export async function deleteDocument(id, userId) {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) throw new AppError('Document not found', 404);
  // Clean up legacy disk file if it exists
  if (doc.path) {
    const resolved = resolveFilePath(doc.path);
    if (resolved) {
      try { fs.unlinkSync(resolved); } catch { /* file may already be gone */ }
    }
  }
  await logAction('DOCUMENT_DELETED', 'Document', id, userId, { originalName: doc.originalName, claimId: doc.claimId });
  await recordActivity(doc.claimId, 'DOCUMENT_DELETED', `Document deleted: ${doc.originalName}`, userId);
  await prisma.document.delete({ where: { id } });
}

export async function getDocumentFile(id, claimId) {
  const doc = await prisma.document.findFirst({
    where: { id, claimId: Number(claimId) },
  });
  if (!doc) throw new AppError('Document not found', 404);

  // Prefer BLOB data stored in the database (persistent across deploys)
  if (doc.data) {
    return { ...doc, buffer: Buffer.from(doc.data) };
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
