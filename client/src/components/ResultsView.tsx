import { useState } from 'react';
import type { GameResults, PlayerResults } from '@blind/shared';
import { MyResultsTable } from './MyResultsTable';
import { ResultsTable } from './ResultsTable';

type Tab = 'mine' | 'room';

interface ResultsViewProps {
  results: GameResults;
  personal: PlayerResults | null;
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-md px-4 py-2 text-sm font-semibold transition',
        active ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:text-slate-900',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export function ResultsView({ results, personal }: ResultsViewProps) {
  // Players default to their own breakdown; with no personal data (e.g. host) show the room.
  const [tab, setTab] = useState<Tab>(personal ? 'mine' : 'room');

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Results</h2>
        {personal && (
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
            <TabButton active={tab === 'mine'} onClick={() => setTab('mine')}>
              My results
            </TabButton>
            <TabButton active={tab === 'room'} onClick={() => setTab('room')}>
              Room results
            </TabButton>
          </div>
        )}
      </div>

      {tab === 'mine' && personal ? (
        <MyResultsTable results={personal} />
      ) : (
        <ResultsTable results={results} />
      )}
    </section>
  );
}
