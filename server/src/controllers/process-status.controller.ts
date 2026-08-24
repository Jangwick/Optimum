/* eslint-disable @typescript-eslint/no-explicit-any */
import * as processStatusService from '../services/process-status.service.js';
import { AppError } from '../middleware/error.js';
import type { Request, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';

function idParam(req: Request) {
  const id = Number(Number(req.params.id));
  if (Number.isNaN(id)) throw new AppError('Invalid claim id', 400);
  return id;
}

export const listProcessStatuses: RequestHandler = async (req, res, next) => {
  try {
    const items = await processStatusService.getProcessStatuses();
    res.json({ success: true, items });
  } catch (err) { next(err as any);
  }
}

export const listProcessStatusHistory: RequestHandler = async (req, res, next) => {
  try {
    const items = await processStatusService.getProcessStatusHistory(idParam(req));
    res.json({ success: true, items });
  } catch (err) { next(err as any);
  }
}

export const updateProcessStatus: RequestHandler = async (req, res, next) => {
  try {
    const item = await processStatusService.updateProcessStatus(idParam(req), req.body, (req as AuthenticatedRequest).user.id);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const getClosingGuards: RequestHandler = async (req, res, next) => {
  try {
    const item = await processStatusService.getClosingGuardStatus(idParam(req));
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}
