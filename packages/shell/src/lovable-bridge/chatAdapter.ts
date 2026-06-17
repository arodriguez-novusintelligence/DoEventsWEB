import type {
  ChatMessage as ApiChatMessage,
  ChatParticipant,
  ChatRoom,
} from '@doevents/shared';
import { resolveImageUrl } from '@doevents/shared';
import {
  isAnnouncementMessage,
  isEventInProgress,
  isEventRoom,
  isEventShareMessage,
  isFileMessage,
  isGifMessage,
  isImageMessage,
  isLocationMessage,
  isPrivateGroupRoom,
  isVideoMessage,
  isRoomAdmin,
  resolveAllChatMembers,
  resolveDirectPeerParticipant,
  resolveDirectPeerUserId,
  resolveDisplayEventStatus,
  resolveEventRoomImage,
  resolveMediaUrl,
  resolveMessagePreview,
  resolveMessageSenderId,
  resolveMessageText,
  resolveRoomAvatar,
  resolveRoomEventId,
  resolveRoomId,
  resolveRoomTitle,
  userIdsMatch,
} from '@doevents/shared';
import { parseEventDate } from '@doevents/shared';
import type {
  ChatAttendee,
  ChatMessage as LovableChatMessage,
  EventChatRoom,
  EventStatus,
  PrivateChat,
} from '@lovable/data/chatData';

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'DE';
}

