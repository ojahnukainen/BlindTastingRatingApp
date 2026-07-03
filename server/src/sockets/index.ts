import { Server } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { env } from '../config/env';
import { registerGameHandlers } from './gameHandlers';
import type { AppServer } from './types';

/** Attach a typed Socket.IO server to an existing HTTP server. */
export function createSocketServer(httpServer: HttpServer): AppServer {
  const io: AppServer = new Server(httpServer, {
    cors: { origin: env.CLIENT_ORIGIN, methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    registerGameHandlers(io, socket);
  });

  return io;
}

export type { AppServer, AppSocket } from './types';
