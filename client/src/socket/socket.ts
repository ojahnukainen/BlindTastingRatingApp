import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@blind/shared';
import { env } from '../env';

// Note: the client's emit/receive directions are the mirror of the server's.
export type AppClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppClientSocket | null = null;

/** Lazily create the shared Socket.IO client (connection is opened on demand). */
export function getSocket(): AppClientSocket {
  if (!socket) {
    socket = io(env.SOCKET_URL, {
      autoConnect: false,
      // Start with HTTP long-polling and upgrade to WebSocket when possible.
      // WebSocket-only has no fallback, so environments that block or stall the
      // upgrade (iOS Chrome/WKWebView, some mobile networks and proxies) hang
      // forever on connect. Polling establishes the connection reliably first.
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 5,
      timeout: 20_000,
    });
  }
  return socket;
}
