import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { search } from '../controllers/search.controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/', search);

export default router;
