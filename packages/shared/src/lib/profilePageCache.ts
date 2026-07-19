import type { UserProfile } from '../api/userService';
import type { UserStats } from '../api/userService';
import { getPersistedOAuthProfilePhoto } from './userDisplayName';
import { isExternalProfileUrl, isSignedS3Url, toPersistentMediaUrl } from './persistentMediaUrl';

const PROFILE_PAGE_CACHE_KEY = 'doevents_profile_page_cache_v1';

/** TTL del header de perfil (avatar, portada, nombre, seguidores, likes). */
export const PROFILE_HEADER_CACHE_TTL_MS = 15 * 60 * 1000;

/** Alias retrocompatible con el TTL del header. */
export const PROFILE_PAGE_CACHE_TTL_MS = PROFILE_HEADER_CACHE_TTL_MS;

export interface ProfilePageCacheSnapshot {
  userId: string;
  profile: UserProfile | null;
  stats: UserStats | null;
  myEventsCount: number;
  myStatsCount: number;
  myPurchasesCount: number;
  myInvitationsCount: number;
  myVenuesCount: number;
  myServicesCount: number;
  followersCount: number;
  followingCount: number;
  rating: number;
  commentsCount: number;
  /** Marca de tiempo del snapshot completo (secciones secundarias). */
  cachedAt: number;
  /** Marca de tiempo del header (avatar, portada, stats sociales). */
  headerCachedAt?: number;
}

export interface ProfileHeaderCacheSnapshot {
  userId: string;
  profile: UserProfile | null;
  followersCount: number;
  followingCount: number;
  profileLikes: number;
  rating: number;
  headerCachedAt: number;
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

function resolveHeaderTimestamp(entry: ProfilePageCacheSnapshot): number {
  return entry.headerCachedAt ?? entry.cachedAt;
}

export function isProfileHeaderCacheFresh(userId: string): boolean {
  const entry = readStore()[userId];
  if (!entry?.profile) return false;
  return Date.now() - resolveHeaderTimestamp(entry) <= PROFILE_HEADER_CACHE_TTL_MS;
}

export function getProfileHeaderCache(userId: string): ProfileHeaderCacheSnapshot | null {
  const entry = readStore()[userId];
  if (!entry?.profile || !isProfileHeaderCacheFresh(userId)) return null;
  return {
    userId,
    profile: entry.profile,
    followersCount: entry.followersCount,
    followingCount: entry.followingCount,
    profileLikes: entry.profile?.likesReceivedCount ?? 0,
    rating: entry.rating,
    headerCachedAt: resolveHeaderTimestamp(entry),
  };
}

export function getProfilePageCache(userId: string): ProfilePageCacheSnapshot | null {
  const entry = readStore()[userId];
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > PROFILE_HEADER_CACHE_TTL_MS) return null;
  return entry;
}

export function cacheProfilePageSnapshot(
  snapshot: Omit<ProfilePageCacheSnapshot, 'cachedAt' | 'headerCachedAt'>,
  options?: { preserveHeader?: boolean },
): void {
  const store = readStore();
  const now = Date.now();
  const existing = store[snapshot.userId];
  store[snapshot.userId] = {
    ...snapshot,
    cachedAt: now,
    headerCachedAt: options?.preserveHeader && existing
      ? resolveHeaderTimestamp(existing)
      : now,
  };
  writeStore(store);
}

/** Actualiza contadores sin invalidar el header (TTL de avatar/portada/nombre). */
export function patchProfilePageCounts(
  userId: string,
  patch: Partial<Pick<
    ProfilePageCacheSnapshot,
    'myEventsCount' | 'myStatsCount' | 'myPurchasesCount' | 'myInvitationsCount' | 'myVenuesCount' | 'myServicesCount' | 'commentsCount'
  >>,
): void {
  const store = readStore();
  const entry = store[userId];
  if (!entry) return;
  store[userId] = {
    ...entry,
    ...patch,
    cachedAt: Date.now(),
    headerCachedAt: resolveHeaderTimestamp(entry),
  };
  writeStore(store);
}

export function invalidateProfileHeaderCache(userId?: string): void {
  invalidateProfilePageCache(userId);
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

/** Evita guardar URLs firmadas que expiran y deja OAuth/públicas estables. */
export function sanitizeProfileMediaForCache(
  profile: UserProfile,
  userId?: string | null,
): UserProfile {
  const imagen = sanitizeAvatarUrl(profile.imagen, userId);
  const coverImageUrl = sanitizeCoverUrl(profile.coverImageUrl);
  if (imagen === profile.imagen && coverImageUrl === profile.coverImageUrl) return profile;
  return { ...profile, imagen, coverImageUrl };
}

function sanitizeAvatarUrl(
  url: string | undefined,
  userId?: string | null,
): string | undefined {
  const raw = String(url || '').trim();
  if (!raw) return getPersistedOAuthProfilePhoto(userId) || undefined;
  if (isExternalProfileUrl(raw)) return raw;
  if (isSignedS3Url(raw)) {
    return toPersistentMediaUrl(raw) || getPersistedOAuthProfilePhoto(userId) || undefined;
  }
  return raw;
}

function sanitizeCoverUrl(url: string | undefined): string | undefined {
  const raw = String(url || '').trim();
  if (!raw) return undefined;
  if (isSignedS3Url(raw)) return toPersistentMediaUrl(raw) || undefined;
  return raw;
}
