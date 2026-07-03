import { NICKNAME_MAX, ROOM_CODE_LENGTH } from '@blind/shared';
import { logger } from '../logger';
import { Game } from '../models/Game';
import { Player } from '../models/Player';
import {
  buildStartedData,
  computePersonalResults,
  computeResults,
  finishGame,
  getProgress,
  listPublicPlayers,
  recordRating,
  startGame,
} from '../services/gameService';
import { toClientMessage } from '../services/ServiceError';
import { generatePlayerToken } from '../services/tokens';
import type { AppServer, AppSocket } from './types';

/** Broadcast the current lobby roster to everyone in the room. */
async function broadcastPlayers(io: AppServer, roomCode: string, gameId: AppSocket['data']['gameId']) {
  if (!gameId) return;
  const game = await Game.findById(gameId);
  if (!game) return;
  const players = await listPublicPlayers(game._id);
  io.to(roomCode).emit('lobby:playersUpdate', { players });
}

export function registerGameHandlers(io: AppServer, socket: AppSocket): void {
  socket.on('player:join', async (payload, ack) => {
    try {
      const roomCode = payload.roomCode?.trim().toUpperCase() ?? '';
      const nickname = payload.nickname?.trim() ?? '';
      if (roomCode.length !== ROOM_CODE_LENGTH) {
        return ack({ ok: false, error: 'Invalid room code' });
      }
      if (nickname.length < 1 || nickname.length > NICKNAME_MAX) {
        return ack({ ok: false, error: 'Please choose a nickname' });
      }

      const game = await Game.findOne({ roomCode });
      if (!game) return ack({ ok: false, error: 'Room not found' });

      // Reattach to an existing player when a valid token is presented — this is
      // how a device resumes after a refresh or a socket drop (e.g. phone sleep).
      const existing = payload.playerToken
        ? await Player.findOne({ gameId: game._id, playerToken: payload.playerToken })
        : null;

      // A brand-new player can't join a game that has already finished; a
      // returning player (with a token) is still allowed back to see results.
      if (!existing && game.status === 'finished') {
        return ack({ ok: false, error: 'This game has finished' });
      }

      let player = existing;
      if (player) {
        player.socketId = socket.id;
        player.connected = true;
        if (nickname) player.nickname = nickname;
        await player.save();
      } else {
        player = await Player.create({
          gameId: game._id,
          nickname,
          playerToken: generatePlayerToken(),
          socketId: socket.id,
        });
      }

      socket.data.role = 'player';
      socket.data.gameId = game._id.toString();
      socket.data.roomCode = roomCode;
      socket.data.playerId = player._id.toString();
      await socket.join(roomCode);

      const players = await listPublicPlayers(game._id);
      io.to(roomCode).emit('lobby:playersUpdate', { players });

      ack({
        ok: true,
        data: {
          playerId: player._id.toString(),
          playerToken: player.playerToken,
          nickname: player.nickname,
          status: game.status,
          players,
        },
      });

      // Catch a (re)joining player up to the game's current phase.
      if (game.status === 'active') {
        socket.emit('game:started', buildStartedData(game));
      } else if (game.status === 'finished') {
        socket.emit('game:personalResults', await computePersonalResults(game, player._id.toString()));
        socket.emit('game:finished', { results: await computeResults(game) });
      }
    } catch (error) {
      logger.error({ error }, 'player:join failed');
      ack({ ok: false, error: toClientMessage(error) });
    }
  });

  socket.on('host:join', async (payload, ack) => {
    try {
      const roomCode = payload.roomCode?.trim().toUpperCase() ?? '';
      const game = await Game.findOne({ roomCode });
      if (!game || game.hostToken !== payload.hostToken) {
        return ack({ ok: false, error: 'Not authorized for this game' });
      }
      socket.data.role = 'host';
      socket.data.gameId = game._id.toString();
      socket.data.roomCode = roomCode;
      await socket.join(roomCode);

      const players = await listPublicPlayers(game._id);
      ack({ ok: true, data: { status: game.status, players } });
    } catch (error) {
      logger.error({ error }, 'host:join failed');
      ack({ ok: false, error: toClientMessage(error) });
    }
  });

  socket.on('host:startGame', async (ack) => {
    try {
      if (socket.data.role !== 'host' || !socket.data.gameId) {
        return ack({ ok: false, error: 'Only the host can start the game' });
      }
      const game = await Game.findById(socket.data.gameId);
      if (!game) return ack({ ok: false, error: 'Game not found' });

      const data = await startGame(game);
      io.to(game.roomCode).emit('game:started', data);
      ack({ ok: true, data });
    } catch (error) {
      logger.error({ error }, 'host:startGame failed');
      ack({ ok: false, error: toClientMessage(error) });
    }
  });

  socket.on('player:submitRating', async (payload, ack) => {
    try {
      if (socket.data.role !== 'player' || !socket.data.gameId || !socket.data.playerId) {
        return ack({ ok: false, error: 'Join the game before rating' });
      }
      const game = await Game.findById(socket.data.gameId);
      if (!game) return ack({ ok: false, error: 'Game not found' });

      await recordRating(game, socket.data.playerId, payload);
      ack({ ok: true, data: undefined });

      const progress = await getProgress(game);
      io.to(game.roomCode).emit('submissions:progress', progress);
    } catch (error) {
      logger.error({ error }, 'player:submitRating failed');
      ack({ ok: false, error: toClientMessage(error) });
    }
  });

  socket.on('host:endGame', async (ack) => {
    try {
      if (socket.data.role !== 'host' || !socket.data.gameId) {
        return ack({ ok: false, error: 'Only the host can end the game' });
      }
      const game = await Game.findById(socket.data.gameId);
      if (!game) return ack({ ok: false, error: 'Game not found' });

      const results = await finishGame(game);

      // Send each connected player their own breakdown before revealing the
      // room results, so the "My results" tab is populated on arrival.
      const roomSockets = await io.in(game.roomCode).fetchSockets();
      await Promise.all(
        roomSockets.map(async (member) => {
          if (member.data.role === 'player' && member.data.playerId) {
            const personal = await computePersonalResults(game, member.data.playerId);
            member.emit('game:personalResults', personal);
          }
        }),
      );

      io.to(game.roomCode).emit('game:finished', { results });
      ack({ ok: true, data: results });
    } catch (error) {
      logger.error({ error }, 'host:endGame failed');
      ack({ ok: false, error: toClientMessage(error) });
    }
  });

  socket.on('disconnect', async () => {
    try {
      const { role, playerId, roomCode, gameId } = socket.data;
      if (role === 'player' && playerId) {
        await Player.findByIdAndUpdate(playerId, { connected: false });
        if (roomCode) {
          await broadcastPlayers(io, roomCode, gameId);
        }
      }
    } catch (error) {
      logger.error({ error }, 'disconnect handling failed');
    }
  });
}
