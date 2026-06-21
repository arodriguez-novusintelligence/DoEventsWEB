import { useMemo, useState, type ReactNode } from 'react';
import {
  matchesDiscoverEventCategory,
  matchesDiscoverVenueCategory,
  matchesDiscoverServiceCategory,
  DISCOVER_EVENT_CATEGORIES,
  DISCOVER_VENUE_CATEGORIES,
  DISCOVER_SERVICE_CATEGORIES,
  resolveEventImageUrl,
  SafeImage,
} from '@doevents/shared';
import {
  Heart,
  ChevronRight,
  CalendarDays,
  Music,
  Mic,
  MonitorPlay,
  Store,
  Smile,
  Trophy,
  MapPin,
  PartyPopper,
  Users,
  Home,
  Building2,
  Trees,
  Warehouse,
  Hotel,
  UtensilsCrossed,
  Truck,
  Camera,
  Mic2,
  ShieldCheck,
  Megaphone,
  Star,
  Search,
  Loader2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import FeedServicesCarousel, { type FeedServiceCard } from '@lovable/components/feed/FeedServicesCarousel';
import type { PublishedVenueDraft } from '@lovable/components/venues/VenueCreator';

type FilterType = 'todos' | 'eventos' | 'lugares' | 'servicios';

type Category = {
  label: string;
  icon: LucideIcon;
  bg: string;
  color: string;
};

/** Paleta semántica DSF — evita colores hardcoded pink/violet/emerald en chips. */
const DISCOVER_CHIP_STYLES: Pick<Category, 'bg' | 'color'>[] = [
  { bg: 'bg-primary/10', color: 'text-primary' },
  { bg: 'bg-accent', color: 'text-accent-foreground' },
  { bg: 'bg-secondary', color: 'text-secondary-foreground' },
  { bg: 'bg-primary/15', color: 'text-primary' },
  { bg: 'bg-muted', color: 'text-muted-foreground' },
  { bg: 'bg-accent/80', color: 'text-accent-foreground' },
  { bg: 'bg-primary/10', color: 'text-primary' },
  { bg: 'bg-secondary', color: 'text-secondary-foreground' },
];

const categories = DISCOVER_EVENT_CATEGORIES.map((chip, index) => {
  const icons = [Music, Mic, MonitorPlay, Store, Smile, Trophy, MapPin, PartyPopper];
  const style = DISCOVER_CHIP_STYLES[index] || DISCOVER_CHIP_STYLES[0];
  const icon = icons[index] || Music;
  return { label: chip.label, icon, bg: style.bg, color: style.color };
});

const venueCategories = DISCOVER_VENUE_CATEGORIES.map((chip, index) => {
  const icons = [Trees, Building2, Home, Hotel, Warehouse, UtensilsCrossed];
  const style = DISCOVER_CHIP_STYLES[index] || DISCOVER_CHIP_STYLES[0];
  const icon = icons[index] || Trees;
  return { label: chip.label, icon, bg: style.bg, color: style.color };
});

const serviceCategories = DISCOVER_SERVICE_CATEGORIES.map((chip, index) => {
  const icons = [UtensilsCrossed, Music, Camera, Truck, ShieldCheck, Megaphone, Mic2, Truck];
  const style = DISCOVER_CHIP_STYLES[index] || DISCOVER_CHIP_STYLES[0];
  const icon = icons[index] || UtensilsCrossed;
  return { label: chip.label, icon, bg: style.bg, color: style.color };
});

type EventItem = {
  id: string;
  image: string;
  videoUrl?: string;
  isVideo?: boolean;
  title: string;
  date: string;
  location: string;
  description?: string;
  category?: string;
  status?: string;
};

function statusBadgeLabel(status?: string): string {
  if (status === 'borrador') return 'borrador';
  if (status === 'finalizado') return 'finalizado';
  if (status === 'inactivo') return 'inactivo';
  return 'activo';
}

function statusBadgeClass(status?: string): string {
  if (status === 'borrador') return 'bg-secondary text-secondary-foreground';
  if (status === 'inactivo' || status === 'finalizado') return 'bg-muted/90 text-muted-foreground';
  return 'bg-primary/90 text-primary-foreground';
}

function matchesDiscoverEvent(event: EventItem, category: string | null): boolean {
  return matchesDiscoverEventCategory(
    {
      category: event.category,
      nombre: event.title,
      description: event.description,
    },
    category,
  );
}

function matchesDiscoverVenue(venue: PublishedVenueDraft, category: string | null): boolean {
  return matchesDiscoverVenueCategory(
    {
      type: venue.type,
      name: venue.name,
      address: venue.address,
      description: venue.description,
      sector: venue.sector,
    },
    category,
  );
}

const EventMedia = ({ event }: { event: EventItem }) => {
  if (event.isVideo && event.videoUrl) {
    return (
      <video
        src={event.videoUrl}
        className="h-full w-full object-cover"
        muted
        playsInline
        loop
        autoPlay
      />
    );
  }
  if (event.image) {
    return <img src={event.image} alt={event.title} className="h-full w-full object-cover" />;
  }
  if (event.videoUrl) {
    return (
      <video
        src={event.videoUrl}
        className="h-full w-full object-cover"
        muted
        playsInline
        loop
        autoPlay
      />
    );
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted text-xs text-muted-foreground">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
        <CalendarDays className="h-7 w-7 text-primary" />
      </div>
      Sin imagen
    </div>
  );
};

const FavoriteHeartButton = ({
  active,
  onToggle,
  className = 'absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-primary shadow-sm',
  iconClassName = 'h-4 w-4',
}: {
  active?: boolean;
  onToggle?: () => void;
  className?: string;
  iconClassName?: string;
}) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onToggle?.();
    }}
    aria-label={active ? 'Quitar me gusta' : 'Me gusta'}
    className={className}
  >
    <Heart
      className={`${iconClassName} ${active ? 'fill-primary text-primary' : ''}`}
      strokeWidth={2.2}
    />
  </button>
);

