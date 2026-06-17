import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  EVENTS_CACHE_INVALIDATED_EVENT,
  SERVICES_CACHE_INVALIDATED_EVENT,
  VENUES_CACHE_INVALIDATED_EVENT,
  buildDiscoverLocationKey,
  cacheDiscover,
  fetchEventsFeed,
  fetchNearbyEvents,
  fetchNearbyServices,
  fetchNearbyVenues,
  fetchOwnerRentalVenues,
  mergeVenuesById,
  fetchUserEvents,
  fetchFavoriteUserEvents,
  fetchLikedServiceIds,
  fetchLikedVenueIds,
  getCachedDiscover,
  invalidateDiscoverCache,
  isDiscoverCacheFresh,
  getCachedProfiles,
  getStoredUserLocation,
  toggleEventLike,
  likeVenue,
  likeService,
  resolveUserLocation,
  Loader,
  RootState,
  useToast,
  EVENT_FAVORITE_CHANGED_EVENT,
  dispatchEventFavoriteChanged,
  syncEventFavoriteWithFeedPublications,
  USER_LOCATION_CHANGED_EVENT,
  type FeedEventItem,
  type NearbyServiceProvider,
  type NearbyVenue,
  type StoredUserLocation,
} from '@doevents/shared';
import EventsView from '@lovable/components/feed/EventsView';
import { feedEventToDiscoverItem } from '../lovable-bridge/discoverAdapter';
import { filterAndSortMyPublishedEvents } from '../lovable-bridge/discoverEventFilters';
import {
  buildOtherDiscoverEvents,
  buildUpcomingDiscoverEvents,
  splitRecommendedCarousel,
} from '../lovable-bridge/discoverSections';
import { groupServicesByProvider } from '../lovable-bridge/servicesAdapter';
import { providerToCard } from '../lovable-bridge/useNearbyServices';
import type { FeedServiceCard } from '@lovable/components/feed/FeedServicesCarousel';
import { nearbyVenueToPublishedDraft } from '../lovable-bridge/venuesAdapter';

const NEARBY_RADIUS_KM = 50;

function sortEventsByDistance(items: FeedEventItem[]): FeedEventItem[] {
  return [...items].sort((a, b) => (a.distancia ?? Infinity) - (b.distancia ?? Infinity));
}

function sortServicesByDistance(items: NearbyServiceProvider[]): NearbyServiceProvider[] {
  return [...items].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
}

function sortVenuesByDistance(items: NearbyVenue[]): NearbyVenue[] {
  return [...items].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
}

const FAVORITE_REFRESH_EVENT = EVENT_FAVORITE_CHANGED_EVENT;

async function enrichProviderAvatars(
  providers: ReturnType<typeof groupServicesByProvider>,
): Promise<ReturnType<typeof groupServicesByProvider>> {
  if (!providers.length) return providers;
  const profiles = await getCachedProfiles(providers.map((p) => p.userId));
  return providers.map((p) => {
    const profile = profiles.get(p.userId);
    const avatarFromProfile = profile?.imagen;
    return {
      ...p,
      avatarUrl: avatarFromProfile || p.avatarUrl,
    };
  });
}

