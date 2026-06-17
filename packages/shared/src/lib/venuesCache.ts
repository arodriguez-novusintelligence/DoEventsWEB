import type { NearbyVenue } from '../api/venueService';

const NEARBY_VENUES_CACHE_KEY = 'doevents_venues_nearby_cache_v1';
const USER_VENUES_CACHE_KEY = 'doevents_venues_user_cache_v1';

export const VENUES_CACHE_INVALIDATED_EVENT = 'doevents-venues-cache-invalidated';

export const VENUES_CACHE_FRESH_MS = 10 * 60 * 1000;
export const VENUES_CACHE_STALE_MS = 60 * 60 * 1000;

interface VenuesTimedEntry<T> {
  data: T;
  cachedAt: number;
}

interface NearbyVenuesCacheStore {
  entries: Record<string, VenuesTimedEntry<NearbyVenue[]>>;
}

interface UserVenuesCacheStore {
  users: Record<string, VenuesTimedEntry<NearbyVenue[]>>;
}

function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStore<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function isFresh(cachedAt: number): boolean {
  return Date.now() - cachedAt < VENUES_CACHE_FRESH_MS;
}

function isStaleButUsable(cachedAt: number): boolean {
  const age = Date.now() - cachedAt;
  return age >= VENUES_CACHE_FRESH_MS && age < VENUES_CACHE_STALE_MS;
}

function getEntry<T>(entry: VenuesTimedEntry<T> | undefined, allowStale: boolean): VenuesTimedEntry<T> | null {
  if (!entry) return null;
  if (isFresh(entry.cachedAt)) return entry;
  if (allowStale && isStaleButUsable(entry.cachedAt)) return entry;
  return null;
}

export function buildNearbyVenuesCacheKey(
  lat: number,
  lng: number,
  maxKm: number,
  limit: number,
): string {
  return `${lat.toFixed(3)}:${lng.toFixed(3)}:${maxKm}:${limit}`;
}

export function getCachedNearbyVenues(key: string, allowStale = true): NearbyVenue[] | null {
  const store = readStore<NearbyVenuesCacheStore>(NEARBY_VENUES_CACHE_KEY, { entries: {} });
  const entry = getEntry(store.entries[key], allowStale);
  return entry?.data ?? null;
}

export function cacheNearbyVenues(key: string, data: NearbyVenue[]): void {
  const store = readStore<NearbyVenuesCacheStore>(NEARBY_VENUES_CACHE_KEY, { entries: {} });
  store.entries[key] = { data, cachedAt: Date.now() };
  writeStore(NEARBY_VENUES_CACHE_KEY, store);
}

export function invalidateVenuesCache(): void {
  try {
    localStorage.removeItem(NEARBY_VENUES_CACHE_KEY);
    localStorage.removeItem(USER_VENUES_CACHE_KEY);
    localStorage.removeItem('doevents_discover_cache_v1');
    localStorage.removeItem('doevents_map_cache_v1');
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(VENUES_CACHE_INVALIDATED_EVENT));
  }
}
