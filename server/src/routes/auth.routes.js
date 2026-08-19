import { Router } from 'express';
import { loginHandler, logoutHandler, meHandler } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', loginHandler);
router.post('/logout', logoutHandler);
router.get('/me', authMiddleware, meHandler);

export default router;
