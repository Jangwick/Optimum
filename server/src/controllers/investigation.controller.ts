/* eslint-disable @typescript-eslint/no-explicit-any */
import * as investigationService from '../services/investigation.service.js';
import { AppError } from '../middleware/error.js';
import type { Request, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';

function idParam(req: Request) {
  const id = Number(Number(req.params.id));
  if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
  return id;
}

export const listInvestigations: RequestHandler = async (req, res, next) => {
  try {
    const items = await investigationService.listInvestigations(Number(req.params.claimId), (req as AuthenticatedRequest).user);
    res.json({ success: true, items });
  } catch (err) { next(err as any);
  }
}

export const createInvestigation: RequestHandler = async (req, res, next) => {
  try {
    const item = await investigationService.createInvestigation(Number(req.params.claimId), req.body, (req as AuthenticatedRequest).user);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const updateInvestigation: RequestHandler = async (req, res, next) => {
  try {
    const item = await investigationService.updateInvestigation(idParam(req), req.body, (req as AuthenticatedRequest).user);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const deleteInvestigation: RequestHandler = async (req, res, next) => {
  try {
    await investigationService.deleteInvestigation(idParam(req), (req as AuthenticatedRequest).user);
    res.json({ success: true });
  } catch (err) { next(err as any);
  }
}
