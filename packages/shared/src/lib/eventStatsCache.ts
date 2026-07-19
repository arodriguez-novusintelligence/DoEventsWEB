/** Cache de respuestas de estadísticas por evento (memoria + sessionStorage). */

export type EventStatsCacheKind = 'sales' | 'invitations' | 'access' | 'refunds' | 'buyers';

export const EVENT_STATS_CACHE_FRESH_MS = 2 * 60 * 1000;
export const EVENT_STATS_CACHE_STALE_MS = 10 * 60 * 1000;

const STORAGE_KEY = 'doevents_event_stats_cache_v1';

interface StatsCacheEntry<T = unknown> {
  data: T;
  cachedAt: number;
}

interface StatsCacheStore {
  entries: Record<string, StatsCacheEntry>;
}

const memory = new Map<string, StatsCacheEntry>();

function readStore(): StatsCacheStore {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: {} };
    return JSON.parse(raw) as StatsCacheStore;
  } catch {
    return { entries: {} };
  }
}

function writeStore(store: StatsCacheStore): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

export function buildEventStatsCacheKey(
  eventId: string,
  kind: EventStatsCacheKind,
  extra?: string,
): string {
  const base = `${eventId}:${kind}`;
  return extra ? `${base}:${extra}` : base;
}

function isFresh(cachedAt: number): boolean {
  return Date.now() - cachedAt < EVENT_STATS_CACHE_FRESH_MS;
}

function isStaleButUsable(cachedAt: number): boolean {
  const age = Date.now() - cachedAt;
  return age >= EVENT_STATS_CACHE_FRESH_MS && age < EVENT_STATS_CACHE_STALE_MS;
}

export function getCachedEventStatsEntry<T>(
  key: string,
  allowStale = true,
): StatsCacheEntry<T> | null {
  const mem = memory.get(key) as StatsCacheEntry<T> | undefined;
  if (mem) {
    if (isFresh(mem.cachedAt)) return mem;
    if (allowStale && isStaleButUsable(mem.cachedAt)) return mem;
    memory.delete(key);
  }

  const store = readStore();
  const entry = store.entries[key] as StatsCacheEntry<T> | undefined;
  if (!entry) return null;
  if (isFresh(entry.cachedAt)) {
    memory.set(key, entry);
    return entry;
  }
  if (allowStale && isStaleButUsable(entry.cachedAt)) {
    memory.set(key, entry);
    return entry;
  }
  delete store.entries[key];
  writeStore(store);
  return null;
}

export function getCachedEventStats<T>(key: string, allowStale = true): T | null {
  return getCachedEventStatsEntry<T>(key, allowStale)?.data ?? null;
}

export function isEventStatsCacheFresh(key: string): boolean {
  const entry = getCachedEventStatsEntry(key, false);
  return Boolean(entry && isFresh(entry.cachedAt));
}

export function cacheEventStats<T>(key: string, data: T): void {
  const entry: StatsCacheEntry<T> = { data, cachedAt: Date.now() };
  memory.set(key, entry);

  const store = readStore();
  store.entries[key] = entry;
  writeStore(store);
}

export function invalidateEventStatsCache(eventId?: string): void {
  if (!eventId) {
    memory.clear();
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    return;
  }

  for (const key of memory.keys()) {
    if (key.startsWith(`${eventId}:`)) memory.delete(key);
  }

  const store = readStore();
  for (const key of Object.keys(store.entries)) {
    if (key.startsWith(`${eventId}:`)) delete store.entries[key];
  }
  writeStore(store);
}

export const EVENT_STATS_CACHE_INVALIDATED_EVENT = 'de-event-stats-cache-invalidated';

export function dispatchEventStatsCacheInvalidated(eventId?: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_STATS_CACHE_INVALIDATED_EVENT, { detail: { eventId } }));
}
