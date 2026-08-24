import pino from 'pino';

const options: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
};

if (process.env.NODE_ENV === 'development') {
  options.transport = { target: 'pino-pretty' };
}

export const logger = pino(options);
