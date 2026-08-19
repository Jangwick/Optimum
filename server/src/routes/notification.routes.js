import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { listNotifications, markRead } from '../controllers/notification.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', listNotifications);
router.put('/:id/read', markRead);

export default router;
