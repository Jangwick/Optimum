import 'dotenv/config';
import type { SignOptions } from 'jsonwebtoken';

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

function trimEnv(value: string | undefined, defaultValue: string | undefined = undefined): string | undefined {
  if (value === undefined) return defaultValue;
  return value.trim();
}

const nodeEnv = trimEnv(process.env.NODE_ENV, 'development') ?? 'development';

export const config: AppConfig = {
  nodeEnv,
  port: Number(trimEnv(process.env.PORT, '3001')),
  clientUrl: trimEnv(process.env.CLIENT_URL) || (nodeEnv === 'production' ? '*' : 'http://localhost:5173'),
  databaseUrl: trimEnv(process.env.DATABASE_URL) || '',
  jwtSecret: trimEnv(process.env.JWT_SECRET) || (() => {
    if (nodeEnv === 'production') {
      throw new Error('JWT_SECRET must be set in production');
    }
    return 'dev-jwt-secret-change-in-production';
  })(),
  jwtExpiresIn: (trimEnv(process.env.JWT_EXPIRES_IN, '24h') ?? '24h') as NonNullable<SignOptions['expiresIn']>,
  bcryptRounds: Number(trimEnv(process.env.BCRYPT_ROUNDS, '12')),
  uploadDir: trimEnv(process.env.UPLOAD_DIR, './uploads') ?? './uploads',
  reportDir: trimEnv(process.env.REPORT_DIR, './reports') ?? './reports',
  maxFileSize: Number(trimEnv(process.env.MAX_FILE_SIZE, '20971520')),
};
