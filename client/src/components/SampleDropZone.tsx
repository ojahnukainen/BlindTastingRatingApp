import { useDroppable } from '@dnd-kit/core';
import type { OptionChip, PublicSample, Stars } from '@blind/shared';
import { StarRating } from './StarRating';

interface SampleDropZoneProps {
  sample: PublicSample;
  assignedOption: OptionChip | null;
  stars: number;
  onRate: (value: Stars) => void;
}

export function SampleDropZone({ sample, assignedOption, stars, onRate }: SampleDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: sample.id });

  return (
    <div
      className={[
        'rounded-lg border-2 p-4 transition',
        isOver ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white',
      ].join(' ')}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold">{sample.label}</span>
        <StarRating value={stars} onChange={onRate} />
      </div>
      <div
        ref={setNodeRef}
        className="mt-3 flex min-h-12 items-center justify-center rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm"
      >
        {assignedOption ? (
          <span className="font-medium">{assignedOption.name}</span>
        ) : (
          <span className="text-slate-400">Drag your guess here</span>
        )}
      </div>
    </div>
  );
}
