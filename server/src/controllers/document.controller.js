import * as documentService from '../services/document.service.js';
import { AppError } from '../middleware/error.js';

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
    const item = await documentService.markDocumentReceived(idParam(req), req.user.id);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

async function sendDocumentFile(req, res, next, disposition) {
  try {
    const id = idParam(req);
    const doc = await documentService.getDocumentFile(id, req.params.claimId);

    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`
    );
    res.setHeader('Content-Type', doc.mimeType);
    res.send(doc.buffer);
  } catch (err) {
    next(err);
  }
}

export async function downloadDocument(req, res, next) {
  await sendDocumentFile(req, res, next, 'attachment');
}

export async function previewDocument(req, res, next) {
  await sendDocumentFile(req, res, next, 'inline');
}

export async function deleteDocument(req, res, next) {
  try {
    await documentService.deleteDocument(idParam(req), req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
