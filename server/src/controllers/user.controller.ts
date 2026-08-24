/* eslint-disable @typescript-eslint/no-explicit-any */
import * as userService from '../services/user.service.js';
import { AppError } from '../middleware/error.js';
import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export const listUsers: RequestHandler = async (req, res, next) => {
  try {
    const result = await userService.getUsers({
      role: (req.query as any).role,
      search: (req.query as any).search,
      page: (req.query as any).page ? Number((req.query as any).page) : undefined,
      limit: (req.query as any).limit ? Number((req.query as any).limit) : undefined,
      sortField: (req.query as any).sortField,
      sortOrder: (req.query as any).sortOrder,
    } as any);
    res.json({ success: true, users: result.users, count: result.count });
  } catch (err) { next(err as any);
  }
}

export const getUser: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(Number(req.params.id));
    if (Number.isNaN(id)) {
      throw new AppError('Invalid user id', 400);
    }

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
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, user });
  } catch (err) { next(err as any);
  }
}

export const updateUser: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(Number(req.params.id));
    if (Number.isNaN(id)) {
      throw new AppError('Invalid user id', 400);
    }

    if ((req as AuthenticatedRequest).user.role !== 'ADMIN' && (req as AuthenticatedRequest).user.id !== id) {
      throw new AppError('Forbidden', 403);
    }

    const user = await userService.updateUser(id, req.body, (req as AuthenticatedRequest).user);
    res.json({ success: true, user });
  } catch (err) { next(err as any);
  }
}

export const deactivateUser: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(Number(req.params.id));
    if (Number.isNaN(id)) {
      throw new AppError('Invalid user id', 400);
    }

    const user = await userService.deactivateUser(id, (req as AuthenticatedRequest).user);
    res.json({ success: true, user });
  } catch (err) { next(err as any);
  }
}

export const activateUser: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(Number(req.params.id));
    if (Number.isNaN(id)) {
      throw new AppError('Invalid user id', 400);
    }

    const user = await userService.activateUser(id, (req as AuthenticatedRequest).user);
    res.json({ success: true, user });
  } catch (err) { next(err as any);
  }
}

export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(Number(req.params.id));
    if (Number.isNaN(id)) {
      throw new AppError('Invalid user id', 400);
    }

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
