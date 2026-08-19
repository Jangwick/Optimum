import app from './app.js';
import { config } from './config/index.js';
import { logger } from './config/logger.js';

const server = app.listen(config.port, () => {
  logger.info(`Server running on http://localhost:${config.port} (${config.nodeEnv})`);
});

process.on('unhandledRejection', (err) => {
  logger.error({ err: err.message, stack: err.stack }, 'Unhandled rejection');
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error({ err: err.message, stack: err.stack }, 'Uncaught exception');
  server.close(() => process.exit(1));
});
