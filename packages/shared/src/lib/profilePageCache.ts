import type { UserProfile } from '../api/userService';
import type { UserStats } from '../api/userService';

const PROFILE_PAGE_CACHE_KEY = 'doevents_profile_page_cache_v1';
const FRESH_MS = 15 * 60 * 1000;

export interface ProfilePageCacheSnapshot {
  userId: string;
  profile: UserProfile | null;
  stats: UserStats | null;
  myEventsCount: number;
  ticketsCount: number;
  myVenuesCount: number;
  followersCount: number;
  followingCount: number;
  rating: number;
  commentsCount: number;
  cachedAt: number;
}

function readStore(): Record<string, ProfilePageCacheSnapshot> {
  try {
    const raw = localStorage.getItem(PROFILE_PAGE_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ProfilePageCacheSnapshot>;
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, ProfilePageCacheSnapshot>): void {
  try {
    localStorage.setItem(PROFILE_PAGE_CACHE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

export function getProfilePageCache(userId: string): ProfilePageCacheSnapshot | null {
  const entry = readStore()[userId];
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > FRESH_MS) return null;
  return entry;
}

export function cacheProfilePageSnapshot(snapshot: Omit<ProfilePageCacheSnapshot, 'cachedAt'>): void {
  const store = readStore();
  store[snapshot.userId] = { ...snapshot, cachedAt: Date.now() };
  writeStore(store);
}

export function invalidateProfilePageCache(userId?: string): void {
  if (!userId) {
    localStorage.removeItem(PROFILE_PAGE_CACHE_KEY);
    return;
  }
  const store = readStore();
  delete store[userId];
  writeStore(store);
}

export const PROFILE_PAGE_CACHE_INVALIDATED_EVENT = 'de-profile-page-cache-invalidated';
