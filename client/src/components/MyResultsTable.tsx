import type { PlayerResults } from '@blind/shared';
import { StarRating } from './StarRating';

export function MyResultsTable({ results }: { results: PlayerResults }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <div>
          <p className="text-2xl font-bold">
            {results.correctCount}/{results.totalSamples}
          </p>
          <p className="text-slate-500">guessed correctly</p>
        </div>
        <div>
          <p className="text-2xl font-bold">
            {results.averageStarsGiven === null ? '—' : results.averageStarsGiven.toFixed(1)}
          </p>
          <p className="text-slate-500">avg stars you gave</p>
        </div>
      </div>

      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {results.ratings.map((rating) => (
          <li key={rating.label} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="font-semibold">{rating.itemName}</p>
              <p className="text-xs text-slate-500">
                {rating.label} · your guess:{' '}
                <span className={rating.correct ? 'text-emerald-600' : 'text-slate-600'}>
                  {rating.guessedName ?? 'no guess'}
                </span>{' '}
                {rating.guessedName && (rating.correct ? '✓' : '✗')}
              </p>
            </div>
            <StarRating value={Math.round(rating.stars ?? 0)} readOnly />
          </li>
        ))}
      </ul>
    </div>
  );
}
