import { configSchema, MAX_FILE_SIZE_CAP } from '../src/config/index.js';

describe('config validation', () => {
  it('loads with defaults in development', () => {
    const result = configSchema.parse({
      NODE_ENV: 'development',
      CLIENT_URL: 'http://localhost:5173',
    });
    expect(result.nodeEnv).toBe('development');
    expect(result.port).toBe(3001);
    expect(result.clientUrl).toBe('http://localhost:5173');
    expect(result.databaseUrl).toBe('');
    expect(result.jwtSecret).toBe('dev-jwt-secret-change-in-production');
    expect(result.jwtExpiresIn).toBe('24h');
    expect(result.bcryptRounds).toBe(12);
    expect(result.uploadDir).toBe('./uploads');
    expect(result.reportDir).toBe('./reports');
    expect(result.maxFileSize).toBe(20_971_520);
  });

  it('rejects MAX_FILE_SIZE above the cap', () => {
    expect(() =>
      configSchema.parse({
        NODE_ENV: 'development',
        CLIENT_URL: 'http://localhost:5173',
        MAX_FILE_SIZE: String(MAX_FILE_SIZE_CAP + 1),
      })
    ).toThrow(/must not exceed/);
  });

  it('rejects wildcard CLIENT_URL', () => {
    expect(() =>
      configSchema.parse({
        NODE_ENV: 'development',
        CLIENT_URL: '*',
      })
    ).toThrow(/wildcard/);
  });

  it('requires DATABASE_URL in production', () => {
    expect(() =>
      configSchema.parse({
        NODE_ENV: 'production',
        CLIENT_URL: 'http://localhost:5173',
      })
    ).toThrow(/DATABASE_URL is required in production/);
  });

  it('requires a non-default JWT_SECRET in production', () => {
    expect(() =>
      configSchema.parse({
        NODE_ENV: 'production',
        CLIENT_URL: 'http://localhost:5173',
        DATABASE_URL: 'mysql://root:pass@localhost:3306/db',
        JWT_SECRET: 'dev-jwt-secret-change-in-production',
      })
    ).toThrow(/cannot use the default/);
  });

  it('rejects invalid CLIENT_URL in production', () => {
    expect(() =>
      configSchema.parse({
        NODE_ENV: 'production',
        CLIENT_URL: 'not-a-url',
        DATABASE_URL: 'mysql://root:pass@localhost:3306/db',
        JWT_SECRET: 'production-secret',
      })
    ).toThrow(/valid URL/);
  });
});
