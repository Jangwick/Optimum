import { logger } from '../config/logger.js';

export function errorHandler(err, req, res, next) {
  logger.error({ err: err.message, stack: err.stack }, 'Unhandled error');

  if (res.headersSent) {
    return next(err);
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
