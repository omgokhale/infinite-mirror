'use client';

import { useRef, useEffect } from 'react';
import type { IterationWithUrl } from '@/lib/types';

interface FilmstripProps {
  iterations: IterationWithUrl[];
  totalCount: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
  currentStep: number;
  isGenerating: boolean;
}

export function Filmstrip({
  iterations,
  totalCount,
  selectedIndex,
  onSelect,
  currentStep,
  isGenerating,
}: FilmstripProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedRef.current && containerRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selectedIndex]);

  const slots = Array.from({ length: totalCount }, (_, i) => {
    const iteration = iterations.find(it => it.index === i);
    return { index: i, iteration };
  });

  return (
    <div
      ref={containerRef}
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-300"
    >
      {slots.map(({ index, iteration }) => {
        const isSelected = index === selectedIndex;
        const isCompleted = !!iteration;
        const isCurrentlyGenerating = isGenerating && index === currentStep + 1;
        const isPending = !isCompleted && !isCurrentlyGenerating;

        return (
          <button
            key={index}
            ref={isSelected ? selectedRef : null}
            onClick={() => isCompleted && onSelect(index)}
            disabled={!isCompleted}
            className={`
              relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all
              ${isSelected ? 'border-neutral-900 ring-2 ring-neutral-900/20' : 'border-transparent'}
              ${isCompleted ? 'cursor-pointer hover:border-neutral-400' : 'cursor-default'}
              ${isPending ? 'bg-neutral-100' : ''}
            `}
          >
            {isCompleted && iteration && (
              <img
                src={iteration.imageUrl}
                alt={`Iteration ${index}`}
                className="w-full h-full object-cover"
              />
            )}

            {isCurrentlyGenerating && (
              <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
              </div>
            )}

            {isPending && (
              <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
                <div className="w-2 h-2 bg-neutral-300 rounded-full" />
              </div>
            )}

            <div className={`
              absolute bottom-0 left-0 right-0 text-center text-xs py-0.5
              ${isSelected ? 'bg-neutral-900 text-white' : 'bg-white/80 text-neutral-600'}
            `}>
              {index === 0 ? 'Original' : index}
            </div>
          </button>
        );
      })}
    </div>
  );
}
