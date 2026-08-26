/* eslint-disable @typescript-eslint/no-explicit-any */
import * as exportService from '../services/export.service.js';
import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { parseWithAppError } from '../validators/index.js';
import { ExportClaimsQuerySchema } from '../validators/export.js';

export const exportClaims: RequestHandler = async (req, res, next) => {
  try {
    const filters = parseWithAppError(ExportClaimsQuerySchema, req.query);
    const signal = (req as { signal?: AbortSignal }).signal ?? new AbortController().signal;
    const buffer = await exportService.exportClaimsToExcel(filters, (req as AuthenticatedRequest).user, signal);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=claims-${new Date().toISOString().slice(0, 10)}.xlsx`);
    res.end(buffer);
  } catch (err) { next(err as any);
  }
}
