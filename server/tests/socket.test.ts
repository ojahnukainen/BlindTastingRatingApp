import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { io as ioClient, type Socket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type {
  Ack,
  ClientToServerEvents,
  GameResults,
  GameStartedData,
  JoinedData,
  ServerToClientEvents,
} from '@blind/shared';
import { createSocketServer, type AppServer } from '../src/sockets';
import { createGame, setItems } from '../src/services/gameService';

type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let httpServer: HttpServer;
let io: AppServer;
let url: string;
const sockets: ClientSocket[] = [];

beforeEach(async () => {
  httpServer = createServer();
  io = createSocketServer(httpServer);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const { port } = httpServer.address() as AddressInfo;
  url = `http://localhost:${port}`;
});

afterEach(async () => {
  for (const socket of sockets.splice(0)) socket.disconnect();
  await io.close();
  httpServer.close();
});

function connect(): ClientSocket {
  const socket = ioClient(url, { transports: ['websocket'], forceNew: true });
  sockets.push(socket);
  return socket;
}

function waitFor<T>(socket: ClientSocket, event: string): Promise<T> {
  return new Promise((resolve) => {
    (socket.on as (e: string, cb: (data: T) => void) => void)(event, resolve);
  });
}

function emitAck<T = undefined>(
  socket: ClientSocket,
  event: string,
  payload?: unknown,
): Promise<Ack<T>> {
  return new Promise((resolve) => {
    const args = payload === undefined ? [event, resolve] : [event, payload, resolve];
    (socket.emit as (...a: unknown[]) => void).apply(socket, args);
  });
}

describe('socket game flow', () => {
  it('runs host + player from join through finished results', async () => {
    const game = await createGame();
    await setItems(game, ['Coke', 'Pepsi']);

    const host = connect();
    const player = connect();
    await Promise.all([waitFor(host, 'connect'), waitFor(player, 'connect')]);

    const hostJoin = await emitAck(host, 'host:join', {
      roomCode: game.roomCode,
      hostToken: game.hostToken,
    });
    expect(hostJoin.ok).toBe(true);

    const playerJoin = await emitAck<JoinedData>(player, 'player:join', {
      roomCode: game.roomCode,
      nickname: 'Ann',
    });
    expect(playerJoin.ok).toBe(true);

    const startedOnPlayer = waitFor<GameStartedData>(player, 'game:started');
    const startAck = await emitAck<GameStartedData>(host, 'host:startGame');
    expect(startAck.ok).toBe(true);
    const started = await startedOnPlayer;
    expect(started.samples).toHaveLength(2);
    expect(started.options).toHaveLength(2);

    for (const sample of started.samples) {
      const rated = await emitAck(player, 'player:submitRating', {
        sampleId: sample.id,
        guessedItemId: null,
        stars: 4,
      });
      expect(rated.ok).toBe(true);
    }

    const finishedOnPlayer = waitFor<{ results: GameResults }>(player, 'game:finished');
    const endAck = await emitAck<GameResults>(host, 'host:endGame');
    expect(endAck.ok).toBe(true);
    const finished = await finishedOnPlayer;
    expect(finished.results.items).toHaveLength(2);
    expect(finished.results.items.every((item) => item.averageStars === 4)).toBe(true);
  });

  it('rejects a host action from an unauthorized socket', async () => {
    const game = await createGame();
    await setItems(game, ['A', 'B']);
    const intruder = connect();
    await waitFor(intruder, 'connect');

    const ack = await emitAck<GameStartedData>(intruder, 'host:startGame');
    expect(ack.ok).toBe(false);
  });

  it('reattaches to the same player when rejoining with the stored token', async () => {
    const game = await createGame();
    await setItems(game, ['A', 'B']);

    const first = connect();
    await waitFor(first, 'connect');
    const join1 = await emitAck<JoinedData>(first, 'player:join', {
      roomCode: game.roomCode,
      nickname: 'Ann',
    });
    expect(join1.ok).toBe(true);
    if (!join1.ok) return;
    const { playerId, playerToken } = join1.data;

    // Simulate the phone sleeping / a refresh: drop the socket, reconnect fresh.
    first.disconnect();

    const second = connect();
    await waitFor(second, 'connect');
    const join2 = await emitAck<JoinedData>(second, 'player:join', {
      roomCode: game.roomCode,
      nickname: 'Ann',
      playerToken,
    });
    expect(join2.ok).toBe(true);
    if (!join2.ok) return;

    // Same identity, and no duplicate player was created.
    expect(join2.data.playerId).toBe(playerId);
    expect(join2.data.players).toHaveLength(1);
  });
});
