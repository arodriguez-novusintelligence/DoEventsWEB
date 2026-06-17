import { getAuthToken, getCurrentEnv } from './client';
import { getStoredUserId } from './authService';
import { parseFetchResponse, toUserFacingError } from '../lib/apiError';
import type {
  FeedComment,
  FeedCommentsResponse,
  FeedHomeResponse,
  FeedMedia,
  FeedPublication,
  FeedStoriesResponse,
  FeedStoryItem,
  FeedStoryRing,
} from '../types/feed';
import { getStoredUserLocation } from '../lib/userLocation';
import { resolveImageUrl } from '../lib/resolveImageUrl';
import {
  cacheSocialFeed,
  getCachedSocialFeedEntry,
  invalidateSocialFeedCache,
  isFresh,
} from '../lib/eventsCache';
import { revalidateOnce } from '../lib/wallCacheRevalidate';

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

function clientRequestId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Base del feed: …/wall/v1/feed (publicaciones, historias, comentarios) */
function wallFeedBase(): string {
  return getCurrentEnv().endpoints.wallFeed.replace(/\/home\/?$/, '');
}

/** Raíz wall v1: …/wall/v1 (media upload-url, etc.) */
function wallV1Base(): string {
  return getCurrentEnv().endpoints.wallFeed.replace(/\/feed\/home\/?$/, '');
}

/** @deprecated alias */
function wallBase(): string {
  return wallFeedBase();
}

export function buildSocialFeedCacheKey(
  userId: string | undefined,
  cursor: string | null | undefined,
  limit: number,
  location?: { lat?: number; lng?: number } | null,
): string {
  const lat = location?.lat != null ? Number(location.lat).toFixed(3) : 'na';
  const lng = location?.lng != null ? Number(location.lng).toFixed(3) : 'na';
  return `${userId || 'anon'}:${lat}:${lng}:${cursor || 'start'}:${limit}`;
}

function normalizeFeedMediaItem(raw: unknown): FeedMedia | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('http')) return { url: trimmed, kind: 'image' };
    const urlMatch = trimmed.match(/url=([^;}\s]+)/i);
    if (urlMatch?.[1]) return { url: urlMatch[1], kind: 'image' };
    return null;
  }
  if (typeof raw === 'object') {
    const item = raw as Record<string, unknown>;
    const url = String(item.url || item.signedUrl || item.publicUrl || '').trim();
    if (!url) return null;
    return { url, kind: String(item.kind || item.type || 'image') };
  }
  return null;
}

function normalizeFeedPublication(item: FeedPublication): FeedPublication {
  const media = (item.media || [])
    .map((entry) => normalizeFeedMediaItem(entry))
    .filter((entry): entry is FeedMedia => Boolean(entry?.url));
  const images = (item.images || []).filter(Boolean);
  const imageUrl = item.imageUrl || images[0] || media[0]?.url;
  return {
    ...item,
    media,
    images: images.length ? images : (imageUrl ? [imageUrl] : []),
    imageUrl: imageUrl || undefined,
  };
}

function normalizeFeedResponse(payload: FeedHomeResponse): FeedHomeResponse {
  return {
    ...payload,
    items: (payload.items || []).map((item) => normalizeFeedPublication(item)),
  };
}

async function requestSocialFeed(
  cursor?: string | null,
  limit = 20,
  location?: { lat?: number; lng?: number } | null,
  userId?: string,
): Promise<FeedHomeResponse> {
  const params = new URLSearchParams({ limit: String(limit), include: 'services,nearby' });
  if (cursor) params.set('cursor', cursor);
  const viewerId = userId || getStoredUserId();
  if (viewerId) params.set('viewerId', viewerId);
  const stored = location ?? getStoredUserLocation();
  if (stored?.lat != null) params.set('lat', String(stored.lat));
  if (stored?.lng != null) params.set('lng', String(stored.lng));

  const response = await fetch(`${getCurrentEnv().endpoints.wallFeed}?${params}`, {
    headers: authHeaders(),
  });

  if (response.status === 304) {
    return { items: [], hasMore: false, nextCursor: null };
  }

  const rawText = await response.text();
  if (!response.ok) {
    let message = 'Error al cargar el muro social';
    try {
      const errBody = JSON.parse(rawText) as { error?: { message?: string }; message?: string };
      message = errBody.error?.message || errBody.message || message;
    } catch {
      // usar mensaje genérico
    }
    throw new Error(message);
  }

  if (!rawText.trim()) {
    return { items: [], hasMore: false, nextCursor: null };
  }

  const parsed = JSON.parse(rawText) as FeedHomeResponse & { data?: FeedHomeResponse };
  const payload = (parsed.data && Array.isArray(parsed.data.items) ? parsed.data : parsed) as FeedHomeResponse;
  return normalizeFeedResponse({
    items: Array.isArray(payload.items) ? payload.items : [],
    nextCursor: payload.nextCursor ?? null,
    hasMore: Boolean(payload.hasMore),
    serverTime: payload.serverTime,
  });
}

