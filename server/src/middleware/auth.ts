import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service.js';
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

function isDocumentDownloadOrPreview(path: string | undefined): boolean {
  if (!path) return false;
  const [withoutQuery] = path.split('?');
  if (!withoutQuery) return false;
  return /^\/api\/claims\/[^/]+\/documents\/[^/]+\/(preview|download)$/.test(withoutQuery);
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined =
      req.cookies?.token ||
      (typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : undefined);

    // Allow query-string tokens only on document download/preview GET endpoints,
    // which are used by legacy/embedded image previews.
    if (!token && req.method === 'GET' && isDocumentDownloadOrPreview(req.path)) {
      const queryToken = req.query?.token;
      if (typeof queryToken === 'string') {
        token = queryToken;
      }
    }

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const payload = verifyToken(token);
    if (!payload) {
      throw new AppError('Invalid or expired token', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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
