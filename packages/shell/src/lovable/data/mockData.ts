/** Tipos UI del feed — sin datos mock de runtime. */
export interface User {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  timeAgo: string;
  likes: number;
  replies: number;
  repliesData?: Comment[];
  images?: string[];
}

export interface Post {
  id: string;
  user: User;
  timeAgo: string;
  images: string[];
  title: string;
  date: string;
  location: string;
  tags: string[];
  description: string;
  likes: number;
  likedBy: User[];
  comments: Comment[];
  commentsCount?: number;
  reposts: number;
  repostedBy: User[];
  type: 'evento' | 'servicio' | 'lugar' | 'publicacion';
  visibility: 'public' | 'private';
  detailPath?: string | null;
  repostOf?: {
    user: User;
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

/** @deprecated Sin datos mock — usar API real */
export const users: User[] = [];
/** @deprecated Sin datos mock — usar API real */
export const bannerEvents: Array<{ id: string; title: string; image: string; date: string; location: string }> = [];
/** @deprecated Sin datos mock — usar API real */
export const mockPosts: Post[] = [];
