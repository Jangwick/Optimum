import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

function parseUrl(url) {
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
    connectionLimit: 5,
  };
}

const config = parseUrl(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb(config);

export const prisma = new PrismaClient({ adapter });
