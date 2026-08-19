import * as activityService from '../services/activity.service.js';
import { AppError } from '../middleware/error.js';

function idParam(req) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('Invalid claim id', 400);
  return id;
}

export async function listActivities(req, res, next) {
  try {
    const data = await activityService.getActivities(idParam(req), req.query);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function addActivity(req, res, next) {
  try {
    const item = await activityService.addActivity(idParam(req), req.body, req.user.id);
    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function listCorrespondence(req, res, next) {
  try {
    const items = await activityService.getCorrespondence(idParam(req));
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

export async function addCorrespondence(req, res, next) {
  try {
    const item = await activityService.addCorrespondence(idParam(req), req.body, req.user.id);
    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
}
