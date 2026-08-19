import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { listClaims, getClaim, createClaim, updateStatus } from '../controllers/claim.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', listClaims);
router.get('/:id', getClaim);
router.post('/', requireRole('ADMIN'), createClaim);
router.patch('/:id/status', updateStatus);

export default router;
