import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { resolveEventImageUrl } from '@doevents/shared';
import type { FeedVenueCard } from '../../../lovable-bridge/useNearbyVenues';

interface FeedVenuesCarouselProps {
  venues?: FeedVenueCard[];
  loading?: boolean;
  onOpenVenue?: (venue: FeedVenueCard) => void;
}

function VenueCardImage({ src, alt }: { src: string; alt: string }) {
  const [url, setUrl] = useState(resolveEventImageUrl(src));
  return (
    <img
      src={url}
      alt={alt}
      className="h-full w-full object-cover"
      loading="lazy"
      onError={() => setUrl(resolveEventImageUrl(null))}
    />
  );
}

const FeedVenuesCarousel = ({ venues = [], loading, onOpenVenue }: FeedVenuesCarouselProps) => {
  const list = venues.filter((v) => v.id);
  if (loading) return null;
  if (!list.length) return null;

  return (
    <section className="my-5">
      <div className="mx-4 mb-3">
        <h3 className="text-base font-bold text-foreground">Lugares para alquilar cerca de ti</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Fincas, salones, teatros y espacios publicados en DoEvents
        </p>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {list.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onOpenVenue?.(v)}
            className="flex w-[72%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-md sm:w-[280px] text-left active:scale-[0.98] transition-transform"
          >
            <div className="relative aspect-[4/3] w-full bg-muted">
              <VenueCardImage src={v.image} alt={v.name} />
            </div>
            <div className="p-3">
              <p className="text-sm font-bold text-foreground line-clamp-1">{v.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{v.type}</p>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="line-clamp-1">
                  {v.city || 'Colombia'}
                  {v.distanceKm != null ? ` · ${v.distanceKm.toFixed(1)} km` : ''}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default FeedVenuesCarousel;
