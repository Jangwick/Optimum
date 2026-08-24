/* eslint-disable @typescript-eslint/no-explicit-any */
import * as activityService from '../services/activity.service.js';
import { AppError } from '../middleware/error.js';
import type { Request, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';

function idParam(req: Request) {
  const id = Number(Number(req.params.id));
  if (Number.isNaN(id)) throw new AppError('Invalid claim id', 400);
  return id;
}

export const listActivities: RequestHandler = async (req, res, next) => {
  try {
    const data = await activityService.getActivities(idParam(req), (req.query as any));
    res.json({ success: true, ...data });
  } catch (err) { next(err as any);
  }
}

export const addActivity: RequestHandler = async (req, res, next) => {
  try {
    const item = await activityService.addActivity(idParam(req), req.body, (req as AuthenticatedRequest).user.id);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const listCorrespondence: RequestHandler = async (req, res, next) => {
  try {
    const items = await activityService.getCorrespondence(idParam(req));
    res.json({ success: true, items });
  } catch (err) { next(err as any);
  }
}

export const addCorrespondence: RequestHandler = async (req, res, next) => {
  try {
    const item = await activityService.addCorrespondence(idParam(req), req.body, (req as AuthenticatedRequest).user.id);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}