function formatChatTime(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

function formatEventDateLabel(fechaIni?: string, horaIni?: string): string {
  const date = parseEventDate(fechaIni);
  if (!date) return fechaIni || '—';
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const label = `${date.getDate()} ${months[date.getMonth()]}`;
  if (horaIni?.trim()) return `${label} ${horaIni.trim()}`;
  return label;
}

function resolveEventFields(room: ChatRoom): {
  estatus?: string;
  fechaIni?: string;
  fechaFin?: string;
  horaIni?: string;
  horaFin?: string;
} {
  const rawEvent = room.event as {
    estatus?: string;
    status?: string;
    fechaIni?: string;
    fechaFin?: string;
    date?: string;
    horaIni?: string;
    horaFin?: string;
  } | undefined;
  return {
    estatus: (room as { eventStatus?: string }).eventStatus
      || rawEvent?.estatus
      || rawEvent?.status,
    fechaIni: rawEvent?.fechaIni || rawEvent?.date || (room as { eventDate?: string }).eventDate,
    fechaFin: rawEvent?.fechaFin,
    horaIni: rawEvent?.horaIni,
    horaFin: rawEvent?.horaFin,
  };
}

function mapEventStatus(room: ChatRoom): EventStatus {
  const fields = resolveEventFields(room);
  const display = resolveDisplayEventStatus({
    estatus: fields.estatus,
    fechaIni: fields.fechaIni,
    fechaFin: fields.fechaFin,
    horaIni: fields.horaIni,
    horaFin: fields.horaFin,
  });

  if (display === 'cancelado') return 'cancelado';
  if (display === 'finalizado') return 'finalizado';
  if (isEventInProgress(fields)) return 'en_ejecucion';
  return 'activo';
}

function participantToAttendee(
  participant: ChatParticipant,
  room: ChatRoom,
  currentUserId: string,
  onlineUserIds: Record<string, boolean>,
): ChatAttendee {
  const name = participant.name?.trim() || 'Usuario';
  return {
    id: participant.id,
    name,
    initials: initialsFromName(name),
    avatar: resolveImageUrl(participant.avatar) || undefined,
    isAdmin: isRoomAdmin(room, participant.id),
    isOnline: Boolean(onlineUserIds[participant.id]),
  };
}

export function apiMessageToLovable(
  message: ApiChatMessage,
  currentUserId: string,
  participantMap: Map<string, { name?: string; avatar?: string }>,
): LovableChatMessage {
  const senderId = resolveMessageSenderId(message) || '';
  const isOwn = Boolean(currentUserId && userIdsMatch(senderId, currentUserId));
  const profile = participantMap.get(senderId);
  const senderName = message.senderName
    || (typeof message.sender === 'object' ? message.sender?.name : undefined)
    || profile?.name
    || (isOwn ? 'Tú' : 'Usuario');
  const text = resolveMessageText(message) || resolveMessagePreview(message);
  const mediaUrl = resolveMediaUrl(message) || undefined;
  const image = isImageMessage(message) ? mediaUrl : undefined;

  let messageType: import('@lovable/data/chatData').LovableMessageType = 'text';
  if (isAnnouncementMessage(message)) messageType = 'text';
  else if (isGifMessage(message)) messageType = 'image-gif';
  else if (isImageMessage(message)) messageType = 'image';
  else if (isVideoMessage(message)) messageType = 'video';
  else if (isFileMessage(message)) messageType = 'file';
  else if (isLocationMessage(message)) messageType = 'location';
  else if (isEventShareMessage(message)) messageType = 'event-share';

  return {
    id: message.id || message.messageId || message.clientMessageId || `msg-${Date.now()}`,
    senderId,
    senderName,
    senderInitials: initialsFromName(senderName),
    senderAvatar: resolveImageUrl(profile?.avatar) || undefined,
    text,
    timestamp: formatChatTime(message.createdAt || message.timestamp),
    isOwn,
    isAnnouncement: isAnnouncementMessage(message),
    image,
    messageType: isAnnouncementMessage(message) ? 'text' : messageType,
    mediaUrl,
    location: message.location
      ? { lat: message.location.lat, lng: message.location.lng, label: message.location.label }
      : undefined,
    sharedEvent: message.sharedEvent?.id
      ? {
        id: message.sharedEvent.id,
        name: message.sharedEvent.name,
        image: message.sharedEvent.image,
        date: message.sharedEvent.date,
      }
      : undefined,
  };
}

export function chatRoomToEventChatRoom(
  room: ChatRoom,
  messages: ApiChatMessage[],
  currentUserId: string,
  onlineUserIds: Record<string, boolean>,
): EventChatRoom {
  const participants = resolveAllChatMembers(room);
  const participantMap = new Map<string, { name?: string; avatar?: string }>();
  participants.forEach((p) => {
    if (p.id) participantMap.set(p.id, { name: p.name, avatar: p.avatar });
  });

  const eventId = resolveRoomEventId(room);
  const fields = resolveEventFields(room);
  const fechaIni = fields.fechaIni || '';
  const rawEvent = room.event as { horaIni?: string; horaFin?: string } | undefined;
  const horaIni = fields.horaIni || rawEvent?.horaIni || '';
  const horaFin = fields.horaFin || rawEvent?.horaFin || '';
  const eventTime = (room as { eventTime?: string }).eventTime
    || (horaIni && horaFin
      ? `${horaIni} – ${horaFin}`
      : horaIni || horaFin);

  return {
    id: resolveRoomId(room),
    eventId,
    eventName: room.eventName || resolveRoomTitle(room, currentUserId),
    eventImage: resolveEventRoomImage(room),
    eventDate: formatEventDateLabel(fechaIni, horaIni) || '—',
    eventDateRaw: fechaIni || undefined,
    eventTime,
    eventDescription: (room as { eventDescription?: string }).eventDescription,
    eventStatus: mapEventStatus(room),
    lastMessage: room.lastMessage || resolveRoomSubtitleFromRoom(room),
    lastMessageTime: formatChatTime(room.lastMessageAt),
    unreadCount: room.unreadCount || 0,
    attendees: participants.map((p) => participantToAttendee(p, room, currentUserId, onlineUserIds)),
    messages: messages.map((m) => apiMessageToLovable(m, currentUserId, participantMap)),
  };
}

function resolveRoomSubtitleFromRoom(room: ChatRoom): string {
  const last = room.messages?.[room.messages.length - 1];
  if (last) return resolveMessagePreview(last);
  return 'Sin mensajes recientes';
}

export function chatRoomToPrivateChat(
  room: ChatRoom,
  messages: ApiChatMessage[],
  currentUserId: string,
  onlineUserIds: Record<string, boolean>,
): PrivateChat {
  const peer = isPrivateGroupRoom(room)
    ? undefined
    : resolveDirectPeerParticipant(room, currentUserId);
  const peerId = peer?.id || resolveDirectPeerUserId(room, currentUserId);
  const title = resolveRoomTitle(room, currentUserId);
  const avatar = resolveRoomAvatar(room, currentUserId);

  const user: ChatAttendee = isPrivateGroupRoom(room)
    ? {
        id: resolveRoomId(room),
        name: title,
        initials: initialsFromName(title),
        avatar,
        isAdmin: isRoomAdmin(room, currentUserId),
        isOnline: false,
      }
    : {
        id: peerId || resolveRoomId(room),
        name: title,
        initials: initialsFromName(title),
        avatar,
        isAdmin: false,
        isOnline: Boolean(peerId && onlineUserIds[peerId]),
      };

  const participantMap = new Map<string, { name?: string; avatar?: string }>();
  resolveAllChatMembers(room).forEach((p) => {
    if (p.id) participantMap.set(p.id, { name: p.name, avatar: p.avatar });
  });
  if (peer?.id) participantMap.set(peer.id, { name: peer.name, avatar: peer.avatar });

  return {
    id: resolveRoomId(room),
    user,
    lastMessage: room.lastMessage || resolveRoomSubtitleFromRoom(room),
    lastMessageTime: formatChatTime(room.lastMessageAt),
    unreadCount: room.unreadCount || 0,
    messages: messages.map((m) => apiMessageToLovable(m, currentUserId, participantMap)),
  };
}

export function chatContactToAttendee(
  contact: { id: string; name: string; avatar?: string; online?: boolean },
): ChatAttendee {
  return {
    id: contact.id,
    name: contact.name,
    initials: initialsFromName(contact.name),
    avatar: contact.avatar,
    isAdmin: false,
    isOnline: Boolean(contact.online),
  };
}

export function splitRoomsForLovable(
  rooms: ChatRoom[],
  currentUserId: string,
  blockedUserIds: Set<string>,
): { eventRooms: ChatRoom[]; privateChats: ChatRoom[]; groupChats: ChatRoom[] } {
  const eventRooms: ChatRoom[] = [];
  const privateChats: ChatRoom[] = [];
  const groupChats: ChatRoom[] = [];

  rooms.forEach((room) => {
    if (isEventRoom(room)) {
      eventRooms.push(room);
      return;
    }
    if (isPrivateGroupRoom(room)) {
      groupChats.push(room);
      return;
    }
    if (currentUserId) {
      const peerId = resolveDirectPeerUserId(room, currentUserId);
      if (peerId && blockedUserIds.has(peerId)) return;
    }
    privateChats.push(room);
  });

  return { eventRooms, privateChats, groupChats };
}

export function roomsToEventChatRooms(
  rooms: ChatRoom[],
  currentUserId: string,
  onlineUserIds: Record<string, boolean>,
  archivedUserId?: string,
): EventChatRoom[] {
  return rooms
    .filter((room) => !archivedUserId || !(room.archivedBy || []).some((id) => userIdsMatch(id, archivedUserId)))
    .map((room) => chatRoomToEventChatRoom(room, room.messages || [], currentUserId, onlineUserIds));
}

export function roomsToPrivateChats(
  rooms: ChatRoom[],
  currentUserId: string,
  onlineUserIds: Record<string, boolean>,
  archivedUserId?: string,
): PrivateChat[] {
  return rooms
    .filter((room) => !archivedUserId || !(room.archivedBy || []).some((id) => userIdsMatch(id, archivedUserId)))
    .map((room) => chatRoomToPrivateChat(room, room.messages || [], currentUserId, onlineUserIds));
}
