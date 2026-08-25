/* eslint-disable @typescript-eslint/no-explicit-any */
import * as taskService from '../services/task.service.js';
import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { IdParamSchema, parseWithAppError } from '../validators/index.js';
import { ListTasksQuerySchema, CreateTaskSchema, UpdateTaskSchema } from '../validators/tasks.js';

export const listTasks: RequestHandler = async (req, res, next) => {
  try {
    const filters = parseWithAppError(ListTasksQuerySchema, req.query);
    const items = await taskService.getTasks(filters, (req as AuthenticatedRequest).user);
    res.json({ success: true, items });
  } catch (err) { next(err as any);
  }
}

export const createTask: RequestHandler = async (req, res, next) => {
  try {
    const body = parseWithAppError(CreateTaskSchema, req.body);
    const item = await taskService.createTask(body, (req as AuthenticatedRequest).user.id);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const updateTask: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const body = parseWithAppError(UpdateTaskSchema, req.body);
    const item = await taskService.updateTask(id, body, (req as AuthenticatedRequest).user.id);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const deleteTask: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    await taskService.deleteTask(id, (req as AuthenticatedRequest).user.id);
    res.json({ success: true });
  } catch (err) { next(err as any);
  }
}
