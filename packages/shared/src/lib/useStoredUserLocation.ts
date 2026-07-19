import { useEffect, useState } from 'react';

import {
  getStoredUserLocation,
  USER_LOCATION_CHANGED_EVENT,
  type StoredUserLocation,
} from './userLocation';

export function useStoredUserLocation(): StoredUserLocation | null {
  const [location, setLocation] = useState<StoredUserLocation | null>(() => getStoredUserLocation());

  useEffect(() => {
    const onChanged = (event: Event) => {
      const detail = (event as CustomEvent<StoredUserLocation>).detail;
      setLocation(detail || getStoredUserLocation());
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === 'doevents_user_location') {
        setLocation(getStoredUserLocation());
      }
    };

    window.addEventListener(USER_LOCATION_CHANGED_EVENT, onChanged);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(USER_LOCATION_CHANGED_EVENT, onChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return location;
}
