import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';
import {
  EVENTS_CACHE_INVALIDATED_EVENT,
  SERVICES_CACHE_INVALIDATED_EVENT,
  VENUES_CACHE_INVALIDATED_EVENT,
  buildMapCacheKey,
  cacheMapData,
  fetchNearbyEvents,
  fetchNearbyServices,
  fetchNearbyVenues,
  fetchOwnerRentalVenues,
  fetchUserEvents,
  mergeVenuesById,
  getCachedMapData,
  isMapCacheFresh,
  getStoredUserLocation,
  RootState,
  USER_LOCATION_CHANGED_EVENT,
  type StoredUserLocation,
} from '@doevents/shared';
import MapView from '@lovable/components/feed/MapView';
import {
  feedEventsToMapItems,
  servicesToMapItems,
  venuesToMapItems,
  type MapItemData,
} from '../lovable-bridge/mapAdapter';

const DISTANCE_OPTIONS = [5, 10, 25, 50];

export const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [mapItems, setMapItems] = useState<MapItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<StoredUserLocation | null>(null);
  const [distanceKm, setDistanceKm] = useState(5);

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

    const cacheKey = buildMapCacheKey(loc.lat, loc.lng, km);
    const cacheFresh = !forceNetwork && isMapCacheFresh(cacheKey);

    if (!forceNetwork) {
      const cached = getCachedMapData(cacheKey, true);
      if (cached) {
        const events = feedEventsToMapItems(cached.events);
        const services = servicesToMapItems(cached.services);
        const venues = venuesToMapItems(cached.venues || []);
        setMapItems([...events, ...venues, ...services]);
        setLoading(false);
        if (cacheFresh) return;
      }
    }

    if (!cacheFresh) setLoading(true);
    try {
      const [nearby, services, venues, ownVenues, ownEventsRes] = await Promise.all([
        fetchNearbyEvents(loc.lat, loc.lng, km, userId || undefined, 40).catch(() => []),
        fetchNearbyServices(loc.lat, loc.lng, km, 40, { forceNetwork }).catch(() => []),
        fetchNearbyVenues(loc.lat, loc.lng, km, 40, { forceNetwork }).catch(() => []),
        userId ? fetchOwnerRentalVenues(userId).catch(() => []) : Promise.resolve([]),
        userId ? fetchUserEvents(userId, { allEvents: true, forceNetwork }).catch(() => ({ data: { datosEvento: [] } })) : Promise.resolve({ data: { datosEvento: [] } }),
      ]);
      const mergedVenues = mergeVenuesById(venues, ownVenues);
      const ownEvents = ownEventsRes.data?.datosEvento || [];
      const eventIds = new Set(nearby.map((e) => e.id));
      const mergedEvents = [...nearby, ...ownEvents.filter((e) => e.id && !eventIds.has(e.id))];
      const events = feedEventsToMapItems(mergedEvents);
      const serviceItems = servicesToMapItems(services);
      const venueItems = venuesToMapItems(mergedVenues);
      setMapItems([...events, ...venueItems, ...serviceItems]);
      cacheMapData({ cacheKey, events: mergedEvents, services, venues: mergedVenues });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const stored = getStoredUserLocation();
    setUserLocation(stored);
    void loadMap(stored, distanceKm);
  }, [loadMap, distanceKm]);

  useEffect(() => {
    const onLocationChanged = (e: Event) => {
      const detail = (e as CustomEvent<StoredUserLocation>).detail;
      if (detail?.lat != null && detail?.lng != null) {
        setUserLocation(detail);
        void loadMap(detail, distanceKm, true);
      }
    };
    const onCacheInvalidated = () => {
      void loadMap(userLocation ?? getStoredUserLocation(), distanceKm, true);
    };
    window.addEventListener(USER_LOCATION_CHANGED_EVENT, onLocationChanged);
    window.addEventListener(EVENTS_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    window.addEventListener(SERVICES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    window.addEventListener(VENUES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    return () => {
      window.removeEventListener(USER_LOCATION_CHANGED_EVENT, onLocationChanged);
      window.removeEventListener(EVENTS_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
      window.removeEventListener(SERVICES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
      window.removeEventListener(VENUES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    };
  }, [distanceKm, loadMap, userLocation]);

  if (loading && !mapItems.length) {
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
      mapItems={mapItems}
      userLocation={userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined}
      distanceKm={distanceKm}
      distanceOptions={DISTANCE_OPTIONS}
      onDistanceChange={setDistanceKm}
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
