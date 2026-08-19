import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { listInspections, createInspection, updateInspection, deleteInspection } from '../controllers/inspection.controller.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', listInspections);
router.post('/', createInspection);
router.put('/:id', updateInspection);
router.delete('/:id', deleteInspection);

export default router;
