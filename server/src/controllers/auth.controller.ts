/* eslint-disable @typescript-eslint/no-explicit-any */
import { login, setAuthCookie, clearAuthCookie, changePassword, updateProfile } from '../services/auth.service.js';
import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export const loginHandler: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const { token, user } = await login(email, password);
    setAuthCookie(res, token);

    res.json({ success: true, token, user });
  } catch (err) { next(err as any);
  }
}

export const logoutHandler: RequestHandler = (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
}

export const meHandler: RequestHandler = (req, res) => {
  res.json({ success: true, user: (req as AuthenticatedRequest).user });
}

export const changePasswordHandler: RequestHandler = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new passwords are required' });
    }
    await changePassword((req as AuthenticatedRequest).user.id, currentPassword, newPassword);
    res.json({ success: true });
  } catch (err) { next(err as any);
  }
}

export const updateProfileHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = await updateProfile((req as AuthenticatedRequest).user.id, req.body);
    res.json({ success: true, user });
  } catch (err) { next(err as any);
  }
}
