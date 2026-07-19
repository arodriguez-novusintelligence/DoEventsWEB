/** Cache en memoria de datos ya transformados por statsAdapter (navegación instantánea entre secciones). */

const RESOLVED_FRESH_MS = 2 * 60 * 1000;
const RESOLVED_STALE_MS = 10 * 60 * 1000;

interface ResolvedEntry<T> {
  data: T;
  cachedAt: number;
}

const store = new Map<string, ResolvedEntry<unknown>>();

function isFresh(cachedAt: number): boolean {
  return Date.now() - cachedAt < RESOLVED_FRESH_MS;
}

function isStaleButUsable(cachedAt: number): boolean {
  const age = Date.now() - cachedAt;
  return age >= RESOLVED_FRESH_MS && age < RESOLVED_STALE_MS;
}

export function buildResolvedStatsKey(eventId: string, scope: string): string {
  return `${eventId}:${scope}`;
}

export function getResolvedStats<T>(key: string, allowStale = true): T | null {
  const entry = store.get(key) as ResolvedEntry<T> | undefined;
  if (!entry) return null;
  if (isFresh(entry.cachedAt)) return entry.data;
  if (allowStale && isStaleButUsable(entry.cachedAt)) return entry.data;
  store.delete(key);
  return null;
}

export function cacheResolvedStats<T>(key: string, data: T): void {
  store.set(key, { data, cachedAt: Date.now() });
}

export function invalidateResolvedStats(eventId?: string): void {
  if (!eventId) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(`${eventId}:`)) store.delete(key);
  }
}
