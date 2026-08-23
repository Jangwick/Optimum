import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  listDiscussionNotes,
  createDiscussionNote,
  deleteDiscussionNote,
} from '../controllers/discussion-note.controller.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', listDiscussionNotes);
router.post('/', createDiscussionNote);
router.delete('/:id', deleteDiscussionNote);

export default router;
