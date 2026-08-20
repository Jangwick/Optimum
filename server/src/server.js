import app from './app.js';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { prisma } from './db/client.js';

async function autoSeed() {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      logger.info(`Database has ${userCount} user(s), skipping auto-seed.`);
      return;
    }
    logger.info('No users found — running auto-seed...');

    // Import seed dynamically to avoid circular deps in tests
    const { runSeed } = await import('../prisma/seed.js');
    if (typeof runSeed === 'function') {
      await runSeed();
      logger.info('Auto-seed complete.');
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Auto-seed failed (non-fatal)');
  }
}

const server = app.listen(config.port, async () => {
  logger.info(`Server running on http://localhost:${config.port} (${config.nodeEnv})`);
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
