import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

const app = createApp();

async function newGame() {
  const res = await request(app).post('/api/games').expect(201);
  return res.body as { gameId: string; roomCode: string; hostToken: string };
}

describe('games REST API', () => {
  it('creates a game with a 6-char room code and a host token', async () => {
    const game = await newGame();
    expect(game.roomCode).toHaveLength(6);
    expect(game.hostToken).toBeTruthy();
  });

  it('rejects setting items without a host token', async () => {
    const game = await newGame();
    await request(app)
      .put(`/api/games/${game.roomCode}/items`)
      .send({ items: ['Coke', 'Pepsi'] })
      .expect(401);
  });

  it('sets items with a valid host token', async () => {
    const game = await newGame();
    const res = await request(app)
      .put(`/api/games/${game.roomCode}/items`)
      .set('x-host-token', game.hostToken)
      .send({ items: ['Coke', 'Pepsi', 'Sprite'] })
      .expect(200);
    expect(res.body.itemCount).toBe(3);
    expect(res.body.items).toHaveLength(3);
  });

  it('rejects fewer than two items', async () => {
    const game = await newGame();
    await request(app)
      .put(`/api/games/${game.roomCode}/items`)
      .set('x-host-token', game.hostToken)
      .send({ items: ['OnlyOne'] })
      .expect(400);
  });

  it('hides item names from non-host viewers but exposes the count', async () => {
    const game = await newGame();
    await request(app)
      .put(`/api/games/${game.roomCode}/items`)
      .set('x-host-token', game.hostToken)
      .send({ items: ['Coke', 'Pepsi'] });
    const res = await request(app).get(`/api/games/${game.roomCode}`).expect(200);
    expect(res.body.items).toBeUndefined();
    expect(res.body.itemCount).toBe(2);
  });

  it('returns item names to the host', async () => {
    const game = await newGame();
    await request(app)
      .put(`/api/games/${game.roomCode}/items`)
      .set('x-host-token', game.hostToken)
      .send({ items: ['Coke', 'Pepsi'] });
    const res = await request(app)
      .get(`/api/games/${game.roomCode}`)
      .set('x-host-token', game.hostToken)
      .expect(200);
    expect(res.body.items).toHaveLength(2);
  });

  it('returns 404 for an unknown room code', async () => {
    await request(app).get('/api/games/ZZZZZZ').expect(404);
  });
});
