import { Router } from 'express';
import { loginHandler, logoutHandler, meHandler, changePasswordHandler, updateProfileHandler } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', loginHandler);
router.post('/logout', logoutHandler);
router.get('/me', authMiddleware, meHandler);
router.put('/me', authMiddleware, updateProfileHandler);
router.put('/me/password', authMiddleware, changePasswordHandler);

export default router;
