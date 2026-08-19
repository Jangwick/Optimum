import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  listInvestigations,
  createInvestigation,
  updateInvestigation,
  deleteInvestigation,
} from '../controllers/investigation.controller.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', listInvestigations);
router.post('/', createInvestigation);
router.put('/:id', updateInvestigation);
router.delete('/:id', deleteInvestigation);

export default router;
