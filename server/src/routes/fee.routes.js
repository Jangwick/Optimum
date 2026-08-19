import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { listFees, createFee, updateFee, deleteFee } from '../controllers/fee.controller.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', listFees);
router.post('/', createFee);
router.put('/:id', updateFee);
router.delete('/:id', deleteFee);

export default router;
