'use client';

import { useState, useRef, useCallback } from 'react';
import {
  DEFAULT_ITERATION_COUNT,
  MIN_ITERATION_COUNT,
  MAX_ITERATION_COUNT,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  ACCEPTED_IMAGE_TYPES,
} from '@/lib/constants';

interface UploadFormProps {
  onUpload: (file: File, iterationCount: number) => Promise<void>;
  onLoadDemo: () => void;
  isLoading: boolean;
  hasRun: boolean;
}

export function UploadForm({ onUpload, onLoadDemo, isLoading, hasRun }: UploadFormProps) {
  const [iterationCount, setIterationCount] = useState(DEFAULT_ITERATION_COUNT);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return 'Please upload a PNG, JPEG, or WebP image';
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`;
    }
    return null;
  }, []);

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    await onUpload(file, iterationCount);
  }, [validateFile, onUpload, iterationCount]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (hasRun) {
    return null;
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-light tracking-tight">Infinite Mirror</h1>
        <p className="text-neutral-500 text-sm">
          Watch AI drift as it tries to faithfully recreate an image, over and over
        </p>
      </div>

      <button
        onClick={onLoadDemo}
        disabled={isLoading}
        className="w-full py-3 px-4 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50 transition-colors disabled:opacity-50"
      >
        View Demo
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-neutral-400">or upload your own</span>
        </div>
      </div>

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${dragActive ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-300 hover:border-neutral-400'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={handleFileInput}
          disabled={isLoading}
          className="hidden"
        />
        <div className="space-y-2">
          <div className="text-4xl">📷</div>
          <p className="text-sm text-neutral-600">
            {dragActive ? 'Drop image here' : 'Click or drag an image'}
          </p>
          <p className="text-xs text-neutral-400">
            PNG, JPEG, or WebP up to {MAX_FILE_SIZE_MB}MB
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      <div className="flex items-center justify-center gap-4">
        <label className="text-sm text-neutral-600">Iterations:</label>
        <input
          type="range"
          min={MIN_ITERATION_COUNT}
          max={MAX_ITERATION_COUNT}
          value={iterationCount}
          onChange={(e) => setIterationCount(Number(e.target.value))}
          disabled={isLoading}
          className="w-32"
        />
        <span className="text-sm font-medium w-8 text-center">{iterationCount}</span>
      </div>

      <p className="text-xs text-neutral-400 text-center">
        1 original + {iterationCount - 1} AI recreations
      </p>
    </div>
  );
}
