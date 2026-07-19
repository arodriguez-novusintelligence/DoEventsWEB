import type { NavigateFunction } from 'react-router-dom';
import {
  invalidateEventsCache,
  invalidateSocialFeedCache,
  type FeedPublishRedirectState,
} from '@doevents/shared';

export type { FeedPublishRedirectState };

export function buildFeedRedirectState(highlightId?: string): FeedPublishRedirectState {
  return {
    feedRefresh: true,
    feedHighlightId: highlightId,
  };
}

export type FeedPublishTargetKind = 'venue' | 'event' | 'service';

export function redirectToFeed(
  navigate: NavigateFunction,
  targetId?: string,
): void {
  invalidateEventsCache();
  invalidateSocialFeedCache();
  navigate('/', { replace: true, state: buildFeedRedirectState(targetId) });
}

/** Tras publicar, refresca el feed y navega al muro (sin repost duplicado). */
export async function finishPublishAndGoToFeed(
  targetId: string,
  options?: {
    title?: string;
    kind?: FeedPublishTargetKind;
    onNavigate?: (state: FeedPublishRedirectState) => void;
    navigate?: NavigateFunction;
  },
): Promise<void> {
  void options?.title;
  void options?.kind;
  invalidateEventsCache();
  invalidateSocialFeedCache();
  const state = buildFeedRedirectState(targetId);
  if (options?.onNavigate) {
    options.onNavigate(state);
    return;
  }
  if (options?.navigate) {
    options.navigate('/', { replace: true, state });
  }
}
