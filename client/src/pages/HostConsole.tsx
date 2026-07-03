import { useState, type FormEvent } from 'react';
import { MAX_ITEMS, MIN_ITEMS } from '@blind/shared';
import { api } from '../api/client';
import { Button } from '../components/Button';
import { ErrorBanner } from '../components/ErrorBanner';
import { PlayersList } from '../components/PlayersList';
import { ResultsTable } from '../components/ResultsTable';
import { endGame, joinAsHost, startGame } from '../socket/actions';
import { useLiveGame } from '../socket/useLiveGame';
import { useGameStore } from '../store/gameStore';
import { saveHostToken } from '../store/hostStorage';

export function HostConsole() {
  useLiveGame();

  const roomCode = useGameStore((state) => state.roomCode);
  const hostToken = useGameStore((state) => state.hostToken);
  const status = useGameStore((state) => state.status);
  const players = useGameStore((state) => state.players);
  const progress = useGameStore((state) => state.progress);
  const results = useGameStore((state) => state.results);
  const setError = useGameStore((state) => state.setError);
  const reset = useGameStore((state) => state.reset);

  const [creating, setCreating] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [savedSignature, setSavedSignature] = useState<string | null>(null);

  const dirty = JSON.stringify(items) !== savedSignature;
  const canStart = items.length >= MIN_ITEMS && !dirty;

  async function handleCreate() {
    setCreating(true);
    try {
      const game = await api.createGame();
      saveHostToken(game.roomCode, game.hostToken);
      await joinAsHost(game.roomCode, game.hostToken);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not create game');
    } finally {
      setCreating(false);
    }
  }

  function handleAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draft.trim();
    if (!name || items.length >= MAX_ITEMS) return;
    setItems((prev) => [...prev, name]);
    setDraft('');
  }

  async function handleSaveItems() {
    if (!roomCode || !hostToken) return;
    try {
      const view = await api.setItems(roomCode, hostToken, items);
      setSavedSignature(JSON.stringify(view.items.map((item) => item.name)));
      setItems(view.items.map((item) => item.name));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not save items');
    }
  }

  function handleNewGame() {
    reset();
    setItems([]);
    setDraft('');
    setSavedSignature(null);
  }

  // ── No game yet ────────────────────────────────────────────────
  if (!roomCode) {
    return (
      <div className="space-y-4">
        <ErrorBanner />
        <h1 className="text-xl font-bold">Host a game</h1>
        <p className="text-slate-600">Create a room, then add the items players will taste.</p>
        <Button onClick={handleCreate} disabled={creating}>
          {creating ? 'Creating…' : 'Create game'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ErrorBanner />

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Host console</h1>
          <p className="text-sm text-slate-500">Share this room code with players</p>
        </div>
        <span className="rounded-md bg-slate-900 px-4 py-2 font-mono text-lg tracking-widest text-white">
          {roomCode}
        </span>
      </header>

      {/* ── Lobby: set up items and start ──────────────────────── */}
      {status === 'lobby' && (
        <>
          <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="font-semibold">Items to taste</h2>
            <form onSubmit={handleAddItem} className="flex gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="e.g. Coca-Cola"
                aria-label="Item name"
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
              <Button type="submit" variant="secondary" disabled={items.length >= MAX_ITEMS}>
                Add
              </Button>
            </form>
            {items.length > 0 && (
              <ul className="space-y-1">
                {items.map((name, index) => (
                  <li
                    key={`${name}-${index}`}
                    className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span>{name}</span>
                    <button
                      type="button"
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                      className="text-slate-400 hover:text-red-600"
                      aria-label={`Remove ${name}`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-slate-500">
              Add between {MIN_ITEMS} and {MAX_ITEMS} items.
            </p>
            <Button variant="secondary" onClick={handleSaveItems} disabled={items.length < MIN_ITEMS || !dirty}>
              {dirty ? 'Save items' : 'Saved'}
            </Button>
          </section>

          <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="font-semibold">Players</h2>
            <PlayersList players={players} />
          </section>

          <Button onClick={() => void startGame()} disabled={!canStart} className="w-full">
            Start game
          </Button>
        </>
      )}

      {/* ── Active: watch progress, end the game ───────────────── */}
      {status === 'active' && (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">Game in progress</h2>
          <p className="text-slate-600">
            {progress ? `${progress.submitted} of ${progress.total} players finished` : 'Waiting for ratings…'}
          </p>
          <PlayersList players={players} />
          <Button onClick={() => void endGame()} className="w-full">
            End game &amp; reveal results
          </Button>
        </section>
      )}

      {/* ── Finished: results ──────────────────────────────────── */}
      {status === 'finished' && results && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Results</h2>
          <ResultsTable results={results} />
          <Button variant="secondary" onClick={handleNewGame}>
            Start a new game
          </Button>
        </section>
      )}
    </div>
  );
}
