import type {
  AddItemsRequest,
  CreateGameResponse,
  HostGameView,
  PublicGameSummary,
} from '@blind/shared';
import { env } from '../env';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${env.API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }

  return (await res.json()) as T;
}

export const api = {
  createGame: () => request<CreateGameResponse>('/api/games', { method: 'POST' }),

  getGame: (code: string, hostToken?: string) =>
    request<PublicGameSummary | HostGameView>(`/api/games/${code}`, {
      headers: hostToken ? { 'x-host-token': hostToken } : {},
    }),

  setItems: (code: string, hostToken: string, items: string[]) =>
    request<HostGameView>(`/api/games/${code}/items`, {
      method: 'PUT',
      headers: { 'x-host-token': hostToken },
      body: JSON.stringify({ items } satisfies AddItemsRequest),
    }),
};