const EventCard = ({
  event,
  onClick,
  isFavorite,
  onToggleFavorite,
}: {
  event: EventItem;
  onClick?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (eventId: string) => void;
}) => (
  <button
    onClick={onClick}
    className="min-w-[210px] max-w-[210px] flex-shrink-0 rounded-2xl bg-card shadow-sm overflow-hidden border border-border/60 text-left transition-transform active:scale-[0.98]"
  >
    <div className="relative h-36">
      <EventMedia event={event} />
      <span className={`absolute top-2.5 left-2.5 px-3 py-1 rounded-full text-[11px] font-extrabold backdrop-blur-sm ${statusBadgeClass(event.status)}`}>
        {statusBadgeLabel(event.status)}
      </span>
      {onToggleFavorite ? (
        <FavoriteHeartButton
          active={isFavorite}
          onToggle={() => { if (event.id) onToggleFavorite(event.id); }}
        />
      ) : (
        <span className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-primary shadow-sm">
          <Heart className="h-4 w-4" strokeWidth={2.2} />
        </span>
      )}
    </div>
    <div className="p-3.5">
      <h3 className="text-sm font-extrabold text-foreground line-clamp-2 leading-snug">{event.title}</h3>
      <p className="mt-2 text-sm font-extrabold text-foreground">{event.date}</p>
      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">{event.location}</p>
      {event.description && (
        <p className="mt-2 text-xs text-foreground/80 line-clamp-2">{event.description}</p>
      )}
    </div>
  </button>
);

