import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service.js';
import { verifyDownloadToken } from '../services/download-token.service.js';
import { prisma } from '../db/client.js';
import { AppError } from './error.js';

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

function isBinaryResource(path: string | undefined): boolean {
  if (!path) return false;
  const [withoutQuery] = path.split('?');
  if (!withoutQuery) return false;
  return /^\/api\/claims\/[^/]+\/(documents\/[^/]+\/(preview|download)|inspections\/photos\/[^/]+)$/.test(withoutQuery);
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token: string | undefined =
      req.cookies?.token ||
      (typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : undefined);
    const userFromDownloadToken = await tryDownloadToken(req);

    if (!token && !userFromDownloadToken) {
      throw new AppError('Authentication required', 401);
    }

    let payload;
    if (token) {
      payload = verifyToken(token);
    }

    if (!payload && !userFromDownloadToken) {
      throw new AppError('Invalid or expired token', 401);
    }

    if (userFromDownloadToken) {
      const authReq = req as AuthenticatedRequest;
      authReq.user = userFromDownloadToken;
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: payload!.userId },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    const authReq = req as AuthenticatedRequest;
    authReq.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
    };

    next();
  } catch (err) {
    next(err);
  }
}

async function tryDownloadToken(req: Request): Promise<AuthUser | null> {
  if (req.method !== 'GET' || !isBinaryResource(req.path)) {
    return null;
  }

  const queryToken = req.query?.dt;
  if (typeof queryToken !== 'string' || !queryToken) {
    return null;
  }

  const [withoutQuery] = req.path.split('?');
  const payload = verifyDownloadToken(queryToken, withoutQuery!);
  if (!payload) {
    return null;
  }

  return {
    id: payload.userId,
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
    role: payload.role,
  };
}
