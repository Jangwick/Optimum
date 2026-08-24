/* eslint-disable @typescript-eslint/no-explicit-any */
import * as invoiceService from '../services/invoice.service.js';
import { AppError } from '../middleware/error.js';
import type { Request, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';

function idParam(req: Request) {
  const id = Number(Number(req.params.id));
  if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
  return id;
}

export const listInvoices: RequestHandler = async (req, res, next) => {
  try {
    const items = await invoiceService.listInvoices(Number(req.params.claimId));
    res.json({ success: true, items });
  } catch (err) { next(err as any);
  }
}

export const createInvoice: RequestHandler = async (req, res, next) => {
  try {
    const item = await invoiceService.createInvoice(Number(req.params.claimId), req.body, (req as AuthenticatedRequest).user.id);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const getInvoice: RequestHandler = async (req, res, next) => {
  try {
    const item = await invoiceService.getInvoice(idParam(req));
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const recordPayment: RequestHandler = async (req, res, next) => {
  try {
    const item = await invoiceService.recordPayment(idParam(req), req.body, (req as AuthenticatedRequest).user.id);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}
