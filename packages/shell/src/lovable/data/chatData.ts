export interface ChatAttendee {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  /** Handle para @mención (si no hay, se deriva del nombre). */
  username?: string;
  isAdmin: boolean;
  isOnline: boolean;
}

export type LovableMessageType =
  | 'text'
  | 'image'
  | 'image-gif'
  | 'video'
  | 'file'
  | 'location'
  | 'event-share';

export interface ChatMessageLocation {
  lat: number;
  lng: number;
  label?: string;
}

export interface ChatSharedEventPreview {
  id: string;
  name?: string;
  image?: string;
  date?: string;
}

export interface ChatMessageReply {
  id: string;
  text: string;
  senderName: string;
  senderId?: string;
}

export interface ChatMessageReaction {
  userId: string;
  emoji: string;
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
  isAnnouncement?: boolean;
  image?: string;
  messageType?: LovableMessageType;
  mediaUrl?: string;
  location?: ChatMessageLocation;
  sharedEvent?: ChatSharedEventPreview;
  replyTo?: ChatMessageReply;
  reactions?: ChatMessageReaction[];
}

export type EventStatus = 'activo' | 'en_ejecucion' | 'cancelado' | 'finalizado';

export interface EventChatRoom {
  id: string;
  eventId?: string;
  eventName: string;
  eventImage?: string;
  eventDate: string;
  eventDateRaw?: string;
  eventTime?: string;
  eventDescription?: string;
  eventStatus: EventStatus;
  ticketsSold?: number;
  salesRevenue?: number;
  promoCodesRedeemed?: number;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  attendees: ChatAttendee[];
  messages: ChatMessage[];
}

export interface PrivateChat {
  id: string;
  user: ChatAttendee;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}
export const mockPrivateChats: PrivateChat[] = [];
export const mockChatRooms: EventChatRoom[] = [];
