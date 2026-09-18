// Shared by Prisma's CLI and the application so deployment aliases cannot drift.
interface DeploymentEnvironment {
  DATABASE_URL?: string | undefined;
  MYSQL_URL?: string | undefined;
  MYSQL_PRIVATE_URL?: string | undefined;
  CLIENT_URL?: string | undefined;
  RAILWAY_PUBLIC_DOMAIN?: string | undefined;
}

export function getDatabaseUrl(env: DeploymentEnvironment): string | undefined {
  const value = env.DATABASE_URL?.trim() || env.MYSQL_URL?.trim() || env.MYSQL_PRIVATE_URL?.trim();
  if (!value) return undefined;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('DATABASE_URL must be a valid mysql:// connection URL.');
  }
  if (url.protocol !== 'mysql:') {
    throw new Error('This application requires MySQL/MariaDB with a mysql:// URL; PostgreSQL is not supported.');
  }
  return value;
}

export function getClientUrl(env: DeploymentEnvironment): string | undefined {
  const explicitUrl = env.CLIENT_URL?.trim();
  if (explicitUrl) return explicitUrl;

  const domain = env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (!domain) return undefined;
  const url = URL.canParse(`https://${domain}`) ? new URL(`https://${domain}`) : undefined;
  if (!url || url.host !== domain || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('RAILWAY_PUBLIC_DOMAIN must contain only the public hostname.');
  }
  return url.origin;
}
