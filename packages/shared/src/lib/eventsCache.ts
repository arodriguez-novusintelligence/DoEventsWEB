import type { FeedHomeResponse } from '../types/feed';
import type { FeedEventItem, EventsFeedResponse, UserEventItem } from '../types/events';

interface CachedEventType {
  id: string;
  nombre?: string;
  name?: string;
}

const EVENT_CACHE_KEY = 'doevents_event_cache_v2';
const FEED_CACHE_KEY = 'doevents_feed_cache_v2';
const SOCIAL_FEED_CACHE_KEY = 'doevents_social_feed_cache_v2';
const EVENT_TYPES_CACHE_KEY = 'doevents_event_types_cache_v2';
const USER_EVENTS_CACHE_KEY = 'doevents_user_events_cache_v2';

export const CACHE_FRESH_MS = 15 * 60 * 1000;
export const CACHE_STALE_MS = 24 * 60 * 60 * 1000;

export interface TimedEntry<T> {
  data: T;
  cachedAt: number;
}

interface EventCacheStore {
  events: Record<string, TimedEntry<FeedEventItem>>;
}

interface FeedCacheStore {
  feeds: Record<string, TimedEntry<EventsFeedResponse>>;
}

interface SocialFeedCacheStore {
  feeds: Record<string, TimedEntry<FeedHomeResponse>>;
}

interface EventTypesCacheStore {
  types: TimedEntry<CachedEventType[]>;
}

interface UserEventsCacheStore {
  users: Record<string, TimedEntry<UserEventItem[]>>;
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
    // ignore quota errors
  }
}

export function isFresh(cachedAt: number): boolean {
  return Date.now() - cachedAt < CACHE_FRESH_MS;
}

export function isStaleButUsable(cachedAt: number): boolean {
  const age = Date.now() - cachedAt;
  return age >= CACHE_FRESH_MS && age < CACHE_STALE_MS;
}

function getEntry<T>(entry: TimedEntry<T> | undefined, allowStale: boolean): TimedEntry<T> | null {
  if (!entry) return null;
  if (isFresh(entry.cachedAt)) return entry;
  if (allowStale && isStaleButUsable(entry.cachedAt)) return entry;
  return null;
}

export function getCachedEvent(eventId: string): FeedEventItem | null {
  const store = readStore<EventCacheStore>(EVENT_CACHE_KEY, { events: {} });
  const entry = getEntry(store.events[eventId], true);
  return entry?.data ?? null;
}

export function cacheEvents(events: FeedEventItem[]): void {
  if (!events.length) return;
  const store = readStore<EventCacheStore>(EVENT_CACHE_KEY, { events: {} });
  const now = Date.now();
  events.forEach((event) => {
    if (event.id) {
      store.events[event.id] = { data: event, cachedAt: now };
    }
  });
  writeStore(EVENT_CACHE_KEY, store);
}

export function getCachedFeedEntry(
  userKey: string,
  allowStale = true,
): TimedEntry<EventsFeedResponse> | null {
  const store = readStore<FeedCacheStore>(FEED_CACHE_KEY, { feeds: {} });
  return getEntry(store.feeds[userKey], allowStale);
}

export function getCachedFeed(userKey: string, allowStale = true): EventsFeedResponse | null {
  return getCachedFeedEntry(userKey, allowStale)?.data ?? null;
}

export function cacheFeed(userKey: string, feed: EventsFeedResponse): void {
  const store = readStore<FeedCacheStore>(FEED_CACHE_KEY, { feeds: {} });
  store.feeds[userKey] = { data: feed, cachedAt: Date.now() };
  writeStore(FEED_CACHE_KEY, store);
  cacheEvents(feed.items || []);
}

export function getCachedSocialFeedEntry(
  userKey: string,
  allowStale = true,
): TimedEntry<FeedHomeResponse> | null {
  const store = readStore<SocialFeedCacheStore>(SOCIAL_FEED_CACHE_KEY, { feeds: {} });
  return getEntry(store.feeds[userKey], allowStale);
}

export function getCachedSocialFeed(userKey: string, allowStale = true): FeedHomeResponse | null {
  return getCachedSocialFeedEntry(userKey, allowStale)?.data ?? null;
}

export function cacheSocialFeed(userKey: string, feed: FeedHomeResponse): void {
  const store = readStore<SocialFeedCacheStore>(SOCIAL_FEED_CACHE_KEY, { feeds: {} });
  store.feeds[userKey] = { data: feed, cachedAt: Date.now() };
  writeStore(SOCIAL_FEED_CACHE_KEY, store);
}

export function getCachedEventTypesEntry(allowStale = true): TimedEntry<CachedEventType[]> | null {
  const store = readStore<EventTypesCacheStore>(EVENT_TYPES_CACHE_KEY, { types: { data: [], cachedAt: 0 } });
  return getEntry(store.types, allowStale);
}

export function getCachedEventTypes(allowStale = true): CachedEventType[] | null {
  return getCachedEventTypesEntry(allowStale)?.data ?? null;
}

export function cacheEventTypes(types: CachedEventType[]): void {
  writeStore<EventTypesCacheStore>(EVENT_TYPES_CACHE_KEY, {
    types: { data: types, cachedAt: Date.now() },
  });
}

export function getCachedUserEvents(userId: string, allowStale = true): UserEventItem[] | null {
  const store = readStore<UserEventsCacheStore>(USER_EVENTS_CACHE_KEY, { users: {} });
  return getEntry(store.users[userId], allowStale)?.data ?? null;
}

export function getCachedUserEventsEntry(
  userId: string,
  allowStale = true,
): TimedEntry<UserEventItem[]> | null {
  const store = readStore<UserEventsCacheStore>(USER_EVENTS_CACHE_KEY, { users: {} });
  return getEntry(store.users[userId], allowStale);
}

export function cacheUserEvents(userId: string, events: UserEventItem[]): void {
  const store = readStore<UserEventsCacheStore>(USER_EVENTS_CACHE_KEY, { users: {} });
  store.users[userId] = { data: events, cachedAt: Date.now() };
  writeStore(USER_EVENTS_CACHE_KEY, store);
  cacheEvents(events.map((event) => ({
    id: event.id,
    nombre: event.nombre,
    fechaIni: event.fechaIni,
    horaIni: event.horaIni,
    ciudad: event.ciudad,
    departamento: event.departamento,
    descripcion: event.descripcion,
    imagen: event.imagen,
    liked: event.liked,
  })));
}

export const EVENTS_CACHE_INVALIDATED_EVENT = 'de-events-cache-invalidated';

export function invalidateSocialFeedCache(): void {
  localStorage.removeItem(SOCIAL_FEED_CACHE_KEY);
}

export function invalidateEventsCache(): void {
  localStorage.removeItem(EVENT_CACHE_KEY);
  localStorage.removeItem(FEED_CACHE_KEY);
  localStorage.removeItem(SOCIAL_FEED_CACHE_KEY);
  localStorage.removeItem(EVENT_TYPES_CACHE_KEY);
  localStorage.removeItem(USER_EVENTS_CACHE_KEY);
  try {
    localStorage.removeItem('doevents_discover_cache_v1');
    localStorage.removeItem('doevents_map_cache_v1');
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENTS_CACHE_INVALIDATED_EVENT));
  }
}

export function invalidateAllSectionCaches(): void {
  invalidateEventsCache();
}

export const invalidateWallCache = invalidateEventsCache;
