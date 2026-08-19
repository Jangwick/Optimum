import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import fs from 'fs';
import path from 'path';

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
    fs.unlinkSync(file.path);
    throw new AppError('Claim not found', 404);
  }

  const doc = await prisma.document.create({
    data: {
      claimId: Number(claimId),
      documentCategoryId: data.documentCategoryId ? Number(data.documentCategoryId) : null,
      fileName: path.basename(file.filename),
      originalName: file.originalname,
      mimeType: file.mimetype,
      path: file.path,
      size: file.size,
      description: data.description,
      uploadedById: userId,
      isReceived: data.isReceived === 'true' || data.isReceived === true,
      receivedAt: data.isReceived ? new Date() : null,
    },
    include: { documentCategory: true },
  });

  await logAction('DOCUMENT_UPLOADED', 'Document', doc.id, userId, { originalName: doc.originalName, claimId });
  return doc;
}

export async function markDocumentReceived(id, userId) {
  const doc = await prisma.document.update({
    where: { id },
    data: { isReceived: true, receivedAt: new Date() },
    include: { documentCategory: true },
  });
  await logAction('DOCUMENT_RECEIVED', 'Document', id, userId, { originalName: doc.originalName, claimId: doc.claimId });
  return doc;
}

export async function deleteDocument(id, userId) {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) throw new AppError('Document not found', 404);
  if (fs.existsSync(doc.path)) {
    fs.unlinkSync(doc.path);
  }
  await logAction('DOCUMENT_DELETED', 'Document', id, userId, { originalName: doc.originalName, claimId: doc.claimId });
  await prisma.document.delete({ where: { id } });
}
