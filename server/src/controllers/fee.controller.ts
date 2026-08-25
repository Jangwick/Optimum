/* eslint-disable @typescript-eslint/no-explicit-any */
import * as feeService from '../services/fee.service.js';
import { AppError } from '../middleware/error.js';
import type { Request, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';

function idParam(req: Request) {
  const id = Number(Number(req.params.id));
  if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
  return id;
}

export const listFees: RequestHandler = async (req, res, next) => {
  try {
    const items = await feeService.listFees(Number(req.params.claimId), (req as AuthenticatedRequest).user);
    res.json({ success: true, items });
  } catch (err) { next(err as any);
  }
}

export const createFee: RequestHandler = async (req, res, next) => {
  try {
    const item = await feeService.createFee(Number(req.params.claimId), req.body, (req as AuthenticatedRequest).user);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const updateFee: RequestHandler = async (req, res, next) => {
  try {
    const item = await feeService.updateFee(idParam(req), req.body, (req as AuthenticatedRequest).user);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const deleteFee: RequestHandler = async (req, res, next) => {
  try {
    await feeService.deleteFee(idParam(req), (req as AuthenticatedRequest).user);
    res.json({ success: true });
  } catch (err) { next(err as any);
  }
}
