export interface FeedAuthor {
  id: string;
  name: string;
  avatarUrl?: string | null;
  isFollowing?: boolean;
}

export interface FeedMedia {
  url: string;
  kind?: string;
}

export interface FeedStats {
  likes: number;
  comments: number;
  reposts?: number;
  shares?: number;
}

export interface FeedViewerState {
  liked: boolean;
  reposted?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface FeedMention {
  type?: string;
  mentionType?: string;
  targetId?: string;
  userId?: string | null;
  eventId?: string | null;
  tag?: string;
  name?: string | null;
  title?: string | null;
  dateLabel?: string;
  locationLabel?: string;
  metadata?: Record<string, unknown>;
}

export interface FeedRepostOf {
  publicationId?: string;
  targetType?: string;
  eventId?: string;
  serviceId?: string;
  venueId?: string;
  targetId?: string;
}

export interface FeedPublication {
  id: string;
  listItemType?: string;
  type: string;
  author: FeedAuthor;
  createdAt?: string;
  title?: string;
  description?: string;
  media?: FeedMedia[];
  imageUrl?: string | null;
  images?: string[];
  stats: FeedStats;
  viewerState: FeedViewerState;
  locationLabel?: string;
  dateLabel?: string;
  eventId?: string;
  targetId?: string;
  mentions?: FeedMention[];
  repostOf?: FeedRepostOf | null;
  sourcePublication?: FeedPublication | null;
  sourceImages?: string[];
  sourceImageUrl?: string | null;
  metadata?: Record<string, unknown>;
  isRepost?: boolean;
}

export interface FeedHomeResponse {
  items: FeedPublication[];
  nextCursor?: string | null;
  hasMore?: boolean;
  serverTime?: string;
}

export interface FeedComment {
  id: string;
  publicationId?: string;
  text: string;
  author?: FeedAuthor;
  user?: FeedAuthor;
  createdAt?: string;
  stats?: { likes?: number; replies?: number };
  viewerState?: { liked?: boolean };
  media?: FeedMedia[];
  images?: string[];
  parentCommentId?: string | null;
}

export interface FeedCommentsResponse {
  items: FeedComment[];
  nextCursor?: string | null;
  hasMore?: boolean;
}

export interface FeedStoryItem {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  description?: string;
  mediaUrl?: string;
  mediaKind?: 'image' | 'video' | 'text';
  isLive?: boolean;
  createdAt?: string;
  expiresAt?: string;
  locationLabel?: string;
  mediaIds?: string[];
  latitude?: number;
  longitude?: number;
}

export interface FeedStoryRing {
  id: string;
  authorId: string;
  name: string;
  avatarUrl?: string;
  previewUrl?: string;
  live?: boolean;
  isOwn?: boolean;
  hasStory?: boolean;
  storyCount?: number;
}

export interface FeedStoriesResponse {
  items: FeedStoryRing[];
  serverTime?: string;
}

export interface FeedPublishRedirectState {
  feedRefresh?: boolean;
  feedHighlightId?: string;
}
