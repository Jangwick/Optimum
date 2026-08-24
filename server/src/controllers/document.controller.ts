/* eslint-disable @typescript-eslint/no-explicit-any */
import * as documentService from '../services/document.service.js';
import { AppError } from '../middleware/error.js';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';

function idParam(req: Request) {
  const id = Number(Number(req.params.id));
  if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
  return id;
}

export const getChecklist: RequestHandler = async (req, res, next) => {
  try {
    const items = await documentService.getDocumentChecklist(Number(req.params.claimId), (req as AuthenticatedRequest).user);
    res.json({ success: true, items });
  } catch (err) { next(err as any);
  }
}

export const uploadDocument: RequestHandler = async (req, res, next) => {
  try {
    if (!(req as any).file) throw new AppError('No file uploaded', 400);
    const item = await documentService.uploadDocument(Number(req.params.claimId), (req as any).file, req.body, (req as AuthenticatedRequest).user);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const markReceived: RequestHandler = async (req, res, next) => {
  try {
    const item = await documentService.markDocumentReceived(Number(req.params.claimId), idParam(req), (req as AuthenticatedRequest).user);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

async function sendDocumentFile(req: Request, res: Response, next: NextFunction, disposition: string) {
  try {
    const id = idParam(req);
    const doc = (await documentService.getDocumentFile(Number(req.params.claimId), id, (req as AuthenticatedRequest).user)) as { originalName: string; mimeType: string; buffer: Buffer };

    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`
    );
    res.setHeader('Content-Type', doc.mimeType);
    res.send(doc.buffer);
  } catch (err) { next(err as any);
  }
}

export const downloadDocument: RequestHandler = async (req, res, next) => {
  await sendDocumentFile(req, res, next, 'attachment');
}

export const previewDocument: RequestHandler = async (req, res, next) => {
  await sendDocumentFile(req, res, next, 'inline');
}

export const deleteDocument: RequestHandler = async (req, res, next) => {
  try {
    await documentService.deleteDocument(Number(req.params.claimId), idParam(req), (req as AuthenticatedRequest).user);
    res.json({ success: true });
  } catch (err) { next(err as any);
  }
}
