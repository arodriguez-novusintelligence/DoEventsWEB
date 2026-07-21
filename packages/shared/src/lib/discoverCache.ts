import type { FeedEventItem } from '../types/events';
import type { NearbyServiceProvider } from '../api/servicesService';
import type { NearbyVenue } from '../api/venueService';

// v5: invalida cachés que saltaban red con eventos pero sin lugares/servicios.
const DISCOVER_CACHE_KEY = 'doevents_discover_cache_v5';
const FRESH_MS = 10 * 60 * 1000;
const STALE_MS = 60 * 60 * 1000;

export interface DiscoverCacheEntry {
  nearby: FeedEventItem[];
  recommended: FeedEventItem[];
  myEvents: FeedEventItem[];
  favorites: FeedEventItem[];
  services: NearbyServiceProvider[];
  venues: NearbyVenue[];
  locationKey: string;
  cachedAt: number;
  /** true tras un fetch de red con ubicación (aunque venues/services vengan vacíos). */
  locationBoundFetched?: boolean;
}

function readStore(): DiscoverCacheEntry | null {
  try {
    const raw = localStorage.getItem(DISCOVER_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DiscoverCacheEntry;
  } catch {
    return null;
  }
}

function isFresh(cachedAt: number): boolean {
  return Date.now() - cachedAt < FRESH_MS;
}

function isStaleButUsable(cachedAt: number): boolean {
  const age = Date.now() - cachedAt;
  return age >= FRESH_MS && age < STALE_MS;
}

export function buildDiscoverLocationKey(lat?: number, lng?: number, userId?: string): string {
  if (lat == null || lng == null) return `no-loc:${userId || 'anon'}`;
  return `${lat.toFixed(3)}:${lng.toFixed(3)}:${userId || 'anon'}`;
}

export function getCachedDiscover(
  locationKey: string,
  allowStale = true,
): DiscoverCacheEntry | null {
  const entry = readStore();
  if (!entry || entry.locationKey !== locationKey) return null;
  const normalized: DiscoverCacheEntry = { ...entry, venues: entry.venues || [] };
  if (isFresh(entry.cachedAt)) return normalized;
  if (allowStale && isStaleButUsable(entry.cachedAt)) return normalized;
  return null;
}

export function isDiscoverCacheFresh(locationKey: string): boolean {
  const entry = readStore();
  return Boolean(entry && entry.locationKey === locationKey && isFresh(entry.cachedAt));
}

export function cacheDiscover(payload: Omit<DiscoverCacheEntry, 'cachedAt'>): void {
  try {
    localStorage.setItem(DISCOVER_CACHE_KEY, JSON.stringify({
      ...payload,
      cachedAt: Date.now(),
    }));
  } catch {
    // ignore
  }
}

export function invalidateDiscoverCache(): void {
  try {
    localStorage.removeItem(DISCOVER_CACHE_KEY);
  } catch {
    // ignore
  }
}
