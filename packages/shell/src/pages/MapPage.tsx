import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';
import {
  EVENTS_CACHE_INVALIDATED_EVENT,
  SERVICES_CACHE_INVALIDATED_EVENT,
  VENUES_CACHE_INVALIDATED_EVENT,
  buildMapCacheKey,
  cacheMapData,
  fetchEventDetail,
  fetchNearbyEvents,
  fetchNearbyServices,
  fetchNearbyVenues,
  fetchOwnerRentalVenues,
  fetchUserEvents,
  hydrateMissingVenueImages,
  mergeVenuesById,
  getCachedMapData,
  getLastMapInteraction,
  isMapCacheFresh,
  invalidateMapCache,
  getStoredUserLocation,
  normalizeFeedEventItem,
  resolveDisplayLocation,
  resolveEventImageUrl,
  resolveImageUrl,
  resolveUserLocation,
  RootState,
  useStoredUserLocation,
  type FeedEventItem,
  type StoredUserLocation,
} from '@doevents/shared';
import MapView from '@lovable/components/feed/MapView';
import {
  feedEventsToMapItems,
  servicesToMapItems,
  venuesToMapItems,
  type MapItemData,
} from '../lovable-bridge/mapAdapter';
import { filterDiscoverFeedEvents } from '../lovable-bridge/discoverEventFilters';
import {
  filterEventsWithinRadius,
  filterServicesWithinRadius,
  filterVenuesWithinRadius,
  mapFetchLimitForRadiusKm,
} from '../lovable-bridge/mapGeoUtils';

const DISTANCE_OPTIONS = [5, 10, 25, 50, 100];

function normalizeOwnEvents(items: unknown[]): FeedEventItem[] {
  return items
    .map((item) => normalizeFeedEventItem(item as Record<string, unknown>))
    .filter((event) => Boolean(event.id && event.nombre));
}

const DEFAULT_DISTANCE_KM = 100;

function readInitialDistanceKm(): number {
  const last = getLastMapInteraction();
  return last?.distanceKm ?? DEFAULT_DISTANCE_KM;
}

