import { Types } from 'mongoose';
import {
  MAX_ITEMS,
  MAX_STARS,
  MIN_ITEMS,
  MIN_STARS,
  type GameResults,
  type GameStartedData,
  type ItemResult,
  type OptionChip,
  type PersonalRatingResult,
  type PlayerResults,
  type PublicPlayer,
  type PublicSample,
  type RatingInput,
} from '@blind/shared';
import { Game, type GameDoc } from '../models/Game';
import { Player } from '../models/Player';
import { Rating } from '../models/Rating';
import { ServiceError } from './ServiceError';
import { generateHostToken, generateRoomCode } from './tokens';

const MAX_CODE_ATTEMPTS = 5;

/** Non-mutating Fisher–Yates shuffle. */
function shuffle<T>(input: readonly T[]): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = out[i]!;
    const b = out[j]!;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

/** Create a fresh game in the lobby state with a unique room code. */
export async function createGame(): Promise<GameDoc> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    try {
      return await Game.create({
        roomCode: generateRoomCode(),
        hostToken: generateHostToken(),
        status: 'lobby',
      });
    } catch (error) {
      lastError = error; // Most likely a duplicate room code — retry.
    }
  }
  throw lastError ?? new ServiceError('Could not allocate a room code', 500);
}

/** Replace the game's item list (host setup, only while in the lobby). */
export async function setItems(game: GameDoc, names: string[]): Promise<GameDoc> {
  if (game.status !== 'lobby') {
    throw new ServiceError('Items can only be edited before the game starts', 409);
  }
  const cleaned = names.map((name) => name.trim()).filter((name) => name.length > 0);
  if (cleaned.length < MIN_ITEMS || cleaned.length > MAX_ITEMS) {
    throw new ServiceError(`Provide between ${MIN_ITEMS} and ${MAX_ITEMS} items`);
  }
  game.items.splice(0, game.items.length);
  cleaned.forEach((name, order) => game.items.push({ name, order }));
  await game.save();
  return game;
}

/** Items in the host's entered order — this is the real order players must guess. */
function orderedItems(game: GameDoc) {
  return [...game.items].sort((a, b) => a.order - b.order);
}

/** Build the public "game started" payload (samples in real order + shuffled options). */
export function buildStartedData(game: GameDoc): GameStartedData {
  const samples: PublicSample[] = game.samples.map((sample) => ({
    id: sample.sampleId,
    label: sample.label,
  }));
  // The option chips ARE shuffled so the draggable choices don't reveal the
  // answer — but the samples themselves keep the host's true order.
  const options: OptionChip[] = shuffle(orderedItems(game)).map((item) => ({
    id: item._id.toString(),
    name: item.name,
  }));
  return { status: 'active', samples, options };
}

/** Snapshot items into ordered samples (Sample N = the host's Nth item) and go active. */
export async function startGame(game: GameDoc): Promise<GameStartedData> {
  if (game.status !== 'lobby') {
    throw new ServiceError('Game has already started', 409);
  }
  if (game.items.length < MIN_ITEMS) {
    throw new ServiceError(`Add at least ${MIN_ITEMS} items before starting`);
  }
  game.samples.splice(0, game.samples.length);
  // Preserve the host's order: Sample 1 = first item entered, and so on. The
  // host arranges the physical samples to match; players guess this order.
  orderedItems(game).forEach((item, index) => {
    game.samples.push({
      sampleId: `s${index + 1}`,
      itemId: item._id,
      label: `Sample ${index + 1}`,
    });
  });
  game.status = 'active';
  game.startedAt = new Date();
  await game.save();
  return buildStartedData(game);
}