export async function fetchSocialFeed(
  cursor?: string | null,
  limit = 20,
  options?: { forceNetwork?: boolean; userId?: string; location?: { lat?: number; lng?: number } | null },
): Promise<FeedHomeResponse> {
  const cacheKey = buildSocialFeedCacheKey(options?.userId, cursor, limit, options?.location);
  const isFirstPage = !cursor;
  const cachedEntry = isFirstPage ? getCachedSocialFeedEntry(cacheKey, true) : null;

  if (isFirstPage && cachedEntry && !options?.forceNetwork) {
    if (isFresh(cachedEntry.cachedAt)) {
      return cachedEntry.data;
    }
    void revalidateOnce(`social-feed:${cacheKey}`, async () => {
      const fresh = await requestSocialFeed(cursor, limit, options?.location, options?.userId);
      cacheSocialFeed(cacheKey, fresh);
    });
    return cachedEntry.data;
  }

  try {
    const data = await requestSocialFeed(cursor, limit, options?.location, options?.userId);
    if (isFirstPage) cacheSocialFeed(cacheKey, data);
    return data;
  } catch (err) {
    if (options?.forceNetwork) invalidateSocialFeedCache();
    if (cachedEntry) return cachedEntry.data;
    throw err;
  }
}

export async function createPublication(input: {
  title: string;
  description: string;
  visibility?: string;
  mediaIds?: string[];
  locationLabel?: string;
  latitude?: number;
  longitude?: number;
  type?: string;
  mentions?: import('../types/feed').FeedMention[];
}): Promise<FeedPublication> {
  let response: Response;
  try {
    response = await fetch(`${wallFeedBase()}/publications`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        type: input.type || 'post',
        title: input.title,
        description: input.description,
        visibility: input.visibility || 'PUBLIC',
        mediaIds: input.mediaIds || [],
        mentions: input.mentions || [],
        locationLabel: input.locationLabel || '',
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        clientRequestId: clientRequestId('web-post'),
      }),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la creación de la publicación'));
  }

  const body = await response.json() as { publication?: FeedPublication; error?: { message?: string } };
  if (!response.ok) {
    throw new Error(body.error?.message || 'No se pudo crear la publicación');
  }
  invalidateSocialFeedCache();
  return body.publication!;
}

export async function togglePublicationLike(
  publicationId: string,
  liked: boolean,
): Promise<{ stats?: { likes?: number }; viewerState?: { liked?: boolean } }> {
  const viewerId = getStoredUserId();
  const response = await fetch(`${wallBase()}/publications/${encodeURIComponent(publicationId)}/like`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({
      liked,
      viewerId,
      userId: viewerId,
      clientRequestId: clientRequestId('web-like'),
    }),
  });

  const body = await response.json() as { stats?: { likes?: number }; viewerState?: { liked?: boolean }; error?: { message?: string } };
  if (!response.ok) {
    throw new Error(body.error?.message || 'Error al actualizar like');
  }
  return body;
}

export async function fetchPublicationComments(
  publicationId: string,
  limit = 20,
): Promise<FeedCommentsResponse> {
  const response = await fetch(
    `${wallBase()}/publications/${encodeURIComponent(publicationId)}/comments?limit=${limit}`,
    { headers: authHeaders() },
  );

  if (!response.ok) {
    throw new Error('Error al cargar comentarios');
  }

  return response.json() as Promise<FeedCommentsResponse>;
}

