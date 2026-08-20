import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Use process.env directly instead of prisma's strict env() validator.
// This allows Railway variable references to resolve at runtime.
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('Warning: DATABASE_URL is not set. Prisma commands may fail.');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  datasource: {
    url: databaseUrl,
  },
});
