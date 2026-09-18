import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { getDatabaseUrl } from './deployment-env.js';

// Use process.env directly instead of prisma's strict env() validator.
// This allows Railway variable references to resolve at runtime.
const databaseUrl = getDatabaseUrl(process.env);

if (!databaseUrl) {
  console.warn('Warning: DATABASE_URL is not set. Prisma commands may fail.');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    ...(databaseUrl ? { url: databaseUrl } : {}),
  },
});
