'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Run, RunWithIterations, IterationWithUrl, ViewMode } from '@/lib/types';
import {
  createRun as dbCreateRun,
  updateRun as dbUpdateRun,
  createIteration,
  getRunWithIterations,
  deleteRun,
  blobToBase64,
  base64ToBlob,
  getImageDimensions,
  getBestImageSize,
  preloadImage,
} from '@/lib/db';
import type { ImageSize } from '@/lib/types';
import { DEFAULT_ITERATION_COUNT, GENERATION_PROMPT } from '@/lib/constants';

interface UseRunState {
  run: RunWithIterations | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  selectedIndex: number;
  comparisonIndex: number | null;
  viewMode: ViewMode;
  fastMode: boolean;
  autoAdvanceEnabled: boolean;
}

interface UseRunActions {
  createRun: (file: File, iterationCount?: number) => Promise<void>;
  loadRun: (runId: string) => Promise<void>;
  loadDemoRun: () => Promise<void>;
  startGeneration: () => Promise<void>;
  setSelectedIndex: (index: number) => void;
  setComparisonIndex: (index: number | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setFastMode: (fast: boolean) => void;
  setAutoAdvance: (enabled: boolean) => void;
  clearRun: () => Promise<void>;
}

export function useRun(): UseRunState & UseRunActions {
  const [run, setRun] = useState<RunWithIterations | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [comparisonIndex, setComparisonIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('current');
  const [imageSize, setImageSize] = useState<ImageSize>('1024x1024');
  const [fastMode, setFastMode] = useState(false);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  const autoAdvanceRef = useRef(true);

  // Keep ref in sync with state for use in async callbacks
  useEffect(() => {
    autoAdvanceRef.current = autoAdvanceEnabled;
  }, [autoAdvanceEnabled]);

  const refreshRun = useCallback(async (runId: string): Promise<RunWithIterations | null> => {
    const updated = await getRunWithIterations(runId);
    if (updated) {
      setRun(updated);
      return updated;
    }
    return null;
  }, []);

  const createRun = useCallback(async (file: File, iterationCount = DEFAULT_ITERATION_COUNT) => {
    setIsLoading(true);
    setError(null);

    try {
      const run = await dbCreateRun(iterationCount);

      const blob = new Blob([await file.arrayBuffer()], { type: file.type });

      // Detect image dimensions and set appropriate size
      const dimensions = await getImageDimensions(blob);
      const bestSize = getBestImageSize(dimensions.width, dimensions.height);
      setImageSize(bestSize);

      await createIteration(run.id, 0, blob);

      await dbUpdateRun({ id: run.id, status: 'idle', currentStep: 0 });
      await refreshRun(run.id);
      setSelectedIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create run');
    } finally {
      setIsLoading(false);
    }
  }, [refreshRun]);

  const loadRun = useCallback(async (runId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const loaded = await getRunWithIterations(runId);
      if (loaded) {
        setRun(loaded);
        setSelectedIndex(0);
      } else {
        setError('Run not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load run');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDemoRun = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const manifestRes = await fetch('/demo/run.json');
      if (!manifestRes.ok) {
        throw new Error('Demo not available');
      }
      const manifest = await manifestRes.json();

      const iterations: IterationWithUrl[] = [];
      for (let i = 0; i < manifest.images.length; i++) {
        iterations.push({
          id: `demo-iteration-${i}`,
          runId: 'demo-run',
          index: i,
          status: 'completed',
          createdAt: manifest.createdAt,
          imageUrl: `/demo/${manifest.images[i]}`,
        });
      }

      const demoRun: RunWithIterations = {
        id: 'demo-run',
        createdAt: manifest.createdAt,
        status: 'completed',
        iterationCount: manifest.iterationCount,
        currentStep: manifest.iterationCount - 1,
        isDemo: true,
        iterations,
      };

      setRun(demoRun);
      setSelectedIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load demo');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateNextIteration = useCallback(async (
    runId: string,
    currentIndex: number,
    inputImageUrl: string,
    size: ImageSize,
    useFastMode: boolean
  ): Promise<boolean> => {
    try {
      let imageBase64: string;

      if (inputImageUrl.startsWith('/demo/')) {
        const res = await fetch(inputImageUrl);
        const blob = await res.blob();
        imageBase64 = await blobToBase64(blob);
      } else {
        const res = await fetch(inputImageUrl);
        const blob = await res.blob();
        imageBase64 = await blobToBase64(blob);
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          prompt: GENERATION_PROMPT,
          size,
          fastMode: useFastMode,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const outputBlob = base64ToBlob(data.imageBase64);
      await createIteration(runId, currentIndex + 1, outputBlob);
      await dbUpdateRun({ id: runId, currentStep: currentIndex + 1 });

      return true;
    } catch (err) {
      console.error('Generation error:', err);
      return false;
    }
  }, []);

  const startGeneration = useCallback(async () => {
    if (!run || run.isDemo || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      await dbUpdateRun({ id: run.id, status: 'running' });
      await refreshRun(run.id);

      const totalGenerations = run.iterationCount - 1;

      for (let i = run.currentStep; i < totalGenerations; i++) {
        const currentRun = await getRunWithIterations(run.id);
        if (!currentRun) break;

        const inputIteration = currentRun.iterations.find(it => it.index === i);
        if (!inputIteration) {
          throw new Error(`Missing iteration ${i}`);
        }

        const success = await generateNextIteration(run.id, i, inputIteration.imageUrl, imageSize, fastMode);

        if (!success) {
          await dbUpdateRun({
            id: run.id,
            status: 'failed',
            errorMessage: `Failed at iteration ${i + 1}`,
          });
          await refreshRun(run.id);
          setError(`Generation failed at iteration ${i + 1}`);
          return;
        }

        // Refresh and get the updated run with the new iteration
        const updatedRun = await refreshRun(run.id);

        // Only auto-advance if enabled (disabled during initial pixel reveal)
        if (autoAdvanceRef.current) {
          // Preload the new image before auto-advancing to avoid showing empty gray square
          const newIteration = updatedRun?.iterations.find(it => it.index === i + 1);
          if (newIteration) {
            try {
              await preloadImage(newIteration.imageUrl);
            } catch {
              // If preload fails, still advance (image will load eventually)
            }
          }
          setSelectedIndex(i + 1); // Auto-advance to the newly generated image
        }
      }

      await dbUpdateRun({ id: run.id, status: 'completed' });
      await refreshRun(run.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      if (run) {
        await dbUpdateRun({ id: run.id, status: 'failed' });
        await refreshRun(run.id);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [run, isGenerating, refreshRun, generateNextIteration, imageSize, fastMode]);

  const clearRun = useCallback(async () => {
    if (run && !run.isDemo) {
      await deleteRun(run.id);
    }
    setRun(null);
    setSelectedIndex(0);
    setComparisonIndex(null);
    setError(null);
  }, [run]);

  return {
    run,
    isLoading,
    isGenerating,
    error,
    selectedIndex,
    comparisonIndex,
    viewMode,
    fastMode,
    autoAdvanceEnabled,
    createRun,
    loadRun,
    loadDemoRun,
    startGeneration,
    setSelectedIndex,
    setComparisonIndex,
    setViewMode,
    setFastMode,
    setAutoAdvance: setAutoAdvanceEnabled,
    clearRun,
  };
}
