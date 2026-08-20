import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getAnalytics } from '../controllers/analytics.controller.js';

const router = Router();
router.use(authMiddleware);
router.get('/', getAnalytics);

export default router;
