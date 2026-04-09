'use client';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  isGenerating: boolean;
}

export function ProgressIndicator({
  currentStep,
  totalSteps,
  isGenerating,
}: ProgressIndicatorProps) {
  if (!isGenerating) return null;

  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-600">
          Generating image {currentStep + 1} of {totalSteps - 1}...
        </span>
        <span className="text-neutral-400">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-neutral-900 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
