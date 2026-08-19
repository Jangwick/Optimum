import * as processStatusService from '../services/process-status.service.js';
import { AppError } from '../middleware/error.js';

function idParam(req) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('Invalid claim id', 400);
  return id;
}

export async function listProcessStatuses(req, res, next) {
  try {
    const items = await processStatusService.getProcessStatuses();
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

export async function listProcessStatusHistory(req, res, next) {
  try {
    const items = await processStatusService.getProcessStatusHistory(idParam(req));
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

export async function updateProcessStatus(req, res, next) {
  try {
    const item = await processStatusService.updateProcessStatus(idParam(req), req.body, req.user.id);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function getClosingGuards(req, res, next) {
  try {
    const item = await processStatusService.getClosingGuardStatus(idParam(req));
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}
