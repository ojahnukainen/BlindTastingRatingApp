import type { GameResults } from '@blind/shared';
import { StarRating } from './StarRating';

function formatPercent(value: number | null): string {
  return value === null ? '—' : `${Math.round(value * 100)}%`;
}

export function ResultsTable({ results }: { results: GameResults }) {
  const ranked = [...results.items].sort(
    (a, b) => (b.averageStars ?? 0) - (a.averageStars ?? 0),
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        {results.totalPlayers} player{results.totalPlayers === 1 ? '' : 's'} ·{' '}
        {results.submissionsCount} rating{results.submissionsCount === 1 ? '' : 's'}
      </p>
      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {ranked.map((item) => (
          <li key={item.itemId} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-xs text-slate-500">
                {item.label} · guessed correctly by {formatPercent(item.guessAccuracy)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StarRating value={Math.round(item.averageStars ?? 0)} readOnly />
              <span className="w-10 text-right text-sm font-medium">
                {item.averageStars === null ? '—' : item.averageStars.toFixed(1)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
