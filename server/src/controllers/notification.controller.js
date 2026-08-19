import * as notificationService from '../services/notification.service.js';
import { AppError } from '../middleware/error.js';

export async function listNotifications(req, res, next) {
  try {
    const items = await notificationService.getNotifications(req.user.id);
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
    const item = await notificationService.markRead(id, req.user.id);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}
