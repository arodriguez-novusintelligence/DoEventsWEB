/** Tipos UI del feed Lovable — sin datos mock de runtime. */
export interface FeedUiUser {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
}

export interface VenueFeedAddonService {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: 'evento' | 'día' | 'dia';
  imageUrl?: string;
}

export interface VenueFeedData {
  venueId: string;
  pricePerDay?: number;
  checkIn?: string;
  checkOut?: string;
  capacity?: number | string;
  addonServices?: VenueFeedAddonService[];
  availability?: {
    selectedDates?: string[];
    blockedDates?: string[];
    globalStartTime?: string;
    globalEndTime?: string;
  };
}

export interface FeedUiComment {
  id: string;
  user: FeedUiUser;
  text: string;
  timeAgo: string;
  likes: number;
  liked?: boolean;
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
  /** Publicación creada por un usuario (menú +), no un sync nativo del timeline */
  isUserPublication?: boolean;
  /** Tipo de entidad promocionada en la tarjeta inferior (evento, servicio o lugar) */
  promotedEntityType?: 'evento' | 'servicio' | 'lugar';
  /** Nombre original de la entidad (cápsula); no debe confundirse con el título de la publicación */
  promotedEntityTitle?: string;
  /** Fecha/horario original de la entidad para la cápsula */
  promotedEntityDate?: string;
  /** Ubicación original de la entidad para la cápsula */
  promotedEntityLocation?: string;
  /** Multimedia original de la entidad promocionada (miniatura de la tarjeta EVENTOS/etc.) */
  promotedEntityImages?: string[];
  /** Menciones enriquecidas del backend (usuarios, eventos, etc.) */
  feedMentions?: import('./feed').FeedMention[];
  visibility: 'public' | 'private';
  detailPath?: string | null;
  venueFeed?: VenueFeedData;
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
    isUserPublication?: boolean;
    promotedEntityType?: 'evento' | 'servicio' | 'lugar';
    promotedEntityTitle?: string;
    promotedEntityDate?: string;
    promotedEntityLocation?: string;
    promotedEntityImages?: string[];
    detailPath?: string | null;
    venueFeed?: VenueFeedData;
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