export async function createPublicationComment(
  publicationId: string,
  text: string,
  options?: {
    parentCommentId?: string | null;
    mediaIds?: string[];
  },
): Promise<FeedComment> {
  const response = await fetch(
    `${wallBase()}/publications/${encodeURIComponent(publicationId)}/comments`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        text,
        parentCommentId: options?.parentCommentId ?? null,
        mediaIds: options?.mediaIds?.length ? options.mediaIds : undefined,
        clientRequestId: clientRequestId('web-comment'),
      }),
    },
  );

  const body = await response.json() as { comment?: FeedComment; error?: { message?: string } };
  if (!response.ok) {
    throw new Error(body.error?.message || 'No se pudo publicar el comentario');
  }
  return body.comment!;
}

export async function reportPublicationComment(
  commentId: string,
  input: { reason?: string; details?: string } = {},
): Promise<void> {
  const response = await fetch(
    `${wallFeedBase()}/comments/${encodeURIComponent(commentId)}/report`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        reason: input.reason || 'inappropriate',
        details: input.details || '',
        clientRequestId: clientRequestId('web-report-comment'),
      }),
    },
  );
  const body = await response.json() as { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(body.error?.message || 'No se pudo reportar el comentario');
  }
}

export async function updatePublication(
  publicationId: string,
  payload: {
    title?: string;
    description?: string;
    visibility?: string;
    locationLabel?: string;
    dateLabel?: string;
    priceLabel?: string;
    mentions?: import('../types/feed').FeedMention[];
  },
): Promise<FeedPublication> {
  const response = await fetch(`${wallBase()}/publications/${encodeURIComponent(publicationId)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({})) as {
    publication?: FeedPublication;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(body.error?.message || 'No se pudo actualizar la publicación');
  }
  if (!body.publication) {
    throw new Error('Respuesta inválida al actualizar la publicación');
  }
  return body.publication;
}

export async function shareStoryAsPublication(input: {
  description?: string;
  mediaIds?: string[];
  locationLabel?: string;
  latitude?: number;
  longitude?: number;
}): Promise<FeedPublication> {
  return createPublication({
    title: '',
    description: input.description || '',
    visibility: 'PUBLIC',
    mediaIds: input.mediaIds?.length ? input.mediaIds : undefined,
    locationLabel: input.locationLabel,
    latitude: input.latitude,
    longitude: input.longitude,
    type: 'post',
  });
}

export async function deletePublication(publicationId: string): Promise<void> {
  const response = await fetch(`${wallBase()}/publications/${encodeURIComponent(publicationId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(body.error?.message || 'No se pudo eliminar la publicación');
  }
}

export async function repostPublication(
  publicationId: string,
  input: {
    opinion?: string;
    title?: string;
    visibility?: string;
    mentions?: import('../types/feed').FeedMention[];
  } = {},
): Promise<{ repostPublication: FeedPublication; sourcePublication?: FeedPublication }> {
  const response = await fetch(`${wallFeedBase()}/reposts`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      sourcePublicationId: publicationId,
      opinion: input.opinion || '',
      title: input.title || '',
      visibility: input.visibility || 'PUBLIC',
      mentions: input.mentions || [],
      clientRequestId: clientRequestId('web-repost'),
    }),
  });

  const body = await response.json() as {
    repostPublication?: FeedPublication;
    sourcePublication?: FeedPublication;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(body.error?.message || 'No se pudo repostear');
  }
  if (!body.repostPublication) {
    throw new Error('Respuesta inválida al repostear');
  }
  invalidateSocialFeedCache();
  return {
    repostPublication: body.repostPublication,
    sourcePublication: body.sourcePublication,
  };
}

/** Promueve un evento, servicio o lugar recién publicado al muro social (repost automático). */
export async function promotePublishedTargetToFeed(
  targetId: string,
  input: {
    opinion?: string;
    title?: string;
    visibility?: string;
  } = {},
): Promise<FeedPublication | null> {
  const cleanId = String(targetId || '').trim();
  if (!cleanId) return null;

  try {
    const result = await repostPublication(cleanId, {
      opinion: input.opinion || '',
      title: input.title || '',
      visibility: input.visibility || 'PUBLIC',
    });
    return result.repostPublication;
  } catch (err) {
    const message = err instanceof Error ? err.message.toLowerCase() : '';
    if (
      message.includes('reposte')
      || message.includes('already')
      || message.includes('409')
    ) {
      return null;
    }
    throw err;
  }
}

