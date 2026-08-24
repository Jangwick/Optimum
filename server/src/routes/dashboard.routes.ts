import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDashboard } from '../controllers/dashboard.controller.js';

const router = Router();
router.use(authMiddleware);
router.get('/', getDashboard);

export default router;
