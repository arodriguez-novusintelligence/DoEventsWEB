import type { FeedEventItem } from '../types/events';
import type { NearbyServiceProvider } from '../api/servicesService';
import type { NearbyVenue } from '../api/venueService';

const MAP_CACHE_KEY = 'doevents_map_cache_v1';
const FRESH_MS = 5 * 60 * 1000;
const STALE_MS = 30 * 60 * 1000;

export interface MapCacheEntry {
  events: FeedEventItem[];
  services: NearbyServiceProvider[];
  venues: NearbyVenue[];
  cacheKey: string;
  cachedAt: number;
}

export function buildMapCacheKey(lat: number, lng: number, km: number): string {
  return `${lat.toFixed(3)}:${lng.toFixed(3)}:${km}`;
}

function readStore(): MapCacheEntry | null {
  try {
    const raw = localStorage.getItem(MAP_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MapCacheEntry;
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

export function getCachedMapData(
  cacheKey: string,
  allowStale = true,
): MapCacheEntry | null {
  const entry = readStore();
  if (!entry || entry.cacheKey !== cacheKey) return null;
  const normalized: MapCacheEntry = { ...entry, venues: entry.venues || [] };
  if (isFresh(entry.cachedAt)) return normalized;
  if (allowStale && isStaleButUsable(entry.cachedAt)) return normalized;
  return null;
}

export function isMapCacheFresh(cacheKey: string): boolean {
  const entry = readStore();
  return Boolean(entry && entry.cacheKey === cacheKey && isFresh(entry.cachedAt));
}

export function cacheMapData(payload: Omit<MapCacheEntry, 'cachedAt'>): void {
  try {
    localStorage.setItem(MAP_CACHE_KEY, JSON.stringify({
      ...payload,
      cachedAt: Date.now(),
    }));
  } catch {
    // ignore
  }
}
