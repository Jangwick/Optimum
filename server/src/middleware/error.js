import { logger } from '../config/logger.js';

export function errorHandler(err, req, res, next) {
  logger.error({ err: err.message, stack: err.stack }, 'Unhandled error');

  if (res.headersSent) {
    return next(err);
  }

  // Prisma known request errors (P2000 = value too long for column, etc.)
  // Check by duck-typing to avoid importing Prisma client (breaks tests).
  if (err && err.code === 'P2000' && typeof err.meta === 'object') {
    return res.status(400).json({
      success: false,
      error: 'A value provided is too large for the database column (e.g. amount exceeds allowed precision).',
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode >= 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}
