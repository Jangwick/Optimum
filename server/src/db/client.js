import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client.js';

// Prisma connects to PostgreSQL using DATABASE_URL directly.
// No adapter needed for PostgreSQL — Prisma has native support.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
