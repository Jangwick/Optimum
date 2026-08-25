import type { Request, Response, NextFunction } from 'express';
import type { Logger } from 'pino';
import { logger } from '../config/logger.js';
import { getVersion } from '../config/version.js';
import crypto from 'node:crypto';

declare module 'express-serve-static-core' {
  interface Request {
    id: string;
    log: Logger;
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers['x-request-id'] as string | undefined) ?? crypto.randomUUID();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);

  const log = logger.child({ requestId });
  req.log = log;

  const start = Date.now();

  const onComplete = () => {
    res.removeListener('finish', onComplete);
    res.removeListener('close', onComplete);

    const duration = Date.now() - start;
    const status = res.statusCode;
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

    log[level](
      {
        event: 'request_complete',
        method: req.method,
        route: req.route?.path ?? req.path,
        path: req.path,
        statusCode: status,
        duration_ms: duration,
        version: getVersion(),
      },
      'request complete',
    );
  };

  res.on('finish', onComplete);
  res.on('close', onComplete);

  next();
}
