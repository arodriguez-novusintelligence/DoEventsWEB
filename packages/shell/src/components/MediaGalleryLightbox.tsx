import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface MediaGalleryLightboxProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
  title?: string;
}

export const MediaGalleryLightbox: React.FC<MediaGalleryLightboxProps> = ({
  images,
  initialIndex = 0,
  open,
  onClose,
  title,
}) => {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i >= images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, goPrev, goNext]);

  if (!open || !images.length) return null;

  const current = images[index] || images[0];

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Galería multimedia'}
    >
      <div className="flex shrink-0 items-center justify-between px-4 py-3 safe-area-top">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 text-sm font-medium text-white"
        >
          <ChevronLeft className="h-5 w-5" />
          Volver
        </button>
        <span className="text-xs text-white/70">
          {index + 1} / {images.length}
        </span>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-white/80" aria-label="Cerrar">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-8">
        {images.length > 1 && (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 z-10 rounded-full bg-white/10 p-2 text-white"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        <img
          src={current}
          alt={title || `Imagen ${index + 1}`}
          className="max-h-[75vh] max-w-full object-contain"
        />
        {images.length > 1 && (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 z-10 rounded-full bg-white/10 p-2 text-white"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-6 safe-area-bottom">
          {images.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === index ? 'border-primary' : 'border-transparent opacity-70'
              }`}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaGalleryLightbox;
