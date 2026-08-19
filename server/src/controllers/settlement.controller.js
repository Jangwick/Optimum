import * as settlementService from '../services/settlement.service.js';
import { AppError } from '../middleware/error.js';

function idParam(req) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
  return id;
}

export async function getSettlement(req, res, next) {
  try {
    const item = await settlementService.getSettlement(req.params.claimId);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function upsertSettlement(req, res, next) {
  try {
    const item = await settlementService.upsertSettlement(req.params.claimId, req.body, req.user.id);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function listOffers(req, res, next) {
  try {
    const items = await settlementService.listOffers(req.params.claimId);
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

export async function createOffer(req, res, next) {
  try {
    const item = await settlementService.createOffer(req.params.claimId, req.body, req.user.id);
    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function respondToOffer(req, res, next) {
  try {
    const item = await settlementService.respondToOffer(idParam(req), req.body, req.user.id);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}
