/* eslint-disable @typescript-eslint/no-explicit-any */
import * as contactService from '../services/contact.service.js';
import { AppError } from '../middleware/error.js';
import type { Request, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';

function idParam(req: Request) {
  const id = Number(Number(req.params.id));
  if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
  return id;
}

export const listContacts: RequestHandler = async (req, res, next) => {
  try {
    const items = await contactService.listContacts(Number(req.params.claimId));
    res.json({ success: true, items });
  } catch (err) { next(err as any);
  }
}

export const createContact: RequestHandler = async (req, res, next) => {
  try {
    const item = await contactService.createContact(Number(req.params.claimId), req.body, (req as AuthenticatedRequest).user.id);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const updateContact: RequestHandler = async (req, res, next) => {
  try {
    const item = await contactService.updateContact(idParam(req), req.body, (req as AuthenticatedRequest).user.id);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const deleteContact: RequestHandler = async (req, res, next) => {
  try {
    await contactService.deleteContact(idParam(req), (req as AuthenticatedRequest).user.id);
    res.json({ success: true });
  } catch (err) { next(err as any);
  }
}
