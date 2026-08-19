import { AppError } from './error.js';

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Forbidden', 403));
    }

    next();
  };
}

export function requireOwnershipOrRole(getResourceUserId, ...allowedRoles) {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    const resourceUserId = await getResourceUserId(req);
    if (resourceUserId && resourceUserId === req.user.id) {
      return next();
    }

    next(new AppError('Forbidden', 403));
  };
}
