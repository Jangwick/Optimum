import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { listClaims, getClaim, createClaim, updateStatus } from '../controllers/claim.controller.js';
import {
  listProcessStatusHistory,
  updateProcessStatus,
  getClosingGuards,
} from '../controllers/process-status.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', listClaims);
router.get('/:id', getClaim);
router.post('/', requireRole('ADMIN'), createClaim);
router.patch('/:id/status', updateStatus);

// Process status (primary OCS status) — claim-scoped
router.get('/:id/process-status-history', listProcessStatusHistory);
router.get('/:id/closing-guards', getClosingGuards);
router.patch('/:id/process-status', requireRole('ADMIN'), updateProcessStatus);

export default router;
