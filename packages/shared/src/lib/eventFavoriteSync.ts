import { togglePublicationLike } from '../api/feedService';
import { resolveEventIdFromFeedPublication } from './feedPublicationUtils';
import type { FeedPublication } from '../types/feed';

export const EVENT_FAVORITE_CHANGED_EVENT = 'de-event-favorited';

export interface EventFavoriteChangedDetail {
  eventId: string;
  liked: boolean;
  /** Estado de favorito antes del cambio (Descubre / event like). */
  previousLiked: boolean;
}

const SOCIAL_FEED_CACHE_KEY = 'doevents_social_feed_cache_v2';

interface SocialFeedCacheStore {
  feeds: Record<string, { data: { items?: FeedPublication[] }; cachedAt: number }>;
}

function readSocialFeedStore(): SocialFeedCacheStore {
  try {
    const raw = localStorage.getItem(SOCIAL_FEED_CACHE_KEY);
    if (!raw) return { feeds: {} };
    return JSON.parse(raw) as SocialFeedCacheStore;
  } catch {
    return { feeds: {} };
  }
}

function writeSocialFeedStore(store: SocialFeedCacheStore): void {
  try {
    localStorage.setItem(SOCIAL_FEED_CACHE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

function computeFavoriteLikeDelta(
  currentLikes: number,
  liked: boolean,
  previousLiked: boolean,
): number {
  if (previousLiked === liked) return currentLikes;
  return liked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
}

function patchPublicationFavoriteState(
  post: FeedPublication,
  liked: boolean,
  previousLiked: boolean,
  likesOverride?: number,
): FeedPublication {
  const currentLikes = Number(post.stats?.likes ?? 0);
  const nextLikes = likesOverride ?? computeFavoriteLikeDelta(currentLikes, liked, previousLiked);
  const heartChanged = Boolean(post.viewerState?.liked) !== liked;
  const countChanged = nextLikes !== currentLikes;
  if (!heartChanged && !countChanged) return post;
  return {
    ...post,
    viewerState: { ...post.viewerState, liked },
    stats: { ...post.stats, likes: nextLikes },
  };
}

export function dispatchEventFavoriteChanged(
  eventId: string,
  liked: boolean,
  previousLiked?: boolean,
): void {
  if (typeof window === 'undefined') return;
  const detail: EventFavoriteChangedDetail = {
    eventId,
    liked,
    previousLiked: previousLiked ?? !liked,
  };
  window.dispatchEvent(new CustomEvent<EventFavoriteChangedDetail>(EVENT_FAVORITE_CHANGED_EVENT, {
    detail,
  }));
}

export function collectPublicationIdsForEvent(eventId: string): string[] {
  const ids = new Set<string>();
  const store = readSocialFeedStore();
  Object.values(store.feeds).forEach((entry) => {
    (entry.data.items || []).forEach((post) => {
      if (resolveEventIdFromFeedPublication(post) === eventId && post.id) {
        ids.add(post.id);
      }
    });
  });
  if (!ids.size) ids.add(eventId);
  return [...ids];
}

export function patchCachedSocialFeedEventLike(
  eventId: string,
  liked: boolean,
  previousLiked?: boolean,
  likesByPublicationId?: Record<string, number>,
): void {
  const prev = previousLiked ?? !liked;
  const store = readSocialFeedStore();
  let changed = false;
  Object.values(store.feeds).forEach((entry) => {
    const items = entry.data.items || [];
    items.forEach((post, index) => {
      if (resolveEventIdFromFeedPublication(post) !== eventId) return;
      const likesOverride = post.id ? likesByPublicationId?.[post.id] : undefined;
      const next = patchPublicationFavoriteState(post, liked, prev, likesOverride);
      if (next !== post) {
        items[index] = next;
        changed = true;
      }
    });
  });
  if (changed) writeSocialFeedStore(store);
}

export function applyEventFavoriteToPublications(
  posts: FeedPublication[],
  eventId: string,
  liked: boolean,
  previousLiked?: boolean,
): FeedPublication[] {
  const prev = previousLiked ?? !liked;
  return posts.map((post) => {
    if (resolveEventIdFromFeedPublication(post) !== eventId) return post;
    return patchPublicationFavoriteState(post, liked, prev);
  });
}

export async function syncEventFavoriteWithFeedPublications(
  eventId: string,
  liked: boolean,
  previousLiked?: boolean,
): Promise<void> {
  const prev = previousLiked ?? !liked;
  const targets = collectPublicationIdsForEvent(eventId);
  const likesByPublicationId: Record<string, number> = {};

  await Promise.all(
    targets.map(async (publicationId) => {
      try {
        const result = await togglePublicationLike(publicationId, liked);
        if (typeof result.stats?.likes === 'number') {
          likesByPublicationId[publicationId] = result.stats.likes;
        }
      } catch {
        // sin publicación en el muro: el parche local mantiene coherencia visual
      }
    }),
  );

  patchCachedSocialFeedEventLike(eventId, liked, prev, likesByPublicationId);
}
