'use client';

import type { IterationWithUrl, ViewMode } from '@/lib/types';
import { ComparisonSlider } from './ComparisonSlider';
import { SideBySide } from './SideBySide';
import { GridView } from './GridView';

interface ImageViewerProps {
  iterations: IterationWithUrl[];
  selectedIndex: number;
  viewMode: ViewMode;
  onSelectIndex: (index: number) => void;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ImageViewer({
  iterations,
  selectedIndex,
  viewMode,
  onSelectIndex,
  onViewModeChange,
}: ImageViewerProps) {
  const selectedIteration = iterations.find(it => it.index === selectedIndex);
  const previousIteration = iterations.find(it => it.index === selectedIndex - 1);
  const originalIteration = iterations.find(it => it.index === 0);

  if (!selectedIteration) {
    return (
      <div className="aspect-square bg-neutral-100 rounded-lg flex items-center justify-center">
        <p className="text-neutral-400">Select an iteration</p>
      </div>
    );
  }

  const viewModes: { mode: ViewMode; label: string; disabled?: boolean }[] = [
    { mode: 'current', label: 'Current' },
    { mode: 'vs-previous', label: 'Vs Previous', disabled: selectedIndex === 0 },
    { mode: 'vs-original', label: 'Vs Original', disabled: selectedIndex === 0 },
    { mode: 'grid', label: 'Grid' },
  ];

  return (
    <div className="space-y-4">
      {/* View mode tabs */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg">
        {viewModes.map(({ mode, label, disabled }) => (
          <button
            key={mode}
            onClick={() => !disabled && onViewModeChange(mode)}
            disabled={disabled}
            className={`
              flex-1 py-2 px-3 text-sm rounded-md transition-colors
              ${viewMode === mode
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
              }
              ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main viewer */}
      <div className="w-full">
        {viewMode === 'current' && (
          <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden">
            <img
              src={selectedIteration.imageUrl}
              alt={`Iteration ${selectedIndex}`}
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {viewMode === 'vs-previous' && previousIteration && (
          <ComparisonSlider
            leftImage={previousIteration.imageUrl}
            rightImage={selectedIteration.imageUrl}
            leftLabel={previousIteration.index === 0 ? 'Original' : `#${previousIteration.index}`}
            rightLabel={`#${selectedIteration.index}`}
          />
        )}

        {viewMode === 'vs-original' && originalIteration && selectedIndex !== 0 && (
          <SideBySide
            leftImage={originalIteration.imageUrl}
            rightImage={selectedIteration.imageUrl}
            leftLabel="Original"
            rightLabel={`#${selectedIteration.index}`}
          />
        )}

        {viewMode === 'grid' && (
          <GridView
            iterations={iterations}
            selectedIndex={selectedIndex}
            onSelect={onSelectIndex}
          />
        )}
      </div>

      {/* Current selection label */}
      {viewMode !== 'grid' && (
        <p className="text-center text-sm text-neutral-500">
          {selectedIndex === 0 ? 'Original Image' : `Iteration ${selectedIndex} of ${iterations.length - 1}`}
        </p>
      )}
    </div>
  );
}
