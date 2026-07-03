/**
 * Core domain types shared by the client and server.
 * These describe the *public* shapes exchanged over the wire — internal
 * persistence shapes (e.g. the sample→item answer key) live on the server only.
 */

export type GameStatus = 'lobby' | 'active' | 'finished';

export type Role = 'host' | 'player';

/** Constraints shared by client validation and server validation. */
export const ROOM_CODE_LENGTH = 6;
export const NICKNAME_MIN = 1;
export const NICKNAME_MAX = 20;
export const MIN_ITEMS = 2;
export const MAX_ITEMS = 20;
export const MIN_STARS = 1;
export const MAX_STARS = 5;

export type Stars = 1 | 2 | 3 | 4 | 5;

/** An item the host enters — the true identity of one blind sample. */
export interface Item {
  id: string;
  name: string;
  order: number;
}

/** A player as exposed to other clients (no socket/internal fields). */
export interface PublicPlayer {
  id: string;
  nickname: string;
  connected: boolean;
}

/** An anonymized blind sample shown to players during the game. */
export interface PublicSample {
  id: string;
  label: string;
}

/** A draggable option chip — the candidate identity a player can assign. */
export interface OptionChip {
  id: string;
  name: string;
}

/** A single rating submitted by a player for one sample. */
export interface RatingInput {
  sampleId: string;
  guessedItemId: string | null;
  stars: Stars;
}

/** Aggregated result for one item after the game finishes. */
export interface ItemResult {
  itemId: string;
  name: string;
  label: string;
  averageStars: number | null;
  ratingsCount: number;
  correctGuesses: number;
  guessAccuracy: number | null;
}

export interface GameResults {
  items: ItemResult[];
  totalPlayers: number;
  submissionsCount: number;
}

/** One player's own outcome for a single sample, revealed when the game ends. */
export interface PersonalRatingResult {
  label: string;
  itemName: string;
  stars: number | null;
  guessedName: string | null;
  correct: boolean;
}

/** A single player's personal results, sent only to that player. */
export interface PlayerResults {
  ratings: PersonalRatingResult[];
  correctCount: number;
  totalSamples: number;
  averageStarsGiven: number | null;
}