export async function sharePublication(publicationId: string): Promise<{ shares?: number; shareUrl?: string }> {
  const response = await fetch(
    `${wallFeedBase()}/publications/${encodeURIComponent(publicationId)}/share`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        channel: 'web',
        clientRequestId: clientRequestId('web-share'),
      }),
    },
  );

  const body = await response.json() as {
    stats?: { shares?: number };
    shareUrl?: string;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(body.error?.message || 'No se pudo compartir');
  }
  return { shares: body.stats?.shares, shareUrl: body.shareUrl };
}

export type FollowersCountResult = {
  count: number;
  isFollowing: boolean;
};

export async function fetchFollowersCount(
  userId: string,
  viewerId?: string,
): Promise<FollowersCountResult> {
  const params = viewerId ? `?viewerId=${encodeURIComponent(viewerId)}` : '';
  const response = await fetch(
    `${getCurrentEnv().apiBaseUrl}/wall/client/${encodeURIComponent(userId)}/followers/count${params}`,
    { headers: authHeaders() },
  );
  if (!response.ok) return { count: 0, isFollowing: false };
  const body = await response.json() as {
    followers_count?: number;
    count?: number;
    isFollowing?: boolean;
  };
  return {
    count: body.followers_count ?? body.count ?? 0,
    isFollowing: Boolean(body.isFollowing),
  };
}

export async function fetchFollowingList(userId: string, limit = 50): Promise<Array<{ id: string; name: string; avatarUrl?: string | null }>> {
  const response = await fetch(
    `${getCurrentEnv().apiBaseUrl}/wall/client/${encodeURIComponent(userId)}/following?limit=${limit}`,
    { headers: authHeaders() },
  );
  if (!response.ok) return [];
  const body = await response.json() as { following?: Array<{ id: string; name: string; lastName?: string; avatarUrl?: string | null }> };
  return (body.following || []).map((item) => ({
    id: item.id,
    name: [item.name, item.lastName].filter(Boolean).join(' ') || 'Usuario',
    avatarUrl: item.avatarUrl,
  }));
}

export async function fetchFollowersList(userId: string, limit = 50): Promise<Array<{ id: string; name: string; avatarUrl?: string | null }>> {
  const response = await fetch(
    `${getCurrentEnv().apiBaseUrl}/wall/client/${encodeURIComponent(userId)}/followers?limit=${limit}`,
    { headers: authHeaders() },
  );
  if (!response.ok) return [];
  const body = await response.json() as { followers?: Array<{ id: string; name: string; lastName?: string; avatarUrl?: string | null }> };
  return (body.followers || []).map((item) => ({
    id: item.id,
    name: [item.name, item.lastName].filter(Boolean).join(' ') || 'Usuario',
    avatarUrl: item.avatarUrl,
  }));
}

export async function fetchFollowingCount(userId: string): Promise<number> {
  const response = await fetch(
    `${getCurrentEnv().apiBaseUrl}/wall/client/${encodeURIComponent(userId)}/following/count`,
    { headers: authHeaders() },
  );
  if (!response.ok) return 0;
  const body = await response.json() as { following_count?: number; count?: number };
  return body.following_count ?? body.count ?? 0;
}

export type FollowUserResult = {
  status?: 'accepted' | 'pending';
  message?: string;
};

export async function followUser(followerId: string, targetUserId: string): Promise<FollowUserResult> {
  let response: Response;
  try {
    response = await fetch(`${getCurrentEnv().apiBaseUrl}/wall/client/follow`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ userId: followerId, follow_userId: targetUserId }),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la solicitud de seguimiento'));
  }
  if (response.status === 409) {
    return { status: 'accepted', message: 'Ya sigues a este usuario' };
  }
  if (response.status === 404) {
    const body = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(body.message || 'Usuario no encontrado');
  }
  const body = await parseFetchResponse<{ message?: string; status?: 'accepted' | 'pending' }>(
    response,
    'No se pudo enviar la solicitud de seguimiento',
  );
  return { status: body.status, message: body.message };
}