/** Upsert one player's rating for a single sample. */
export async function recordRating(
  game: GameDoc,
  playerId: string,
  input: RatingInput,
): Promise<void> {
  if (game.status !== 'active') {
    throw new ServiceError('Game is not active', 409);
  }
  const sample = game.samples.find((s) => s.sampleId === input.sampleId);
  if (!sample) {
    throw new ServiceError('Unknown sample');
  }
  if (!Number.isInteger(input.stars) || input.stars < MIN_STARS || input.stars > MAX_STARS) {
    throw new ServiceError('Rating must be between 1 and 5 stars');
  }

  let guessedItemId: Types.ObjectId | null = null;
  if (input.guessedItemId) {
    const known = game.items.some((item) => item._id.toString() === input.guessedItemId);
    if (!known) {
      throw new ServiceError('Unknown option');
    }
    guessedItemId = new Types.ObjectId(input.guessedItemId);
  }

  await Rating.findOneAndUpdate(
    { playerId, sampleId: input.sampleId },
    { gameId: game._id, playerId, sampleId: input.sampleId, guessedItemId, stars: input.stars },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

/** Aggregate per-item averages and guess accuracy. */
export async function computeResults(game: GameDoc): Promise<GameResults> {
  const [players, ratings] = await Promise.all([
    Player.find({ gameId: game._id }),
    Rating.find({ gameId: game._id }),
  ]);

  const items: ItemResult[] = game.samples.map((sample) => {
    const item = game.items.find((it) => it._id.equals(sample.itemId));
    const sampleRatings = ratings.filter((r) => r.sampleId === sample.sampleId);
    const ratingsCount = sampleRatings.length;
    const sumStars = sampleRatings.reduce((acc, r) => acc + r.stars, 0);
    const correctGuesses = sampleRatings.filter(
      (r) => r.guessedItemId && r.guessedItemId.equals(sample.itemId),
    ).length;
    return {
      itemId: sample.itemId.toString(),
      name: item?.name ?? 'Unknown',
      label: sample.label,
      averageStars: ratingsCount > 0 ? sumStars / ratingsCount : null,
      ratingsCount,
      correctGuesses,
      guessAccuracy: ratingsCount > 0 ? correctGuesses / ratingsCount : null,
    };
  });

  return { items, totalPlayers: players.length, submissionsCount: ratings.length };
}

/** One player's own per-sample outcome, with true identities revealed. */
export async function computePersonalResults(
  game: GameDoc,
  playerId: string,
): Promise<PlayerResults> {
  const ratings = await Rating.find({ gameId: game._id, playerId });
  const bySample = new Map(ratings.map((rating) => [rating.sampleId, rating]));

  const perSample: PersonalRatingResult[] = game.samples.map((sample) => {
    const item = game.items.find((it) => it._id.equals(sample.itemId));
    const rating = bySample.get(sample.sampleId);
    const guessedItem = rating?.guessedItemId
      ? game.items.find((it) => it._id.equals(rating.guessedItemId!))
      : null;
    const correct = Boolean(rating?.guessedItemId?.equals(sample.itemId));
    return {
      label: sample.label,
      itemName: item?.name ?? 'Unknown',
      stars: rating ? rating.stars : null,
      guessedName: guessedItem?.name ?? null,
      correct,
    };
  });

  const rated = perSample.filter((entry) => entry.stars !== null);
  const sumStars = rated.reduce((acc, entry) => acc + (entry.stars ?? 0), 0);

  return {
    ratings: perSample,
    correctCount: perSample.filter((entry) => entry.correct).length,
    totalSamples: game.samples.length,
    averageStarsGiven: rated.length > 0 ? sumStars / rated.length : null,
  };
}

/** Finish the game (idempotent) and return the aggregated results. */
export async function finishGame(game: GameDoc): Promise<GameResults> {
  if (game.status === 'lobby') {
    throw new ServiceError('Game has not started yet', 409);
  }
  const results = await computeResults(game);
  if (game.status !== 'finished') {
    game.status = 'finished';
    game.finishedAt = new Date();
    await game.save();
  }
  return results;
}

/** How many connected players have rated every sample. */
export async function getProgress(game: GameDoc): Promise<{ submitted: number; total: number }> {
  const [players, ratings] = await Promise.all([
    Player.find({ gameId: game._id, connected: true }),
    Rating.find({ gameId: game._id }),
  ]);
  const totalSamples = game.samples.length;
  const perPlayer = new Map<string, number>();
  for (const rating of ratings) {
    const key = rating.playerId.toString();
    perPlayer.set(key, (perPlayer.get(key) ?? 0) + 1);
  }
  const submitted =
    totalSamples > 0
      ? [...perPlayer.values()].filter((count) => count >= totalSamples).length
      : 0;
  return { submitted, total: players.length };
}

/** Public-safe player list for a game, in join order. */
export async function listPublicPlayers(gameId: Types.ObjectId): Promise<PublicPlayer[]> {
  const players = await Player.find({ gameId }).sort({ createdAt: 1 });
  return players.map((player) => ({
    id: player._id.toString(),
    nickname: player.nickname,
    connected: player.connected,
  }));
}
