import * as discussionNoteService from '../services/discussion-note.service.js';
import { AppError } from '../middleware/error.js';

function idParam(req) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
  return id;
}

export async function listDiscussionNotes(req, res, next) {
  try {
    const items = await discussionNoteService.listDiscussionNotes(req.params.claimId);
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

export async function createDiscussionNote(req, res, next) {
  try {
    const item = await discussionNoteService.createDiscussionNote(req.params.claimId, req.body, req.user.id);
    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function deleteDiscussionNote(req, res, next) {
  try {
    await discussionNoteService.deleteDiscussionNote(idParam(req), req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