const UpcomingEventRow = ({
  event,
  onClick,
  isFavorite,
  onToggleFavorite,
}: {
  event: EventItem;
  onClick?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (eventId: string) => void;
}) => (
  <button
    onClick={onClick}
    className="flex w-full gap-3 rounded-2xl bg-card p-3 shadow-sm border border-border/60 items-center text-left active:scale-[0.99]"
  >
    <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
      <EventMedia event={event} />
      <span className={`absolute top-1 left-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold ${statusBadgeClass(event.status)}`}>
        {statusBadgeLabel(event.status)}
      </span>
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-extrabold text-foreground line-clamp-3 leading-snug pr-6">{event.title}</h3>
      {event.date && <p className="mt-1 text-xs font-extrabold text-foreground">{event.date}</p>}
    </div>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (event.id) onToggleFavorite?.(event.id);
      }}
      aria-label="Favorito"
      className="shrink-0 self-start"
    >
      <Heart className={`h-5 w-5 ${isFavorite ? 'fill-primary text-primary' : 'text-primary'}`} strokeWidth={2} />
    </button>
  </button>
);

const OtherEventRow = ({
  event,
  onClick,
  isFavorite,
  onToggleFavorite,
}: {
  event: EventItem;
  onClick?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (eventId: string) => void;
}) => (
  <button
    onClick={onClick}
    className="flex w-full gap-3 rounded-2xl bg-card p-3 shadow-sm border border-border/60 text-left active:scale-[0.99]"
  >
    <div className="relative h-24 w-24 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
      <EventMedia event={event} />
      <span className={`absolute top-1 left-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold ${statusBadgeClass(event.status)}`}>
        {statusBadgeLabel(event.status)}
      </span>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-extrabold text-foreground line-clamp-2">{event.title}</h3>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (event.id) onToggleFavorite?.(event.id);
          }}
          aria-label="Favorito"
          className="shrink-0"
        >
          <Heart className={`h-4 w-4 flex-shrink-0 ${isFavorite ? 'fill-primary text-primary' : 'text-primary'}`} strokeWidth={2} />
        </button>
      </div>
      <p className="mt-1 text-sm font-extrabold text-foreground">{event.date}</p>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{event.location}</p>
    </div>
  </button>
);

const HORIZONTAL_SCROLL =
  'mt-3 flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar snap-x snap-mandatory';

