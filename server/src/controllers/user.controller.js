import * as userService from '../services/user.service.js';
import { AppError } from '../middleware/error.js';

export async function listUsers(req, res, next) {
  try {
    const result = await userService.getUsers({
      role: req.query.role,
      search: req.query.search,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      sortField: req.query.sortField,
      sortOrder: req.query.sortOrder,
    });
    res.json({ success: true, users: result.users, count: result.count });
  } catch (err) {
    next(err);
  }
}

export async function getUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      throw new AppError('Invalid user id', 400);
    }

    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      throw new AppError('Forbidden', 403);
    }

    const user = await userService.getUserById(id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      throw new AppError('Invalid user id', 400);
    }

    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      throw new AppError('Forbidden', 403);
    }

    const user = await userService.updateUser(id, req.body);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

export async function deactivateUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      throw new AppError('Invalid user id', 400);
    }

    const user = await userService.deactivateUser(id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

export async function activateUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      throw new AppError('Invalid user id', 400);
    }

    const user = await userService.activateUser(id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      throw new AppError('Invalid user id', 400);
    }

    const result = await userService.resetPassword(id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function listEngineers(req, res, next) {
  try {
    const result = await userService.getUsers({ role: 'ENGINEER' });
    res.json({ success: true, users: result.users });
  } catch (err) {
    next(err);
  }
}

export async function listAccountants(req, res, next) {
  try {
    const result = await userService.getUsers({ role: 'ACCOUNTANT' });
    res.json({ success: true, users: result.users });
  } catch (err) {
    next(err);
  }
}
