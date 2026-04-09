import GIF from 'gif.js-upgrade';

export interface GifOptions {
  width?: number;
  height?: number;
  delay?: number;
  quality?: number;
}

export async function createGifFromUrls(
  imageUrls: string[],
  options: GifOptions = {}
): Promise<Blob> {
  const {
    width = 512,
    height = 512,
    delay = 500,
    quality = 10,
  } = options;

  return new Promise(async (resolve, reject) => {
    try {
      const gif = new GIF({
        workers: 2,
        quality,
        width,
        height,
        workerScript: '/gif.worker.js',
      });

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      for (const url of imageUrls) {
        const img = await loadImage(url);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        const scale = Math.min(width / img.width, height / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const x = (width - scaledWidth) / 2;
        const y = (height - scaledHeight) / 2;

        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

        gif.addFrame(ctx, { copy: true, delay });
      }

      gif.on('finished', (blob: Blob) => {
        resolve(blob);
      });

      gif.on('error', (err: Error) => {
        reject(err);
      });

      gif.render();
    } catch (err) {
      reject(err);
    }
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
