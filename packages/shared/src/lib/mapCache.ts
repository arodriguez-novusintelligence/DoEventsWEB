import type { FeedEventItem } from '../types/events';
import type { NearbyServiceProvider } from '../api/servicesService';
import type { NearbyVenue } from '../api/venueService';

const MAP_CACHE_KEY = 'doevents_map_cache_v2';

/** Duración del caché del mapa: sin reconsultar API mientras sea válido. */
export const MAP_CACHE_TTL_MS = 15 * 60 * 1000;

export interface MapCacheEntry {
  events: FeedEventItem[];
  services: NearbyServiceProvider[];
  venues: NearbyVenue[];
  cacheKey: string;
  lat: number;
  lng: number;
  distanceKm: number;
  cachedAt: number;
}

export interface MapLastInteraction {
  lat: number;
  lng: number;
  distanceKm: number;
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
    const parsed = JSON.parse(raw) as MapCacheEntry;
    if (!parsed?.cacheKey || parsed.cachedAt == null) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isMapCacheEntryFresh(cachedAt: number, nowMs = Date.now()): boolean {
  return nowMs - cachedAt < MAP_CACHE_TTL_MS;
}

export function getCachedMapData(
  cacheKey: string,
  allowStale = false,
): MapCacheEntry | null {
  const entry = readStore();
  if (!entry || entry.cacheKey !== cacheKey) return null;
  const normalized: MapCacheEntry = { ...entry, venues: entry.venues || [] };
  if (isMapCacheEntryFresh(entry.cachedAt)) return normalized;
  if (allowStale) return normalized;
  return null;
}

export function isMapCacheFresh(cacheKey: string): boolean {
  const entry = readStore();
  return Boolean(
    entry
    && entry.cacheKey === cacheKey
    && isMapCacheEntryFresh(entry.cachedAt),
  );
}

export function getLastMapInteraction(nowMs = Date.now()): MapLastInteraction | null {
  const entry = readStore();
  if (!entry || !isMapCacheEntryFresh(entry.cachedAt, nowMs)) return null;
  return {
    lat: entry.lat,
    lng: entry.lng,
    distanceKm: entry.distanceKm,
    cacheKey: entry.cacheKey,
    cachedAt: entry.cachedAt,
  };
}

export function cacheMapData(payload: Omit<MapCacheEntry, 'cachedAt'>): void {
  try {
    localStorage.setItem(MAP_CACHE_KEY, JSON.stringify({
      ...payload,
      venues: payload.venues || [],
      cachedAt: Date.now(),
    }));
  } catch {
    // ignore
  }
}

export function invalidateMapCache(): void {
  try {
    localStorage.removeItem(MAP_CACHE_KEY);
  } catch {
    // ignore
  }
}
