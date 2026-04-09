'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  DEFAULT_ITERATION_COUNT,
  MAX_FILE_SIZE_BYTES,
  ACCEPTED_IMAGE_TYPES,
} from '@/lib/constants';

interface UploadFormProps {
  onUpload: (file: File, iterationCount: number) => Promise<void>;
  onDemo: () => void;
  isLoading: boolean;
  hasRun: boolean;
  fastMode: boolean;
  onFastModeChange: (enabled: boolean) => void;
}

export function UploadForm({ onUpload, onDemo, isLoading, hasRun, fastMode, onFastModeChange }: UploadFormProps) {
  const [iterationCount, setIterationCount] = useState(DEFAULT_ITERATION_COUNT);
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
      return 'File too large (max 4MB)';
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

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handlePlusClick = useCallback(() => {
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
          setError('Camera access denied');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found');
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
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Calculate 4:3 crop (centered)
    const targetRatio = 4 / 3;
    const videoRatio = videoWidth / videoHeight;

    let cropWidth: number, cropHeight: number, cropX: number, cropY: number;

    if (videoRatio > targetRatio) {
      // Video is wider than 4:3, crop sides
      cropHeight = videoHeight;
      cropWidth = videoHeight * targetRatio;
      cropX = (videoWidth - cropWidth) / 2;
      cropY = 0;
    } else {
      // Video is taller than 4:3, crop top/bottom
      cropWidth = videoWidth;
      cropHeight = videoWidth / targetRatio;
      cropX = 0;
      cropY = (videoHeight - cropHeight) / 2;
    }

    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw cropped portion
    ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

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

  useEffect(() => {
    if (videoRef.current && webcamStream) {
      videoRef.current.srcObject = webcamStream;
    }
  }, [webcamStream]);

  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [webcamStream]);

  const handleIterationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 20) {
      setIterationCount(value);
    }
  }, []);

  if (hasRun) {
    return null;
  }

  if (showWebcam) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl px-8">
          <div className="relative overflow-hidden bg-neutral-900">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => setWebcamReady(true)}
              className="w-full aspect-[4/3] object-cover"
            />
            {!webcamReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white/50 text-sm">Starting camera...</p>
              </div>
            )}
          </div>
          <div className="flex gap-4 mt-6 justify-center">
            {/* Cancel button - X icon */}
            <button
              onClick={stopWebcam}
              className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {/* Capture button - Camera icon */}
            <button
              onClick={captureWebcam}
              disabled={!webcamReady || isLoading}
              className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-colors disabled:opacity-30"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.5">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover -z-10 blur-sm"
      >
        <source src="/background.webm" type="video/webm" />
        <source src="/background.mp4" type="video/mp4" />
      </video>

      {/* Title - matches Header positioning: h-14 (56px) centered = 22px from top */}
      <div className="h-14 flex items-center justify-center">
        <img src="/logo.svg" alt="Infinite Mirror" className="h-3" />
      </div>

      {/* Center buttons */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex gap-4">
          {/* File upload button */}
          <button
            onClick={handlePlusClick}
            disabled={isLoading}
            className="w-40 h-40 rounded-full border border-white/20 flex items-center justify-center hover:border-white/40 transition-colors disabled:opacity-30"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={handleFileInput}
              disabled={isLoading}
              className="hidden"
            />
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* Webcam button */}
          <button
            onClick={startWebcam}
            disabled={isLoading}
            className="w-40 h-40 rounded-full border border-white/20 flex items-center justify-center hover:border-white/40 transition-colors disabled:opacity-30"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-32">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Bottom controls */}
      <div className="pb-8 flex items-center justify-center gap-8">
        {/* Fast mode toggle */}
        <button
          onClick={() => onFastModeChange(!fastMode)}
          disabled={isLoading}
          className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors disabled:opacity-30"
        >
          <span
            className={`w-2 h-2 rounded-full ${fastMode ? 'bg-white' : 'bg-white/30'}`}
          />
          <span>Fast mode</span>
        </button>

        {/* Iterations input */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/70">Iterations</span>
          <input
            type="text"
            value={iterationCount}
            onChange={handleIterationChange}
            disabled={isLoading}
            className="w-10 h-7 bg-transparent border border-white/20 rounded text-center text-white text-sm focus:outline-none focus:border-white/40 disabled:opacity-30"
          />
        </div>
      </div>

      {/* Demo button - top right */}
      <button
        onClick={onDemo}
        disabled={isLoading}
        className="absolute top-4 right-4 p-2 opacity-35 hover:opacity-100 transition-opacity disabled:opacity-20"
        title="View demo"
      >
        <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
          <path d="M208,88H48a16,16,0,0,0-16,16v96a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V104A16,16,0,0,0,208,88Zm0,112H48V104H208v96ZM48,64a8,8,0,0,1,8-8H200a8,8,0,0,1,0,16H56A8,8,0,0,1,48,64ZM64,32a8,8,0,0,1,8-8H184a8,8,0,0,1,0,16H72A8,8,0,0,1,64,32Z" />
        </svg>
      </button>
    </div>
  );
}
