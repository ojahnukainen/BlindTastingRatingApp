import { create } from 'zustand';
import type {
  GameResults,
  GameStatus,
  OptionChip,
  PlayerResults,
  ProgressData,
  PublicPlayer,
  PublicSample,
  Role,
} from '@blind/shared';

interface PlayerSession {
  roomCode: string;
  playerId: string;
  status: GameStatus;
  players: PublicPlayer[];
}

interface HostSession {
  roomCode: string;
  hostToken: string;
  status: GameStatus;
  players: PublicPlayer[];
}

interface GameState {
  role: Role | null;
  roomCode: string | null;
  hostToken: string | null;
  playerId: string | null;
  status: GameStatus | null;
  players: PublicPlayer[];
  samples: PublicSample[];
  options: OptionChip[];
  progress: ProgressData | null;
  results: GameResults | null;
  personalResults: PlayerResults | null;
  error: string | null;

  setError: (error: string | null) => void;
  setPlayers: (players: PublicPlayer[]) => void;
  setProgress: (progress: ProgressData) => void;
  setStatus: (status: GameStatus) => void;
  setPlayerSession: (session: PlayerSession) => void;
  setHostSession: (session: HostSession) => void;
  applyStarted: (data: { status: GameStatus; samples: PublicSample[]; options: OptionChip[] }) => void;
  applyFinished: (results: GameResults) => void;
  setPersonalResults: (results: PlayerResults) => void;
  reset: () => void;
}

const initialState = {
  role: null,
  roomCode: null,
  hostToken: null,
  playerId: null,
  status: null,
  players: [],
  samples: [],
  options: [],
  progress: null,
  results: null,
  personalResults: null,
  error: null,
} satisfies Partial<GameState>;

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setError: (error) => set({ error }),
  setPlayers: (players) => set({ players }),
  setProgress: (progress) => set({ progress }),
  setStatus: (status) => set({ status }),

  setPlayerSession: (session) =>
    set({
      role: 'player',
      roomCode: session.roomCode,
      playerId: session.playerId,
      status: session.status,
      players: session.players,
      error: null,
    }),

  setHostSession: (session) =>
    set({
      role: 'host',
      roomCode: session.roomCode,
      hostToken: session.hostToken,
      status: session.status,
      players: session.players,
      error: null,
    }),

  applyStarted: (data) =>
    set({ status: data.status, samples: data.samples, options: data.options }),

  applyFinished: (results) => set({ status: 'finished', results }),

  setPersonalResults: (personalResults) => set({ personalResults }),

  reset: () => set({ ...initialState }),
}));
