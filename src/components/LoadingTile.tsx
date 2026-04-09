'use client';

import { useEffect, useRef } from 'react';

interface LoadingTileProps {
  previousImageUrl: string;
  size?: number;
}

interface Pixel {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  r: number;
  g: number;
  b: number;
}

export function LoadingTile({ previousImageUrl, size = 80 }: LoadingTileProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Tiny pixels for more abstraction
      const pixelSize = 1;
      const cols = Math.ceil(size / pixelSize);
      const rows = Math.ceil(size / pixelSize);

      // Create offscreen canvas to sample colors
      const offscreen = document.createElement('canvas');
      offscreen.width = cols;
      offscreen.height = rows;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      // Draw image at tiny size to get average colors per block
      offCtx.drawImage(img, 0, 0, cols, rows);
      const imageData = offCtx.getImageData(0, 0, cols, rows);
      const data = imageData.data;

      // Create pixel objects with positions and colors
      const pixels: Pixel[] = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const idx = (y * cols + x) * 4;
          pixels.push({
            x: x * pixelSize + Math.random() * size * 0.2,
            y: y * pixelSize + Math.random() * size * 0.2,
            targetX: x * pixelSize,
            targetY: y * pixelSize,
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2],
          });
        }
      }

      // Periodically assign new random target positions
      let lastTargetUpdate = 0;
      const updateInterval = 3000; // ms between target updates (slow, ambient)

      const animate = (timestamp: number) => {
        // Update targets periodically
        if (timestamp - lastTargetUpdate > updateInterval) {
          lastTargetUpdate = timestamp;
          for (const pixel of pixels) {
            // Random position within the canvas, biased toward original position
            pixel.targetX = pixel.targetX * 0.5 + Math.random() * size * 0.5;
            pixel.targetY = pixel.targetY * 0.5 + Math.random() * size * 0.5;
          }
        }

        ctx.clearRect(0, 0, size, size);

        // Slide pixels toward their targets very slowly
        for (const pixel of pixels) {
          pixel.x += (pixel.targetX - pixel.x) * 0.008;
          pixel.y += (pixel.targetY - pixel.y) * 0.008;

          ctx.fillStyle = `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`;
          ctx.fillRect(pixel.x, pixel.y, pixelSize, pixelSize);
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    };

    img.src = previousImageUrl;

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [previousImageUrl, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="w-full h-full"
    />
  );
}
