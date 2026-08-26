import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { strictRateLimit } from '../middleware/rate-limit.js';
import { exportClaims } from '../controllers/export.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/claims', strictRateLimit, exportClaims);

export default router;
