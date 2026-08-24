import app from './app.js';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { execSync } from 'node:child_process';

interface SeedModule {
  runSeed?: () => Promise<void>;
}

function getErrorMeta(err: unknown) {
  if (err instanceof Error) return { message: err.message, stack: err.stack };
  return { message: String(err) };
}

async function syncSchema() {
  if (config.nodeEnv === 'production') {
    logger.info('Skipping auto schema sync in production (migrations are run before start).');
    return;
  }

  try {
    logger.info('Syncing database schema with prisma db push...');
    execSync('npx prisma db push', {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
    });
    logger.info('Schema sync complete.');
  } catch (err) {
    logger.error(getErrorMeta(err), 'Schema sync failed (non-fatal, continuing)');
  }
}

async function autoSeed() {
  if (config.nodeEnv === 'production') {
    logger.info('Skipping auto-seed in production.');
    return;
  }

  try {
    logger.info('Running auto-seed (idempotent upserts)...');

    const { runSeed } = (await import('../prisma/seed.js')) as SeedModule;
    if (typeof runSeed === 'function') {
      await runSeed();
      logger.info('Auto-seed complete.');
    }
  } catch (err) {
    logger.error(getErrorMeta(err), 'Auto-seed failed (non-fatal)');
  }
}

const server = app.listen(config.port, async () => {
  logger.info(`Server running on http://localhost:${config.port} (${config.nodeEnv})`);
  await syncSchema();
  await autoSeed();
});

process.on('unhandledRejection', (err: unknown) => {
  logger.error(getErrorMeta(err), 'Unhandled rejection');
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err: unknown) => {
  logger.error(getErrorMeta(err), 'Uncaught exception');
  server.close(() => process.exit(1));
});
