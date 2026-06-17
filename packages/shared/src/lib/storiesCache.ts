import type { FeedStoryItem } from '../types/feed';

const STORIES_CACHE_KEY = 'doevents_stories_cache_v1';
const FRESH_MS = 5 * 60 * 1000;

interface StoriesCacheEntry {
  authorUserId: string;
  items: FeedStoryItem[];
  cachedAt: number;
}

function readStore(): Record<string, StoriesCacheEntry> {
  try {
    const raw = localStorage.getItem(STORIES_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, StoriesCacheEntry>;
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, StoriesCacheEntry>): void {
  try {
    localStorage.setItem(STORIES_CACHE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota
  }
}

export function getCachedUserStories(authorUserId: string): FeedStoryItem[] | null {
  const entry = readStore()[authorUserId];
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > FRESH_MS) return null;
  return entry.items;
}

export function cacheUserStories(authorUserId: string, items: FeedStoryItem[]): void {
  const store = readStore();
  store[authorUserId] = { authorUserId, items, cachedAt: Date.now() };
  writeStore(store);
}

export function invalidateUserStoriesCache(authorUserId?: string): void {
  if (!authorUserId) {
    localStorage.removeItem(STORIES_CACHE_KEY);
    return;
  }
  const store = readStore();
  delete store[authorUserId];
  writeStore(store);
}

export const STORIES_CACHE_INVALIDATED_EVENT = 'de-stories-cache-invalidated';

export function dispatchStoriesCacheInvalidated(authorUserId?: string): void {
  window.dispatchEvent(new CustomEvent(STORIES_CACHE_INVALIDATED_EVENT, { detail: { authorUserId } }));
}
