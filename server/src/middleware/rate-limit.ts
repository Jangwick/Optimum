import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
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
      // ipKeyGenerator normalises an IPv6 address to its subnet prefix; using req.ip raw lets an IPv6
      // client hop addresses to bypass the limit (ERR_ERL_KEY_GEN_IPV6).
      return user?.id?.toString() ?? ipKeyGenerator(req.ip ?? 'unknown');
    },
  });
}

export const strictRateLimit = userRateLimit(15 * 60 * 1000, 30);
