import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './logger';
import { gamesRouter } from './routes/games';
import { errorHandler, notFound } from './middleware/errors';

/** Build the Express app (no network binding) so it can be reused in tests. */
export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN }));
  app.use(express.json());
  if (env.NODE_ENV !== 'test') {
    app.use(pinoHttp({ logger }));
  }

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/games', gamesRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
