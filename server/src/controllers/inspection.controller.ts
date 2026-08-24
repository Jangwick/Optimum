/* eslint-disable @typescript-eslint/no-explicit-any */
import * as inspectionService from '../services/inspection.service.js';
import { AppError } from '../middleware/error.js';
import type { Request, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';

function idParam(req: Request) {
  const id = Number(Number(req.params.id));
  if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
  return id;
}

export const listInspections: RequestHandler = async (req, res, next) => {
  try {
    const items = await inspectionService.listInspections(Number(req.params.claimId));
    res.json({ success: true, items });
  } catch (err) { next(err as any);
  }
}

export const createInspection: RequestHandler = async (req, res, next) => {
  try {
    const item = await inspectionService.createInspection(Number(req.params.claimId), req.body, (req as AuthenticatedRequest).user.id);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const updateInspection: RequestHandler = async (req, res, next) => {
  try {
    const item = await inspectionService.updateInspection(idParam(req), req.body, (req as AuthenticatedRequest).user.id);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const deleteInspection: RequestHandler = async (req, res, next) => {
  try {
    await inspectionService.deleteInspection(idParam(req), (req as AuthenticatedRequest).user.id);
    res.json({ success: true });
  } catch (err) { next(err as any);
  }
}

export const uploadInspectionPhoto: RequestHandler = async (req, res, next) => {
  try {
    if (!(req as any).file) throw new AppError('No file uploaded', 400);
    const photo = await inspectionService.uploadPhoto(
      idParam(req),
      (req as any).file,
      req.body.caption,
      (req as AuthenticatedRequest).user.id
    );
    res.status(201).json({ success: true, item: photo });
  } catch (err) { next(err as any);
  }
}

export const getInspectionPhoto: RequestHandler = async (req, res, next) => {
  try {
    const photo = await inspectionService.getPhoto(Number(req.params.photoId));
    res.setHeader('Content-Type', photo.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${photo.originalName}"`);
    res.send(photo.buffer);
  } catch (err) { next(err as any);
  }
}

export const deleteInspectionPhoto: RequestHandler = async (req, res, next) => {
  try {
    await inspectionService.deletePhoto(Number(Number(req.params.photoId)), (req as AuthenticatedRequest).user.id);
    res.json({ success: true });
  } catch (err) { next(err as any);
  }
}
