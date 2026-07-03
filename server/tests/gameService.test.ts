import { describe, expect, it } from 'vitest';
import {
  computePersonalResults,
  createGame,
  finishGame,
  getProgress,
  recordRating,
  setItems,
  startGame,
} from '../src/services/gameService';
import { Player } from '../src/models/Player';

describe('gameService lifecycle', () => {
  it('creates, starts, rates, and aggregates a full game', async () => {
    const game = await createGame();
    await setItems(game, ['Coke', 'Pepsi', 'Sprite']);

    const started = await startGame(game);
    expect(started.samples).toHaveLength(3);
    expect(started.options).toHaveLength(3);
    expect(game.status).toBe('active');

    const player = await Player.create({
      gameId: game._id,
      nickname: 'Tess',
      playerToken: 'tok-tess',
      socketId: 'sock-1',
    });

    for (const sample of game.samples) {
      await recordRating(game, player._id.toString(), {
        sampleId: sample.sampleId,
        guessedItemId: sample.itemId.toString(), // always guess correctly
        stars: 5,
      });
    }

    const progress = await getProgress(game);
    expect(progress).toEqual({ submitted: 1, total: 1 });

    const results = await finishGame(game);
    expect(game.status).toBe('finished');
    expect(results.totalPlayers).toBe(1);
    expect(results.items).toHaveLength(3);
    expect(results.items.every((item) => item.averageStars === 5)).toBe(true);
    expect(results.items.every((item) => item.correctGuesses === 1)).toBe(true);
    expect(results.items.every((item) => item.guessAccuracy === 1)).toBe(true);
  });

  it('upserts a rating when a player re-rates the same sample', async () => {
    const game = await createGame();
    await setItems(game, ['A', 'B']);
    await startGame(game);
    const player = await Player.create({
      gameId: game._id,
      nickname: 'Ann',
      playerToken: 'tok-ann',
      socketId: 's',
    });
    const first = game.samples[0]!;

    await recordRating(game, player._id.toString(), {
      sampleId: first.sampleId,
      guessedItemId: null,
      stars: 2,
    });
    await recordRating(game, player._id.toString(), {
      sampleId: first.sampleId,
      guessedItemId: null,
      stars: 4,
    });

    const results = await finishGame(game);
    const ratedItem = results.items.find((item) => item.label === first.label);
    expect(ratedItem?.ratingsCount).toBe(1);
    expect(ratedItem?.averageStars).toBe(4);
  });

  it('computes a player personal breakdown with revealed identities', async () => {
    const game = await createGame();
    await setItems(game, ['Coke', 'Pepsi', 'Sprite']);
    await startGame(game);
    const player = await Player.create({
      gameId: game._id,
      nickname: 'Sam',
      playerToken: 'tok-sam',
      socketId: 's',
    });

    // Guess correctly on the first sample only; rate every sample 4 stars.
    const [first, ...rest] = game.samples;
    await recordRating(game, player._id.toString(), {
      sampleId: first!.sampleId,
      guessedItemId: first!.itemId.toString(),
      stars: 4,
    });
    for (const sample of rest) {
      await recordRating(game, player._id.toString(), {
        sampleId: sample.sampleId,
        guessedItemId: null,
        stars: 4,
      });
    }

    const personal = await computePersonalResults(game, player._id.toString());
    expect(personal.totalSamples).toBe(3);
    expect(personal.correctCount).toBe(1);
    expect(personal.averageStarsGiven).toBe(4);
    expect(personal.ratings).toHaveLength(3);
    expect(personal.ratings.every((entry) => entry.itemName !== 'Unknown')).toBe(true);
  });

  it('builds samples in the host entered order (Sample N = Nth item)', async () => {
    const game = await createGame();
    await setItems(game, ['Coke', 'Pepsi', 'Sprite']);
    await startGame(game);

    // Sample 1 must be Coke, Sample 2 Pepsi, Sample 3 Sprite — the true order.
    const names = game.samples.map(
      (sample) => game.items.find((it) => it._id.equals(sample.itemId))?.name,
    );
    expect(game.samples.map((s) => s.sampleId)).toEqual(['s1', 's2', 's3']);
    expect(names).toEqual(['Coke', 'Pepsi', 'Sprite']);
  });

  it('rejects starting a game with too few items', async () => {
    const game = await createGame();
    await expect(setItems(game, ['only-one'])).rejects.toThrow();
  });
});
