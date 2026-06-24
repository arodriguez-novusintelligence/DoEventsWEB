/** Re-exporta tipos UI desde shared; sin datos mock de runtime. */
export type {
  FeedUiUser as User,
  FeedUiComment as Comment,
  FeedUiPost as Post,
  FeedUiBannerEvent,
} from '@doevents/shared';

/** Listas vacías — menciones en composer usan API cuando hay datos */
export const users: import('@doevents/shared').FeedUiUser[] = [];
export const bannerEvents: import('@doevents/shared').FeedUiBannerEvent[] = [];
export const mockPosts: import('@doevents/shared').FeedUiPost[] = [];
export const myFollowers: import('@doevents/shared').FeedUiUser[] = [];
