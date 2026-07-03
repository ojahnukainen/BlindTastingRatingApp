/** REST request/response shapes for host setup (pre-live) endpoints. */
import type { GameStatus, Item } from './domain';

export interface CreateGameResponse {
  gameId: string;
  roomCode: string;
  /** Opaque token proving host ownership of this game. Store client-side. */
  hostToken: string;
}

export interface AddItemsRequest {
  /** Item names to be tasted. */
  items: string[];
}

/** Public, non-revealing summary of a game (safe for any visitor). */
export interface PublicGameSummary {
  id: string;
  roomCode: string;
  status: GameStatus;
  playerCount: number;
  itemCount: number;
}

/** Full host view — includes item names. Returned only with a valid host token. */
export interface HostGameView extends PublicGameSummary {
  items: Item[];
}

export interface ApiError {
  error: string;
}
