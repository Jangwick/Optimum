import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  listClaims,
  getClaim,
  createClaim,
  updateClaim,
  updateStatus,
  listClaimInsurers,
  addClaimInsurer,
  updateClaimInsurer,
  removeClaimInsurer,
  autoReserve,
} from '../controllers/claim.controller.js';
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
router.patch('/:id', requireRole('ADMIN'), updateClaim);
router.patch('/:id/status', updateStatus);

// Process status (primary OCS status) — claim-scoped
router.get('/:id/process-status-history', listProcessStatusHistory);
router.get('/:id/closing-guards', getClosingGuards);
router.patch('/:id/process-status', requireRole('ADMIN'), updateProcessStatus);

// Insurer panel
router.get('/:id/insurers', listClaimInsurers);
router.post('/:id/insurers', requireRole('ADMIN'), addClaimInsurer);
router.patch('/:id/insurers/:insurerId', requireRole('ADMIN'), updateClaimInsurer);
router.delete('/:id/insurers/:insurerId', requireRole('ADMIN'), removeClaimInsurer);

// Auto-calculate loss reserve suggestion
router.get('/:id/auto-reserve', autoReserve);

export default router;
