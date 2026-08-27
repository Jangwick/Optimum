import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

function parseUrl(url: string | undefined): ConstructorParameters<typeof PrismaMariaDb>[0] {
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }

  // mysql://user:pass@host:port/database?options
  const parsed = new URL(url);
  // queryTimeout is MariaDB-only (driver issues SET STATEMENT max_statement_time). Against
  // MySQL the driver throws ER_TIMEOUT_NOT_SUPPORTED on every connect, so only send it when
  // explicitly asked for -- never as a default.
  const queryTimeout = Number(parsed.searchParams.get('queryTimeout') ?? process.env.QUERY_TIMEOUT) || 0;

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.replace(/^\//, ''),
    connectionLimit: Number(parsed.searchParams.get('connectionLimit')) || 20,
    idleTimeout: Number(parsed.searchParams.get('idleTimeout')) || 600000,
    acquireTimeout: Number(parsed.searchParams.get('acquireTimeout')) || 30000,
    connectTimeout: Number(parsed.searchParams.get('connectTimeout')) || 30000,
    ...(queryTimeout ? { queryTimeout } : {}),
  };
}

const config = parseUrl(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb(config);

export const prisma = new PrismaClient({ adapter });
