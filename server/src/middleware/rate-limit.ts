import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

export function userRateLimit(
  windowMs: number,
  max: number,
  skip?: (req: Request) => boolean,
) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    ...(skip ? { skip } : {}),
    keyGenerator: (req: Request) => {
      const user = (req as { user?: { id: number } }).user;
      return user?.id?.toString() ?? req.ip ?? 'anonymous';
    },
  });
}

export const strictRateLimit = userRateLimit(15 * 60 * 1000, 30);
