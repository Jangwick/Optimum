import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from '../controllers/notification.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', listNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);export default router;
