import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import {
  EVENTS_CACHE_INVALIDATED_EVENT,
  SERVICES_CACHE_INVALIDATED_EVENT,
  VENUES_CACHE_INVALIDATED_EVENT,
  applyProfileCityAsLocation,
  buildDiscoverLocationKey,
  cacheDiscover,
  fetchEventsFeed,
  fetchNearbyEvents,
  fetchNearbyServices,
  fetchNearbyVenues,
  fetchOwnerRentalVenues,
  fetchUserById,
  fetchUserEvents,
  fetchFavoriteUserEvents,
  fetchLikedServiceIds,
  fetchLikedVenueIds,
  getCachedDiscover,
  invalidateDiscoverCache,
  isDiscoverCacheFresh,
  getCachedProfiles,
  getStoredUserLocation,
  type StoredUserLocation,
  mergeVenuesById,
  toggleEventLike,
  likeVenue,
  likeService,
  resolveUserLocation,
  useStoredUserLocation,
  RootState,
  useToast,
  EVENT_FAVORITE_CHANGED_EVENT,
  dispatchEventFavoriteChanged,
  syncEventFavoriteWithFeedPublications,
  USER_LOCATION_CHANGED_EVENT,
  filterByOwnerPrivacyFailOpen,
  type FeedEventItem,
  type NearbyServiceProvider,
  type NearbyVenue,
} from '@doevents/shared';
import EventsView from '@lovable/components/feed/EventsView';
import { feedEventToDiscoverItem } from '../lovable-bridge/discoverAdapter';
import {
  buildNearbyEventsFromCatalog,
  discoverNearbyLooksIncomplete,
  filterAndSortMyPublishedEvents,
  filterDiscoverFeedEvents,
} from '../lovable-bridge/discoverEventFilters';
import {
  buildOtherDiscoverEvents,
  buildUpcomingDiscoverEvents,
  splitRecommendedCarousel,
} from '../lovable-bridge/discoverSections';
import { groupServicesByProvider } from '../lovable-bridge/servicesAdapter';
import { nearbyVenueToPublishedDraft } from '../lovable-bridge/venuesAdapter';
import { providerToCard } from '../lovable-bridge/useNearbyServices';
import type { FeedServiceCard } from '@lovable/components/feed/FeedServicesCarousel';
import DiscoverServiceDetailOverlay from '../components/DiscoverServiceDetailOverlay';

const NEARBY_RADIUS_KM = 100;
const NEARBY_FETCH_LIMIT = 80;
const DISCOVER_FEED_LIMIT = 100;
const FAVORITE_REFRESH_EVENT = EVENT_FAVORITE_CHANGED_EVENT;

function sortEventsByDistance(items: FeedEventItem[]): FeedEventItem[] {
  return [...items].sort((a, b) => (a.distancia ?? Infinity) - (b.distancia ?? Infinity));
}

function sortServicesByDistance(items: NearbyServiceProvider[]): NearbyServiceProvider[] {
  return [...items].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
}

function sortVenuesByDistance(items: NearbyVenue[]): NearbyVenue[] {
  return [...items].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
}

function hasDiscoverContent(cached: {
  nearby?: FeedEventItem[];
  recommended?: FeedEventItem[];
  services?: NearbyServiceProvider[];
  venues?: NearbyVenue[];
}): boolean {
  return Boolean(
    cached.nearby?.length
    || cached.recommended?.length
    || cached.services?.length
    || cached.venues?.length,
  );
}

function mergeDiscoverSupplementalCatalog(
  catalog: FeedEventItem[],
  supplementalCatalog: FeedEventItem[] = [],
): FeedEventItem[] {
  const mergedCatalog = [...catalog];
  const seen = new Set(catalog.map((event) => event.id).filter(Boolean));
  for (const event of supplementalCatalog) {
    if (!event.id || seen.has(event.id)) continue;
    mergedCatalog.push(event);
    seen.add(event.id);
  }
  return mergedCatalog;
}

