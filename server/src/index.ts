import { createServer } from 'node:http';
import mongoose from 'mongoose';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './logger';
import { createSocketServer } from './sockets';

async function main(): Promise<void> {
  // Fail fast (and legibly) if the database is unreachable, instead of the
  // default 30s server-selection hang.
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  logger.info('Connected to MongoDB');

  const app = createApp();
  const httpServer = createServer(app);
  createSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    logger.info(`Server listening on http://localhost:${env.PORT}`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    httpServer.close(() => {
      void mongoose.disconnect().finally(() => process.exit(0));
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  // Use the `err` key so pino serializes the message + stack (not just enumerable props).
  logger.error({ err: error }, 'Fatal startup error');
  process.exit(1);
});
