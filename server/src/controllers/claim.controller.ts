/* eslint-disable @typescript-eslint/no-explicit-any */
import * as claimService from '../services/claim.service.js';
import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { IdParamSchema, parseWithAppError } from '../validators/index.js';
import {
  CreateClaimSchema,
  UpdateClaimSchema,
  UpdateStatusSchema,
  ListClaimsQuerySchema,
  ClaimInsurerSchema,
  UpdateClaimInsurerSchema,
} from '../validators/claims.js';

export const listClaims: RequestHandler = async (req, res, next) => {
  try {
    const filters = parseWithAppError(ListClaimsQuerySchema, req.query);
    const data = await claimService.getClaims(filters, (req as AuthenticatedRequest).user);
    res.json({ success: true, ...data });
  } catch (err) { next(err as any);
  }
}

export const getClaim: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const item = await claimService.getClaim(id, (req as AuthenticatedRequest).user);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const createClaim: RequestHandler = async (req, res, next) => {
  try {
    const body = parseWithAppError(CreateClaimSchema, req.body);
    const item = await claimService.createClaim(body, (req as AuthenticatedRequest).user.id);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const updateClaim: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const body = parseWithAppError(UpdateClaimSchema, req.body);
    const item = await claimService.updateClaim(id, body, (req as AuthenticatedRequest).user.id);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const updateStatus: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const body = parseWithAppError(UpdateStatusSchema, req.body);
    const item = await claimService.updateStatus(id, body, (req as AuthenticatedRequest).user.id);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

// Insurer panel
export const listClaimInsurers: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const items = await claimService.getClaimInsurers(id);
    res.json({ success: true, items });
  } catch (err) { next(err as any);
  }
}

export const addClaimInsurer: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const body = parseWithAppError(ClaimInsurerSchema, req.body);
    const item = await claimService.addClaimInsurer(id, body, (req as AuthenticatedRequest).user.id);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const updateClaimInsurer: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const insurerId = parseWithAppError(IdParamSchema, req.params.insurerId);
    const body = parseWithAppError(UpdateClaimInsurerSchema, req.body);
    const item = await claimService.updateClaimInsurer(id, insurerId, body, (req as AuthenticatedRequest).user.id);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const removeClaimInsurer: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const insurerId = parseWithAppError(IdParamSchema, req.params.insurerId);
    const item = await claimService.removeClaimInsurer(id, insurerId, (req as AuthenticatedRequest).user.id);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const autoReserve: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const result = await claimService.autoCalculateReserve(id);
    res.json({ success: true, ...result });
  } catch (err) { next(err as any);
  }
}
