/** Tipos UI del feed Lovable — sin datos mock de runtime. */
export interface FeedUiUser {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
}

export interface FeedUiComment {
  id: string;
  user: FeedUiUser;
  text: string;
  timeAgo: string;
  likes: number;
  replies: number;
  repliesData?: FeedUiComment[];
  images?: string[];
}

export interface FeedUiPost {
  id: string;
  user: FeedUiUser;
  timeAgo: string;
  images: string[];
  title: string;
  date: string;
  location: string;
  tags: string[];
  description: string;
  likes: number;
  likedBy: FeedUiUser[];
  comments: FeedUiComment[];
  commentsCount?: number;
  reposts: number;
  repostedBy: FeedUiUser[];
  type: 'evento' | 'servicio' | 'lugar' | 'publicacion';
  visibility: 'public' | 'private';
  detailPath?: string | null;
  repostOf?: {
    user: FeedUiUser;
    timeAgo: string;
    images: string[];
    title: string;
    description: string;
    date?: string;
    location?: string;
    tags: string[];
    type?: 'evento' | 'servicio' | 'lugar' | 'publicacion';
    detailPath?: string | null;
  };
}

export interface FeedUiBannerEvent {
  id: string;
  title: string;
  image: string;
  date: string;
  location: string;
}

/** Alias cortos para componentes Lovable portados */
export type User = FeedUiUser;
export type Comment = FeedUiComment;
export type Post = FeedUiPost;
