import type { ErrorRequestHandler, RequestHandler } from 'express';
import { logger } from '../logger';
import { ServiceError } from '../services/ServiceError';

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Not found' });
};

// Express requires the 4-arg signature to register this as an error handler.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ServiceError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  logger.error({ err }, 'Unhandled request error');
  res.status(500).json({ error: 'Internal server error' });
};
