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

export async function updateClaim(req, res, next) {
  try {
    const item = await claimService.updateClaim(idParam(req), req.body, req.user.id);
    res.json({ success: true, item });
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

// Insurer panel
export async function listClaimInsurers(req, res, next) {
  try {
    const items = await claimService.getClaimInsurers(idParam(req));
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

export async function addClaimInsurer(req, res, next) {
  try {
    const item = await claimService.addClaimInsurer(idParam(req), req.body, req.user.id);
    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function updateClaimInsurer(req, res, next) {
  try {
    const item = await claimService.updateClaimInsurer(idParam(req), Number(req.params.insurerId), req.body, req.user.id);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function removeClaimInsurer(req, res, next) {
  try {
    const item = await claimService.removeClaimInsurer(idParam(req), Number(req.params.insurerId), req.user.id);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}
