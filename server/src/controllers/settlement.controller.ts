/* eslint-disable @typescript-eslint/no-explicit-any */
import * as settlementService from '../services/settlement.service.js';
import { AppError } from '../middleware/error.js';
import type { Request, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';

function idParam(req: Request) {
  const id = Number(Number(req.params.id));
  if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
  return id;
}

export const getSettlement: RequestHandler = async (req, res, next) => {
  try {
    const item = await settlementService.getSettlement(Number(req.params.claimId), (req as AuthenticatedRequest).user);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const upsertSettlement: RequestHandler = async (req, res, next) => {
  try {
    const item = await settlementService.upsertSettlement(Number(req.params.claimId), req.body, (req as AuthenticatedRequest).user);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const listOffers: RequestHandler = async (req, res, next) => {
  try {
    const items = await settlementService.listOffers(Number(req.params.claimId), (req as AuthenticatedRequest).user);
    res.json({ success: true, items });
  } catch (err) { next(err as any);
  }
}

export const createOffer: RequestHandler = async (req, res, next) => {
  try {
    const item = await settlementService.createOffer(Number(req.params.claimId), req.body, (req as AuthenticatedRequest).user);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const respondToOffer: RequestHandler = async (req, res, next) => {
  try {
    const item = await settlementService.respondToOffer(idParam(req), req.body, (req as AuthenticatedRequest).user);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}