export const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);
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

  const recommendedCarousel = useMemo(
    () => splitRecommendedCarousel(recommendedAll),
    [recommendedAll],
  );

  const upcomingEvents = useMemo(
    () => buildUpcomingDiscoverEvents(myEvents),
    [myEvents],
  );

  const otherEvents = useMemo(
    () => buildOtherDiscoverEvents(recommendedAll, {
      nearby,
      favorites,
      myEvents,
    }),
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

  const load = async (loc: StoredUserLocation | null, forceNetwork = false) => {
    const locationKey = buildDiscoverLocationKey(loc?.lat, loc?.lng, userId || undefined);
    const cacheFresh = !forceNetwork && isDiscoverCacheFresh(locationKey);

    if (!forceNetwork) {
      const cached = getCachedDiscover(locationKey, true);
      if (cached) {
        const mappedNearby = sortEventsByDistance(cached.nearby).map(feedEventToDiscoverItem);
        const mappedRecommended = cached.recommended.map(feedEventToDiscoverItem);
        const nearbyDistances = new Map(
          cached.nearby.filter((e) => e.id).map((e) => [e.id!, e.distancia ?? Infinity]),
        );
        const sortedMine = filterAndSortMyPublishedEvents(cached.myEvents, {
          userLat: loc?.lat,
          userLng: loc?.lng,
          radiusKm: NEARBY_RADIUS_KM,
          nearbyDistances,
        });
        const mappedMy = sortedMine.map(feedEventToDiscoverItem);
        const mappedFav = cached.favorites.map(feedEventToDiscoverItem);
        setNearby(mappedNearby);
        setRecommendedAll(mappedRecommended);
        setMyEvents(mappedMy);
        setFavorites(mappedFav);
        const providers = groupServicesByProvider(sortServicesByDistance(cached.services || []));
        setServiceProviders(providers);
        setNearbyServiceCards(sortServicesByDistance(cached.services || []).map(providerToCard));
        setPublishedVenues(sortVenuesByDistance(cached.venues || []).map(nearbyVenueToPublishedDraft));
        setLoading(false);
        void loadLikedDiscoverItems(
          (cached.venues || []).map((v) => v.venueId).filter(Boolean),
          (cached.services || []).map((s) => s.serviceId).filter(Boolean),
          userId || undefined,
        );
        if (cacheFresh) {
          void enrichProviderAvatars(providers).then(setServiceProviders);
          return;
        }
      }
    }

    if (!cacheFresh) setLoading(true);
    try {
      const [nearbyRes, feedRes, mineRes, favRes, servicesRes, venuesRes] = await Promise.all([
        loc
          ? fetchNearbyEvents(loc.lat, loc.lng, NEARBY_RADIUS_KM, userId || undefined, 20).catch(() => [])
          : Promise.resolve([]),
        fetchEventsFeed(userId || undefined, 0, 40, { forceNetwork }).catch(() => ({ items: [] })),
        userId
          ? fetchUserEvents(userId, { forceNetwork, allEvents: true }).catch(() => ({ data: { datosEvento: [] } }))
          : Promise.resolve({ data: { datosEvento: [] } }),
        userId
          ? fetchFavoriteUserEvents(userId, 40).catch(() => [])
          : Promise.resolve([]),
        loc
          ? fetchNearbyServices(loc.lat, loc.lng, NEARBY_RADIUS_KM, 40, { forceNetwork }).catch(() => [])
          : Promise.resolve([]),
        loc
          ? fetchNearbyVenues(loc.lat, loc.lng, NEARBY_RADIUS_KM, 40, { forceNetwork }).catch(() => [])
          : Promise.resolve([]),
      ]);

      const sortedNearby = sortEventsByDistance(nearbyRes);
      const sortedServices = sortServicesByDistance(servicesRes);
      let mergedVenues = sortVenuesByDistance(venuesRes);
      if (userId) {
        const ownVenues = await fetchOwnerRentalVenues(userId).catch(() => []);
        mergedVenues = sortVenuesByDistance(mergeVenuesById(mergedVenues, ownVenues));
      }

      const mappedNearby = sortedNearby.map(feedEventToDiscoverItem);
      const mappedRecommended = (feedRes.items || []).map(feedEventToDiscoverItem);
      const nearbyDistances = new Map(
        sortedNearby.filter((e) => e.id).map((e) => [e.id!, e.distancia ?? Infinity]),
      );
      const sortedMine = filterAndSortMyPublishedEvents(mineRes.data?.datosEvento || [], {
        userLat: loc?.lat,
        userLng: loc?.lng,
        radiusKm: NEARBY_RADIUS_KM,
        nearbyDistances,
      });
      const mappedMy = sortedMine.map(feedEventToDiscoverItem);
      const mappedFav = (Array.isArray(favRes) ? favRes : []).map(feedEventToDiscoverItem);

      setNearby(mappedNearby);
      setRecommendedAll(mappedRecommended);
      setMyEvents(mappedMy);
      setFavorites(mappedFav);
      const providers = groupServicesByProvider(sortedServices);
      const enrichedProviders = await enrichProviderAvatars(providers);
      setServiceProviders(enrichedProviders);
      setNearbyServiceCards(sortedServices.map(providerToCard));
      setPublishedVenues(mergedVenues.map(nearbyVenueToPublishedDraft));

      cacheDiscover({
        locationKey,
        nearby: sortedNearby,
        recommended: feedRes.items || [],
        myEvents: mineRes.data?.datosEvento || [],
        favorites: Array.isArray(favRes) ? favRes : [],
        services: sortedServices,
        venues: mergedVenues,
      });
      void loadLikedDiscoverItems(
        mergedVenues.map((v) => v.venueId).filter(Boolean),
        sortedServices.map((s) => s.serviceId).filter(Boolean),
        userId || undefined,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      let loc = getStoredUserLocation();
      if (!loc) {
        loc = await resolveUserLocation({ prompt: true }).catch(() => null);
      }
      await load(loc);
    };
    void init();

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<StoredUserLocation>).detail;
      void load(detail || getStoredUserLocation(), true);
    };
    const onCacheInvalidated = () => { void load(getStoredUserLocation(), true); };
    const onFavorite = () => { void load(getStoredUserLocation(), true); };

    window.addEventListener(USER_LOCATION_CHANGED_EVENT, handler);
    window.addEventListener(EVENTS_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    window.addEventListener(SERVICES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    window.addEventListener(VENUES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    window.addEventListener(FAVORITE_REFRESH_EVENT, onFavorite);
    return () => {
      window.removeEventListener(USER_LOCATION_CHANGED_EVENT, handler);
      window.removeEventListener(EVENTS_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
      window.removeEventListener(SERVICES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
      window.removeEventListener(VENUES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
      window.removeEventListener(FAVORITE_REFRESH_EVENT, onFavorite);
    };
  }, [userId]);

  if (loading && !nearby.length && !recommendedAll.length && !serviceProviders.length) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  return (
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
      onOpenService={(card) => {
        if (card.id && !/^sp-\d+$/i.test(card.id)) {
          navigate(`/services/${card.id}`);
        }
      }}
      onReserveService={(serviceId) => navigate(`/services/${serviceId}`)}
      favoriteEventIds={favoriteEventIds}
      onToggleFavorite={(eventId) => { void handleToggleFavorite(eventId); }}
      likedVenueIds={likedVenueIds}
      onToggleVenueLike={(venueId) => { void handleToggleVenueLike(venueId); }}
      likedServiceIds={likedServiceIds}
      onToggleServiceLike={(serviceId) => { void handleToggleServiceLike(serviceId); }}
    />
  );
};

export default EventsPage;
