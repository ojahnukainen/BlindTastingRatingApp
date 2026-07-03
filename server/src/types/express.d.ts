import type { GameDoc } from '../models/Game';

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireHost` once host ownership is verified. */
      game?: GameDoc;
    }
  }
}

export {};
