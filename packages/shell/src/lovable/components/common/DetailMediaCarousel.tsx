import { useCallback, useEffect, useState, type ReactNode } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@lovable/lib/utils';
import MediaGalleryLightbox from '../../../components/MediaGalleryLightbox';

function isVideoUrl(src: string): boolean {
  if (src.startsWith('data:video/')) return true;
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src);
}

export interface DetailMediaCarouselProps {
  images: string[];
  alt?: string;
  /** Clases de tamaño del slide (ej. h-56 / h-64) */
  frameClassName?: string;
  className?: string;
  roundedClassName?: string;
  topLeft?: ReactNode;
  topRight?: ReactNode;
  bottomRight?: ReactNode;
  /** Badge sobre la media (ej. "Servicio") */
  badge?: ReactNode;
  emptyFallback?: ReactNode;
}

/**
 * Carrusel horizontal (swipe) de multimedia para detalle de evento / lugar / servicio.
 */
export function DetailMediaCarousel({
  images,
  alt = '',
  frameClassName = 'h-56',
  className,
  roundedClassName = 'rounded-2xl',
  topLeft,
  topRight,
  bottomRight,
  badge,
  emptyFallback,
}: DetailMediaCarouselProps) {
  const media = images.filter(Boolean);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    dragFree: false,
    containScroll: 'trimSnaps',
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (!media.length) {
    return emptyFallback ? <>{emptyFallback}</> : null;
  }

  return (
    <>
      <div className={cn('relative', className)}>
        <div
          className={cn('overflow-hidden touch-pan-x', roundedClassName)}
          ref={emblaRef}
        >
          <div className="flex">
            {media.map((src, i) => (
              <div key={`${src}-${i}`} className="min-w-0 flex-[0_0_100%]">
                <button
                  type="button"
                  className={cn('relative block w-full overflow-hidden', frameClassName, roundedClassName)}
                  onClick={() => {
                    setLightboxOpen(true);
                  }}
                  aria-label={`Ampliar multimedia ${i + 1} de ${media.length}`}
                >
                  {isVideoUrl(src) ? (
                    <video
                      src={src}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={src}
                      alt={alt ? `${alt} ${i + 1}` : `Multimedia ${i + 1}`}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {badge}
        {topLeft}
        {topRight}
        {bottomRight}

        {media.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
            {media.map((_, i) => (
              <button
                key={i}
                type="button"
                className={cn(
                  'pointer-events-auto h-1.5 rounded-full transition-all',
                  i === selectedIndex ? 'w-8 bg-primary' : 'w-6 bg-primary/40',
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  emblaApi?.scrollTo(i);
                }}
                aria-label={`Ir a multimedia ${i + 1}`}
              />
            ))}
          </div>
        )}

        {media.length > 1 && (
          <span className="pointer-events-none absolute left-3 bottom-3 z-10 rounded-full bg-foreground/70 px-2.5 py-0.5 text-[11px] font-medium text-background">
            {selectedIndex + 1}/{media.length}
          </span>
        )}
      </div>

      <MediaGalleryLightbox
        images={media}
        initialIndex={selectedIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={alt || 'Galería multimedia'}
      />
    </>
  );
}

export default DetailMediaCarousel;
