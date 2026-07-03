import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROOM_CODE_LENGTH } from '@blind/shared';
import { Button } from '../components/Button';

export function Landing() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const trimmed = code.trim().toUpperCase();

  function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (trimmed.length === ROOM_CODE_LENGTH) {
      navigate(`/play/${trimmed}`);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold">Blind tasting, scored together</h1>
        <p className="mt-2 text-slate-600">
          Host a tasting session or join one with a room code, then match and rate each item.
        </p>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Host a game</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create a room and enter the items to be tasted.
          </p>
          <Button onClick={() => navigate('/host')} className="mt-4">
            Host a game
          </Button>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Join a game</h2>
          <p className="mt-1 text-sm text-slate-500">Enter the room code from your host.</p>
          <form onSubmit={handleJoin} className="mt-4 flex gap-2">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              maxLength={ROOM_CODE_LENGTH}
              placeholder="ROOM CODE"
              aria-label="Room code"
              className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono uppercase tracking-widest"
            />
            <Button type="submit" variant="secondary" disabled={trimmed.length !== ROOM_CODE_LENGTH}>
              Join
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
