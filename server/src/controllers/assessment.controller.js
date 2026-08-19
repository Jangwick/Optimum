import * as assessmentService from '../services/assessment.service.js';
import { AppError } from '../middleware/error.js';

function idParam(req) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
  return id;
}

export async function listAssessments(req, res, next) {
  try {
    const items = await assessmentService.getAssessments(req.params.claimId);
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

export async function getAssessment(req, res, next) {
  try {
    const item = await assessmentService.getAssessment(idParam(req));
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function createAssessment(req, res, next) {
  try {
    const item = await assessmentService.createAssessment(req.params.claimId, req.body, req.user.id);
    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function updateAssessment(req, res, next) {
  try {
    const item = await assessmentService.updateAssessment(idParam(req), req.body, req.user.id);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function deleteAssessment(req, res, next) {
  try {
    await assessmentService.deleteAssessment(idParam(req));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
