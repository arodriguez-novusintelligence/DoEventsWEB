import { useState } from 'react';
import { Heart, Star } from 'lucide-react';
import { resolveEventImageUrl } from '@doevents/shared';

export interface FeedServiceCard {
  id: string;
  userId?: string;
  name: string;
  role: string;
  rating: number;
  reviewCount?: number;
  handle: string;
  description: string;
  image: string;
  minPrice?: number;
  currency?: string;
  distanceKm?: number;
}

interface FeedServicesCarouselProps {
  providers?: FeedServiceCard[];
  loading?: boolean;
  onOpenService?: (card: FeedServiceCard) => void;
  likedServiceIds?: Set<string>;
  onToggleServiceLike?: (serviceId: string) => void;
}

function ServiceCardImage({ src, alt }: { src: string; alt: string }) {
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

const FeedServicesCarousel = ({
  providers = [],
  loading,
  onOpenService,
  likedServiceIds,
  onToggleServiceLike,
}: FeedServicesCarouselProps) => {
  const list = providers.filter((p) => p.id && !/^sp-\d+$/i.test(p.id));

  if (loading) {
    return (
      <section className="my-5 px-4">
        <div className="mb-3 h-5 w-48 animate-pulse rounded bg-muted" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 w-[72%] shrink-0 animate-pulse rounded-2xl bg-muted sm:w-[280px]" />
          ))}
        </div>
      </section>
    );
  }

  if (!list.length) return null;

  return (
    <section className="my-5">
      <div className="mx-4 mb-3">
        <h3 className="text-base font-bold text-foreground">
          Servicios cercanos a tu ubicación
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          DJs, catering, fotografía y más cerca de ti
        </p>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {list.map((p) => {
          const isLiked = Boolean(likedServiceIds?.has(p.id));
          return (
          <button
            key={p.id}
            onClick={() => onOpenService?.(p)}
            className="flex w-[72%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-md sm:w-[280px] text-left active:scale-[0.98] transition-transform"
          >
            <div className="relative h-48 w-full overflow-hidden bg-muted">
              <ServiceCardImage src={p.image} alt={p.name} />
              {p.distanceKm != null && (
                <span className="absolute top-2.5 left-2.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                  {p.distanceKm} km
                </span>
              )}
              {onToggleServiceLike ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleServiceLike(p.id);
                  }}
                  aria-label={isLiked ? 'Quitar me gusta' : 'Me gusta'}
                  className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm"
                >
                  <Heart
                    className={`h-4 w-4 ${isLiked ? 'fill-primary text-primary' : ''}`}
                    strokeWidth={2.2}
                  />
                </button>
              ) : null}
            </div>
            <div className="flex flex-1 flex-col gap-1 p-3.5">
              <p className="text-sm font-bold text-foreground line-clamp-1">{p.name}</p>
              <p className="text-xs font-semibold text-primary">{p.role}</p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{p.rating.toFixed(1)}</span>
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {p.reviewCount != null && p.reviewCount > 0 && (
                    <span>({p.reviewCount})</span>
                  )}
                </div>
                {p.minPrice != null && p.minPrice > 0 && (
                  <span className="text-xs font-bold text-primary">
                    Desde {p.currency || 'COP'} {p.minPrice.toLocaleString('es-CO')}
                  </span>
                )}
              </div>
              {p.handle && <p className="text-[11px] text-muted-foreground">{p.handle}</p>}
              <p className="mt-0.5 text-xs leading-snug text-foreground/75 line-clamp-3">
                {p.description}
              </p>
            </div>
          </button>
          );
        })}
      </div>
    </section>
  );
};

export default FeedServicesCarousel;
