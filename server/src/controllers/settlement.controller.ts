/* eslint-disable @typescript-eslint/no-explicit-any */
import * as settlementService from '../services/settlement.service.js';
import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { IdParamSchema, parseWithAppError } from '../validators/index.js';
import { UpsertSettlementSchema, CreateOfferSchema, OfferResponseSchema } from '../validators/financial.js';

export const getSettlement: RequestHandler = async (req, res, next) => {
  try {
    const claimId = parseWithAppError(IdParamSchema, req.params.claimId);
    const item = await settlementService.getSettlement(claimId, (req as AuthenticatedRequest).user);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const upsertSettlement: RequestHandler = async (req, res, next) => {
  try {
    const claimId = parseWithAppError(IdParamSchema, req.params.claimId);
    const body = parseWithAppError(UpsertSettlementSchema, req.body);
    const item = await settlementService.upsertSettlement(claimId, body, (req as AuthenticatedRequest).user);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const listOffers: RequestHandler = async (req, res, next) => {
  try {
    const claimId = parseWithAppError(IdParamSchema, req.params.claimId);
    const items = await settlementService.listOffers(claimId, (req as AuthenticatedRequest).user);
    res.json({ success: true, items });
  } catch (err) { next(err as any);
  }
}

export const createOffer: RequestHandler = async (req, res, next) => {
  try {
    const claimId = parseWithAppError(IdParamSchema, req.params.claimId);
    const body = parseWithAppError(CreateOfferSchema, req.body);
    const item = await settlementService.createOffer(claimId, body, (req as AuthenticatedRequest).user);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const respondToOffer: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const body = parseWithAppError(OfferResponseSchema, req.body);
    const item = await settlementService.respondToOffer(id, body, (req as AuthenticatedRequest).user);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}
