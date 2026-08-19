import * as feeService from '../services/fee.service.js';
import { AppError } from '../middleware/error.js';

function idParam(req) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
  return id;
}

export async function listFees(req, res, next) {
  try {
    const items = await feeService.listFees(req.params.claimId);
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

export async function createFee(req, res, next) {
  try {
    const item = await feeService.createFee(req.params.claimId, req.body, req.user.id);
    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function updateFee(req, res, next) {
  try {
    const item = await feeService.updateFee(idParam(req), req.body);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function deleteFee(req, res, next) {
  try {
    await feeService.deleteFee(idParam(req));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
