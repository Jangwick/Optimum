import { getDatabaseUrl, getClientUrl } from '../deployment-env.js';

describe('deployment environment (small)', () => {
  it('uses Railway MySQL variables when DATABASE_URL is absent', () => {
    expect(getDatabaseUrl({ MYSQL_URL: 'mysql://db:3306/railway' })).toBe('mysql://db:3306/railway');
    expect(getDatabaseUrl({ MYSQL_PRIVATE_URL: 'mysql://private:3306/railway' })).toBe('mysql://private:3306/railway');
  });

  it('preserves explicit settings over Railway defaults', () => {
    expect(getDatabaseUrl({ DATABASE_URL: 'mysql://chosen/app', MYSQL_URL: 'mysql://other/app' })).toBe('mysql://chosen/app');
    expect(getClientUrl({ CLIENT_URL: 'https://claims.example.com', RAILWAY_PUBLIC_DOMAIN: 'app.up.railway.app' })).toBe('https://claims.example.com');
  });

  it('treats blank configuration as absent', () => {
    expect(getDatabaseUrl({ DATABASE_URL: ' ', MYSQL_URL: ' mysql://db/app ' })).toBe('mysql://db/app');
    expect(getClientUrl({ CLIENT_URL: ' ', RAILWAY_PUBLIC_DOMAIN: 'app.up.railway.app' })).toBe('https://app.up.railway.app');
  });

  it('does not invent a database or public origin', () => {
    expect(getDatabaseUrl({})).toBeUndefined();
    expect(getClientUrl({})).toBeUndefined();
  });

  it('rejects incompatible databases without exposing connection credentials', () => {
    const databaseUrl = 'postgresql://user:sensitive-password@host/app';
    expect(() => getDatabaseUrl({ DATABASE_URL: databaseUrl })).toThrow('MySQL');
    expect(() => getDatabaseUrl({ DATABASE_URL: databaseUrl })).not.toThrow('sensitive-password');
  });

  it('rejects malformed URLs without echoing their contents', () => {
    expect(() => getDatabaseUrl({ DATABASE_URL: 'secret-invalid-value' })).toThrow('valid mysql://');
    expect(() => getDatabaseUrl({ DATABASE_URL: 'secret-invalid-value' })).not.toThrow('secret-invalid-value');
  });

  it('rejects a Railway domain containing a scheme, credentials, or path', () => {
    for (const domain of ['https://example.com', 'user:password@example.com', 'example.com/path']) {
      expect(() => getClientUrl({ RAILWAY_PUBLIC_DOMAIN: domain })).toThrow('RAILWAY_PUBLIC_DOMAIN');
    }
  });
});
