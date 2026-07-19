import { useCallback, useEffect, useState } from 'react';

import {

  fetchNearbyServices,

  getStoredUserLocation,

  resolveEventImageUrl,

  resolveImageUrl,

  SERVICES_CACHE_INVALIDATED_EVENT,

  USER_LOCATION_CHANGED_EVENT,

  type NearbyServiceProvider,

  type StoredUserLocation,

} from '@doevents/shared';

import type { FeedServiceCard } from '@lovable/components/feed/FeedServicesCarousel';



export function providerToCard(p: NearbyServiceProvider): FeedServiceCard {

  const displayName = (p as NearbyServiceProvider & { providerDisplayName?: string }).providerDisplayName

    || p.username

    || p.name;

  return {

    id: p.serviceId || p.userId,

    name: displayName,

    role: p.role || p.category || 'Servicio',

    rating: p.rating || 0,

    reviewCount: p.reviewCount,

    handle: p.username ? `@${p.username}` : '',

    description: p.description || '',

    image: resolveEventImageUrl(

      resolveImageUrl(p.profileImageUrl || p.gallery?.[0]),

    ),

    userId: p.userId,

    minPrice: p.minPrice,

    currency: p.currency,

    distanceKm: p.distanceKm,

  };

}



export function useNearbyServices(maxDistanceKm = 25) {

  const [providers, setProviders] = useState<FeedServiceCard[]>([]);

  const [loading, setLoading] = useState(true);



  const load = useCallback(async (loc: StoredUserLocation | null, forceNetwork = false) => {

    if (!loc) {

      setProviders([]);

      setLoading(false);

      return;

    }

    setLoading(true);

    try {

      const items = await fetchNearbyServices(loc.lat, loc.lng, maxDistanceKm, 20, { forceNetwork });

      setProviders(items.map(providerToCard));

    } catch {

      setProviders([]);

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

    window.addEventListener(SERVICES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);

    return () => {

      window.removeEventListener(USER_LOCATION_CHANGED_EVENT, onLocation);

      window.removeEventListener(SERVICES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);

    };

  }, [load]);



  return { providers, loading };

}

