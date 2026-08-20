import * as taskService from '../services/task.service.js';
import { AppError } from '../middleware/error.js';

function idParam(req) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('Invalid task id', 400);
  return id;
}

export async function listTasks(req, res, next) {
  try {
    const items = await taskService.getTasks(req.query, req.user);
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

export async function createTask(req, res, next) {
  try {
    const item = await taskService.createTask(req.body, req.user.id);
    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    const item = await taskService.updateTask(idParam(req), req.body, req.user.id);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req, res, next) {
  try {
    await taskService.deleteTask(idParam(req), req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
