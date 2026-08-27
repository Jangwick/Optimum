import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import { getVersion } from '../config/version.js';

interface AppErrorLike extends Error {
  statusCode?: number;
  status?: number;
  code?: string;
  meta?: Record<string, unknown>;
}

export function errorHandler(err: AppErrorLike, req: Request, res: Response, next: NextFunction) {
  const requestId = req.id;
  const log = req.log ?? logger.child({ requestId });
  const statusCode = err.statusCode || err.status || 500;

  log.error({
    event: 'request_error',
    requestId,
    method: req.method,
    route: req.route?.path ?? req.path,
    path: req.path,
    statusCode,
    errorType: err.name || 'Error',
    err: err.message,
    stack: err.stack,
    version: getVersion(),
  }, 'Unhandled error');

  if (res.headersSent) {
    return next(err);
  }

  // Prisma known request errors (P2000 = value too long for column, etc.)
  // Check by duck-typing to avoid importing Prisma client (breaks tests).
  if (err && err.code === 'P2000' && typeof err.meta === 'object') {
    const column = typeof err.meta?.column_name === 'string' ? err.meta.column_name : null;
    return res.status(400).json({
      success: false,
      error: column
        ? `Value for "${column}" is too long for the database column.`
        : 'A value provided is too long for the database column.',
    });
  }

  const message = statusCode >= 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}
