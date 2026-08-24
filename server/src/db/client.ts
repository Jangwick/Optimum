import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

interface DbConnectionConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  idleTimeout: number;
  acquireTimeout: number;
  connectTimeout: number;
  reconnect: true;
}

function parseUrl(url: string | undefined): DbConnectionConfig {
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }

  // mysql://user:pass@host:port/database?options
  const parsed = new URL(url);
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
    reconnect: true,
  };
}

const config = parseUrl(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb(config as unknown as ConstructorParameters<typeof PrismaMariaDb>[0]);

export const prisma = new PrismaClient({ adapter });
