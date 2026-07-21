import { invalidateDiscoverCache } from './discoverCache';
import { formatMapLocationLabel } from './formatMapLocation';
import { geocodePlaceQuery, reverseGeocodePlace, type GeocodedPlace } from './geocodePlace';
import { invalidateMapCache } from './mapCache';

const STORAGE_KEY = 'doevents_user_location';
export const USER_LOCATION_CHANGED_EVENT = 'doevents-location-changed';

export interface StoredUserLocation {
  lat: number;
  lng: number;
  city?: string;
  departamento?: string;
  street?: string;
  country?: string;
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

function invalidateLocationDependentCaches(): void {
  invalidateDiscoverCache();
  invalidateMapCache();
}

export function saveStoredUserLocation(location: Omit<StoredUserLocation, 'updatedAt'>): StoredUserLocation {
  const previous = getStoredUserLocation();
  const entry: StoredUserLocation = { ...location, updatedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));

  const coordsChanged = !previous
    || Math.abs(previous.lat - entry.lat) > 0.0001
    || Math.abs(previous.lng - entry.lng) > 0.0001;
  if (coordsChanged) {
    invalidateLocationDependentCaches();
  }

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
  return applyGeocodedPlaceAsUserLocation(place);
}

export function applyGeocodedPlaceAsUserLocation(place: GeocodedPlace): StoredUserLocation {
  return saveStoredUserLocation({
    lat: place.lat,
    lng: place.lng,
    city: place.city,
    departamento: place.departamento,
    street: place.street,
    country: place.country,
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

async function isGeolocationPermissionGranted(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) return false;
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state === 'granted';
  } catch {
    return false;
  }
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

  const hasGeolocation = typeof navigator !== 'undefined' && Boolean(navigator.geolocation);
  let tryGeolocation = hasGeolocation && options?.prompt !== false;
  if (hasGeolocation && options?.prompt === false) {
    tryGeolocation = await isGeolocationPermissionGranted();
  }

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
        street: reversed?.street,
        country: reversed?.country,
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