export const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusEventId = searchParams.get('event')?.trim() || null;
  const returnTo = searchParams.get('returnTo')?.trim() || null;
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const userLocation = useStoredUserLocation();
  const [mapItems, setMapItems] = useState<MapItemData[]>([]);
  const [focusedEventItem, setFocusedEventItem] = useState<MapItemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [distanceKm, setDistanceKm] = useState(readInitialDistanceKm);
  const lastFetchKeyRef = useRef('');
  const lastQueryRef = useRef<{ lat: number; lng: number; km: number } | null>(null);

  const handleDistanceChange = useCallback((km: number) => {
    const prev = lastQueryRef.current;
    if (prev && prev.km !== km) {
      invalidateMapCache();
    }
    setDistanceKm(km);
  }, []);

  const loadMap = useCallback(async (
    loc: StoredUserLocation | null,
    km: number,
    forceNetwork = false,
  ) => {
    if (!loc) {
      setMapItems([]);
      setLoading(false);
      return;
    }

    const fetchKey = `${loc.lat.toFixed(4)}:${loc.lng.toFixed(4)}:${km}:${forceNetwork ? 'net' : 'cache'}`;
    lastFetchKeyRef.current = fetchKey;

    const cacheKey = buildMapCacheKey(loc.lat, loc.lng, km);
    const cacheFresh = !forceNetwork && isMapCacheFresh(cacheKey);
    const fetchLimit = mapFetchLimitForRadiusKm(km);
    const locationChanged = Boolean(
      lastQueryRef.current
      && (
        Math.abs(lastQueryRef.current.lat - loc.lat) > 0.0001
        || Math.abs(lastQueryRef.current.lng - loc.lng) > 0.0001
      ),
    );
    const radiusChanged = lastQueryRef.current != null && lastQueryRef.current.km !== km;

    if ((locationChanged || radiusChanged) && !forceNetwork) {
      invalidateMapCache();
    }

    if (!forceNetwork) {
      const cached = getCachedMapData(cacheKey, false);
      if (cached) {
        const events = feedEventsToMapItems(cached.events);
        const services = servicesToMapItems(cached.services);
        const venues = venuesToMapItems(cached.venues || []);
        setMapItems([...events, ...venues, ...services]);
        setLoading(false);
        lastQueryRef.current = { lat: loc.lat, lng: loc.lng, km };
        if (cacheFresh) return;
      }
    }

    setLoading(true);
    try {
      const forceLocationFetch = forceNetwork || locationChanged || radiusChanged;
      const [nearby, services, venues, ownVenues, ownEventsRes] = await Promise.all([
        fetchNearbyEvents(loc.lat, loc.lng, km, userId || undefined, fetchLimit).catch((err) => {
          console.warn('[Mapa] fetchNearbyEvents falló', err);
          return [] as FeedEventItem[];
        }),
        fetchNearbyServices(loc.lat, loc.lng, km, fetchLimit, { forceNetwork: forceLocationFetch }).catch(() => []),
        fetchNearbyVenues(loc.lat, loc.lng, km, fetchLimit, { forceNetwork: forceLocationFetch }).catch(() => []),
        userId ? fetchOwnerRentalVenues(userId).catch(() => []) : Promise.resolve([]),
        userId
          ? fetchUserEvents(userId, { allEvents: true, forceNetwork }).catch(() => ({ data: { datosEvento: [] } }))
          : Promise.resolve({ data: { datosEvento: [] } }),
      ]);

      if (lastFetchKeyRef.current !== fetchKey) return;

      const ownEvents = normalizeOwnEvents(filterDiscoverFeedEvents(ownEventsRes.data?.datosEvento || []));
      // Preferir eventos del feed geo (incluye ajenos); propios solo como complemento in-range.
      const nearbyInRange = filterEventsWithinRadius(
        filterDiscoverFeedEvents(nearby),
        loc.lat,
        loc.lng,
        km,
      );
      const ownInRange = filterEventsWithinRadius(ownEvents, loc.lat, loc.lng, km);
      const nearbyIds = new Set(nearbyInRange.map((event) => event.id));
      const mergedEvents = [
        ...nearbyInRange,
        ...ownInRange.filter((event) => event.id && !nearbyIds.has(event.id)),
      ];

      const mergedVenues = filterVenuesWithinRadius(
        await hydrateMissingVenueImages(mergeVenuesById(venues, ownVenues)),
        loc.lat,
        loc.lng,
        km,
      );
      const mergedServices = filterServicesWithinRadius(services, loc.lat, loc.lng, km);

      const events = feedEventsToMapItems(mergedEvents);
      const serviceItems = servicesToMapItems(mergedServices);
      const venueItems = venuesToMapItems(mergedVenues);
      setMapItems([...events, ...venueItems, ...serviceItems]);
      cacheMapData({
        cacheKey,
        lat: loc.lat,
        lng: loc.lng,
        distanceKm: km,
        events: mergedEvents,
        services: mergedServices,
        venues: mergedVenues,
      });
      lastQueryRef.current = { lat: loc.lat, lng: loc.lng, km };
    } finally {
      if (lastFetchKeyRef.current === fetchKey) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      let stored = userLocation ?? getStoredUserLocation();
      if (!stored) {
        stored = await resolveUserLocation({ prompt: false }).catch(() => null);
      }
      if (cancelled) return;
      if (!stored) {
        setMapItems([]);
        setLoading(false);
        return;
      }
      void loadMap(stored, distanceKm, false);
    };
    void run();
    return () => { cancelled = true; };
  }, [loadMap, distanceKm, userLocation?.lat, userLocation?.lng]);

  useEffect(() => {
    const onCacheInvalidated = () => {
      void loadMap(userLocation ?? getStoredUserLocation(), distanceKm, true);
    };
    window.addEventListener(EVENTS_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    window.addEventListener(SERVICES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    window.addEventListener(VENUES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    return () => {
      window.removeEventListener(EVENTS_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
      window.removeEventListener(SERVICES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
      window.removeEventListener(VENUES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    };
  }, [distanceKm, loadMap, userLocation]);

  useEffect(() => {
    if (!focusEventId) {
      setFocusedEventItem(null);
      return;
    }
    const alreadyPresent = mapItems.some(
      (item) => item.refId === focusEventId || item.id === `event-${focusEventId}`,
    );
    if (alreadyPresent) {
      setFocusedEventItem(null);
      return;
    }
    let cancelled = false;
    void fetchEventDetail(focusEventId).then((detail) => {
      if (cancelled || !detail?.event) return;
      const ev = detail.event;
      const lat = Number(ev.ubicacion?.latitude ?? ev.latitude);
      const lng = Number(ev.ubicacion?.longitude ?? ev.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const location = resolveDisplayLocation({
        direccion: ev.direccion,
        ciudad: ev.ciudad,
        departamento: ev.departamento,
      });
      const image = resolveEventImageUrl(
        resolveImageUrl(detail.images?.[0] || '') || '',
      );
      setFocusedEventItem({
        id: `event-${ev.id}`,
        category: 'eventos',
        title: ev.nombre || 'Evento',
        subtitle: ev.fechaIni || ev.ciudad || 'Evento',
        image,
        lat,
        lng,
        date: ev.fechaIni,
        timeRange: ev.horaIni && ev.horaFin
          ? `${ev.horaIni} - ${ev.horaFin}`
          : ev.horaIni || undefined,
        location: location !== '—' ? location : undefined,
        refId: ev.id,
      });
    });
    return () => { cancelled = true; };
  }, [focusEventId, mapItems]);

  const displayMapItems = useMemo(() => {
    if (!focusedEventItem) return mapItems;
    if (mapItems.some((item) => item.id === focusedEventItem.id || item.refId === focusedEventItem.refId)) {
      return mapItems;
    }
    return [focusedEventItem, ...mapItems];
  }, [focusedEventItem, mapItems]);

  const handleMapBack = useCallback(() => {
    if (returnTo && returnTo.startsWith('/')) {
      navigate(returnTo);
      return;
    }
    if (focusEventId) {
      navigate(`/events/${focusEventId}`);
      return;
    }
    navigate(-1);
  }, [focusEventId, navigate, returnTo]);

  if (loading && !mapItems.length && !focusedEventItem) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 bg-secondary pb-24">
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-10 py-12 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">Cargando mapa…</p>
          <p className="text-xs text-muted-foreground max-w-[220px] text-center">
            Buscando eventos, lugares y servicios cerca de ti.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
    <MapView
      mapItems={displayMapItems}
      loading={loading}
      userLocation={userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined}
      distanceKm={distanceKm}
      distanceOptions={DISTANCE_OPTIONS}
      focusItemId={focusEventId ? `event-${focusEventId}` : null}
      onBack={focusEventId || returnTo ? handleMapBack : undefined}
      onDistanceChange={handleDistanceChange}
      onOpenEvent={(eventId) => navigate(`/events/${eventId}`)}
      onOpenVenue={(venueId) => {
        if (venueId) navigate(`/places/${venueId}`);
        else navigate('/places/publish');
      }}
      onOpenService={(serviceId) => {
        if (serviceId) navigate(`/services/${serviceId}`);
        else navigate('/services/create');
      }}
      onOpenProfile={(profileId) => navigate(`/users/${profileId}`)}
    />
    </div>
  );
};

export default MapPage;
