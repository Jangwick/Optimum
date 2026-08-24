import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  listReports,
  createReport,
  generateReport,
  createClarification,
  answerClarification,
  downloadReport,
  downloadDocx,
} from '../controllers/report.controller.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', listReports);
router.post('/', createReport);
router.post('/:id/generate', generateReport);
router.get('/:id/download', downloadReport);
router.get('/:id/download/docx', downloadDocx);
router.post('/:id/clarifications', createClarification);
router.put('/:id/clarifications/:clarificationId/answer', answerClarification);

export default router;
