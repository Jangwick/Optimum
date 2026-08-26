/* eslint-disable @typescript-eslint/no-explicit-any */
import * as userService from '../services/user.service.js';
import { AppError } from '../middleware/error.js';
import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { IdParamSchema, parseWithAppError } from '../validators/index.js';
import { ListUsersQuerySchema, CreateUserSchema, UpdateUserSchema } from '../validators/user.js';

export const listUsers: RequestHandler = async (req, res, next) => {
  try {
    const filters = parseWithAppError(ListUsersQuerySchema, req.query);
    const result = await userService.getUsers(filters);
    res.json({ success: true, users: result.users, count: result.count });
  } catch (err) { next(err as any);
  }
}

export const getUser: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);

    if ((req as AuthenticatedRequest).user.role !== 'ADMIN' && (req as AuthenticatedRequest).user.id !== id) {
      throw new AppError('Forbidden', 403);
    }

    const user = await userService.getUserById(id);
    res.json({ success: true, user });
  } catch (err) { next(err as any);
  }
}

export const createUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await userService.createUser(parseWithAppError(CreateUserSchema, req.body));
    res.status(201).json({ success: true, user });
  } catch (err) { next(err as any);
  }
}

export const updateUser: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);

    if ((req as AuthenticatedRequest).user.role !== 'ADMIN' && (req as AuthenticatedRequest).user.id !== id) {
      throw new AppError('Forbidden', 403);
    }

    const user = await userService.updateUser(id, parseWithAppError(UpdateUserSchema, req.body), (req as AuthenticatedRequest).user);
    res.json({ success: true, user });
  } catch (err) { next(err as any);
  }
}

export const deactivateUser: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const user = await userService.deactivateUser(id, (req as AuthenticatedRequest).user);
    res.json({ success: true, user });
  } catch (err) { next(err as any);
  }
}

export const activateUser: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const user = await userService.activateUser(id, (req as AuthenticatedRequest).user);
    res.json({ success: true, user });
  } catch (err) { next(err as any);
  }
}

export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const result = await userService.resetPassword(id);
    res.json({ success: true, ...result });
  } catch (err) { next(err as any);
  }
}

export const listEngineers: RequestHandler = async (req, res, next) => {
  try {
    const result = await userService.getUsers({ role: 'ENGINEER' });
    res.json({ success: true, users: result.users });
  } catch (err) { next(err as any);
  }
}

export const listAccountants: RequestHandler = async (req, res, next) => {
  try {
    const result = await userService.getUsers({ role: 'ACCOUNTANT' });
    res.json({ success: true, users: result.users });
  } catch (err) { next(err as any);
  }
}
