import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { NICKNAME_MAX } from '@blind/shared';
import { Button } from '../components/Button';
import { ErrorBanner } from '../components/ErrorBanner';
import { PlayBoard } from '../components/PlayBoard';
import { PlayersList } from '../components/PlayersList';
import { ResultsView } from '../components/ResultsView';
import { joinAsPlayer } from '../socket/actions';
import { useLiveGame } from '../socket/useLiveGame';
import { useGameStore } from '../store/gameStore';

export function PlayRoom() {
  const { code = '' } = useParams();
  const roomCode = code.toUpperCase();
  useLiveGame();

  const role = useGameStore((state) => state.role);
  const joinedRoom = useGameStore((state) => state.roomCode);
  const status = useGameStore((state) => state.status);
  const players = useGameStore((state) => state.players);
  const results = useGameStore((state) => state.results);
  const personalResults = useGameStore((state) => state.personalResults);

  const [nickname, setNickname] = useState('');
  const [joining, setJoining] = useState(false);

  const isJoined = role === 'player' && joinedRoom === roomCode;

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setJoining(true);
    await joinAsPlayer(roomCode, nickname.trim());
    setJoining(false);
  }

  if (!isJoined) {
    return (
      <div className="space-y-4">
        <ErrorBanner />
        <h1 className="text-xl font-bold">Join room {roomCode}</h1>
        <form onSubmit={handleJoin} className="space-y-3">
          <input
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            maxLength={NICKNAME_MAX}
            placeholder="Your nickname"
            aria-label="Nickname"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <Button type="submit" disabled={joining || nickname.trim().length === 0}>
            {joining ? 'Joining…' : 'Join game'}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ErrorBanner />
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Room {roomCode}</h1>
        <span className="text-sm text-slate-500">
          {players.length} player{players.length === 1 ? '' : 's'}
        </span>
      </header>

      {status === 'lobby' && (
        <section className="space-y-3">
          <p className="text-slate-600">Waiting for the host to start the game…</p>
          <PlayersList players={players} />
        </section>
      )}

      {status === 'active' && <PlayBoard />}

      {status === 'finished' && results && (
        <ResultsView results={results} personal={personalResults} />
      )}
    </div>
  );
}
