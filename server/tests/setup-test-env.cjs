/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv/config');

function getTestDatabaseUrl() {
  const base = process.env.DATABASE_URL;
  if (!base) {
    return 'mysql://root:@localhost:3306/claims_solutions_test?schema=public';
  }
  const parsed = new URL(base);
  parsed.pathname = '/claims_solutions_test';
  return parsed.toString();
}

process.env.DATABASE_URL = getTestDatabaseUrl();
