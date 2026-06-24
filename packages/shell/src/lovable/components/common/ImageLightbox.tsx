import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
  alt?: string;
}

const ImageLightbox = ({ images, initialIndex = 0, open, onClose, alt = '' }: Props) => {
  const [index, setIndex] = useState(initialIndex);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goTo(Math.min(index + 1, images.length - 1));
      if (e.key === 'ArrowLeft') goTo(Math.max(index - 1, 0));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, images.length]);

  useEffect(() => {
    if (!open || !scrollerRef.current) return;
    const el = scrollerRef.current;
    el.scrollTo({ left: initialIndex * el.clientWidth, behavior: 'instant' as ScrollBehavior });
  }, [open, initialIndex]);

  const goTo = (i: number) => {
    if (!scrollerRef.current) return;
    setIndex(i);
    scrollerRef.current.scrollTo({ left: i * scrollerRef.current.clientWidth, behavior: 'smooth' });
  };

  const onScroll = () => {
    if (!scrollerRef.current) return;
    const el = scrollerRef.current;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 text-primary-foreground">
        <span className="text-sm font-medium">{index + 1} / {images.length}</span>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="h-full w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory flex scrollbar-none"
          style={{ scrollbarWidth: 'none' }}
        >
          {images.map((src, i) => (
            <div key={i} className="min-w-full h-full snap-center flex items-center justify-center px-2">
              <img src={src} alt={`${alt} ${i + 1}`} className="max-h-full max-w-full object-contain" />
            </div>
          ))}
        </div>

        {index > 0 && (
          <button
            onClick={() => goTo(index - 1)}
            aria-label="Anterior"
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center text-primary-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {index < images.length - 1 && (
          <button
            onClick={() => goTo(index + 1)}
            aria-label="Siguiente"
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center text-primary-foreground"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-4">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Ir a imagen ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageLightbox;