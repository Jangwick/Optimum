import 'dotenv/config';
import { execSync } from 'node:child_process';

function getTestDatabaseUrl(): string {
  const base = process.env.DATABASE_URL;
  if (!base) {
    return 'mysql://root:@localhost:3306/claims_solutions_test?schema=public';
  }
  const parsed = new URL(base);
  parsed.pathname = '/claims_solutions_test';
  return parsed.toString();
}

process.env.DATABASE_URL = getTestDatabaseUrl();

export default async function () {
  if (process.env.SKIP_DB_SETUP === 'true') {
    return;
  }

  execSync('npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    env: process.env,
    timeout: 120000,
  });

  execSync('npx prisma db seed', {
    stdio: 'inherit',
    env: process.env,
    timeout: 120000,
  });
}
