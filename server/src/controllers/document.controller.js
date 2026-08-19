import * as documentService from '../services/document.service.js';
import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import path from 'path';
import fs from 'fs';

function idParam(req) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
  return id;
}

export async function getChecklist(req, res, next) {
  try {
    const items = await documentService.getDocumentChecklist(req.params.claimId);
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);
    const item = await documentService.uploadDocument(req.params.claimId, req.file, req.body, req.user.id);
    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function markReceived(req, res, next) {
  try {
    const item = await documentService.markDocumentReceived(idParam(req));
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function downloadDocument(req, res, next) {
  try {
    const id = idParam(req);
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) throw new AppError('Document not found', 404);
    if (!fs.existsSync(doc.path)) throw new AppError('File not found on disk', 404);

    res.setHeader('Content-Disposition', `attachment; filename="${doc.originalName}"`);
    res.setHeader('Content-Type', doc.mimeType);
    res.sendFile(path.resolve(doc.path));
  } catch (err) {
    next(err);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    await documentService.deleteDocument(idParam(req));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
