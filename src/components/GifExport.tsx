'use client';

import { useState, useCallback } from 'react';
import type { IterationWithUrl } from '@/lib/types';
import { createGifFromUrls, downloadBlob } from '@/lib/gif';

interface GifExportProps {
  iterations: IterationWithUrl[];
  disabled?: boolean;
}

export function GifExport({ iterations, disabled }: GifExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = useCallback(async () => {
    if (iterations.length < 2) return;

    setIsExporting(true);
    setProgress(0);

    try {
      const urls = iterations.map(it => it.imageUrl);

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
      alert('Failed to export GIF. Please try again.');
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, [iterations]);

  if (iterations.length < 2) {
    return null;
  }

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isExporting}
      className="flex items-center gap-2 py-2 px-4 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50 transition-colors disabled:opacity-50"
    >
      {isExporting ? (
        <>
          <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <span>Download GIF</span>
        </>
      )}
    </button>
  );
}
