/**
 * Persist a player's identity per room so the same device can resume after a
 * page refresh or a dropped connection (e.g. the phone going to sleep).
 */
const KEY_PREFIX = 'blind:player:';

export interface StoredPlayerSession {
  playerToken: string;
  nickname: string;
}

export function savePlayerSession(roomCode: string, session: StoredPlayerSession): void {
  localStorage.setItem(`${KEY_PREFIX}${roomCode}`, JSON.stringify(session));
}

export function getPlayerSession(roomCode: string): StoredPlayerSession | null {
  const raw = localStorage.getItem(`${KEY_PREFIX}${roomCode}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredPlayerSession;
  } catch {
    return null;
  }
}

export function clearPlayerSession(roomCode: string): void {
  localStorage.removeItem(`${KEY_PREFIX}${roomCode}`);
}
