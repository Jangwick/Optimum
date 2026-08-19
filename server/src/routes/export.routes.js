import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { exportClaims } from '../controllers/export.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/claims', exportClaims);

export default router;
