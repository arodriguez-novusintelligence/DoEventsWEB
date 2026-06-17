export interface GuestGroup {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface Guest {
  id: string;
  favoriteId?: string;
  invitedUserId?: string;
  name: string;
  lastName: string;
  username?: string;
  email?: string;
  phone?: string;
  phoneIndicative?: string;
  phoneNumber?: string;
  avatar?: string;
  isFavorite: boolean;
  groupId?: string;
  originType?: string;
  createdAt: Date;
}

export interface CreateGuestRequest {
  name: string;
  lastName: string;
  username?: string;
  email?: string;
  phone?: string;
  phoneIndicative?: string;
  phoneNumber?: string;
  isFavorite?: boolean;
  groupId?: string;
}

export interface UpdateGuestRequest {
  id: string;
  name: string;
  lastName: string;
  username?: string;
  email?: string;
  phone?: string;
  phoneIndicative?: string;
  phoneNumber?: string;
  isFavorite?: boolean;
  groupId?: string;
}

export interface CreateGroupRequest {
  name: string;
  color: string;
}

export interface UpdateGroupRequest {
  id: string;
  name: string;
  color: string;
}
