/**
 * Typed Socket.IO event contracts. Both the server (`Server<...>`) and the
 * client (`Socket<...>`) are parameterized with these interfaces so event
 * names and payloads are checked end-to-end.
 */
import type {
  GameResults,
  GameStatus,
  OptionChip,
  PlayerResults,
  PublicPlayer,
  PublicSample,
  RatingInput,
  Role,
} from './domain';

/** Standard acknowledgement returned to the emitter of a client event. */
export type Ack<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export interface PlayerJoinPayload {
  roomCode: string;
  nickname: string;
}

export interface HostJoinPayload {
  roomCode: string;
  hostToken: string;
}

export interface JoinedData {
  playerId: string;
  status: GameStatus;
  players: PublicPlayer[];
}

export interface HostJoinedData {
  status: GameStatus;
  players: PublicPlayer[];
}

export interface GameStartedData {
  status: GameStatus;
  samples: PublicSample[];
  options: OptionChip[];
}

export interface ProgressData {
  /** Number of players who have submitted a rating for every sample. */
  submitted: number;
  /** Total number of connected players. */
  total: number;
}

export interface ClientToServerEvents {
  'player:join': (payload: PlayerJoinPayload, ack: (res: Ack<JoinedData>) => void) => void;
  'host:join': (payload: HostJoinPayload, ack: (res: Ack<HostJoinedData>) => void) => void;
  'host:startGame': (ack: (res: Ack<GameStartedData>) => void) => void;
  'player:submitRating': (payload: RatingInput, ack: (res: Ack) => void) => void;
  'host:endGame': (ack: (res: Ack<GameResults>) => void) => void;
}

export interface ServerToClientEvents {
  'lobby:playersUpdate': (data: { players: PublicPlayer[] }) => void;
  'game:started': (data: GameStartedData) => void;
  'submissions:progress': (data: ProgressData) => void;
  'game:finished': (data: { results: GameResults }) => void;
  'game:personalResults': (data: PlayerResults) => void;
  'error': (data: { message: string }) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InterServerEvents {}

export interface SocketData {
  gameId?: string;
  roomCode?: string;
  playerId?: string;
  role?: Role;
}
