'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { IterationWithUrl, ViewMode } from '@/lib/types';
import { LoadingTile } from './LoadingTile';

interface FilmstripProps {
  iterations: IterationWithUrl[];
  totalCount: number;
  selectedIndex: number;
  comparisonIndex: number | null;
  viewMode: ViewMode;
  onSelect: (index: number) => void;
  onComparisonSelect: (index: number | null) => void;
  currentStep: number;
  isGenerating: boolean;
}

export function Filmstrip({
  iterations,
  totalCount,
  selectedIndex,
  comparisonIndex,
  viewMode,
  onSelect,
  onComparisonSelect,
  currentStep,
  isGenerating,
}: FilmstripProps) {
  // Compute effective comparison index (user-selected or default based on view mode)
  const getEffectiveComparisonIndex = (): number | null => {
    if (comparisonIndex !== null) return comparisonIndex;
    if (viewMode === 'vs-previous' && selectedIndex > 0) return selectedIndex - 1;
    if (viewMode === 'vs-original' && selectedIndex > 0) return 0;
    return null;
  };
  const effectiveComparisonIndex = getEffectiveComparisonIndex();
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

  const handleClick = useCallback((e: React.MouseEvent, index: number, isCompleted: boolean) => {
    if (!isCompleted) return;

    if (e.shiftKey) {
      // Shift+click sets comparison index
      if (comparisonIndex === index) {
        // Clicking the same comparison index clears it
        onComparisonSelect(null);
      } else {
        onComparisonSelect(index);
      }
    } else {
      // Regular click sets primary selection
      onSelect(index);
    }
  }, [comparisonIndex, onSelect, onComparisonSelect]);

  const slots = Array.from({ length: totalCount }, (_, i) => {
    const iteration = iterations.find(it => it.index === i);
    return { index: i, iteration };
  });

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto py-4 scrollbar-none"
    >
      <div className="group inline-flex gap-2 px-4 min-w-full justify-center">
        {slots.map(({ index, iteration }) => {
        const isSelected = index === selectedIndex;
        const isComparison = index === effectiveComparisonIndex && index !== selectedIndex;
        const isCompleted = !!iteration;
        const isCurrentlyGenerating = isGenerating && index === currentStep + 1;
        const isPending = !isCompleted && !isCurrentlyGenerating;

        return (
          <div key={index} className="flex flex-col items-center gap-2 flex-shrink-0 transition-opacity duration-300 group-hover:opacity-70 hover:!opacity-100">
            <button
              ref={isSelected ? selectedRef : null}
              onClick={(e) => handleClick(e, index, isCompleted)}
              disabled={!isCompleted}
              className={`
                relative flex-shrink-0 w-10 h-10 overflow-hidden transition-all duration-300 ease-out
                ${isCompleted ? 'cursor-pointer' : 'cursor-default'}
              `}
              style={{ borderRadius: isSelected ? '50%' : '0' }}
            >
              {isCompleted && iteration && (
                <img
                  src={iteration.imageUrl}
                  alt={`Iteration ${index}`}
                  className="w-full h-full object-cover"
                />
              )}

              {isCurrentlyGenerating && (() => {
                // Get previous iteration's image for the loading effect
                const prevIteration = iterations.find(it => it.index === currentStep);
                return prevIteration ? (
                  <div className="absolute inset-0">
                    <LoadingTile previousImageUrl={prevIteration.imageUrl} size={40} />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-lg flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                );
              })()}

              {isPending && (
                <div className="absolute inset-0 bg-white/[0.06] backdrop-blur-lg" />
              )}
            </button>

            {/* Selection indicator dot */}
            <div className="flex justify-center w-10 h-1.5">
              {isSelected && (
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
              {isComparison && (
                <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
