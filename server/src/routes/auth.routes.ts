import { Router, type Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { config } from '../config/index.js';
import { loginHandler, logoutHandler, meHandler, changePasswordHandler, updateProfileHandler } from '../controllers/auth.controller.js';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth.js';

const RATE_LIMIT_MESSAGE = { success: false, error: 'Too many attempts, please try again later.' };

function getLoginRateLimitKey(req: Request): string {
  const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : '';
  return email ? `login:${email}` : `ip:${ipKeyGenerator(req.ip ?? 'unknown')}`;
}

function getPasswordChangeRateLimitKey(req: Request): string {
  const user = (req as AuthenticatedRequest).user;
  return user ? `password:${user.id}` : `ip:${ipKeyGenerator(req.ip ?? 'unknown')}`;
}

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => config.nodeEnv !== 'production',
  message: RATE_LIMIT_MESSAGE,
  keyGenerator: getLoginRateLimitKey,
});

const passwordChangeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => config.nodeEnv !== 'production',
  message: RATE_LIMIT_MESSAGE,
  keyGenerator: getPasswordChangeRateLimitKey,
});

const router = Router();

router.post('/login', loginRateLimit, loginHandler);
router.post('/logout', logoutHandler);
router.get('/me', authMiddleware, meHandler);
router.put('/me', authMiddleware, updateProfileHandler);
router.put('/me/password', authMiddleware, passwordChangeRateLimit, changePasswordHandler);

export default router;
