import { useDraggable } from '@dnd-kit/core';
import type { OptionChip } from '@blind/shared';

export function DraggableOption({ option }: { option: OptionChip }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: option.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      {...listeners}
      {...attributes}
      className={[
        'cursor-grab touch-none rounded-full border border-slate-300 bg-white px-4 py-2',
        'text-sm font-medium shadow-sm active:cursor-grabbing',
        isDragging ? 'opacity-50' : 'hover:border-slate-400',
      ].join(' ')}
    >
      {option.name}
    </button>
  );
}