function resolveNearbyEvents(
  apiNearby: FeedEventItem[],
  catalog: FeedEventItem[],
  loc: StoredUserLocation | null,
  supplementalCatalog: FeedEventItem[] = [],
): FeedEventItem[] {
  const filtered = filterDiscoverFeedEvents(apiNearby);
  if (!loc) return sortEventsByDistance(filtered);
  return buildNearbyEventsFromCatalog(
    mergeDiscoverSupplementalCatalog(catalog, supplementalCatalog),
    loc.lat,
    loc.lng,
    NEARBY_RADIUS_KM,
    sortEventsByDistance(filtered),
  );
}

function shouldSkipDiscoverNetworkRefresh(
  cached: {
    nearby?: FeedEventItem[];
    recommended?: FeedEventItem[];
    myEvents?: FeedEventItem[];
    favorites?: FeedEventItem[];
    services?: NearbyServiceProvider[];
    venues?: NearbyVenue[];
    locationBoundFetched?: boolean;
  },
  loc: StoredUserLocation | null,
  cacheFresh: boolean,
): boolean {
  if (!cacheFresh || !hasDiscoverContent(cached)) return false;
  if (loc && !(cached.nearby?.length)) return false;
  // Con ubicación: no saltar si nunca se completó el fetch geo de lugares/servicios.
  // Antes se saltaba solo por tener eventos sintetizados → Descubre sin marketplace.
  if (loc && !cached.locationBoundFetched) return false;
  const supplementalCatalog = filterDiscoverFeedEvents([
    ...(cached.myEvents || []),
    ...(cached.favorites || []),
  ]);
  if (discoverNearbyLooksIncomplete(
    cached.nearby || [],
    cached.recommended || [],
    loc?.lat,
    loc?.lng,
    NEARBY_RADIUS_KM,
    supplementalCatalog,
  )) {
    return false;
  }
  return true;
}

async function enrichProviderAvatars(
  providers: ReturnType<typeof groupServicesByProvider>,
): Promise<ReturnType<typeof groupServicesByProvider>> {
  if (!providers.length) return providers;
  const profiles = await getCachedProfiles(providers.map((p) => p.userId));
  return providers.map((p) => {
    const profile = profiles.get(p.userId);
    return {
      ...p,
      avatarUrl: profile?.imagen || p.avatarUrl,
    };
  });
}

async function resolveDiscoverLocation(
  userId?: string,
  stored?: StoredUserLocation | null,
): Promise<StoredUserLocation | null> {
  if (stored) return stored;
  const fromDevice = await resolveUserLocation({ prompt: false }).catch(() => null);
  if (fromDevice) return fromDevice;
  if (!userId) return null;
  const profile = await fetchUserById(userId).catch(() => null);
  if (!profile?.ciudad) return null;
  return applyProfileCityAsLocation(profile.ciudad, profile.departamento).catch(() => null);
}

