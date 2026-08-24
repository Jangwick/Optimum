import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  listAssessments,
  getAssessment,
  createAssessment,
  updateAssessment,
  deleteAssessment,
} from '../controllers/assessment.controller.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', listAssessments);
router.post('/', createAssessment);
router.get('/:id', getAssessment);
router.put('/:id', updateAssessment);
router.delete('/:id', deleteAssessment);

export default router;
