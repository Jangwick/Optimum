/* eslint-disable @typescript-eslint/no-explicit-any */
import * as dashboardService from '../services/dashboard.service.js';
import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export const getDashboard: RequestHandler = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboard((req as AuthenticatedRequest).user);
    res.json({ success: true, ...data });
  } catch (err) { next(err as any);
  }
}
