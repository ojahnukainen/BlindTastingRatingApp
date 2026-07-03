import type { RatingInput } from '@blind/shared';
import { useGameStore } from '../store/gameStore';
import { getSocket } from './socket';

const ACK_TIMEOUT_MS = 15_000;

function ensureConnected() {
  const socket = getSocket();
  if (!socket.connected) socket.connect();
  // Apply an ack timeout so a stalled connection surfaces an error instead of
  // hanging the UI forever (e.g. if the WebSocket upgrade fails on mobile).
  return socket.timeout(ACK_TIMEOUT_MS);
}

export async function joinAsPlayer(roomCode: string, nickname: string): Promise<boolean> {
  try {
    const res = await ensureConnected().emitWithAck('player:join', { roomCode, nickname });
    if (!res.ok) {
      useGameStore.getState().setError(res.error);
      return false;
    }
    useGameStore.getState().setPlayerSession({ roomCode, ...res.data });
    return true;
  } catch {
    useGameStore.getState().setError('Could not reach the server. Check your connection and try again.');
    return false;
  }
}

export async function joinAsHost(roomCode: string, hostToken: string): Promise<boolean> {
  try {
    const res = await ensureConnected().emitWithAck('host:join', { roomCode, hostToken });
    if (!res.ok) {
      useGameStore.getState().setError(res.error);
      return false;
    }
    useGameStore.getState().setHostSession({ roomCode, hostToken, ...res.data });
    return true;
  } catch {
    useGameStore.getState().setError('Could not reach the server. Check your connection and try again.');
    return false;
  }
}

export async function startGame(): Promise<boolean> {
  const res = await getSocket().emitWithAck('host:startGame');
  if (!res.ok) {
    useGameStore.getState().setError(res.error);
    return false;
  }
  useGameStore.getState().applyStarted(res.data);
  return true;
}

export async function submitRating(input: RatingInput): Promise<boolean> {
  const res = await getSocket().emitWithAck('player:submitRating', input);
  if (!res.ok) {
    useGameStore.getState().setError(res.error);
    return false;
  }
  return true;
}

export async function endGame(): Promise<boolean> {
  const res = await getSocket().emitWithAck('host:endGame');
  if (!res.ok) {
    useGameStore.getState().setError(res.error);
    return false;
  }
  useGameStore.getState().applyFinished(res.data);
  return true;
}
