/* eslint-disable @typescript-eslint/no-explicit-any */
import * as investigationService from '../services/investigation.service.js';
import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { IdParamSchema, parseWithAppError } from '../validators/index.js';
import { ListInvestigationsQuerySchema, CreateInvestigationSchema, UpdateInvestigationSchema } from '../validators/investigation.js';

export const listInvestigations: RequestHandler = async (req, res, next) => {
  try {
    const claimId = parseWithAppError(IdParamSchema, req.params.claimId);
    const query = parseWithAppError(ListInvestigationsQuerySchema, req.query);
    const data = await investigationService.listInvestigations(claimId, (req as AuthenticatedRequest).user, query);
    res.json({ success: true, ...data });
  } catch (err) { next(err as any);
  }
}

export const createInvestigation: RequestHandler = async (req, res, next) => {
  try {
    const claimId = parseWithAppError(IdParamSchema, req.params.claimId);
    const body = parseWithAppError(CreateInvestigationSchema, req.body);
    const item = await investigationService.createInvestigation(claimId, body, (req as AuthenticatedRequest).user);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const updateInvestigation: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const body = parseWithAppError(UpdateInvestigationSchema, req.body);
    const item = await investigationService.updateInvestigation(id, body as any, (req as AuthenticatedRequest).user);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const deleteInvestigation: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    await investigationService.deleteInvestigation(id, (req as AuthenticatedRequest).user);
    res.json({ success: true });
  } catch (err) { next(err as any);
  }
}
