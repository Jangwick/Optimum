/* eslint-disable @typescript-eslint/no-explicit-any */
import * as inspectionService from '../services/inspection.service.js';
import { AppError } from '../middleware/error.js';
import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { IdParamSchema, parseWithAppError } from '../validators/index.js';
import { ListInspectionsQuerySchema, CreateInspectionSchema, UpdateInspectionSchema, InspectionPhotoCaptionSchema } from '../validators/inspection.js';

export const listInspections: RequestHandler = async (req, res, next) => {
  try {
    const claimId = parseWithAppError(IdParamSchema, req.params.claimId);
    const query = parseWithAppError(ListInspectionsQuerySchema, req.query);
    const data = await inspectionService.listInspections(claimId, (req as AuthenticatedRequest).user, query);
    res.json({ success: true, ...data });
  } catch (err) { next(err as any);
  }
}

export const createInspection: RequestHandler = async (req, res, next) => {
  try {
    const claimId = parseWithAppError(IdParamSchema, req.params.claimId);
    const body = parseWithAppError(CreateInspectionSchema, req.body);
    const item = await inspectionService.createInspection(claimId, body, (req as AuthenticatedRequest).user);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const updateInspection: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const body = parseWithAppError(UpdateInspectionSchema, req.body);
    const item = await inspectionService.updateInspection(id, body, (req as AuthenticatedRequest).user);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const deleteInspection: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    await inspectionService.deleteInspection(id, (req as AuthenticatedRequest).user);
    res.json({ success: true });
  } catch (err) { next(err as any);
  }
}

export const uploadInspectionPhoto: RequestHandler = async (req, res, next) => {
  try {
    if (!(req as any).file) throw new AppError('No file uploaded', 400);
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const body = parseWithAppError(InspectionPhotoCaptionSchema, req.body);
    const photo = await inspectionService.uploadPhoto(
      id,
      (req as any).file,
      body.caption,
      (req as AuthenticatedRequest).user
    );
    res.status(201).json({ success: true, item: photo });
  } catch (err) { next(err as any);
  }
}

export const getInspectionPhoto: RequestHandler = async (req, res, next) => {
  try {
    const photoId = parseWithAppError(IdParamSchema, req.params.photoId);
    const photo = await inspectionService.getPhoto(photoId, (req as AuthenticatedRequest).user);
    res.setHeader('Content-Type', photo.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${photo.originalName}"`);
    res.send(photo.buffer);
  } catch (err) { next(err as any);
  }
}

export const deleteInspectionPhoto: RequestHandler = async (req, res, next) => {
  try {
    const photoId = parseWithAppError(IdParamSchema, req.params.photoId);
    await inspectionService.deletePhoto(photoId, (req as AuthenticatedRequest).user);
    res.json({ success: true });
  } catch (err) { next(err as any);
  }
}
