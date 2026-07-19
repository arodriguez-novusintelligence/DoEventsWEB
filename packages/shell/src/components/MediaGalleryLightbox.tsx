import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface MediaGalleryLightboxProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
  title?: string;
}

function isVideoUrl(src: string): boolean {
  if (src.startsWith('data:video/')) return true;
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src);
}

export const MediaGalleryLightbox: React.FC<MediaGalleryLightboxProps> = ({
  images,
  initialIndex = 0,
  open,
  onClose,
  title,
}) => {
  const media = images.filter(Boolean);
  const [index, setIndex] = useState(initialIndex);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setIndex(Math.min(Math.max(initialIndex, 0), Math.max(media.length - 1, 0)));
  }, [open, initialIndex, media.length]);

  const goTo = useCallback((next: number) => {
    if (!scrollerRef.current || !media.length) return;
    const clamped = Math.min(Math.max(next, 0), media.length - 1);
    setIndex(clamped);
    const width = scrollerRef.current.clientWidth || 1;
    scrollerRef.current.scrollTo({ left: clamped * width, behavior: 'smooth' });
  }, [media.length]);

  const goPrev = useCallback(() => {
    goTo(index <= 0 ? media.length - 1 : index - 1);
  }, [goTo, index, media.length]);

  const goNext = useCallback(() => {
    goTo(index >= media.length - 1 ? 0 : index + 1);
  }, [goTo, index, media.length]);

  useEffect(() => {
    if (!open || !scrollerRef.current || !media.length) return;
    const el = scrollerRef.current;
    const width = el.clientWidth || 1;
    el.scrollTo({ left: index * width, behavior: 'auto' });
  }, [open, media.length]); // sync on open — intentional omit index

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

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el || !media.length) return;
    const width = el.clientWidth || 1;
    const next = Math.round(el.scrollLeft / width);
    if (next !== index && next >= 0 && next < media.length) setIndex(next);
  };

  if (!open || !media.length) return null;

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
          {index + 1} / {media.length}
        </span>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-white/80" aria-label="Cerrar">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {media.length > 1 && (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 z-10 rounded-full bg-white/10 p-2 text-white"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="h-full w-full touch-pan-x overflow-x-auto overflow-y-hidden snap-x snap-mandatory flex scrollbar-none"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {media.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="flex h-full min-w-full shrink-0 snap-center items-center justify-center px-4"
            >
              {isVideoUrl(src) ? (
                <video
                  src={src}
                  controls
                  playsInline
                  className="max-h-[75vh] max-w-full object-contain"
                />
              ) : (
                <img
                  src={src}
                  alt={title || `Imagen ${i + 1}`}
                  className="max-h-[75vh] max-w-full object-contain"
                  draggable={false}
                />
              )}
            </div>
          ))}
        </div>

        {media.length > 1 && (
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

      {media.length > 1 && (
        <div className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-6 safe-area-bottom">
          {media.map((url, i) => (
            <button
              key={`${url}-thumb-${i}`}
              type="button"
              onClick={() => goTo(i)}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === index ? 'border-primary' : 'border-transparent opacity-70'
              }`}
            >
              {isVideoUrl(url) ? (
                <video src={url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
              ) : (
                <img src={url} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaGalleryLightbox;
