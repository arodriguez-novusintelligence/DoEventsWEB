import useEmblaCarousel from 'embla-carousel-react';
import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@lovable/lib/utils';

interface ImageCarouselProps {
  images: string[];
  className?: string;
}

const isVideo = (src: string) => {
  if (src.startsWith('data:video/')) return true;
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src);
};

const MediaItem = ({ src, className, onClick }: { src: string; className?: string; onClick?: () => void }) => {
  if (isVideo(src)) {
    return (
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        className={cn('w-full object-cover rounded-xl', className)}
        onClick={(e) => {
          // Don't open fullscreen if clicking on video controls
          if ((e.target as HTMLVideoElement).paused !== undefined && e.detail === 2) {
            e.preventDefault();
            onClick?.();
          }
        }}
      />
    );
  }
  return (
    <img
      src={src}
      alt=""
      className={cn('w-full object-cover rounded-xl cursor-pointer', className)}
      loading="lazy"
      onClick={onClick}
    />
  );
};

/* ── Fullscreen lightbox ── */
const MediaLightbox = ({
  media,
  initialIndex,
  onClose,
}: {
  media: string[];
  initialIndex: number;
  onClose: () => void;
}) => {
  const [index, setIndex] = useState(initialIndex);

  const goPrev = () => setIndex((i) => (i > 0 ? i - 1 : media.length - 1));
  const goNext = () => setIndex((i) => (i < media.length - 1 ? i + 1 : 0));

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const src = media[index];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-foreground/20 text-white backdrop-blur-sm transition-colors hover:bg-foreground/40"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Navigation arrows */}
      {media.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-foreground/20 text-white backdrop-blur-sm transition-colors hover:bg-foreground/40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-foreground/20 text-white backdrop-blur-sm transition-colors hover:bg-foreground/40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Media content */}
      <div className="max-h-[90vh] max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
        {isVideo(src) ? (
          <video
            src={src}
            controls
            autoPlay
            playsInline
            className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain"
          />
        ) : (
          <img
            src={src}
            alt=""
            className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain"
          />
        )}
      </div>

      {/* Dots indicator */}
      {media.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
          {media.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIndex(i); }}
              className={cn(
                'h-2 rounded-full transition-all duration-200',
                i === index ? 'w-4 bg-white' : 'w-2 bg-white/40'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Main Carousel ── */
const ImageCarousel = ({ images, className }: ImageCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (images.length === 0) return null;

  return (
    <>
      {images.length === 1 ? (
        <div className="px-4">
          <MediaItem
            src={images[0]}
            className={cn('rounded-lg', className)}
            onClick={() => setLightboxIndex(0)}
          />
        </div>
      ) : (
        <div className="relative px-4">
          <div className="overflow-hidden rounded-xl" ref={emblaRef}>
            <div className="flex">
              {images.map((src, i) => (
                <div key={i} className="min-w-0 flex-[0_0_100%]">
                  <MediaItem
                    src={src}
                    className={className}
                    onClick={() => setLightboxIndex(i)}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((src, i) => (
              <button
                key={i}
                className={cn(
                  'h-2 rounded-full transition-all duration-200',
                  i === selectedIndex
                    ? 'w-4 bg-primary'
                    : 'w-2 bg-foreground/30'
                )}
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Ir a ${isVideo(src) ? 'video' : 'imagen'} ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <MediaLightbox
          media={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
};

export default ImageCarousel;
