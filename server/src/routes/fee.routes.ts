import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { listFees, createFee, updateFee, deleteFee } from '../controllers/fee.controller.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', listFees);
router.post('/', idempotencyMiddleware, createFee);
router.put('/:id', updateFee);
router.delete('/:id', deleteFee);

export default router;
