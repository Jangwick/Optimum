/* eslint-disable @typescript-eslint/no-explicit-any */
import * as exportService from '../services/export.service.js';
import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export const exportClaims: RequestHandler = async (req, res, next) => {
  try {
    const buffer = await exportService.exportClaimsToExcel((req.query as any), (req as AuthenticatedRequest).user);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=claims-${new Date().toISOString().slice(0, 10)}.xlsx`);
    res.end(buffer);
  } catch (err) { next(err as any);
  }
}
