import { Router } from 'express';
import { z } from 'zod';
import {
  MAX_ITEMS,
  MIN_ITEMS,
  type CreateGameResponse,
  type HostGameView,
  type Item,
  type PublicGameSummary,
} from '@blind/shared';
import { Game } from '../models/Game';
import { Player } from '../models/Player';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireHost } from '../middleware/requireHost';
import { createGame, setItems } from '../services/gameService';

export const gamesRouter = Router();

const addItemsSchema = z.object({
  items: z.array(z.string()).min(MIN_ITEMS).max(MAX_ITEMS),
});

function toItems(game: { items: { _id: unknown; name: string; order: number }[] }): Item[] {
  return game.items
    .map((item) => ({ id: String(item._id), name: item.name, order: item.order }))
    .sort((a, b) => a.order - b.order);
}

/** Create a new game. Returns the room code and a host token to store client-side. */
gamesRouter.post(
  '/',
  asyncHandler(async (_req, res) => {
    const game = await createGame();
    const body: CreateGameResponse = {
      gameId: game._id.toString(),
      roomCode: game.roomCode,
      hostToken: game.hostToken,
    };
    res.status(201).json(body);
  }),
);

/**
 * Fetch a game by room code. Returns a public summary, or the full host view
 * (including item names) when a valid `x-host-token` header is supplied.
 */
gamesRouter.get(
  '/:code',
  asyncHandler(async (req, res) => {
    const code = (req.params.code ?? '').toUpperCase();
    const game = await Game.findOne({ roomCode: code });
    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    const playerCount = await Player.countDocuments({ gameId: game._id });
    const summary: PublicGameSummary = {
      id: game._id.toString(),
      roomCode: game.roomCode,
      status: game.status,
      playerCount,
      itemCount: game.items.length,
    };

    const token = req.header('x-host-token');
    if (token && token === game.hostToken) {
      const hostView: HostGameView = { ...summary, items: toItems(game) };
      res.json(hostView);
      return;
    }

    res.json(summary);
  }),
);

/** Replace the item list for a game (host only, lobby only). */
gamesRouter.put(
  '/:code/items',
  requireHost,
  asyncHandler(async (req, res) => {
    const parsed = addItemsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: `Provide between ${MIN_ITEMS} and ${MAX_ITEMS} items` });
      return;
    }
    // `requireHost` guarantees req.game is set.
    const game = req.game!;
    await setItems(game, parsed.data.items);
    const hostView: HostGameView = {
      id: game._id.toString(),
      roomCode: game.roomCode,
      status: game.status,
      playerCount: await Player.countDocuments({ gameId: game._id }),
      itemCount: game.items.length,
      items: toItems(game),
    };
    res.json(hostView);
  }),
);
