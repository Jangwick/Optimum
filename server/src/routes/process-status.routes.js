import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { listProcessStatuses } from '../controllers/process-status.controller.js';

const router = Router();

router.use(authMiddleware);

// List all OCS process statuses (any authenticated user)
router.get('/', listProcessStatuses);

export default router;
