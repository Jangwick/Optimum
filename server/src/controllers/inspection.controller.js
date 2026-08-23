import * as inspectionService from '../services/inspection.service.js';
import { AppError } from '../middleware/error.js';

function idParam(req) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
  return id;
}

export async function listInspections(req, res, next) {
  try {
    const items = await inspectionService.listInspections(req.params.claimId);
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

export async function createInspection(req, res, next) {
  try {
    const item = await inspectionService.createInspection(req.params.claimId, req.body, req.user.id);
    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function updateInspection(req, res, next) {
  try {
    const item = await inspectionService.updateInspection(idParam(req), req.body, req.user.id);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function deleteInspection(req, res, next) {
  try {
    await inspectionService.deleteInspection(idParam(req), req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function uploadInspectionPhoto(req, res, next) {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);
    const photo = await inspectionService.uploadPhoto(
      idParam(req),
      req.file,
      req.body.caption,
      req.user.id
    );
    res.status(201).json({ success: true, item: photo });
  } catch (err) {
    next(err);
  }
}

export async function getInspectionPhoto(req, res, next) {
  try {
    const photo = await inspectionService.getPhoto(req.params.photoId);
    res.setHeader('Content-Type', photo.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${photo.originalName}"`);
    const { createReadStream } = await import('fs');
    createReadStream(photo.path).pipe(res);
  } catch (err) {
    next(err);
  }
}

export async function deleteInspectionPhoto(req, res, next) {
  try {
    await inspectionService.deletePhoto(Number(req.params.photoId), req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
