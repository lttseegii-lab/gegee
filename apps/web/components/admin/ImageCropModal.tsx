'use client';

import { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';

/**
 * Full-screen image crop modal.
 *
 * Reads the picked File into an object URL, lets the user pan + zoom inside
 * a fixed-aspect crop box, then renders the cropped region to a canvas and
 * resolves a Blob (image/jpeg, 0.92 quality) for upload.
 *
 * Defaults to 1:1 aspect — matching the square <MegaImage /> on the
 * customer mega-menu. Pass `aspect` to override (e.g. 16/9 for hero banners).
 */
export function ImageCropModal({
  file,
  aspect = 1,
  outputSize = 800,
  onCancel,
  onConfirm,
}: {
  file: File | null;
  aspect?: number;
  /** Largest edge of the resulting Blob in pixels (default 800px) */
  outputSize?: number;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  // Load the file into an object URL once
  useEffect(() => {
    if (!file) {
      setImageSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Lock body scroll while open
  useEffect(() => {
    if (!file) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [file]);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function confirm() {
    if (!imageSrc || !croppedAreaPixels) return;
    setBusy(true);
    try {
      const blob = await renderCroppedBlob(
        imageSrc,
        croppedAreaPixels,
        outputSize
      );
      onConfirm(blob);
    } finally {
      setBusy(false);
    }
  }

  if (!file || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 text-white">
        <h3 className="font-medium">Зургийг crop хийх</h3>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          aria-label="Хаах"
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg"
        >
          ✕
        </button>
      </header>

      {/* Cropper */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          showGrid
          objectFit="contain"
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      {/* Controls */}
      <footer className="px-5 py-4 bg-ink/90 text-white space-y-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wider text-white/60 w-12">
            Zoom
          </span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-pinkHot"
          />
          <span className="text-xs font-mono text-white/70 w-12 text-right">
            {zoom.toFixed(2)}×
          </span>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="text-sm text-white/70 hover:text-white px-4 py-2"
          >
            Цуцлах
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy || !croppedAreaPixels}
            className="bg-white text-ink font-medium text-sm px-5 py-2.5 rounded-full hover:bg-white/90 disabled:opacity-50"
          >
            {busy ? 'Бэлдэж байна…' : 'Cropped зургийг ашиглах'}
          </button>
        </div>
      </footer>
    </div>
  );
}

/**
 * Draws the cropped region of `imageSrc` to a canvas (max `outputSize` per
 * side) and resolves a JPEG Blob. The aspect ratio of the crop is preserved.
 */
async function renderCroppedBlob(
  imageSrc: string,
  pixels: Area,
  outputSize: number
): Promise<Blob> {
  const img = await loadImage(imageSrc);

  // Scale the output so the larger crop edge maps to outputSize
  const scale = Math.min(
    1,
    outputSize / Math.max(pixels.width, pixels.height)
  );
  const outW = Math.round(pixels.width * scale);
  const outH = Math.round(pixels.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.drawImage(
    img,
    pixels.x,
    pixels.y,
    pixels.width,
    pixels.height,
    0,
    0,
    outW,
    outH
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/jpeg',
      0.92
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image load failed: ${src}`));
    img.src = src;
  });
}