const Dots = ({ count = 3, active = 0 }: { count?: number; active?: number }) => {
  if (count <= 0) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-1.5">
      {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${i === active ? 'w-8 bg-primary' : 'w-6 bg-primary/30'}`}
        />
      ))}
    </div>
  );
};

const SectionHeader = ({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: boolean;
  onAction?: () => void;
}) => (
  <div className="flex items-end justify-between gap-3">
    <h2 className="text-lg font-extrabold text-foreground leading-tight">{title}</h2>
    {action && (
      <button
        type="button"
        onClick={onAction}
        className="flex items-center gap-0.5 text-sm font-extrabold text-primary whitespace-nowrap"
      >
        Ver más <ChevronRight className="h-4 w-4" />
      </button>
    )}
  </div>
);

const EmptyHint = ({ children, icon: Icon = Search }: { children: ReactNode; icon?: LucideIcon }) => (
  <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card px-4 py-6 text-center shadow-sm">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
      <Icon className="h-7 w-7 text-primary" />
    </div>
    <p className="text-sm text-muted-foreground max-w-[260px]">{children}</p>
  </div>
);

type ServiceProviderItem = {
  userId: string;
  name: string;
  avatarUrl: string;
  username?: string;
  servicesCount: number;
  rating: number;
  primaryRole: string;
  primaryServiceId?: string;
  services?: Array<{
    role?: string;
    category?: string;
    description?: string;
    sectors?: string[];
    name?: string;
  }>;
};

interface EventsViewProps {
  publishedEvents?: EventItem[];
  favoriteEvents?: EventItem[];
  nearbyEvents?: EventItem[];
  recommendedEvents?: EventItem[];
  upcomingEvents?: EventItem[];
  otherEvents?: EventItem[];
  publishedVenues?: PublishedVenueDraft[];
  serviceProviders?: ServiceProviderItem[];
  nearbyServiceCards?: FeedServiceCard[];
  servicesLoading?: boolean;
  discoverLoading?: boolean;
  onOpenEvent?: (event: EventItem) => void;
  onOpenVenue?: (venue: PublishedVenueDraft) => void;
  onOpenServiceProvider?: (provider: ServiceProviderItem) => void;
  onOpenService?: (card: FeedServiceCard) => void;
  onReserveService?: (serviceId: string) => void;
  onCreateEvent?: () => void;
  onViewAllNearby?: () => void;
  onViewAllRecommended?: () => void;
  onViewAllVenues?: () => void;
  onViewAllProviders?: () => void;
  favoriteEventIds?: Set<string>;
  onToggleFavorite?: (eventId: string) => void;
  likedVenueIds?: Set<string>;
  onToggleVenueLike?: (venueId: string) => void;
  likedServiceIds?: Set<string>;
  onToggleServiceLike?: (serviceId: string) => void;
}

const VenueCard = ({
  venue,
  onClick,
  isLiked,
  onToggleLike,
}: {
  venue: PublishedVenueDraft;
  onClick?: () => void;
  isLiked?: boolean;
  onToggleLike?: () => void;
}) => (
  <button
    onClick={onClick}
    className="min-w-[210px] max-w-[210px] flex-shrink-0 rounded-2xl bg-card shadow-sm overflow-hidden border border-border/60 text-left transition-transform active:scale-[0.98]"
  >
    <div className="relative h-36">
      <SafeImage
        src={venue.image}
        alt={venue.name}
        className="h-full w-full object-cover"
        fallbackSrc={resolveEventImageUrl()}
      />
      <span className="absolute top-2.5 left-2.5 px-3 py-1 rounded-full bg-primary/90 text-[11px] font-extrabold text-primary-foreground backdrop-blur-sm">
        Lugar
      </span>
      {onToggleLike ? (
        <FavoriteHeartButton active={isLiked} onToggle={onToggleLike} />
      ) : (
        <span className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-primary shadow-sm">
          <Heart className="h-4 w-4" strokeWidth={2.2} />
        </span>
      )}
    </div>
    <div className="p-3.5">
      <h3 className="text-sm font-extrabold text-foreground line-clamp-2 leading-snug">{venue.name}</h3>
      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">{venue.address}</p>
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{venue.type}</span>
        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{venue.capacity}</span>
      </div>
    </div>
  </button>
);

const ProviderProfileCard = ({
  provider,
  onClick,
  onReserve,
  isLiked,
  onToggleLike,
}: {
  provider: ServiceProviderItem;
  onClick?: () => void;
  onReserve?: () => void;
  isLiked?: boolean;
  onToggleLike?: () => void;
}) => {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const initials = provider.name.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'DE';
  const showAvatar = provider.avatarUrl && !avatarFailed;

  return (
  <div className="min-w-[180px] max-w-[180px] flex-shrink-0 rounded-2xl bg-card shadow-sm overflow-hidden border border-border/60 text-left">
    <button
      type="button"
      onClick={onClick}
      className="w-full transition-transform active:scale-[0.98]"
    >
      <div className="relative flex flex-col items-center px-4 pt-5 pb-3">
        <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-primary/30 bg-muted">
          {showAvatar ? (
            <img
              src={provider.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-extrabold text-primary">
              {initials}
            </div>
          )}
        </div>
        <span className="absolute top-3 right-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-extrabold text-primary-foreground shadow-sm">
          {provider.servicesCount} {provider.servicesCount === 1 ? 'servicio' : 'servicios'}
        </span>
        {onToggleLike && provider.primaryServiceId ? (
          <FavoriteHeartButton
            active={isLiked}
            onToggle={onToggleLike}
            className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-primary shadow-sm"
          />
        ) : null}
        <h3 className="mt-3 text-sm font-extrabold text-foreground text-center line-clamp-2">{provider.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground text-center line-clamp-1">
          {provider.username ? `@${provider.username}` : provider.primaryRole}
        </p>
        <div className="mt-2 flex items-center gap-1 text-xs text-primary font-extrabold">
          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
          {provider.rating > 0 ? provider.rating.toFixed(1) : 'Nuevo'}
        </div>
      </div>
    </button>
    {onReserve && provider.primaryServiceId ? (
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={onReserve}
          className="w-full rounded-full bg-primary px-3 py-2 text-[11px] font-extrabold text-primary-foreground shadow-sm"
        >
          Reservar servicio
        </button>
      </div>
    ) : null}
  </div>
  );
};

const EventsView = ({
  publishedEvents = [],
  favoriteEvents = [],
  nearbyEvents = [],
  recommendedEvents = [],
  upcomingEvents = [],
  otherEvents = [],
  publishedVenues = [],
  serviceProviders = [],
  nearbyServiceCards = [],
  servicesLoading = false,
  discoverLoading = false,
  onOpenEvent,
  onOpenVenue,
  onOpenServiceProvider,
  onOpenService,
  onReserveService,
  onCreateEvent,
  onViewAllNearby,
  onViewAllRecommended,
  onViewAllVenues,
  onViewAllProviders,
  favoriteEventIds,
  onToggleFavorite,
  likedVenueIds,
  onToggleVenueLike,
  likedServiceIds,
  onToggleServiceLike,
}: EventsViewProps) => {
  const [filter, setFilter] = useState<FilterType>('todos');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [myEventsDot, setMyEventsDot] = useState(0);

  const resolvedFavoriteIds = useMemo(
    () => favoriteEventIds ?? new Set(favoriteEvents.map((e) => e.id).filter(Boolean)),
    [favoriteEventIds, favoriteEvents],
  );

  const isFavorite = (eventId: string) => resolvedFavoriteIds.has(eventId);
  const isVenueLiked = (venueId: string) => Boolean(likedVenueIds?.has(venueId));
  const isServiceLiked = (serviceId: string) => Boolean(likedServiceIds?.has(serviceId));

  const showEvents = filter === 'todos' || filter === 'eventos';
  const showVenues = filter === 'todos' || filter === 'lugares';
  const showServices = filter === 'todos' || filter === 'servicios';

  const filterEventsByCategory = (items: EventItem[]) => {
    if (filter !== 'eventos' || !selectedCategory) return items;
    return items.filter((e) => matchesDiscoverEvent(e, selectedCategory));
  };

  const filteredMyEvents = useMemo(
    () => filterEventsByCategory(publishedEvents),
    [publishedEvents, filter, selectedCategory],
  );
  const filteredFavEvents = useMemo(
    () => filterEventsByCategory(favoriteEvents),
    [favoriteEvents, filter, selectedCategory],
  );
  const filteredNearEvents = useMemo(
    () => filterEventsByCategory(nearbyEvents),
    [nearbyEvents, filter, selectedCategory],
  );
  const filteredRecEvents = useMemo(
    () => filterEventsByCategory(recommendedEvents),
    [recommendedEvents, filter, selectedCategory],
  );
  const filteredUpcoming = useMemo(
    () => filterEventsByCategory(upcomingEvents),
    [upcomingEvents, filter, selectedCategory],
  );
  const filteredOther = useMemo(
    () => filterEventsByCategory(otherEvents),
    [otherEvents, filter, selectedCategory],
  );

  const filteredVenues = useMemo(() => {
    if (filter !== 'lugares' || !selectedCategory) return publishedVenues;
    return publishedVenues.filter((v) => matchesDiscoverVenue(v, selectedCategory));
  }, [publishedVenues, filter, selectedCategory]);

  const filteredProviders = useMemo(() => {
    if (filter !== 'servicios' || !selectedCategory) return serviceProviders;
    return serviceProviders.filter((provider) => {
      const serviceMatches = (provider.services || []).some((service) => (
        matchesDiscoverServiceCategory(service, selectedCategory)
      ));
      if (serviceMatches) return true;
      return matchesDiscoverServiceCategory(
        { role: provider.primaryRole, name: provider.name },
        selectedCategory,
      );
    });
  }, [serviceProviders, filter, selectedCategory]);

  const filteredServiceCards = useMemo(() => {
    if (filter !== 'servicios' || !selectedCategory) return nearbyServiceCards;
    return nearbyServiceCards.filter((service) => (
      matchesDiscoverServiceCategory(
        { role: service.role, name: service.name, description: service.description },
        selectedCategory,
      )
    ));
  }, [nearbyServiceCards, filter, selectedCategory]);

  const topStrip: { title: string; items: Category[] } | null =
    filter === 'eventos' ? { title: 'Tipo de eventos', items: categories } :
    filter === 'lugares' ? { title: 'Tipo de lugares', items: venueCategories } :
    filter === 'servicios' ? { title: 'Tipo de servicios', items: serviceCategories } :
    null;

  const handleFilterChange = (next: FilterType) => {
    setFilter(next);
    setSelectedCategory(null);
  };

  const filterPills: { id: FilterType; label: string; dot: string }[] = [
    { id: 'todos', label: 'Todos', dot: '' },
    { id: 'eventos', label: 'Eventos', dot: 'bg-primary' },
    { id: 'lugares', label: 'Lugares', dot: 'bg-accent-foreground/70' },
    { id: 'servicios', label: 'Servicios', dot: 'bg-success' },
  ];

  const isInitialDiscoverLoad = discoverLoading
    && !publishedEvents.length
    && !favoriteEvents.length
    && !nearbyEvents.length
    && !recommendedEvents.length
    && !publishedVenues.length;

  return (
    <div className="mx-auto max-w-lg pb-40 bg-background">
      {isInitialDiscoverLoad && (
        <div className="px-4 pt-4 space-y-6">
          <div className="flex gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-muted" />
            ))}
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              <div className="flex gap-4 overflow-hidden">
                {[1, 2].map((j) => (
                  <div key={j} className="h-52 w-[210px] shrink-0 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {discoverLoading && !isInitialDiscoverLoad && (
        <div className="flex items-center justify-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          Actualizando descubrimiento…
        </div>
      )}
      <div className="px-4 pt-4 pb-5">
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-1 px-1">
          {filterPills.map((p) => {
            const active = filter === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleFilterChange(p.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-extrabold whitespace-nowrap shadow-sm transition-all border border-border/60 ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground hover:bg-accent/50'
                }`}
              >
                {p.dot && <span className={`h-2 w-2 rounded-full ${p.dot}`} />}
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {topStrip && !isInitialDiscoverLoad && (
        <div className="px-4 pt-2 pb-2">
          <h2 className="text-lg font-extrabold text-foreground">{topStrip.title}</h2>
          <div className={`${HORIZONTAL_SCROLL} mt-4`}>
            {topStrip.items.map((c) => {
              const Icon = c.icon;
              const isActive = selectedCategory === c.label;
              const clickable = filter === 'servicios' || filter === 'eventos' || filter === 'lugares';
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => clickable && setSelectedCategory(isActive ? null : c.label)}
                  className="flex flex-col items-center gap-1.5 min-w-[64px] max-w-[64px]"
                >
                  <div className={`h-14 w-14 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-primary ring-2 ring-primary/40' : c.bg}`}>
                    <Icon className={`h-6 w-6 ${isActive ? 'text-primary-foreground' : c.color}`} strokeWidth={2} />
                  </div>
                  <span className={`text-[11px] font-extrabold text-center leading-tight line-clamp-2 ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!isInitialDiscoverLoad && showEvents && filteredMyEvents.length === 0 && filter !== 'lugares' && filter !== 'servicios' && (
        <section className="px-4 pt-6">
          <SectionHeader title="Tus eventos publicados" />
          <EmptyHint icon={CalendarDays}>
            Aún no has publicado eventos. Crea uno para que aparezca aquí.
          </EmptyHint>
          {onCreateEvent && (
            <Button className="mt-4 w-full rounded-full font-extrabold shadow-sm" size="lg" type="button" onClick={onCreateEvent}>
              Crear evento
            </Button>
          )}
        </section>
      )}

      {!isInitialDiscoverLoad && showEvents && filteredMyEvents.length > 0 && (
        <section className="px-4 pt-6 first:pt-2">
          <SectionHeader title="Tus eventos publicados" />
          <div
            className={HORIZONTAL_SCROLL}
            onScroll={(e) => {
              const el = e.currentTarget;
              const cardWidth = 226;
              setMyEventsDot(Math.min(filteredMyEvents.length - 1, Math.round(el.scrollLeft / cardWidth)));
            }}
          >
            {filteredMyEvents.map((e) => (
              <div key={e.id} className="snap-start">
                <EventCard event={e} onClick={() => onOpenEvent?.(e)} isFavorite={isFavorite(e.id)} onToggleFavorite={onToggleFavorite} />
              </div>
            ))}
          </div>
          <Dots count={filteredMyEvents.length} active={myEventsDot} />
        </section>
      )}

      {!isInitialDiscoverLoad && showEvents && (
        <section className="px-4 pt-6">
          <SectionHeader title="Eventos Favoritos" />
          {filteredFavEvents.length > 0 ? (
            <>
              <div className={HORIZONTAL_SCROLL}>
                {filteredFavEvents.map((e) => (
                  <EventCard key={e.id} event={e} onClick={() => onOpenEvent?.(e)} isFavorite={isFavorite(e.id)} onToggleFavorite={onToggleFavorite} />
                ))}
              </div>
              <Dots count={filteredFavEvents.length} />
            </>
          ) : (
            <EmptyHint icon={Heart}>Marca eventos con me gusta para verlos aquí.</EmptyHint>
          )}
        </section>
      )}

      {!isInitialDiscoverLoad && showEvents && (
        <section className="px-4 pt-8 border-t border-border/60 mt-6">
          <div className="pt-6">
            <SectionHeader title="Eventos cercanos a tu ubicación" action onAction={onViewAllNearby} />
            {filteredNearEvents.length > 0 ? (
              <>
                <div className={HORIZONTAL_SCROLL}>
                  {filteredNearEvents.map((e) => (
                    <EventCard key={e.id} event={e} onClick={() => onOpenEvent?.(e)} isFavorite={isFavorite(e.id)} onToggleFavorite={onToggleFavorite} />
                  ))}
                </div>
                <Dots count={filteredNearEvents.length} />
              </>
            ) : (
              <EmptyHint icon={MapPin}>Activa tu ubicación para descubrir eventos cerca de ti.</EmptyHint>
            )}
          </div>
        </section>
      )}

      {!isInitialDiscoverLoad && showVenues && (
        <section className="px-4 pt-8">
          <SectionHeader title="Lugares cercanos a tu ubicación" action onAction={onViewAllVenues} />
          {filteredVenues.length > 0 ? (
            <>
              <div className={HORIZONTAL_SCROLL}>
                {filteredVenues.map((v) => (
                  <VenueCard
                    key={v.id}
                    venue={v}
                    onClick={() => onOpenVenue?.(v)}
                    isLiked={isVenueLiked(v.id)}
                    onToggleLike={onToggleVenueLike ? () => onToggleVenueLike(v.id) : undefined}
                  />
                ))}
              </div>
              <Dots count={filteredVenues.length} />
            </>
          ) : (
            <EmptyHint>
              {selectedCategory
                ? `No hay lugares de tipo «${selectedCategory}» cerca de tu ubicación.`
                : 'No hay lugares publicados cerca de tu ubicación.'}
            </EmptyHint>
          )}
        </section>
      )}

      {!isInitialDiscoverLoad && showServices && (
        <FeedServicesCarousel
          providers={filteredServiceCards}
          loading={servicesLoading}
          onOpenService={onOpenService}
          likedServiceIds={likedServiceIds}
          onToggleServiceLike={onToggleServiceLike}
        />
      )}

      {!isInitialDiscoverLoad && showServices && (
        <section className="px-4 pt-8">
          <SectionHeader
            title={selectedCategory ? `Perfiles · ${selectedCategory}` : 'Perfiles que prestan servicios'}
            action
            onAction={onViewAllProviders}
          />
          {servicesLoading ? (
            <div className="mt-4 flex items-center justify-center gap-2 py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Buscando servicios cerca…</span>
            </div>
          ) : filteredProviders.length > 0 ? (
            <>
              <div className={HORIZONTAL_SCROLL}>
                {filteredProviders.map((p) => (
                  <ProviderProfileCard
                    key={p.userId}
                    provider={p}
                    onClick={() => onOpenServiceProvider?.(p)}
                    isLiked={p.primaryServiceId ? isServiceLiked(p.primaryServiceId) : false}
                    onToggleLike={
                      p.primaryServiceId && onToggleServiceLike
                        ? () => onToggleServiceLike(p.primaryServiceId!)
                        : undefined
                    }
                    onReserve={
                      p.primaryServiceId
                        ? () => onReserveService?.(p.primaryServiceId!)
                        : undefined
                    }
                  />
                ))}
              </div>
              <Dots count={filteredProviders.length} />
            </>
          ) : (
            <EmptyHint icon={Users}>No hay servicios publicados cerca de ti para esta categoría.</EmptyHint>
          )}
        </section>
      )}

      {!isInitialDiscoverLoad && showEvents && (
        <section className="px-4 pt-8">
          <SectionHeader title="Eventos recomendados" action onAction={onViewAllRecommended} />
          {filteredRecEvents.length > 0 ? (
            <>
              <div className={HORIZONTAL_SCROLL}>
                {filteredRecEvents.map((e) => (
                  <EventCard key={e.id} event={e} onClick={() => onOpenEvent?.(e)} isFavorite={isFavorite(e.id)} onToggleFavorite={onToggleFavorite} />
                ))}
              </div>
              <Dots count={filteredRecEvents.length} />
            </>
          ) : (
            <EmptyHint>Aún no hay eventos recomendados para ti.</EmptyHint>
          )}
        </section>
      )}

      {!isInitialDiscoverLoad && showEvents && (
        <section className="px-4 pt-8">
          <h2 className="text-lg font-extrabold text-foreground">Tus eventos vigentes</h2>
          {filteredUpcoming.length > 0 ? (
            <div className="mt-3 space-y-3">
              {filteredUpcoming.map((e) => (
                <UpcomingEventRow key={e.id} event={e} onClick={() => onOpenEvent?.(e)} isFavorite={isFavorite(e.id)} onToggleFavorite={onToggleFavorite} />
              ))}
            </div>
          ) : (
            <EmptyHint icon={CalendarDays}>No tienes eventos activos programados por ahora.</EmptyHint>
          )}
        </section>
      )}

      {!isInitialDiscoverLoad && showEvents && (
        <section className="px-4 pt-8">
          <h2 className="text-lg font-extrabold text-foreground">Otros eventos</h2>
          {filteredOther.length > 0 ? (
            <div className="mt-3 space-y-3">
              {filteredOther.map((e) => (
                <OtherEventRow key={e.id} event={e} onClick={() => onOpenEvent?.(e)} isFavorite={isFavorite(e.id)} onToggleFavorite={onToggleFavorite} />
              ))}
            </div>
          ) : (
            <EmptyHint>No hay más eventos para mostrar en este momento.</EmptyHint>
          )}
        </section>
      )}

      {!isInitialDiscoverLoad && showEvents && (
        <section className="px-4 pt-8 text-center">
          <div className="rounded-2xl bg-card border border-dashed border-primary/25 p-6 flex flex-col items-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <CalendarDays className="h-7 w-7 text-primary" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Crea tu primer evento y hazte conocer<br />en nuestra red de <strong className="text-foreground">eventers</strong>
            </p>
            <Button className="mt-4 w-full rounded-full font-extrabold shadow-sm" size="lg" type="button" onClick={onCreateEvent}>
              Crear evento
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default EventsView;
