import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  listActivities,
  addActivity,
  listCorrespondence,
  addCorrespondence,
} from '../controllers/activity.controller.js';

const router = Router();

router.use(authMiddleware);

// Activities (timeline)
router.get('/:id/activities', listActivities);
router.post('/:id/activities', addActivity);

// Correspondence
router.get('/:id/correspondence', listCorrespondence);
router.post('/:id/correspondence', requireRole('ADMIN', 'ENGINEER'), addCorrespondence);

export default router;