export interface FollowRequestItem {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string | null;
  requestedAt?: string;
}

export async function fetchPendingFollowRequests(userId: string): Promise<FollowRequestItem[]> {
  let response: Response;
  try {
    response = await fetch(
      `${getCurrentEnv().apiBaseUrl}/wall/client/${encodeURIComponent(userId)}/follow-requests`,
      { headers: authHeaders() },
    );
  } catch {
    return [];
  }
  if (!response.ok) return [];
  const body = await response.json() as {
    requests?: Array<{
      userId?: string;
      id?: string;
      name?: string;
      lastName?: string;
      avatarUrl?: string | null;
      timestamp?: string;
    }>;
  };
  return (body.requests || []).map((item) => ({
    id: item.userId || item.id || '',
    userId: item.userId || item.id || '',
    name: [item.name, item.lastName].filter(Boolean).join(' ').trim() || 'Usuario',
    avatarUrl: item.avatarUrl,
    requestedAt: item.timestamp,
  }));
}

export async function respondFollowRequest(
  userId: string,
  followerUserId: string,
  action: 'accept' | 'reject',
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${getCurrentEnv().apiBaseUrl}/wall/client/follow/respond`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        userId,
        follow_userId: followerUserId,
        action,
      }),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la respuesta a la solicitud'));
  }
  await parseFetchResponse(response, 'No se pudo responder la solicitud');
}

export async function unfollowUser(followerId: string, targetUserId: string): Promise<void> {
  const response = await fetch(`${getCurrentEnv().apiBaseUrl}/wall/client/unfollow`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId: followerId, follow_userId: targetUserId }),
  });
  const body = await response.json() as { error?: { message?: string }; message?: string };
  if (!response.ok) {
    throw new Error(body.error?.message || body.message || 'No se pudo dejar de seguir');
  }
}

export async function requestMediaUploadUrl(input: {
  fileName: string;
  contentType: string;
}): Promise<{ uploadUrl: string; mediaId: string }> {
  let response: Response;
  try {
    response = await fetch(`${wallV1Base()}/media/upload-url`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        fileName: input.fileName,
        contentType: input.contentType,
        clientRequestId: clientRequestId('web-media'),
      }),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la preparación de la subida de archivos'));
  }

  const body = await response.json() as {
    uploadUrl?: string;
    mediaId?: string;
    media?: { id?: string };
    error?: { message?: string };
  };
  if (!response.ok || !body.uploadUrl) {
    throw new Error(body.error?.message || 'No se pudo preparar la subida de imagen');
  }
  return {
    uploadUrl: body.uploadUrl,
    mediaId: body.mediaId || body.media?.id || '',
  };
}

export async function createStory(input: {
  description?: string;
  mediaIds?: string[];
  mediaKind?: 'image' | 'video' | 'text';
  isLive?: boolean;
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
}): Promise<FeedPublication> {
  const response = await fetch(`${wallBase()}/publications`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      type: 'story',
      title: '',
      description: input.description || '',
      visibility: 'PUBLIC',
      mediaIds: input.mediaIds || [],
      isLive: Boolean(input.isLive),
      mediaKind: input.mediaKind || (input.mediaIds?.length ? 'image' : 'text'),
      latitude: input.latitude,
      longitude: input.longitude,
      locationLabel: input.locationLabel || '',
      clientRequestId: clientRequestId('web-story'),
    }),
  });

  const body = await response.json() as { publication?: FeedPublication; error?: { message?: string } };
  if (!response.ok) {
    throw new Error(body.error?.message || 'No se pudo crear la historia');
  }
  return body.publication!;
}

export async function updateStoryLivePlayback(input: {
  publicationId: string;
  mediaIds: string[];
  isLive?: boolean;
  description?: string;
}): Promise<void> {
  const response = await fetch(`${wallBase()}/publications/${encodeURIComponent(input.publicationId)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({
      replaceMedia: true,
      mediaIds: input.mediaIds,
      mediaKind: 'video',
      isLive: input.isLive ?? true,
      description: input.description,
    }),
  });
  const body = await response.json() as { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(body.error?.message || 'No se pudo actualizar la transmisión');
  }
}

