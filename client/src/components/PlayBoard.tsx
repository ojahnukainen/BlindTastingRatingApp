import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Stars } from '@blind/shared';
import { submitRating } from '../socket/actions';
import { useGameStore } from '../store/gameStore';
import { Button } from './Button';
import { DraggableOption } from './DraggableOption';
import { SampleDropZone } from './SampleDropZone';

export function PlayBoard() {
  const samples = useGameStore((state) => state.samples);
  const options = useGameStore((state) => state.options);

  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [stars, setStars] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const optionById = useMemo(() => new Map(options.map((option) => [option.id, option])), [options]);
  const assignedIds = new Set(Object.values(assignments));
  const pool = options.filter((option) => !assignedIds.has(option.id));
  const allRated = samples.length > 0 && samples.every((sample) => (stars[sample.id] ?? 0) > 0);

  function handleDragEnd(event: DragEndEvent) {
    const optionId = String(event.active.id);
    const sampleId = event.over ? String(event.over.id) : null;
    setAssignments((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (next[key] === optionId) delete next[key];
      }
      if (sampleId) next[sampleId] = optionId;
      return next;
    });
  }

  async function handleSubmit() {
    for (const sample of samples) {
      const value = stars[sample.id];
      if (!value) continue;
      const ok = await submitRating({
        sampleId: sample.id,
        guessedItemId: assignments[sample.id] ?? null,
        stars: value as Stars,
      });
      if (!ok) return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-lg font-semibold">Thanks for rating! 🎉</p>
        <p className="mt-1 text-sm text-slate-500">Waiting for the host to reveal the results…</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        <div className="grid gap-3">
          {samples.map((sample) => {
            const assignedId = assignments[sample.id];
            return (
              <SampleDropZone
                key={sample.id}
                sample={sample}
                assignedOption={assignedId ? (optionById.get(assignedId) ?? null) : null}
                stars={stars[sample.id] ?? 0}
                onRate={(value) => setStars((prev) => ({ ...prev, [sample.id]: value }))}
              />
            );
          })}
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-sm font-medium text-slate-600">
            Options — drag each onto the sample you think it is
          </p>
          <div className="flex flex-wrap gap-2">
            {pool.length === 0 ? (
              <span className="text-sm text-slate-400">All options placed</span>
            ) : (
              pool.map((option) => <DraggableOption key={option.id} option={option} />)
            )}
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={!allRated} className="w-full">
          Submit ratings
        </Button>
      </div>
    </DndContext>
  );
}
