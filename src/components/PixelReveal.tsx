'use client';

import { useEffect, useRef, useState } from 'react';

interface PixelRevealProps {
  src: string;
  alt: string;
  className?: string;
  duration?: number; // in ms
  onRevealComplete?: () => void;
}

export function PixelReveal({
  src,
  alt,
  className = '',
  duration = 8000,
  onRevealComplete,
}: PixelRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      setImageLoaded(true);

      // Calculate rendered size (matching object-contain behavior)
      const containerRect = container.getBoundingClientRect();
      const imgAspect = img.width / img.height;
      const containerAspect = containerRect.width / containerRect.height;

      let renderWidth: number, renderHeight: number;

      if (imgAspect > containerAspect) {
        // Image is wider - fit to width
        renderWidth = containerRect.width;
        renderHeight = containerRect.width / imgAspect;
      } else {
        // Image is taller - fit to height
        renderHeight = containerRect.height;
        renderWidth = containerRect.height * imgAspect;
      }

      // Set canvas size to match rendered image size
      canvas.width = renderWidth;
      canvas.height = renderHeight;

      // Draw source image to an offscreen canvas to sample from
      const offscreen = document.createElement('canvas');
      offscreen.width = renderWidth;
      offscreen.height = renderHeight;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;
      offCtx.drawImage(img, 0, 0, renderWidth, renderHeight);

      // Get all pixel data
      const imageData = offCtx.getImageData(0, 0, renderWidth, renderHeight);
      const pixels = imageData.data;

      // Create array of pixel indices to reveal
      const totalPixels = renderWidth * renderHeight;
      const pixelIndices: number[] = [];
      for (let i = 0; i < totalPixels; i++) {
        pixelIndices.push(i);
      }

      // Shuffle the pixel indices (Fisher-Yates)
      for (let i = pixelIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pixelIndices[i], pixelIndices[j]] = [pixelIndices[j], pixelIndices[i]];
      }

      // Clear canvas
      ctx.clearRect(0, 0, renderWidth, renderHeight);

      // Animation state
      const startTime = performance.now();
      let revealedCount = 0;
      const outputData = ctx.createImageData(renderWidth, renderHeight);

      // Initialize output as transparent
      for (let i = 0; i < outputData.data.length; i += 4) {
        outputData.data[i] = 0;
        outputData.data[i + 1] = 0;
        outputData.data[i + 2] = 0;
        outputData.data[i + 3] = 0;
      }

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Calculate how many pixels should be revealed by now
        const targetRevealed = Math.floor(progress * totalPixels);

        // Reveal pixels up to target
        while (revealedCount < targetRevealed) {
          const pixelIndex = pixelIndices[revealedCount];
          const x = pixelIndex % renderWidth;
          const y = Math.floor(pixelIndex / renderWidth);
          const dataIndex = (y * renderWidth + x) * 4;

          // Copy pixel from source
          outputData.data[dataIndex] = pixels[dataIndex];
          outputData.data[dataIndex + 1] = pixels[dataIndex + 1];
          outputData.data[dataIndex + 2] = pixels[dataIndex + 2];
          outputData.data[dataIndex + 3] = pixels[dataIndex + 3];

          revealedCount++;
        }

        // Draw current state
        ctx.putImageData(outputData, 0, 0);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Animation complete
          setIsComplete(true);
          onRevealComplete?.();
        }
      };

      requestAnimationFrame(animate);
    };

    img.src = src;

    return () => {
      img.onload = null;
    };
  }, [src, duration, onRevealComplete]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
    >
      {/* Canvas for pixel reveal animation */}
      <canvas
        ref={canvasRef}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${
          isComplete ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Final image - fades in when animation completes */}
      <img
        src={src}
        alt={alt}
        className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
          isComplete && imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
