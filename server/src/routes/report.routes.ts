import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { strictRateLimit } from '../middleware/rate-limit.js';
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
router.post('/:id/generate', strictRateLimit, generateReport);
router.get('/:id/download', strictRateLimit, downloadReport);
router.get('/:id/download/docx', strictRateLimit, downloadDocx);
router.post('/:id/clarifications', createClarification);
router.put('/:id/clarifications/:clarificationId/answer', answerClarification);

export default router;
