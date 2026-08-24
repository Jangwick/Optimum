/* eslint-disable @typescript-eslint/no-explicit-any */
import * as taskService from '../services/task.service.js';
import { AppError } from '../middleware/error.js';
import type { Request, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';

function idParam(req: Request) {
  const id = Number(Number(req.params.id));
  if (Number.isNaN(id)) throw new AppError('Invalid task id', 400);
  return id;
}

export const listTasks: RequestHandler = async (req, res, next) => {
  try {
    const items = await taskService.getTasks((req.query as any), (req as AuthenticatedRequest).user);
    res.json({ success: true, items });
  } catch (err) { next(err as any);
  }
}

export const createTask: RequestHandler = async (req, res, next) => {
  try {
    const item = await taskService.createTask(req.body, (req as AuthenticatedRequest).user.id);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const updateTask: RequestHandler = async (req, res, next) => {
  try {
    const item = await taskService.updateTask(idParam(req), req.body, (req as AuthenticatedRequest).user.id);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const deleteTask: RequestHandler = async (req, res, next) => {
  try {
    await taskService.deleteTask(idParam(req), (req as AuthenticatedRequest).user.id);
    res.json({ success: true });
  } catch (err) { next(err as any);
  }
}
