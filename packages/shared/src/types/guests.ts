export interface EventGuest {
  guestId?: string;
  eventId?: string;
  name?: string;
  email?: string;
  phone?: string;
  userId?: string;
  favoriteId?: string;
  status?: string;
  groupId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventInvitation {
  invitationId?: string;
  id?: string;
  eventId?: string;
  userId?: string;
  favoriteId?: string;
  invitedBy?: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'expired' | string;
  message?: string;
  eventName?: string;
  eventImageSigned?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FavoriteContact {
  favoriteId: string;
  invitedUserId?: string;
  name: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  phoneIndicative?: string;
  username?: string;
  user?: string;
  profileImageUrl?: string;
  isFavorite?: boolean;
  groupIds?: string[];
  originType?: string;
}

export interface GuestGroup {
  groupId: string;
  name: string;
  description?: string;
  memberCount?: number;
  favoriteIds?: string[];
  guestIds?: string[];
}

export interface UserInvitationsResponse {
  invitations: EventInvitation[];
  stats?: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    expired: number;
  };
  nextCursor?: string | null;
}
