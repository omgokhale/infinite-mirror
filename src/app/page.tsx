'use client';

import { useRun } from '@/hooks/useRun';
import { UploadForm } from '@/components/UploadForm';
import { Filmstrip } from '@/components/Filmstrip';
import { ImageViewer } from '@/components/ImageViewer';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { GifExport } from '@/components/GifExport';

export default function Home() {
  const {
    run,
    isLoading,
    isGenerating,
    error,
    selectedIndex,
    viewMode,
    fastMode,
    createRun,
    loadDemoRun,
    startGeneration,
    setSelectedIndex,
    setViewMode,
    setFastMode,
    clearRun,
  } = useRun();

  const hasRun = !!run;
  const canGenerate = run && !run.isDemo && run.status === 'idle' && run.iterations.length > 0;
  const showViewer = run && run.iterations.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header when run exists */}
        {hasRun && (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-light tracking-tight">Infinite Mirror</h1>
              {run.isDemo && (
                <span className="text-xs text-neutral-500">Demo Run</span>
              )}
            </div>
            <button
              onClick={clearRun}
              className="text-sm text-neutral-500 hover:text-neutral-900"
            >
              ← Start Over
            </button>
          </div>
        )}

        {/* Upload form (shown when no run) */}
        <UploadForm
          onUpload={createRun}
          onLoadDemo={loadDemoRun}
          isLoading={isLoading}
          hasRun={hasRun}
          fastMode={fastMode}
          onFastModeChange={setFastMode}
        />

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Main viewer */}
        {showViewer && (
          <>
            <ImageViewer
              iterations={run.iterations}
              selectedIndex={selectedIndex}
              viewMode={viewMode}
              onSelectIndex={setSelectedIndex}
              onViewModeChange={setViewMode}
            />

            {/* Progress indicator */}
            <ProgressIndicator
              currentStep={run.currentStep}
              totalSteps={run.iterationCount}
              isGenerating={isGenerating}
            />

            {/* Filmstrip */}
            <Filmstrip
              iterations={run.iterations}
              totalCount={run.iterationCount}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              currentStep={run.currentStep}
              isGenerating={isGenerating}
            />

            {/* Generate button */}
            {canGenerate && (
              <button
                onClick={startGeneration}
                disabled={isGenerating}
                className="w-full py-3 px-4 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                Generate Sequence
              </button>
            )}

            {/* Status messages and actions */}
            {(run.status === 'completed' || run.isDemo) && run.iterations.length > 1 && (
              <div className="flex items-center justify-between">
                {!run.isDemo && (
                  <p className="text-sm text-green-600">
                    Generation complete! Explore the drift.
                  </p>
                )}
                {run.isDemo && <div />}
                <GifExport iterations={run.iterations} disabled={isGenerating} />
              </div>
            )}

            {run.status === 'failed' && (
              <p className="text-center text-sm text-red-600">
                {run.errorMessage || 'Generation failed'}
              </p>
            )}
          </>
        )}

        {/* Footer */}
        <footer className="pt-8 border-t border-neutral-100">
          <p className="text-xs text-neutral-400 text-center">
            Infinite Mirror — Watch AI drift as it recreates images
          </p>
        </footer>
      </div>
    </div>
  );
}
