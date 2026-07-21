import { fetchFollowingList } from '../api/feedService';
import { userIdsMatch } from '../api/chatService';
import { fetchUserById } from '../api/userService';

const FOLLOWING_TTL_MS = 2 * 60 * 1000;
const PRIVACY_TTL_MS = 5 * 60 * 1000;

const followingCache = new Map<string, { ids: Set<string>; at: number }>();
const privacyCache = new Map<string, { isPublic: boolean; at: number }>();

function toShortUserId(id: string): string {
  const value = String(id || '').trim();
  if (value.length === 36 && value.includes('-')) return value.substring(0, 10);
  return value;
}

function expandUserIdAliases(ids: Iterable<string>): Set<string> {
  const out = new Set<string>();
  for (const id of ids) {
    const raw = String(id || '').trim();
    if (!raw) continue;
    out.add(raw);
    out.add(toShortUserId(raw));
  }
  return out;
}

function setHasUserId(ids: Set<string>, candidate?: string | null): boolean {
  const value = String(candidate || '').trim();
  if (!value) return false;
  if (ids.has(value) || ids.has(toShortUserId(value))) return true;
  for (const id of ids) {
    if (userIdsMatch(id, value)) return true;
  }
  return false;
}

export function canViewUserContent(input: {
  isOwnProfile?: boolean;
  isPublicProfile?: boolean;
  isFollowing?: boolean;
}): boolean {
  if (input.isOwnProfile) return true;
  if (input.isPublicProfile !== false) return true;
  return Boolean(input.isFollowing);
}

/** Mensaje directo: perfil público o seguimiento ya aceptado en perfil privado. */
export function canMessageUser(input: {
  isOwnProfile?: boolean;
  isPublicProfile?: boolean;
  isFollowing?: boolean;
}): boolean {
  if (input.isOwnProfile) return false;
  if (input.isPublicProfile !== false) return true;
  return Boolean(input.isFollowing);
}

export function getDirectMessageBlockReason(input: {
  isPublicProfile?: boolean;
  isFollowing?: boolean;
  followPending?: boolean;
}): string | null {
  if (input.followPending) {
    return 'Debes esperar a que acepte tu solicitud de seguimiento para enviar mensajes.';
  }
  if (input.isPublicProfile === false && !input.isFollowing) {
    return 'Sigue a este usuario y espera su aprobación para enviar mensajes.';
  }
  return null;
}

export function invalidatePrivacyCaches(userId?: string): void {
  if (!userId) {
    followingCache.clear();
    privacyCache.clear();
    return;
  }
  followingCache.delete(userId);
  privacyCache.delete(userId);
}

export async function getFollowingIdSet(viewerId: string): Promise<Set<string>> {
  const cacheKey = toShortUserId(viewerId) || viewerId;
  const cached = followingCache.get(cacheKey) || followingCache.get(viewerId);
  if (cached && Date.now() - cached.at < FOLLOWING_TTL_MS) {
    return cached.ids;
  }

  let list = await fetchFollowingList(viewerId, 200).catch(() => []);
  // El wall indexa por id corto; si llega UUID completo, reintentar.
  if (!list.length) {
    const shortId = toShortUserId(viewerId);
    if (shortId && shortId !== viewerId) {
      list = await fetchFollowingList(shortId, 200).catch(() => []);
    }
  }

  const ids = expandUserIdAliases(list.map((item) => item.id).filter(Boolean));
  followingCache.set(cacheKey, { ids, at: Date.now() });
  if (viewerId !== cacheKey) followingCache.set(viewerId, { ids, at: Date.now() });
  return ids;
}

export async function getProfileIsPublic(ownerId: string): Promise<boolean> {
  const cacheKey = toShortUserId(ownerId) || ownerId;
  const cached = privacyCache.get(cacheKey) || privacyCache.get(ownerId);
  if (cached && Date.now() - cached.at < PRIVACY_TTL_MS) {
    return cached.isPublic;
  }
  let profile = await fetchUserById(ownerId).catch(() => null);
  if (!profile) {
    const shortId = toShortUserId(ownerId);
    if (shortId && shortId !== ownerId) {
      profile = await fetchUserById(shortId).catch(() => null);
    }
  }
  const isPublic = profile?.isPublicProfile !== false;
  privacyCache.set(cacheKey, { isPublic, at: Date.now() });
  if (ownerId !== cacheKey) privacyCache.set(ownerId, { isPublic, at: Date.now() });
  return isPublic;
}

export function setProfilePrivacyCache(ownerId: string, isPublic: boolean): void {
  privacyCache.set(ownerId, { isPublic, at: Date.now() });
}

/**
 * Filtra contenido de perfiles privados: solo visible para el dueño y sus seguidores aceptados.
 */
export async function filterByOwnerPrivacy<T>(
  items: T[],
  getOwnerId: (item: T) => string | undefined | null,
  viewerId?: string | null,
): Promise<T[]> {
  if (!items.length) return items;

  const ownerIds = [...new Set(
    items
      .map((item) => String(getOwnerId(item) || '').trim())
      .filter(Boolean),
  )];

  if (!ownerIds.length) return items;

  const following = viewerId
    ? await getFollowingIdSet(viewerId)
    : new Set<string>();

  await Promise.all(ownerIds.map((id) => getProfileIsPublic(id)));

  return items.filter((item) => {
    const ownerId = String(getOwnerId(item) || '').trim();
    if (!ownerId) return true;
    if (viewerId && userIdsMatch(ownerId, viewerId)) return true;

    const privacy =
      privacyCache.get(ownerId)
      || privacyCache.get(toShortUserId(ownerId));
    // Público (o desconocido) → visible. Privado → solo si hay follow aceptado.
    if (!privacy || privacy.isPublic) return true;
    return setHasUserId(following, ownerId);
  });
}

/**
 * Marketplace Descubre: si privacy/following cuelga, mostrar ítems sin filtrar.
 * Evita loading eterno o listas vacías por peaje de perfiles.
 */
export async function filterByOwnerPrivacyFailOpen<T>(
  items: T[],
  getOwnerId: (item: T) => string | undefined | null,
  viewerId?: string | null,
  timeoutMs = 2500,
): Promise<T[]> {
  if (!items.length) return items;
  try {
    return await new Promise<T[]>((resolve, reject) => {
      const timer = setTimeout(() => resolve(items), timeoutMs);
      filterByOwnerPrivacy(items, getOwnerId, viewerId).then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        },
      );
    });
  } catch {
    return items;
  }
}
