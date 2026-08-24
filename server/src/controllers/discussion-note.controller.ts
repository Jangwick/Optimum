/* eslint-disable @typescript-eslint/no-explicit-any */
import * as discussionNoteService from '../services/discussion-note.service.js';
import { AppError } from '../middleware/error.js';
import type { Request, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';

function idParam(req: Request) {
  const id = Number(Number(req.params.id));
  if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
  return id;
}

export const listDiscussionNotes: RequestHandler = async (req, res, next) => {
  try {
    const items = await discussionNoteService.listDiscussionNotes(Number(req.params.claimId));
    res.json({ success: true, items });
  } catch (err) { next(err as any);
  }
}

export const createDiscussionNote: RequestHandler = async (req, res, next) => {
  try {
    const item = await discussionNoteService.createDiscussionNote(Number(req.params.claimId), req.body, (req as AuthenticatedRequest).user.id);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const deleteDiscussionNote: RequestHandler = async (req, res, next) => {
  try {
    await discussionNoteService.deleteDiscussionNote(idParam(req), (req as AuthenticatedRequest).user.id);
    res.json({ success: true });
  } catch (err) { next(err as any);
  }
}