function storiesEndpoint(): string {
  return `${wallFeedBase()}/stories`;
}

export async function fetchNearbyStories(options?: {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  limit?: number;
}): Promise<FeedStoryRing[]> {
  const stored = getStoredUserLocation();
  const lat = options?.lat ?? stored?.lat;
  const lng = options?.lng ?? stored?.lng;
  const params = new URLSearchParams({
    limit: String(options?.limit ?? 20),
    radiusKm: String(options?.radiusKm ?? 80),
  });
  if (lat != null) params.set('lat', String(lat));
  if (lng != null) params.set('lng', String(lng));

  const response = await fetch(`${storiesEndpoint()}?${params}`, {
    headers: authHeaders(),
  });

  if (!response.ok) return [];
  const body = await response.json() as FeedStoriesResponse;
  return (body.items || []).map((item) => ({
    ...item,
    avatarUrl: resolveImageUrl(item.avatarUrl),
    previewUrl: resolveImageUrl(item.previewUrl),
  }));
}

export async function fetchUserLikedPublications(
  userId: string,
  limit = 30,
): Promise<FeedPublication[]> {
  const response = await fetch(
    `${wallBase()}/users/${encodeURIComponent(userId)}/likes?limit=${limit}`,
    { headers: authHeaders() },
  );
  if (!response.ok) return [];
  const body = await response.json() as { items?: FeedPublication[] };
  return body.items || [];
}

export async function fetchUserPublications(
  userId: string,
  limit = 30,
): Promise<FeedPublication[]> {
  const response = await fetch(
    `${wallBase()}/users/${encodeURIComponent(userId)}/publications?limit=${limit}`,
    { headers: authHeaders() },
  );
  if (!response.ok) {
    throw new Error('No se pudieron cargar tus publicaciones');
  }
  const body = await response.json() as { items?: FeedPublication[]; publications?: FeedPublication[] };
  return body.items || body.publications || [];
}

export async function fetchUserStories(authorUserId: string): Promise<FeedStoryItem[]> {
  const response = await fetch(
    `${storiesEndpoint()}?authorId=${encodeURIComponent(authorUserId)}&limit=20`,
    { headers: authHeaders() },
  );
  if (!response.ok) return [];
  const body = await response.json() as {
    items?: Array<FeedStoryItem & { media?: FeedMedia[]; imageUrl?: string }>;
  };
  return (body.items || []).map((item) => {
    const mediaFromList = item.media?.[0];
    const rawUrl = item.mediaUrl || mediaFromList?.url || item.imageUrl || '';
    const resolvedUrl = resolveImageUrl(rawUrl) || rawUrl;
    const kindFromApi = item.mediaKind || (mediaFromList?.kind as FeedStoryItem['mediaKind']);
    const isVideo = kindFromApi === 'video'
      || item.isLive
      || /\.(mp4|mov|webm|m4v)(\?|$)/i.test(rawUrl);
    return {
      ...item,
      authorAvatar: resolveImageUrl(item.authorAvatar),
      mediaUrl: resolvedUrl || undefined,
      mediaKind: kindFromApi || (isVideo ? 'video' : resolvedUrl ? 'image' : 'text'),
    };
  });
}

export async function uploadMediaFile(file: File): Promise<string> {
  let uploadUrl: string;
  let mediaId: string;
  try {
    const presign = await requestMediaUploadUrl({
      fileName: file.name || (file.type.startsWith('video/') ? 'video.webm' : 'image.jpg'),
      contentType: file.type || 'image/jpeg',
    });
    uploadUrl = presign.uploadUrl;
    mediaId = presign.mediaId;
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la preparación de la subida'));
  }
  if (!mediaId?.trim()) {
    throw new Error('No se recibió el identificador del archivo. Intenta de nuevo.');
  }
  try {
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'image/jpeg' },
      body: file,
    });
    if (!uploadResponse.ok) {
      throw new Error(`Error al subir el archivo (${uploadResponse.status})`);
    }
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la subida del archivo'));
  }
  return mediaId;
}
