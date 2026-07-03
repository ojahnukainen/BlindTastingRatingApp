import type { RatingInput } from '@blind/shared';
import { useGameStore } from '../store/gameStore';
import { getSocket } from './socket';

function ensureConnected() {
  const socket = getSocket();
  if (!socket.connected) socket.connect();
  return socket;
}

export async function joinAsPlayer(roomCode: string, nickname: string): Promise<boolean> {
  const res = await ensureConnected().emitWithAck('player:join', { roomCode, nickname });
  if (!res.ok) {
    useGameStore.getState().setError(res.error);
    return false;
  }
  useGameStore.getState().setPlayerSession({ roomCode, ...res.data });
  return true;
}

export async function joinAsHost(roomCode: string, hostToken: string): Promise<boolean> {
  const res = await ensureConnected().emitWithAck('host:join', { roomCode, hostToken });
  if (!res.ok) {
    useGameStore.getState().setError(res.error);
    return false;
  }
  useGameStore.getState().setHostSession({ roomCode, hostToken, ...res.data });
  return true;
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
