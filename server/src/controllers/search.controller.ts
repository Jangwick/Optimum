import type { Request, Response, NextFunction } from 'express';
import * as searchService from '../services/search.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const { q, limit } = req.query;
    const groups = await searchService.searchAll(q, limit, (req as AuthenticatedRequest).user);
    res.json({
      success: true,
      query: typeof q === 'string' ? q.trim() : '',
      limit: Number.isNaN(Number(limit)) ? 3 : Math.min(Math.max(Number(limit), 1), 10),
      groups,
    });
  } catch (err) {
    next(err);
  }
}
