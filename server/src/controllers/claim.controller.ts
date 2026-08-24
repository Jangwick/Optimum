/* eslint-disable @typescript-eslint/no-explicit-any */
import * as claimService from '../services/claim.service.js';
import { AppError } from '../middleware/error.js';
import type { Request, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';

function idParam(req: Request) {
  const id = Number(Number(req.params.id));
  if (Number.isNaN(id)) throw new AppError('Invalid claim id', 400);
  return id;
}

export const listClaims: RequestHandler = async (req, res, next) => {
  try {
    const data = await claimService.getClaims((req.query as any), (req as AuthenticatedRequest).user);
    res.json({ success: true, ...data });
  } catch (err) { next(err as any);
  }
}

export const getClaim: RequestHandler = async (req, res, next) => {
  try {
    const item = await claimService.getClaim(idParam(req), (req as AuthenticatedRequest).user);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const createClaim: RequestHandler = async (req, res, next) => {
  try {
    const item = await claimService.createClaim(req.body, (req as AuthenticatedRequest).user.id);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const updateClaim: RequestHandler = async (req, res, next) => {
  try {
    const item = await claimService.updateClaim(idParam(req), req.body, (req as AuthenticatedRequest).user.id);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const updateStatus: RequestHandler = async (req, res, next) => {
  try {
    const item = await claimService.updateStatus(idParam(req), req.body, (req as AuthenticatedRequest).user.id);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

// Insurer panel
export const listClaimInsurers: RequestHandler = async (req, res, next) => {
  try {
    const items = await claimService.getClaimInsurers(idParam(req));
    res.json({ success: true, items });
  } catch (err) { next(err as any);
  }
}

export const addClaimInsurer: RequestHandler = async (req, res, next) => {
  try {
    const item = await claimService.addClaimInsurer(idParam(req), req.body, (req as AuthenticatedRequest).user.id);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const updateClaimInsurer: RequestHandler = async (req, res, next) => {
  try {
    const item = await claimService.updateClaimInsurer(idParam(req), Number(Number(req.params.insurerId)), req.body, (req as AuthenticatedRequest).user.id);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const removeClaimInsurer: RequestHandler = async (req, res, next) => {
  try {
    const item = await claimService.removeClaimInsurer(idParam(req), Number(Number(req.params.insurerId)), (req as AuthenticatedRequest).user.id);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const autoReserve: RequestHandler = async (req, res, next) => {
  try {
    const result = await claimService.autoCalculateReserve(idParam(req));
    res.json({ success: true, ...result });
  } catch (err) { next(err as any);
  }
}
