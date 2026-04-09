'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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
  fastMode: boolean;
  onFastModeChange: (enabled: boolean) => void;
}

export function UploadForm({ onUpload, onLoadDemo, isLoading, hasRun, fastMode, onFastModeChange }: UploadFormProps) {
  const [iterationCount, setIterationCount] = useState(DEFAULT_ITERATION_COUNT);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const startWebcam = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setWebcamStream(stream);
      setShowWebcam(true);
      setWebcamReady(false);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera access and try again.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError(`Camera error: ${err.message}`);
        }
      }
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    setShowWebcam(false);
    setWebcamReady(false);
  }, [webcamStream]);

  const captureWebcam = useCallback(async () => {
    if (!videoRef.current || !webcamReady) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError('Failed to capture image');
        return;
      }

      const file = new File([blob], 'webcam-capture.png', { type: 'image/png' });
      stopWebcam();
      await handleFile(file);
    }, 'image/png', 0.95);
  }, [webcamReady, stopWebcam, handleFile]);

  // Attach stream to video element when it changes
  useEffect(() => {
    if (videoRef.current && webcamStream) {
      videoRef.current.srcObject = webcamStream;
    }
  }, [webcamStream]);

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [webcamStream]);

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
        disabled={isLoading || showWebcam}
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

      {showWebcam ? (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-neutral-900">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => setWebcamReady(true)}
              className="w-full aspect-video object-cover"
            />
            {!webcamReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white text-sm">Starting camera...</p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={stopWebcam}
              className="flex-1 py-3 px-4 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={captureWebcam}
              disabled={!webcamReady || isLoading}
              className="flex-1 py-3 px-4 bg-neutral-900 text-white rounded-lg text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              Capture
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
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
              <div className="text-4xl">🖼️</div>
              <p className="text-sm text-neutral-600">
                {dragActive ? 'Drop image here' : 'Click or drag an image'}
              </p>
              <p className="text-xs text-neutral-400">
                PNG, JPEG, or WebP up to {MAX_FILE_SIZE_MB}MB
              </p>
            </div>
          </div>
          <button
            onClick={startWebcam}
            disabled={isLoading}
            className="w-full py-3 px-4 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>📷</span>
            <span>Use Webcam</span>
          </button>
        </div>
      )}

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

      <label className="flex items-center justify-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={fastMode}
          onChange={(e) => onFastModeChange(e.target.checked)}
          disabled={isLoading}
          className="w-4 h-4 rounded border-neutral-300"
        />
        <span className="text-sm text-neutral-600">Fast Mode</span>
        <span className="text-xs text-neutral-400">(~2x faster, more drift)</span>
      </label>

      <p className="text-xs text-neutral-400 text-center">
        1 original + {iterationCount - 1} AI recreations
      </p>
    </div>
  );
}