export const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const userLocation = useStoredUserLocation();
  const [loading, setLoading] = useState(true);
  const [nearby, setNearby] = useState<ReturnType<typeof feedEventToDiscoverItem>[]>([]);
  const [recommendedAll, setRecommendedAll] = useState<ReturnType<typeof feedEventToDiscoverItem>[]>([]);
  const [favorites, setFavorites] = useState<ReturnType<typeof feedEventToDiscoverItem>[]>([]);
  const [myEvents, setMyEvents] = useState<ReturnType<typeof feedEventToDiscoverItem>[]>([]);
  const [serviceProviders, setServiceProviders] = useState<ReturnType<typeof groupServicesByProvider>>([]);
  const [nearbyServiceCards, setNearbyServiceCards] = useState<FeedServiceCard[]>([]);
  const [publishedVenues, setPublishedVenues] = useState<ReturnType<typeof nearbyVenueToPublishedDraft>[]>([]);
  const [likedVenueIds, setLikedVenueIds] = useState<Set<string>>(new Set());
  const [likedServiceIds, setLikedServiceIds] = useState<Set<string>>(new Set());
  const [discoverService, setDiscoverService] = useState<{ id: string; openBooking?: boolean } | null>(null);
  const [effectiveLocation, setEffectiveLocation] = useState<StoredUserLocation | null>(() => getStoredUserLocation());
  const loadGenerationRef = useRef(0);

  const recommendedCarousel = useMemo(() => splitRecommendedCarousel(recommendedAll), [recommendedAll]);
  const upcomingEvents = useMemo(() => buildUpcomingDiscoverEvents(myEvents), [myEvents]);
  const otherEvents = useMemo(
    () => buildOtherDiscoverEvents(recommendedAll, { nearby, favorites, myEvents }),
    [recommendedAll, nearby, favorites, myEvents],
  );
  const favoriteEventIds = useMemo(
    () => new Set(favorites.map((e) => e.id).filter(Boolean)),
    [favorites],
  );

  const findDiscoverEvent = (eventId: string) => (
    [...nearby, ...recommendedAll, ...recommendedCarousel, ...myEvents, ...favorites]
      .find((e) => e.id === eventId)
  );

  const handleToggleFavorite = async (eventId: string) => {
    if (!userId) {
      showToast('Inicia sesión para guardar favoritos', 'error');
      navigate('/auth/login');
      return;
    }
    const isFavorite = favoriteEventIds.has(eventId);
    const liked = !isFavorite;
    setFavorites((prev) => {
      if (!liked) return prev.filter((e) => e.id !== eventId);
      const source = findDiscoverEvent(eventId);
      if (!source || prev.some((e) => e.id === eventId)) return prev;
      return [source, ...prev];
    });
    dispatchEventFavoriteChanged(eventId, liked, isFavorite);
    try {
      await toggleEventLike(userId, eventId, liked);
      await syncEventFavoriteWithFeedPublications(eventId, liked, isFavorite);
      invalidateDiscoverCache();
    } catch (err) {
      setFavorites((prev) => {
        if (isFavorite) {
          const source = findDiscoverEvent(eventId);
          if (!source || prev.some((e) => e.id === eventId)) return prev;
          return [source, ...prev];
        }
        return prev.filter((e) => e.id !== eventId);
      });
      dispatchEventFavoriteChanged(eventId, isFavorite, liked);
      showToast(err instanceof Error ? err.message : 'No se pudo actualizar favoritos', 'error');
    }
  };

  const handleToggleVenueLike = async (venueId: string) => {
    if (!userId) {
      showToast('Inicia sesión para dar me gusta', 'error');
      navigate('/auth/login');
      return;
    }
    const wasLiked = likedVenueIds.has(venueId);
    const like = !wasLiked;
    setLikedVenueIds((prev) => {
      const next = new Set(prev);
      if (like) next.add(venueId);
      else next.delete(venueId);
      return next;
    });
    try {
      await likeVenue(venueId, userId, like);
    } catch (err) {
      setLikedVenueIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(venueId);
        else next.delete(venueId);
        return next;
      });
      showToast(err instanceof Error ? err.message : 'No se pudo actualizar me gusta', 'error');
    }
  };

  const handleToggleServiceLike = async (serviceId: string) => {
    if (!userId) {
      showToast('Inicia sesión para dar me gusta', 'error');
      navigate('/auth/login');
      return;
    }
    const wasLiked = likedServiceIds.has(serviceId);
    const like = !wasLiked;
    setLikedServiceIds((prev) => {
      const next = new Set(prev);
      if (like) next.add(serviceId);
      else next.delete(serviceId);
      return next;
    });
    try {
      await likeService(serviceId, userId, like);
    } catch (err) {
      setLikedServiceIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(serviceId);
        else next.delete(serviceId);
        return next;
      });
      showToast(err instanceof Error ? err.message : 'No se pudo actualizar me gusta', 'error');
    }
  };

  const loadLikedDiscoverItems = async (
    venueIds: string[],
    serviceIds: string[],
    currentUserId?: string,
  ) => {
    if (!currentUserId) {
      setLikedVenueIds(new Set());
      setLikedServiceIds(new Set());
      return;
    }
    const [venueLikes, serviceLikes] = await Promise.all([
      fetchLikedVenueIds(currentUserId, venueIds).catch(() => new Set<string>()),
      fetchLikedServiceIds(currentUserId, serviceIds).catch(() => new Set<string>()),
    ]);
    setLikedVenueIds(venueLikes);
    setLikedServiceIds(serviceLikes);
  };

  const applyDiscoverPayload = async (
    loc: StoredUserLocation | null,
    sortedNearby: FeedEventItem[],
    feedItems: FeedEventItem[],
    mineItems: FeedEventItem[],
    favItems: FeedEventItem[],
    sortedServices: NearbyServiceProvider[],
    mergedVenues: NearbyVenue[],
  ) => {
    const mappedNearby = sortedNearby.map(feedEventToDiscoverItem);
    const mappedRecommended = filterDiscoverFeedEvents(feedItems).map(feedEventToDiscoverItem);
    const nearbyDistances = new Map(
      sortedNearby.filter((e) => e.id).map((e) => [e.id!, e.distancia ?? Infinity]),
    );
    const sortedMine = filterAndSortMyPublishedEvents(filterDiscoverFeedEvents(mineItems), {
      userLat: loc?.lat,
      userLng: loc?.lng,
      radiusKm: NEARBY_RADIUS_KM,
      nearbyDistances,
    });
    const mappedMy = sortedMine.map(feedEventToDiscoverItem);
    const mappedFav = filterDiscoverFeedEvents(favItems).map(feedEventToDiscoverItem);

    setNearby(mappedNearby);
    setRecommendedAll(mappedRecommended);
    setMyEvents(mappedMy);
    setFavorites(mappedFav);
    // Pintar lugares/servicios ANTES del enrich de avatares (si cuelga, las secciones ya existen).
    setNearbyServiceCards(sortedServices.map(providerToCard));
    setPublishedVenues(mergedVenues.map(nearbyVenueToPublishedDraft));
    const providers = groupServicesByProvider(sortedServices);
    setServiceProviders(providers);
    void enrichProviderAvatars(providers)
      .then((enrichedProviders) => {
        setServiceProviders(enrichedProviders);
      })
      .catch(() => {
        /* keep unenriched providers */
      });
    void loadLikedDiscoverItems(
      mergedVenues.map((v) => v.venueId).filter(Boolean),
      sortedServices.map((s) => s.serviceId).filter(Boolean),
      userId || undefined,
    );
  };

  const load = async (loc: StoredUserLocation | null, forceNetwork = false) => {
    const generation = ++loadGenerationRef.current;
    const isCurrentLoad = () => generation === loadGenerationRef.current;

    setEffectiveLocation(loc);
    const locationKey = buildDiscoverLocationKey(loc?.lat, loc?.lng, userId || undefined);
    const cacheFresh = !forceNetwork && isDiscoverCacheFresh(locationKey);
    const supplementalFromCache = (cachedMy: FeedEventItem[], cachedFav: FeedEventItem[]) => (
      filterDiscoverFeedEvents([...cachedMy, ...cachedFav])
    );

    if (!forceNetwork) {
      const cached = getCachedDiscover(locationKey, true);
      if (cached) {
        const cachedRecommended = filterDiscoverFeedEvents(cached.recommended || []);
        const cachedMine = filterDiscoverFeedEvents(cached.myEvents || []);
        const cachedFav = filterDiscoverFeedEvents(cached.favorites || []);
        const sortedNearby = resolveNearbyEvents(
          cached.nearby || [],
          cachedRecommended,
          loc,
          supplementalFromCache(cachedMine, cachedFav),
        );
        if (!isCurrentLoad()) return;
        await applyDiscoverPayload(
          loc,
          sortedNearby,
          cachedRecommended,
          cached.myEvents,
          cached.favorites,
          sortServicesByDistance(cached.services || []),
          sortVenuesByDistance(cached.venues || []),
        );
        if (!isCurrentLoad()) return;
        setLoading(false);
        if (shouldSkipDiscoverNetworkRefresh(cached, loc, cacheFresh)) {
          return;
        }
      }
    }

    setLoading(true);
    try {
      const [nearbyRes, feedRes, mineRes, favRes, servicesRes, venuesRes] = await Promise.all([
        loc
          ? fetchNearbyEvents(loc.lat, loc.lng, NEARBY_RADIUS_KM, userId || undefined, NEARBY_FETCH_LIMIT).catch((err) => {
            console.warn('[Descubre] fetchNearbyEvents falló', err);
            return [] as FeedEventItem[];
          })
          : Promise.resolve([]),
        fetchEventsFeed(userId || undefined, 0, DISCOVER_FEED_LIMIT, { forceNetwork: true }).catch(() => ({ items: [] as FeedEventItem[] })),
        userId
          ? fetchUserEvents(userId, { forceNetwork: true }).catch(() => ({ data: { datosEvento: [] as FeedEventItem[] } }))
          : Promise.resolve({ data: { datosEvento: [] as FeedEventItem[] } }),
        userId
          ? fetchFavoriteUserEvents(userId, 40).catch(() => [])
          : Promise.resolve([]),
        loc
          ? fetchNearbyServices(loc.lat, loc.lng, NEARBY_RADIUS_KM, 40, { forceNetwork: true }).catch(() => [])
          : Promise.resolve([]),
        loc
          ? fetchNearbyVenues(loc.lat, loc.lng, NEARBY_RADIUS_KM, 40, { forceNetwork: true }).catch(() => [])
          : Promise.resolve([]),
      ]);

      if (!isCurrentLoad()) return;

      const feedItemsRaw = filterDiscoverFeedEvents(feedRes.items || []);
      const feedItems = await filterByOwnerPrivacyFailOpen(
        feedItemsRaw,
        (item) => item.userId,
        userId || undefined,
        4000,
      );
      if (!isCurrentLoad()) return;

      const mineItems = filterDiscoverFeedEvents(mineRes.data?.datosEvento || []);
      const favItems = filterDiscoverFeedEvents(Array.isArray(favRes) ? favRes : []);
      const sortedNearby = resolveNearbyEvents(
        nearbyRes,
        feedItems,
        loc,
        supplementalFromCache(mineItems, favItems),
      );
      const sortedServices = sortServicesByDistance(servicesRes);
      let mergedVenues = sortVenuesByDistance(venuesRes);
      if (userId) {
        const ownVenues = await fetchOwnerRentalVenues(userId).catch(() => []);
        if (!isCurrentLoad()) return;
        mergedVenues = sortVenuesByDistance(mergeVenuesById(mergedVenues, ownVenues));
      }

      if (!isCurrentLoad()) return;
      await applyDiscoverPayload(loc, sortedNearby, feedItems, mineItems, favItems, sortedServices, mergedVenues);

      if (!isCurrentLoad()) return;
      cacheDiscover({
        locationKey,
        nearby: sortedNearby,
        recommended: feedItems,
        myEvents: mineItems,
        favorites: favItems,
        services: sortedServices,
        venues: mergedVenues,
        locationBoundFetched: Boolean(loc),
      });
    } catch (err) {
      if (!isCurrentLoad()) return;
      showToast(err instanceof Error ? err.message : 'No se pudo cargar Descubre', 'error');
    } finally {
      if (isCurrentLoad()) {
        setLoading(false);
      }
    }
  };

  const handleRequestLocation = async () => {
    const resolved = await resolveUserLocation({ prompt: true, force: true }).catch(() => null);
    if (resolved) {
      setEffectiveLocation(resolved);
      void load(resolved, true);
      return;
    }
    showToast('Activa la ubicación del navegador o indícala desde el Feed o el Mapa', 'error');
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const stored = userLocation ?? getStoredUserLocation();
      const loc = await resolveDiscoverLocation(userId || undefined, stored);
      if (cancelled) return;
      const locationKey = buildDiscoverLocationKey(loc?.lat, loc?.lng, userId || undefined);
      const staleEmpty = getCachedDiscover(locationKey, true);
      if (staleEmpty && !hasDiscoverContent(staleEmpty)) {
        invalidateDiscoverCache();
      }
      setEffectiveLocation(loc);
      // forceNetwork en el primer paint: evita quedarnos con caché incompleta de sesiones previas.
      await load(loc, true);
    };
    void run();

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<StoredUserLocation>).detail;
      const next = detail || getStoredUserLocation();
      setEffectiveLocation(next);
      void load(next, true);
    };
    const onCacheInvalidated = () => { void load(getStoredUserLocation(), true); };
    const onFavorite = () => { void load(getStoredUserLocation(), true); };

    window.addEventListener(USER_LOCATION_CHANGED_EVENT, handler);
    window.addEventListener(EVENTS_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    window.addEventListener(SERVICES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    window.addEventListener(VENUES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    window.addEventListener(FAVORITE_REFRESH_EVENT, onFavorite);
    return () => {
      cancelled = true;
      window.removeEventListener(USER_LOCATION_CHANGED_EVENT, handler);
      window.removeEventListener(EVENTS_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
      window.removeEventListener(SERVICES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
      window.removeEventListener(VENUES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
      window.removeEventListener(FAVORITE_REFRESH_EVENT, onFavorite);
    };
  }, [userId, userLocation?.lat, userLocation?.lng]);

  const openDiscoverService = (card: FeedServiceCard, openBooking = false) => {
    if (card.id && !/^sp-\d+$/i.test(card.id)) {
      setDiscoverService({ id: card.id, openBooking });
    }
  };

  if (loading && !nearby.length && !recommendedAll.length && !serviceProviders.length && !publishedVenues.length) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 bg-background pb-24">
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-10 py-12 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">Descubriendo eventos cerca de ti…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24" aria-label="Descubre eventos">
      {discoverService ? (
        <DiscoverServiceDetailOverlay
          serviceId={discoverService.id}
          openBookingOnMount={discoverService.openBooking}
          onBack={() => setDiscoverService(null)}
        />
      ) : null}
      <EventsView
        publishedEvents={myEvents}
        nearbyEvents={nearby}
        recommendedEvents={recommendedCarousel}
        favoriteEvents={favorites}
        upcomingEvents={upcomingEvents}
        otherEvents={otherEvents}
        publishedVenues={publishedVenues}
        nearbyServiceCards={nearbyServiceCards}
        servicesLoading={loading}
        discoverLoading={loading}
        hasUserLocation={Boolean(effectiveLocation ?? userLocation)}
        nearbyRadiusKm={NEARBY_RADIUS_KM}
        userLocationLabel={(effectiveLocation ?? userLocation)?.label || (effectiveLocation ?? userLocation)?.city}
        onRequestLocation={() => { void handleRequestLocation(); }}
        serviceProviders={serviceProviders.map((p) => ({
          userId: p.userId,
          name: p.name,
          avatarUrl: p.avatarUrl,
          username: p.username,
          servicesCount: p.servicesCount,
          rating: p.rating,
          primaryRole: p.primaryRole,
          primaryServiceId: p.services[0]?.serviceId,
          services: p.services.map((service) => ({
            role: service.role,
            category: service.category,
            description: service.description,
            sectors: service.sectors,
            name: service.name,
          })),
        }))}
        onCreateEvent={() => navigate('/events/create')}
        onOpenEvent={(event) => {
          if (event.id) navigate(`/events/${event.id}`);
        }}
        onOpenVenue={(venue) => {
          if (venue?.id) navigate(`/places/${venue.id}`);
          else navigate('/places/publish');
        }}
        onOpenServiceProvider={(provider) => navigate(`/users/${provider.userId}/services`)}
        onOpenService={(card) => openDiscoverService(card)}
        onReserveServiceCard={(card) => openDiscoverService(card, true)}
        onEditServiceCard={(card) => {
          if (card.id) navigate(`/services/${card.id}/edit`);
        }}
        currentUserId={userId}
        onReserveService={(serviceId) => setDiscoverService({ id: serviceId, openBooking: true })}
        onViewAllNearby={() => navigate('/map')}
        onViewAllRecommended={() => navigate('/events')}
        onViewAllVenues={() => navigate('/places')}
        onViewAllProviders={() => navigate('/services')}
        favoriteEventIds={favoriteEventIds}
        onToggleFavorite={(eventId) => { void handleToggleFavorite(eventId); }}
        likedVenueIds={likedVenueIds}
        onToggleVenueLike={(venueId) => { void handleToggleVenueLike(venueId); }}
        likedServiceIds={likedServiceIds}
        onToggleServiceLike={(serviceId) => { void handleToggleServiceLike(serviceId); }}
      />
    </div>
  );
};

export default EventsPage;
