import * as investigationService from '../services/investigation.service.js';
import { AppError } from '../middleware/error.js';

function idParam(req) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
  return id;
}

export async function listInvestigations(req, res, next) {
  try {
    const items = await investigationService.listInvestigations(req.params.claimId);
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

export async function createInvestigation(req, res, next) {
  try {
    const item = await investigationService.createInvestigation(req.params.claimId, req.body, req.user.id);
    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function updateInvestigation(req, res, next) {
  try {
    const item = await investigationService.updateInvestigation(idParam(req), req.body, req.user.id);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function deleteInvestigation(req, res, next) {
  try {
    await investigationService.deleteInvestigation(idParam(req));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
