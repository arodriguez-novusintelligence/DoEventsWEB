import useEmblaCarousel from 'embla-carousel-react';
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@lovable/lib/utils';
import { bannerEvents } from '@lovable/data/mockData';

const FeedBanner = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  return (
    <div className="pb-2">
      <div className="px-4 py-3">
        <h2 className="text-base font-bold text-card-foreground">
          Eventos recientes cercanos a mi ubicación
        </h2>
      </div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3 px-4">
          {bannerEvents.map((event) => (
            <div
              key={event.id}
              className="min-w-0 flex-[0_0_75%] cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src={event.image}
                  alt={event.title}
                  className="aspect-[16/10] w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-sm font-bold text-primary-foreground">
                    {event.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-primary-foreground/80">
                    {event.date} - {event.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Dots */}
      <div className="mt-3 flex justify-center gap-1.5">
        {bannerEvents.map((_, i) => (
          <button
            key={i}
            className={cn(
              'h-2 rounded-full transition-all duration-200',
              i === selectedIndex
                ? 'w-5 bg-primary'
                : 'w-2 bg-muted-foreground/30'
            )}
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`Ir a evento ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default FeedBanner;