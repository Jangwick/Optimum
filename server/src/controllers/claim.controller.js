import * as claimService from '../services/claim.service.js';
import { AppError } from '../middleware/error.js';

function idParam(req) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('Invalid claim id', 400);
  return id;
}

export async function listClaims(req, res, next) {
  try {
    const data = await claimService.getClaims(req.query, req.user);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function getClaim(req, res, next) {
  try {
    const item = await claimService.getClaim(idParam(req), req.user);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function createClaim(req, res, next) {
  try {
    const item = await claimService.createClaim(req.body, req.user.id);
    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const item = await claimService.updateStatus(idParam(req), req.body, req.user.id);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}
