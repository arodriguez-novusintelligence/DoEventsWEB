import { useEffect, useMemo, useState } from 'react';
import {
  fetchNearbyStories,
  getStoredUserLocation,
  resolveImageUrl,
} from '@doevents/shared';
import type { FeedStoryItem } from '@lovable/components/feed/FeedHero';

export function useFeedStories(
  refreshKey: number,
  currentUserId?: string | null,
  currentUserName?: string,
  currentUserAvatar?: string,
) {
  const [rings, setRings] = useState<Awaited<ReturnType<typeof fetchNearbyStories>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const location = getStoredUserLocation();
    fetchNearbyStories({
      lat: location?.lat,
      lng: location?.lng,
      radiusKm: 80,
      limit: 20,
    })
      .then((items) => {
        if (!cancelled) setRings(items);
      })
      .catch(() => {
        if (!cancelled) setRings([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const stories = useMemo((): FeedStoryItem[] => {
    const result: FeedStoryItem[] = [];
    const seen = new Set<string>();

    const hasActiveStories = (ring?: (typeof rings)[number]) => Boolean(
      ring && (
        ring.live
        || (ring.storyCount != null && ring.storyCount > 0)
        || Boolean(ring.previewUrl)
      ),
    );

    if (currentUserId) {
      const ownRing = rings.find((r) => r.authorId === currentUserId);
      result.push({
        id: `own-${currentUserId}`,
        name: 'Tu historia',
        imageUrl: resolveImageUrl(currentUserAvatar),
        own: true,
        live: ownRing?.live,
        hasStory: hasActiveStories(ownRing),
        storyCount: ownRing?.storyCount,
        authorId: currentUserId,
      });
      seen.add(currentUserId);
    }

    rings.forEach((ring) => {
      if (!ring.authorId || seen.has(ring.authorId)) return;
      seen.add(ring.authorId);
      result.push({
        id: ring.id,
        name: ring.name,
        imageUrl: resolveImageUrl(ring.avatarUrl),
        live: ring.live,
        hasStory: true,
        storyCount: ring.storyCount,
        authorId: ring.authorId,
      });
    });

    return result.slice(0, 14);
  }, [rings, currentUserId, currentUserAvatar]);

  return { stories, loading };
}
