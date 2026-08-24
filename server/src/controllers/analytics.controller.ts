/* eslint-disable @typescript-eslint/no-explicit-any */
import * as analyticsService from '../services/analytics.service.js';
import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export const getAnalytics: RequestHandler = async (req, res, next) => {
  try {
    const data = await analyticsService.getAnalytics((req as AuthenticatedRequest).user);
    res.json({ success: true, ...data });
  } catch (err) { next(err as any);
  }
}
