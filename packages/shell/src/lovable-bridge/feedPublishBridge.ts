import {
  invalidateEventsCache,
  promotePublishedTargetToFeed,
  type FeedPublication,
  type FeedPublishRedirectState,
} from '@doevents/shared';

export type { FeedPublishRedirectState };

export async function sharePublishedItemToFeed(
  targetId: string,
  options?: { title?: string },
): Promise<FeedPublication | null> {
  if (!targetId?.trim()) return null;
  try {
    return await promotePublishedTargetToFeed(targetId, {
      title: options?.title || '',
      opinion: '',
      visibility: 'PUBLIC',
    });
  } catch {
    return null;
  }
}

export function buildFeedRedirectState(highlightId?: string): FeedPublishRedirectState {
  return {
    feedRefresh: true,
    feedHighlightId: highlightId,
  };
}

export async function finishPublishAndGoToFeed(
  targetId: string,
  options?: { title?: string; onNavigate: (state: FeedPublishRedirectState) => void },
): Promise<void> {
  const repost = await sharePublishedItemToFeed(targetId, { title: options?.title });
  invalidateEventsCache();
  options?.onNavigate(buildFeedRedirectState(repost?.id || targetId));
}
