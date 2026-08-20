import * as contactService from '../services/contact.service.js';
import { AppError } from '../middleware/error.js';

function idParam(req) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
  return id;
}

export async function listContacts(req, res, next) {
  try {
    const items = await contactService.listContacts(req.params.claimId);
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

export async function createContact(req, res, next) {
  try {
    const item = await contactService.createContact(req.params.claimId, req.body, req.user.id);
    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function updateContact(req, res, next) {
  try {
    const item = await contactService.updateContact(idParam(req), req.body, req.user.id);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function deleteContact(req, res, next) {
  try {
    await contactService.deleteContact(idParam(req), req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
