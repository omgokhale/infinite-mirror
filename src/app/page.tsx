'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRun } from '@/hooks/useRun';
import { UploadForm } from '@/components/UploadForm';
import { Filmstrip } from '@/components/Filmstrip';
import { ImageViewer } from '@/components/ImageViewer';
import { Header } from '@/components/Header';
import { createGifFromUrls, downloadBlob } from '@/lib/gif';

export default function Home() {
  const {
    run,
    isLoading,
    isGenerating,
    error,
    selectedIndex,
    comparisonIndex,
    viewMode,
    fastMode,
    createRun,
    loadDemoRun,
    startGeneration,
    setSelectedIndex,
    setComparisonIndex,
    setViewMode,
    setFastMode,
    setAutoAdvance,
    clearRun,
  } = useRun();

  const [isExporting, setIsExporting] = useState(false);
  const [showInitialReveal, setShowInitialReveal] = useState(false);

  const hasRun = !!run;
  const showViewer = run && run.iterations.length > 0;
  const canExport = run && run.iterations.length > 1 && !isExporting;

  // Auto-start generation when run is created
  useEffect(() => {
    if (run && !run.isDemo && run.status === 'idle' && run.iterations.length > 0) {
      startGeneration();
    }
  }, [run, startGeneration]);

  // Keyboard navigation
  useEffect(() => {
    if (!showViewer) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (selectedIndex > 0) {
          setSelectedIndex(selectedIndex - 1);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const maxIndex = run?.iterations.length ? run.iterations.length - 1 : 0;
        if (selectedIndex < maxIndex) {
          setSelectedIndex(selectedIndex + 1);
        }
      } else if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const targetIndex = parseInt(e.key, 10);
        const maxIndex = run?.iterations.length ? run.iterations.length - 1 : 0;
        if (targetIndex <= maxIndex) {
          setSelectedIndex(targetIndex);
        }
      } else if (e.key === '0') {
        e.preventDefault();
        setSelectedIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showViewer, selectedIndex, setSelectedIndex, run?.iterations.length]);

  // Export GIF
  const handleExportGif = useCallback(async () => {
    if (!run || run.iterations.length < 2) return;

    setIsExporting(true);
    try {
      const urls = run.iterations.map(it => it.imageUrl);
      const blob = await createGifFromUrls(urls, {
        width: 512,
        height: 512,
        delay: 400,
        quality: 10,
      });
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      downloadBlob(blob, `infinite-mirror-${timestamp}.gif`);
    } catch (err) {
      console.error('GIF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [run]);

  // Export all images
  const handleExportImages = useCallback(async () => {
    if (!run || run.iterations.length < 1) return;

    setIsExporting(true);
    try {
      for (let i = 0; i < run.iterations.length; i++) {
        const iteration = run.iterations[i];
        const response = await fetch(iteration.imageUrl);
        const blob = await response.blob();
        const index = iteration.index.toString().padStart(2, '0');
        downloadBlob(blob, `infinite-mirror-${index}.png`);
        // Small delay between downloads to not overwhelm the browser
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (err) {
      console.error('Image export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [run]);

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Upload form (shown when no run and not loading) */}
      {!hasRun && !isLoading && (
        <UploadForm
          onUpload={async (file, count) => {
            // Pixel reveal disabled for now (set to true to re-enable)
            setShowInitialReveal(false);
            await createRun(file, count);
          }}
          onDemo={loadDemoRun}
          isLoading={isLoading}
          hasRun={hasRun}
          fastMode={fastMode}
          onFastModeChange={setFastMode}
        />
      )}

      {/* Viewer UI */}
      {showViewer && (
        <>
          <div className="animate-dissolve-in relative z-50">
            <Header
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onClose={clearRun}
              onExportGif={handleExportGif}
              onExportImages={handleExportImages}
              canExport={!!canExport}
            />
          </div>

          {/* Main content area */}
          <div className="flex-1 flex flex-col pt-14 pb-32">
            {/* Error display */}
            {error && (
              <div className="px-4 py-2">
                <p className="text-sm text-red-500 text-center">{error}</p>
              </div>
            )}

            {/* Image viewer */}
            <ImageViewer
              iterations={run.iterations}
              selectedIndex={selectedIndex}
              comparisonIndex={comparisonIndex}
              totalCount={run.iterationCount}
              viewMode={viewMode}
              onSelectIndex={setSelectedIndex}
              showInitialReveal={showInitialReveal}
              onRevealComplete={() => {
                setShowInitialReveal(false);
                setAutoAdvance(true);
                // Jump to latest generated iteration
                if (run && run.iterations.length > 1) {
                  const latestIndex = run.iterations.length - 1;
                  setSelectedIndex(latestIndex);
                }
              }}
            />
          </div>

          {/* Filmstrip - fixed to bottom */}
          <div className="fixed bottom-0 left-0 right-0 pb-4 animate-dissolve-in">
            <Filmstrip
              iterations={run.iterations}
              totalCount={run.iterationCount}
              selectedIndex={selectedIndex}
              comparisonIndex={comparisonIndex}
              viewMode={viewMode}
              onSelect={setSelectedIndex}
              onComparisonSelect={setComparisonIndex}
              currentStep={run.currentStep}
              isGenerating={isGenerating}
            />
          </div>
        </>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
