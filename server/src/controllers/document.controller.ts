/* eslint-disable @typescript-eslint/no-explicit-any */
import * as documentService from '../services/document.service.js';
import { AppError } from '../middleware/error.js';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { IdParamSchema, parseWithAppError } from '../validators/index.js';
import { UploadDocumentSchema } from '../validators/document.js';

export const getChecklist: RequestHandler = async (req, res, next) => {
  try {
    const claimId = parseWithAppError(IdParamSchema, req.params.claimId);
    const items = await documentService.getDocumentChecklist(claimId, (req as AuthenticatedRequest).user);
    res.json({ success: true, items });
  } catch (err) { next(err as any);
  }
}

export const uploadDocument: RequestHandler = async (req, res, next) => {
  try {
    if (!(req as any).file) throw new AppError('No file uploaded', 400);
    const claimId = parseWithAppError(IdParamSchema, req.params.claimId);
    const body = parseWithAppError(UploadDocumentSchema, req.body);
    const item = await documentService.uploadDocument(claimId, (req as any).file, body, (req as AuthenticatedRequest).user);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const markReceived: RequestHandler = async (req, res, next) => {
  try {
    const claimId = parseWithAppError(IdParamSchema, req.params.claimId);
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const item = await documentService.markDocumentReceived(claimId, id, (req as AuthenticatedRequest).user);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

async function sendDocumentFile(req: Request, res: Response, next: NextFunction, disposition: string) {
  try {
    const claimId = parseWithAppError(IdParamSchema, req.params.claimId);
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const doc = (await documentService.getDocumentFile(claimId, id, (req as AuthenticatedRequest).user)) as { originalName: string; mimeType: string; buffer: Buffer };

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
    const claimId = parseWithAppError(IdParamSchema, req.params.claimId);
    const id = parseWithAppError(IdParamSchema, req.params.id);
    await documentService.deleteDocument(claimId, id, (req as AuthenticatedRequest).user);
    res.json({ success: true });
  } catch (err) { next(err as any);
  }
}
