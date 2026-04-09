'use client';

import type { IterationWithUrl, ViewMode } from '@/lib/types';
import { ComparisonSlider } from './ComparisonSlider';
import { SideBySide } from './SideBySide';
import { PixelReveal } from './PixelReveal';

interface ImageViewerProps {
  iterations: IterationWithUrl[];
  selectedIndex: number;
  comparisonIndex: number | null;
  totalCount: number;
  viewMode: ViewMode;
  onSelectIndex: (index: number) => void;
  showInitialReveal?: boolean;
  onRevealComplete?: () => void;
}

export function ImageViewer({
  iterations,
  selectedIndex,
  comparisonIndex,
  totalCount,
  viewMode,
  onSelectIndex,
  showInitialReveal = false,
  onRevealComplete,
}: ImageViewerProps) {
  // Find selected iteration, or fall back to the last available if index doesn't exist yet
  let selectedIteration = iterations.find(it => it.index === selectedIndex);
  if (!selectedIteration && iterations.length > 0) {
    // Index doesn't exist yet (state sync issue) - show last available
    selectedIteration = iterations[iterations.length - 1];
  }

  // For comparison modes: use comparisonIndex if set, otherwise fall back to defaults
  const getComparisonIteration = () => {
    if (comparisonIndex !== null) {
      return iterations.find(it => it.index === comparisonIndex);
    }
    // Default behavior based on view mode
    if (viewMode === 'vs-previous') {
      return iterations.find(it => it.index === selectedIndex - 1);
    }
    if (viewMode === 'vs-original') {
      return iterations.find(it => it.index === 0);
    }
    return null;
  };

  const comparisonIteration = getComparisonIteration();

  const canGoPrev = selectedIndex > 0;
  const canGoNext = selectedIndex < iterations.length - 1;

  const handlePrev = () => {
    if (canGoPrev) onSelectIndex(selectedIndex - 1);
  };

  const handleNext = () => {
    if (canGoNext) onSelectIndex(selectedIndex + 1);
  };

  // Format labels for comparison views
  const currentDisplay = selectedIndex.toString().padStart(2, '0');
  const comparisonDisplay = comparisonIteration
    ? comparisonIteration.index.toString().padStart(2, '0')
    : '00';

  if (!selectedIteration) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-white/30">Select an iteration</p>
      </div>
    );
  }

  // Determine which image goes on left vs right (lower index on left)
  const getOrderedImages = () => {
    if (!comparisonIteration) return null;

    if (comparisonIteration.index < selectedIndex) {
      return {
        left: comparisonIteration,
        right: selectedIteration,
        leftLabel: comparisonDisplay,
        rightLabel: currentDisplay,
      };
    } else {
      return {
        left: selectedIteration,
        right: comparisonIteration,
        leftLabel: currentDisplay,
        rightLabel: comparisonDisplay,
      };
    }
  };

  const orderedImages = getOrderedImages();

  return (
    <div className="flex-1 flex items-center justify-center relative">
      {/* Invisible click zones for navigation */}
      <button
        onClick={handlePrev}
        disabled={!canGoPrev}
        className={`absolute left-0 top-0 w-1/2 h-full z-10 ${canGoPrev ? 'cursor-w-resize' : 'cursor-default'}`}
        aria-label="Previous"
      />
      <button
        onClick={handleNext}
        disabled={!canGoNext}
        className={`absolute right-0 top-0 w-1/2 h-full z-10 ${canGoNext ? 'cursor-e-resize' : 'cursor-default'}`}
        aria-label="Next"
      />

      {/* Main content area */}
      <div className="flex flex-col items-center gap-4 w-full max-w-3xl pointer-events-none">
        {/* Image viewer */}
        <div className="w-full">
          {viewMode === 'current' && (
            <div className="w-full flex items-center justify-center max-h-[60vh]">
              {showInitialReveal && selectedIndex === 0 ? (
                <PixelReveal
                  src={selectedIteration.imageUrl}
                  alt={`Iteration ${selectedIndex}`}
                  className="w-full h-[60vh] flex items-center justify-center"
                  duration={5000}
                  onRevealComplete={onRevealComplete}
                />
              ) : (
                <img
                  src={selectedIteration.imageUrl}
                  alt={`Iteration ${selectedIndex}`}
                  className="max-w-full max-h-[60vh] object-contain"
                />
              )}
            </div>
          )}

          {viewMode === 'vs-previous' && orderedImages && (
            <div className="pointer-events-auto relative z-20">
              <ComparisonSlider
                leftImage={orderedImages.left.imageUrl}
                rightImage={orderedImages.right.imageUrl}
                leftLabel={orderedImages.leftLabel}
                rightLabel={orderedImages.rightLabel}
              />
            </div>
          )}

          {viewMode === 'vs-previous' && !orderedImages && (
            <div className="w-full flex items-center justify-center">
              <img
                src={selectedIteration.imageUrl}
                alt={`Iteration ${selectedIndex}`}
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>
          )}

          {viewMode === 'vs-original' && orderedImages && (
            <SideBySide
              leftImage={orderedImages.left.imageUrl}
              rightImage={orderedImages.right.imageUrl}
              leftLabel={orderedImages.leftLabel}
              rightLabel={orderedImages.rightLabel}
            />
          )}

          {viewMode === 'vs-original' && !orderedImages && (
            <div className="w-full flex items-center justify-center">
              <img
                src={selectedIteration.imageUrl}
                alt="Original"
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
