/* eslint-disable @typescript-eslint/no-explicit-any */
import * as feeService from '../services/fee.service.js';
import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { IdParamSchema, parseWithAppError } from '../validators/index.js';
import { CreateFeeSchema, UpdateFeeSchema } from '../validators/financial.js';

export const listFees: RequestHandler = async (req, res, next) => {
  try {
    const claimId = parseWithAppError(IdParamSchema, req.params.claimId);
    const items = await feeService.listFees(claimId, (req as AuthenticatedRequest).user);
    res.json({ success: true, items });
  } catch (err) { next(err as any);
  }
}

export const createFee: RequestHandler = async (req, res, next) => {
  try {
    const claimId = parseWithAppError(IdParamSchema, req.params.claimId);
    const body = parseWithAppError(CreateFeeSchema, req.body);
    const item = await feeService.createFee(claimId, body, (req as AuthenticatedRequest).user);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const updateFee: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const body = parseWithAppError(UpdateFeeSchema, req.body);
    const item = await feeService.updateFee(id, body, (req as AuthenticatedRequest).user);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const deleteFee: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    await feeService.deleteFee(id, (req as AuthenticatedRequest).user);
    res.json({ success: true });
  } catch (err) { next(err as any);
  }
}
