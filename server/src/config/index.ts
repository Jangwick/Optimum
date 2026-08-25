import 'dotenv/config';
import type { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';

interface AppConfig {
  nodeEnv: string;
  port: number;
  clientUrl: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: NonNullable<SignOptions['expiresIn']>;
  bcryptRounds: number;
  uploadDir: string;
  reportDir: string;
  maxFileSize: number;
}

const MAX_FILE_SIZE_CAP = 104_857_600;

function normalizeString(value: unknown): unknown {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function normalizeNumber(value: unknown): unknown {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return undefined;
    }
    return Number(trimmed);
  }
  return Number(value);
}

const envSchema = z.object({
  NODE_ENV: z.preprocess(normalizeString, z.string().default('development')),
  PORT: z.preprocess(normalizeNumber, z.number().int().default(3001)),
  CLIENT_URL: z.preprocess(normalizeString, z.string().optional()),
  DATABASE_URL: z.preprocess(normalizeString, z.string().optional()),
  JWT_SECRET: z.preprocess(normalizeString, z.string().optional()),
  JWT_EXPIRES_IN: z.preprocess(normalizeString, z.string().default('24h')),
  BCRYPT_ROUNDS: z.preprocess(normalizeNumber, z.number().default(12)),
  UPLOAD_DIR: z.preprocess(normalizeString, z.string().default('./uploads')),
  REPORT_DIR: z.preprocess(normalizeString, z.string().default('./reports')),
  MAX_FILE_SIZE: z.preprocess(
    normalizeNumber,
    z
      .number()
      .max(MAX_FILE_SIZE_CAP, { message: `MAX_FILE_SIZE must not exceed ${MAX_FILE_SIZE_CAP} (100MB)` })
      .default(20_971_520),
  ),
});

const configSchema = envSchema
  .superRefine((data, ctx) => {
    const isProduction = data.NODE_ENV === 'production';

    if (isProduction) {
      if (!data.CLIENT_URL || data.CLIENT_URL === '*') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CLIENT_URL must be set to an explicit origin in production; wildcard is not allowed.',
          path: ['CLIENT_URL'],
        });
      } else if (!URL.canParse(data.CLIENT_URL)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CLIENT_URL must be a valid URL.',
          path: ['CLIENT_URL'],
        });
      }

      if (!data.DATABASE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'DATABASE_URL is required in production.',
          path: ['DATABASE_URL'],
        });
      }

      if (!data.JWT_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'JWT_SECRET must be set in production.',
          path: ['JWT_SECRET'],
        });
      } else if (data.JWT_SECRET === 'dev-jwt-secret-change-in-production') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'JWT_SECRET cannot use the default development value in production.',
          path: ['JWT_SECRET'],
        });
      }
    } else if (data.CLIENT_URL !== undefined) {
      if (data.CLIENT_URL === '*') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CLIENT_URL cannot be a wildcard.',
          path: ['CLIENT_URL'],
        });
      } else if (!URL.canParse(data.CLIENT_URL)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CLIENT_URL must be a valid URL.',
          path: ['CLIENT_URL'],
        });
      }
    }
  })
  .transform((data) => ({
    nodeEnv: data.NODE_ENV,
    port: data.PORT,
    clientUrl: data.CLIENT_URL ?? (data.NODE_ENV === 'production' ? '' : 'http://localhost:5173'),
    databaseUrl: data.DATABASE_URL ?? '',
    jwtSecret:
      data.JWT_SECRET ??
      (data.NODE_ENV === 'production' ? '' : 'dev-jwt-secret-change-in-production'),
    jwtExpiresIn: data.JWT_EXPIRES_IN as NonNullable<SignOptions['expiresIn']>,
    bcryptRounds: data.BCRYPT_ROUNDS,
    uploadDir: data.UPLOAD_DIR,
    reportDir: data.REPORT_DIR,
    maxFileSize: data.MAX_FILE_SIZE,
  }));

export const config: AppConfig = configSchema.parse(process.env);

export { configSchema, MAX_FILE_SIZE_CAP };
