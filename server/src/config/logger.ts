import pino, { type Logger, type LoggerOptions } from 'pino';
import { getVersion } from './version.js';

const REDACT_PATHS = [
  'password',
  '*.password',
  'token',
  '*.token',
  'jwt',
  '*.jwt',
  'authorization',
  '*.authorization',
  'apiKey',
  '*.apiKey',
  'secret',
  '*.secret',
];

export interface CreateLoggerOptions {
  level?: string;
  stream?: NodeJS.WritableStream;
  pretty?: boolean;
}

export function createLogger(options: CreateLoggerOptions = {}): Logger {
  const opts: LoggerOptions = {
    level: options.level ?? process.env.LOG_LEVEL ?? 'info',
    base: { version: getVersion() },
    redact: {
      paths: REDACT_PATHS,
      censor: '[Redacted]',
    },
  };

  if (options.stream) {
    return pino(opts, options.stream);
  }

  if (options.pretty ?? (process.env.NODE_ENV === 'development' && process.env.LOG_PRETTY !== 'false')) {
    return pino({ ...opts, transport: { target: 'pino-pretty' } });
  }

  return pino(opts);
}

export const logger = createLogger();
