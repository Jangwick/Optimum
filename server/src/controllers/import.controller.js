import * as importService from '../services/import.service.js';
import { AppError } from '../middleware/error.js';

function idParam(req) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('Invalid batch id', 400);
  return id;
}

export async function listBatches(req, res, next) {
  try {
    const data = await importService.getBatches(req.query);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function getBatch(req, res, next) {
  try {
    const item = await importService.getBatch(idParam(req));
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function getBatchRows(req, res, next) {
  try {
    const data = await importService.getBatchRows(idParam(req), req.query);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function uploadWorkbook(req, res, next) {
  try {
    const item = await importService.uploadWorkbook(req.file, req.user.id);
    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function previewWorkbook(req, res, next) {
  try {
    const item = await importService.previewWorkbook(idParam(req), req.user.id);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function persistRows(req, res, next) {
  try {
    const item = await importService.persistRows(idParam(req), req.user.id);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function updateMapping(req, res, next) {
  try {
    const item = await importService.updateMapping(idParam(req), req.body.headerMapping, req.user.id);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function commitBatch(req, res, next) {
  try {
    const item = await importService.commitBatch(idParam(req), req.user.id, req.body);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function rollbackBatch(req, res, next) {
  try {
    const item = await importService.rollbackBatch(idParam(req), req.user.id);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}
