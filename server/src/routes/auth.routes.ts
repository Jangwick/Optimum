import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { loginHandler, logoutHandler, meHandler, changePasswordHandler, updateProfileHandler, downloadTokenHandler } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many attempts, please try again later.' },
});

const router = Router();

router.post('/login', authRateLimit, loginHandler);
router.post('/logout', logoutHandler);
router.get('/me', authMiddleware, meHandler);
router.get('/download-token', authMiddleware, downloadTokenHandler);
router.put('/me', authMiddleware, updateProfileHandler);
router.put('/me/password', authRateLimit, authMiddleware, changePasswordHandler);

export default router;
