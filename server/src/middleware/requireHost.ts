import { Game } from '../models/Game';
import { asyncHandler } from './asyncHandler';

/**
 * Authorize the caller as the host of the game named by `:code`.
 *
 * Today this checks the `x-host-token` header against the game's stored token.
 * It is intentionally the single auth boundary for host actions, so it can be
 * swapped for JWT/session auth later without touching the route handlers.
 */
export const requireHost = asyncHandler(async (req, res, next) => {
  const code = req.params.code?.toUpperCase();
  const token = req.header('x-host-token');

  if (!code || !token) {
    res.status(401).json({ error: 'Host token required' });
    return;
  }

  const game = await Game.findOne({ roomCode: code });
  if (!game || game.hostToken !== token) {
    res.status(403).json({ error: 'Not authorized for this game' });
    return;
  }

  req.game = game;
  next();
});
