import type { Stars } from '@blind/shared';

interface StarRatingProps {
  value: number;
  onChange?: (value: Stars) => void;
  readOnly?: boolean;
}

const STAR_VALUES: Stars[] = [1, 2, 3, 4, 5];

export function StarRating({ value, onChange, readOnly = false }: StarRatingProps) {
  return (
    <div role="radiogroup" aria-label="Star rating" className="flex gap-1">
      {STAR_VALUES.map((star) => {
        const filled = star <= value;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            disabled={readOnly}
            onClick={() => onChange?.(star)}
            className={[
              'text-2xl leading-none transition',
              filled ? 'text-amber-400' : 'text-slate-300',
              readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
            ].join(' ')}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
