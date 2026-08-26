import type { Request, Response, NextFunction } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    signal: AbortSignal;
  }
}

export function requestSignalMiddleware(req: Request, res: Response, next: NextFunction): void {
  const controller = new AbortController();
  req.signal = controller.signal;

  req.on('close', () => {
    if (!req.complete && !res.writableEnded) {
      controller.abort();
    }
  });

  res.on('close', () => {
    if (!res.writableEnded) {
      controller.abort();
    }
  });

  next();
}
