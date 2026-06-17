import { fetchUserById } from '../api/userService';
import type { UserProfile } from '../api/userService';
import type { FeedEventItem } from '../types/events';
import { resolveImageUrl } from './resolveImageUrl';

const PROFILE_CACHE_KEY = 'doevents_profile_cache_v1';
const PROFILE_FRESH_MS = 30 * 60 * 1000;

interface CachedProfile {
  id: string;
  imagen?: string;
  nombre?: string;
  apellido?: string;
  username?: string;
  cachedAt: number;
}

const memory = new Map<string, CachedProfile>();

function readStore(): Record<string, CachedProfile> {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CachedProfile>;
  } catch {
    return {};
  }
}

function writeStore(profiles: Record<string, CachedProfile>): void {
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profiles));
  } catch {
    // ignore quota
  }
}

function toCached(profile: UserProfile): CachedProfile {
  return {
    id: profile.id || '',
    imagen: resolveImageUrl(profile.imagen) || profile.imagen,
    nombre: profile.nombre,
    apellido: profile.apellido,
    username: profile.username,
    cachedAt: Date.now(),
  };
}

export function invalidateCachedProfile(userId: string): void {
  memory.delete(userId);
  const store = readStore();
  delete store[userId];
  writeStore(store);
}

function organizerName(profile?: CachedProfile): string | undefined {
  if (!profile) return undefined;
  const full = [profile.nombre, profile.apellido].filter(Boolean).join(' ').trim();
  return full || profile.username || undefined;
}

export async function getCachedProfiles(userIds: string[]): Promise<Map<string, CachedProfile>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const result = new Map<string, CachedProfile>();
  const store = readStore();
  const missing: string[] = [];

  for (const id of unique) {
    const mem = memory.get(id);
    if (mem && Date.now() - mem.cachedAt < PROFILE_FRESH_MS) {
      result.set(id, mem);
      continue;
    }
    const stored = store[id];
    if (stored && Date.now() - stored.cachedAt < PROFILE_FRESH_MS) {
      memory.set(id, stored);
      result.set(id, stored);
      continue;
    }
    missing.push(id);
  }

  if (missing.length) {
    const fetched = await Promise.all(
      missing.map((id) => fetchUserById(id).catch(() => null)),
    );
    const nextStore = { ...store };
    missing.forEach((id, index) => {
      const profile = fetched[index];
      if (!profile) return;
      const profileId = profile.id || id;
      const cached = toCached({ ...profile, id: profileId });
      memory.set(profileId, cached);
      result.set(profileId, cached);
      nextStore[profileId] = cached;
    });
    writeStore(nextStore);
  }

  return result;
}

export async function enrichFeedEventsWithOrganizers(events: FeedEventItem[]): Promise<FeedEventItem[]> {
  const userIds = events.map((e) => e.userId).filter(Boolean) as string[];
  if (!userIds.length) {
    return events.map((e) => ({ ...e, imagen: resolveImageUrl(e.imagen) || e.imagen }));
  }

  const profiles = await getCachedProfiles(userIds);
  return events.map((event) => {
    const profile = event.userId ? profiles.get(event.userId) : undefined;
    return {
      ...event,
      imagen: resolveImageUrl(event.imagen) || event.imagen,
      organizerName: event.organizerName || organizerName(profile),
      organizerAvatar: resolveImageUrl(profile?.imagen) || profile?.imagen,
    };
  });
}
