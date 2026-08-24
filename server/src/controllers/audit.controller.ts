/* eslint-disable @typescript-eslint/no-explicit-any */
import * as auditService from '../services/audit.service.js';
import type { RequestHandler } from 'express';

export const listAuditLogs: RequestHandler = async (req, res, next) => {
  try {
    const data = await auditService.listAuditLogs((req.query as any));
    res.json({ success: true, ...data });
  } catch (err) { next(err as any);
  }
}
