/** Persist host tokens in localStorage so a host can resume after a reload. */
const KEY_PREFIX = 'blind:host:';

export function saveHostToken(roomCode: string, hostToken: string): void {
  localStorage.setItem(`${KEY_PREFIX}${roomCode}`, hostToken);
}

export function getHostToken(roomCode: string): string | null {
  return localStorage.getItem(`${KEY_PREFIX}${roomCode}`);
}

export function clearHostToken(roomCode: string): void {
  localStorage.removeItem(`${KEY_PREFIX}${roomCode}`);
}
