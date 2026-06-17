import { formatMapLocationLabel } from './formatMapLocation';
import { geocodePlaceQuery, reverseGeocodePlace } from './geocodePlace';

const STORAGE_KEY = 'doevents_user_location';
export const USER_LOCATION_CHANGED_EVENT = 'doevents-location-changed';

export interface StoredUserLocation {
  lat: number;
  lng: number;
  city?: string;
  departamento?: string;
  label?: string;
  updatedAt: number;
}

export function getStoredUserLocation(): StoredUserLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredUserLocation;
    if (typeof parsed.lat !== 'number' || typeof parsed.lng !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredUserLocation(location: Omit<StoredUserLocation, 'updatedAt'>): StoredUserLocation {
  const entry: StoredUserLocation = { ...location, updatedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(USER_LOCATION_CHANGED_EVENT, { detail: entry }));
  }
  return entry;
}

export function clearStoredUserLocation(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export async function resolveManualUserLocation(query: string): Promise<StoredUserLocation | null> {
  const place = await geocodePlaceQuery(query);
  if (!place) return null;
  return saveStoredUserLocation({
    lat: place.lat,
    lng: place.lng,
    city: place.city,
    departamento: place.departamento,
    label: place.label,
  });
}

export async function applyProfileCityAsLocation(
  ciudad?: string,
  departamento?: string,
): Promise<StoredUserLocation | null> {
  const city = (ciudad || '').trim();
  if (!city) return null;
  const query = [city, departamento].filter(Boolean).join(', ');
  return resolveManualUserLocation(query);
}

export async function resolveUserLocation(options?: {
  fallbackCity?: string;
  profileCity?: string;
  prompt?: boolean;
  force?: boolean;
  deviceOnly?: boolean;
}): Promise<StoredUserLocation | null> {
  const cached = getStoredUserLocation();
  if (!options?.force && cached && Date.now() - cached.updatedAt < 1000 * 60 * 30) return cached;

  const tryGeolocation = options?.prompt !== false && typeof navigator !== 'undefined' && navigator.geolocation;

  if (tryGeolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: options?.force ? 0 : 60000,
        });
      });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const reversed = await reverseGeocodePlace(lat, lng);
      return saveStoredUserLocation({
        lat,
        lng,
        city: reversed?.city,
        departamento: reversed?.departamento,
        label: reversed?.label || formatMapLocationLabel({
          city: reversed?.city,
          departamento: reversed?.departamento,
          street: reversed?.street,
          country: reversed?.country,
        }) || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      });
    } catch {
      if (options?.deviceOnly) return null;
    }
  }

  const profileFallback = options?.profileCity || options?.fallbackCity;
  if (!options?.deviceOnly && profileFallback) {
    const fromProfile = await applyProfileCityAsLocation(profileFallback);
    if (fromProfile) return fromProfile;
  }

  return cached;
}
