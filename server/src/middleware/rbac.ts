import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { AppError } from './error.js';
import type { AuthenticatedRequest } from './auth.js';

export function requireRole(...allowedRoles: string[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(authReq.user.role)) {
      return next(new AppError('Forbidden', 403));
    }

    next();
  };
}

export function requireOwnershipOrRole(
  getResourceUserId: (req: AuthenticatedRequest) => Promise<number | null | undefined> | number | null | undefined,
  ...allowedRoles: string[]
): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (allowedRoles.includes(authReq.user.role)) {
      return next();
    }

    const resourceUserId = await getResourceUserId(authReq);
    if (resourceUserId && resourceUserId === authReq.user.id) {
      return next();
    }

    next(new AppError('Forbidden', 403));
  };
}
