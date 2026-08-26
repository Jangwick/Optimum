import app, { activeRequests, setShuttingDown } from './app.js';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { prisma } from './db/client.js';
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

const SHUTDOWN_TIMEOUT_MS = 30000;
const ACTIVE_REQUEST_POLL_MS = 100;

async function shutdown(signal: string) {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  setShuttingDown(true);

  server.close();
  // Close idle keep-alive connections so the process can exit promptly.
  server.closeIdleConnections();

  const start = Date.now();
  while (activeRequests > 0 && Date.now() - start < SHUTDOWN_TIMEOUT_MS) {
    await new Promise((resolve) => setTimeout(resolve, ACTIVE_REQUEST_POLL_MS));
  }

  if (activeRequests > 0) {
    logger.warn({ activeRequests }, 'Shutdown timed out waiting for active requests');
  } else {
    logger.info('All active requests completed');
  }

  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => {
  shutdown('SIGTERM').catch((err: unknown) => {
    logger.error(getErrorMeta(err), 'SIGTERM shutdown failed');
    process.exit(1);
  });
});

process.on('SIGINT', () => {
  shutdown('SIGINT').catch((err: unknown) => {
    logger.error(getErrorMeta(err), 'SIGINT shutdown failed');
    process.exit(1);
  });
});

process.on('unhandledRejection', (err: unknown) => {
  logger.error(getErrorMeta(err), 'Unhandled rejection');
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err: unknown) => {
  logger.error(getErrorMeta(err), 'Uncaught exception');
  server.close(() => process.exit(1));
});
