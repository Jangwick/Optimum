/* eslint-disable @typescript-eslint/no-explicit-any */
import * as notificationService from '../services/notification.service.js';
import { AppError } from '../middleware/error.js';
import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { parseWithAppError } from '../validators/index.js';
import { ListNotificationsQuerySchema } from '../validators/notification.js';

export const listNotifications: RequestHandler = async (req, res, next) => {
  try {
    const query = parseWithAppError(ListNotificationsQuerySchema, req.query);
    const data = await notificationService.getNotifications((req as AuthenticatedRequest).user.id, query);
    res.json({ success: true, ...data });
  } catch (err) { next(err as any);
  }
}

export const getUnreadCount: RequestHandler = async (req, res, next) => {
  try {
    const result = await notificationService.getUnreadCount((req as AuthenticatedRequest).user.id);
    res.json({ success: true, ...result });
  } catch (err) { next(err as any);
  }
}

export const markRead: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(Number(req.params.id));
    if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
    const item = await notificationService.markRead(id, (req as AuthenticatedRequest).user.id);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const markAllRead: RequestHandler = async (req, res, next) => {
  try {
    const result = await notificationService.markAllRead((req as AuthenticatedRequest).user.id);
    res.json({ success: true, ...result });
  } catch (err) { next(err as any);
  }
}
