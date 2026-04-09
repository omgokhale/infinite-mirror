'use client';

import type { IterationWithUrl } from '@/lib/types';

interface GridViewProps {
  iterations: IterationWithUrl[];
  onSelect: (index: number) => void;
  selectedIndex: number;
}

export function GridView({ iterations, onSelect, selectedIndex }: GridViewProps) {
  const columns = iterations.length <= 4 ? 2 : iterations.length <= 9 ? 3 : 4;

  return (
    <div
      className="grid gap-2 w-full"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {iterations.map((iteration) => (
        <button
          key={iteration.id}
          onClick={() => onSelect(iteration.index)}
          className={`
            relative aspect-square bg-neutral-100 rounded-lg overflow-hidden
            border-2 transition-all
            ${iteration.index === selectedIndex
              ? 'border-neutral-900 ring-2 ring-neutral-900/20'
              : 'border-transparent hover:border-neutral-300'
            }
          `}
        >
          <img
            src={iteration.imageUrl}
            alt={`Iteration ${iteration.index}`}
            className="w-full h-full object-contain"
          />
          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-xs rounded">
            {iteration.index === 0 ? 'Original' : `#${iteration.index}`}
          </div>
        </button>
      ))}
    </div>
  );
}
