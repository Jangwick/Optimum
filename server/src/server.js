import app from './app.js';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { prisma } from './db/client.js';
import { execSync } from 'node:child_process';

async function syncSchema() {
  try {
    logger.info('Syncing database schema with prisma db push...');
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
    });
    logger.info('Schema sync complete.');
  } catch (err) {
    logger.error({ err: err.message }, 'Schema sync failed (non-fatal, continuing)');
  }
}

async function autoSeed() {
  try {
    logger.info('Running auto-seed (idempotent upserts)...');

    const { runSeed } = await import('../prisma/seed.js');
    if (typeof runSeed === 'function') {
      await runSeed();
      logger.info('Auto-seed complete.');
    }
  } catch (err) {
    logger.error({ err: err.message, stack: err.stack }, 'Auto-seed failed (non-fatal)');
  }
}

const server = app.listen(config.port, async () => {
  logger.info(`Server running on http://localhost:${config.port} (${config.nodeEnv})`);
  await syncSchema();
  await autoSeed();
});

process.on('unhandledRejection', (err) => {
  logger.error({ err: err.message, stack: err.stack }, 'Unhandled rejection');
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error({ err: err.message, stack: err.stack }, 'Uncaught exception');
  server.close(() => process.exit(1));
});
