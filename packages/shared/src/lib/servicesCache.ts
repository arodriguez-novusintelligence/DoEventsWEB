import type { NearbyServiceProvider } from '../api/servicesService';

const NEARBY_CACHE_KEY = 'doevents_services_nearby_cache_v2';
const USER_SERVICES_CACHE_KEY = 'doevents_services_user_cache_v2';

export const SERVICES_CACHE_FRESH_MS = 10 * 60 * 1000;
export const SERVICES_CACHE_STALE_MS = 60 * 60 * 1000;

export const SERVICES_CACHE_INVALIDATED_EVENT = 'doevents-services-cache-invalidated';

interface ServicesTimedEntry<T> {
  data: T;
  cachedAt: number;
}

interface NearbyCacheStore {
  entries: Record<string, ServicesTimedEntry<NearbyServiceProvider[]>>;
}

interface UserServicesCacheStore {
  users: Record<string, ServicesTimedEntry<NearbyServiceProvider[]>>;
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
  return Date.now() - cachedAt < SERVICES_CACHE_FRESH_MS;
}

function isStaleButUsable(cachedAt: number): boolean {
  const age = Date.now() - cachedAt;
  return age >= SERVICES_CACHE_FRESH_MS && age < SERVICES_CACHE_STALE_MS;
}

function getEntry<T>(entry: ServicesTimedEntry<T> | undefined, allowStale: boolean): ServicesTimedEntry<T> | null {
  if (!entry) return null;
  if (isFresh(entry.cachedAt)) return entry;
  if (allowStale && isStaleButUsable(entry.cachedAt)) return entry;
  return null;
}

export function buildNearbyServicesCacheKey(
  lat: number,
  lng: number,
  maxKm: number,
  limit: number,
): string {
  return `${lat.toFixed(3)}:${lng.toFixed(3)}:${maxKm}:${limit}`;
}

export function getCachedNearbyServices(key: string, allowStale = true): NearbyServiceProvider[] | null {
  const store = readStore<NearbyCacheStore>(NEARBY_CACHE_KEY, { entries: {} });
  const entry = getEntry(store.entries[key], allowStale);
  return entry?.data ?? null;
}

export function cacheNearbyServices(key: string, data: NearbyServiceProvider[]): void {
  const store = readStore<NearbyCacheStore>(NEARBY_CACHE_KEY, { entries: {} });
  store.entries[key] = { data, cachedAt: Date.now() };
  writeStore(NEARBY_CACHE_KEY, store);
}

export function getCachedUserServices(userId: string, allowStale = true): NearbyServiceProvider[] | null {
  const store = readStore<UserServicesCacheStore>(USER_SERVICES_CACHE_KEY, { users: {} });
  const entry = getEntry(store.users[userId], allowStale);
  return entry?.data ?? null;
}

export function getCachedUserServicesEntry(
  userId: string,
  allowStale = true,
): ServicesTimedEntry<NearbyServiceProvider[]> | null {
  const store = readStore<UserServicesCacheStore>(USER_SERVICES_CACHE_KEY, { users: {} });
  return getEntry(store.users[userId], allowStale);
}

export function cacheUserServices(userId: string, data: NearbyServiceProvider[]): void {
  const store = readStore<UserServicesCacheStore>(USER_SERVICES_CACHE_KEY, { users: {} });
  store.users[userId] = { data, cachedAt: Date.now() };
  writeStore(USER_SERVICES_CACHE_KEY, store);
}

export function invalidateServicesCache(): void {
  try {
    localStorage.removeItem(NEARBY_CACHE_KEY);
    localStorage.removeItem(USER_SERVICES_CACHE_KEY);
    localStorage.removeItem('doevents_discover_cache_v1');
    localStorage.removeItem('doevents_map_cache_v1');
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SERVICES_CACHE_INVALIDATED_EVENT));
    window.dispatchEvent(new CustomEvent('de-events-cache-invalidated'));
  }
}
