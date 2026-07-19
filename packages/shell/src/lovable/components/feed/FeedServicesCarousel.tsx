import { AlertCircle, Briefcase, Heart, Loader2, RefreshCw, Star } from 'lucide-react';
import { resolveEventImageUrl, SafeImage } from '@doevents/shared';

export interface FeedServiceCard {
  id: string;
  name: string;
  role: string;
  rating: number;
  handle: string;
  description: string;
  image: string;
  reviewCount?: number;
  userId?: string;
  minPrice?: number;
  currency?: string;
  distanceKm?: number;
}

interface FeedServicesCarouselProps {
  providers?: FeedServiceCard[];
  loading?: boolean;
  loadError?: boolean;
  onRetry?: () => void;
  onOpenService?: (card: FeedServiceCard) => void;
  onReserveService?: (card: FeedServiceCard) => void;
  onEditService?: (card: FeedServiceCard) => void;
  currentUserId?: string;
  likedServiceIds?: Set<string>;
  onToggleServiceLike?: (serviceId: string) => void;
}

const FeedServicesCarousel = ({
  providers = [],
  loading = false,
  loadError = false,
  onRetry,
  onOpenService,
  onReserveService,
  onEditService,
  currentUserId,
  likedServiceIds,
  onToggleServiceLike,
}: FeedServicesCarouselProps) => {
  const list = providers.filter((p) => p.id);

  if (loading) {
    return (
      <section className="my-5 px-4">
        <div className="mb-3 h-5 w-56 animate-pulse rounded-lg bg-muted" />
        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex w-[68%] shrink-0 flex-col overflow-hidden rounded-2xl bg-card shadow-sm sm:w-[260px]"
            >
              <div className="h-44 w-full animate-pulse bg-muted" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Cargando servicios cercanos…
        </p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="mx-4 my-5 rounded-2xl border border-dashed border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <p className="mt-3 text-sm font-semibold text-foreground">No se pudieron cargar los servicios</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reintentar
          </button>
        ) : null}
      </section>
    );
  }

  if (!list.length) {
    return (
      <section className="mx-4 my-5 rounded-2xl border border-dashed border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
          <Briefcase className="h-7 w-7 text-primary" />
        </div>
        <p className="mt-3 text-sm font-semibold text-foreground">Sin servicios cercanos</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Publica un servicio o ajusta tu ubicación para ver proveedores cerca de ti.
        </p>
      </section>
    );
  }

  return (
    <section className="my-5">
      <div className="mx-4 mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">
          Servicios cercanos a mi ubicación
        </h3>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {list.map((p) => {
          const isLiked = Boolean(likedServiceIds?.has(p.id));
          const isOwnService = Boolean(currentUserId && p.userId && String(p.userId) === String(currentUserId));
          return (
            <article
              key={p.id}
              className="relative flex w-[68%] shrink-0 flex-col overflow-hidden rounded-2xl bg-card shadow-sm sm:w-[260px] text-left"
            >
              <button
                type="button"
                onClick={() => onOpenService?.(p)}
                className="flex flex-1 flex-col text-left active:scale-[0.98] transition-transform"
              >
              <div className="relative h-44 w-full overflow-hidden bg-muted">
                <SafeImage
                  src={p.image}
                  alt={p.name}
                  className="h-full w-full object-cover"
                  fallbackSrc={resolveEventImageUrl()}
                />
                {onToggleServiceLike ? (
                  <button
                    type="button"
                    aria-label={isLiked ? 'Quitar de favoritos' : 'Guardar servicio'}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleServiceLike(p.id);
                    }}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-primary shadow-sm ring-2 ring-primary/20"
                  >
                    <Heart
                      className={`h-4 w-4 ${isLiked ? 'fill-primary text-primary' : ''}`}
                      strokeWidth={2.2}
                    />
                  </button>
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-3">
                <p className="text-sm font-medium text-foreground line-clamp-1">{p.name}</p>
                <p className="text-base font-semibold text-foreground line-clamp-1">{p.role}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span>Calificación</span>
                    <span className="font-semibold text-foreground">
                      {p.rating > 0 ? p.rating.toFixed(1) : 'Nuevo'}
                    </span>
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  </span>
                  {p.distanceKm != null ? (
                    <span className="font-semibold text-primary">{p.distanceKm.toFixed(1)} km</span>
                  ) : null}
                </div>
                {p.handle ? (
                  <p className="text-xs text-muted-foreground line-clamp-1">{p.handle}</p>
                ) : null}
                {p.description ? (
                  <p className="mt-1 text-xs leading-snug text-foreground/80 line-clamp-3">
                    {p.description}
                  </p>
                ) : null}
              </div>
              </button>
              {(onReserveService || (isOwnService && onEditService)) && (
                <div className="flex gap-2 border-t border-border/60 p-2">
                  {onReserveService && (
                    <button
                      type="button"
                      onClick={() => onReserveService(p)}
                      className="flex-1 rounded-xl bg-primary px-2 py-2 text-xs font-bold text-primary-foreground"
                    >
                      Contratar
                    </button>
                  )}
                  {isOwnService && onEditService && (
                    <button
                      type="button"
                      onClick={() => onEditService(p)}
                      className="flex-1 rounded-xl border border-primary px-2 py-2 text-xs font-bold text-primary"
                    >
                      Editar
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default FeedServicesCarousel;
