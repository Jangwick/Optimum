import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { strictRateLimit } from '../middleware/rate-limit.js';
import { search } from '../controllers/search.controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/', strictRateLimit, search);

export default router;
