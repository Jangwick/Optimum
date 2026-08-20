import 'dotenv/config';

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3001),
  clientUrl: process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? '*' : 'http://localhost:5173'),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production');
    }
    return 'dev-jwt-secret-change-in-production';
  })(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  reportDir: process.env.REPORT_DIR || './reports',
  maxFileSize: Number(process.env.MAX_FILE_SIZE || 20 * 1024 * 1024),
};
