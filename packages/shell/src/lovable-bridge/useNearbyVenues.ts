import { useCallback, useEffect, useState } from 'react';
import {
  fetchNearbyVenues,
  getStoredUserLocation,
  resolveEventImageUrl,
  resolveImageUrl,
  USER_LOCATION_CHANGED_EVENT,
  VENUES_CACHE_INVALIDATED_EVENT,
  type NearbyVenue,
  type StoredUserLocation,
} from '@doevents/shared';

export interface FeedVenueCard {
  id: string;
  name: string;
  type: string;
  image: string;
  city?: string;
  capacity?: number;
  distanceKm?: number | null;
}

function venueToCard(v: NearbyVenue): FeedVenueCard {
  return {
    id: v.venueId,
    name: v.name,
    type: v.type || v.tags || 'Lugar',
    image: resolveEventImageUrl(resolveImageUrl(v.mainImage || v.imageUrls?.[0])),
    city: v.city,
    capacity: v.capacity,
    distanceKm: v.distance,
  };
}

export function useNearbyVenues(maxDistanceKm = 50) {
  const [venues, setVenues] = useState<FeedVenueCard[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (loc: StoredUserLocation | null, forceNetwork = false) => {
    if (!loc) {
      setVenues([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const items = await fetchNearbyVenues(loc.lat, loc.lng, maxDistanceKm, 20, { forceNetwork });
      setVenues(items.map(venueToCard));
    } catch {
      setVenues([]);
    } finally {
      setLoading(false);
    }
  }, [maxDistanceKm]);

  useEffect(() => {
    void load(getStoredUserLocation());
    const onLocation = (e: Event) => {
      void load((e as CustomEvent<StoredUserLocation>).detail || getStoredUserLocation(), true);
    };
    const onCacheInvalidated = () => {
      void load(getStoredUserLocation(), true);
    };
    window.addEventListener(USER_LOCATION_CHANGED_EVENT, onLocation);
    window.addEventListener(VENUES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    return () => {
      window.removeEventListener(USER_LOCATION_CHANGED_EVENT, onLocation);
      window.removeEventListener(VENUES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    };
  }, [load]);

  return { venues, loading };
}
