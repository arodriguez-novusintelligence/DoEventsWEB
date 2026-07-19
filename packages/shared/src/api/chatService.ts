import { getAuthToken, getCurrentEnv } from './client';
import { toUserFacingError } from '../lib/apiError';
import { putBlobToPresignedUrl } from '../lib/presignedUpload';
import { prepareImageForUpload } from '../lib/imageUtils';
import { fileToBase64 } from './profileMediaService';
import {
  chatMediaPublicUrl,
  isPlaceholderEventImage,
  resolveEventImageUrl,
  resolveImageUrl,
} from '../lib/resolveImageUrl';
import { resolveUserAvatarUrl } from '../lib/userAvatarUtils';
import {
  cacheChatMessages,
  cacheChatRooms,
  getCachedChatMessages,
  getCachedChatRooms,
} from '../lib/chatCache';
import { revalidateOnce } from '../lib/wallCacheRevalidate';
import { resolveDisplayEventStatus } from '../lib/eventStatusUtils';

export interface ChatParticipant {
  id: string;
  name?: string;
  username?: string;
  avatar?: string;
}

export interface ChatRoom {
  roomId?: string;
  id?: string;
  eventId?: string;
  eventName?: string;
  eventStatus?: string;
  eventDate?: string;
  event?: {
    id?: string;
    nombre?: string;
    name?: string;
    image?: string;
  };
  eventImage?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  chatType?: 'direct' | 'group' | 'event' | 'unknown';
  participants?: ChatParticipant[] | string[];
  pendingParticipants?: string[];
  pendingParticipantDetails?: ChatParticipant[];
  directChatStatus?: 'pending' | 'active';
  invitationPending?: boolean;
  canMessage?: boolean;
  initiatorId?: string;
  hostName?: string;
  roomName?: string;
  messages?: ChatMessage[];
  unreadCount?: number;
  target?: string[];
  inviteeId?: string;
  archivedBy?: string[];
  directPeer?: ChatParticipant;
  adminId?: string | string[];
  administrators?: string[];
  blacklist?: string[];
  isAdmin?: boolean;
  isDraft?: boolean;
  draftPeerId?: string;
}

export type DirectChatRequestResult = {
  room: ChatRoom;
  created: boolean;
  status: 'pending' | 'active';
  canMessage: boolean;
  invitationPending: boolean;
};

export interface ChatMessageLocation {
  lat: number;
  lng: number;
  label?: string;
}

export interface ChatSharedEvent {
  id?: string;
  name?: string;
  image?: string;
  date?: string;
}

export interface ChatMessage {
  messageId?: string;
  id?: string;
  clientMessageId?: string;
  roomId?: string;
  userId?: string;
  sender?: string | { id?: string; name?: string; avatar?: string };
  senderName?: string;
  text?: string;
  content?: string;
  asset?: string;
  media?: {
    url?: string;
    thumb?: string;
    fileType?: string;
    fileName?: string;
    key?: string;
  };
  location?: ChatMessageLocation;
  sharedEvent?: ChatSharedEvent;
  createdAt?: string;
  timestamp?: string;
  type?: string;
  status?: string;
  deletedAt?: string;
  replyMeta?: {
    replyToId?: string;
    reply?: {
      id?: string;
      text?: string;
      sender?: string;
      type?: string;
    };
  };
  reactions?: Array<{
    userId?: string;
    emoji?: string;
    createdAt?: string;
  }>;
}

export interface SendChatMessageInput {
  text?: string;
  type?: string;
  asset?: string;
  media?: ChatMessage['media'];
  location?: ChatMessageLocation;
  sharedEvent?: ChatSharedEvent;
  replyToId?: string;
  reply?: {
    id: string;
    text: string;
    sender: string;
    type?: string;
  };
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

function chatRestBase(): string {
  return getCurrentEnv().chat.restBaseUrl.replace(/\/$/, '');
}

function extractParticipantIds(participants: ChatRoom['participants']): string[] {
  if (!Array.isArray(participants)) return [];
  return participants
    .map((p) => (typeof p === 'string' ? p : p?.id))
    .filter((id): id is string => Boolean(id));
}

/** Compara ids cortos (10 chars) vs UUID completo del mismo usuario. */
export function userIdsMatch(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const left = String(a).trim();
  const right = String(b).trim();
  if (!left || !right) return false;
  if (left === right) return true;
  const shortLeft = left.length === 36 && left.includes('-') ? left.substring(0, 10) : left;
  const shortRight = right.length === 36 && right.includes('-') ? right.substring(0, 10) : right;
  return shortLeft === shortRight;
}

export function isDirectChatRoom(room: ChatRoom): boolean {
  return room.chatType === 'direct'
    || (Array.isArray(room.target) && room.target.includes('room::direct'));
}

/** Normaliza estado de chat directo según el usuario actual (invitado vs remitente). */
export function normalizeDirectRoomForUser(room: ChatRoom, userId: string): ChatRoom {
  const pending = Array.isArray(room.pendingParticipants) ? room.pendingParticipants : [];
  const participantIds = extractParticipantIds(room.participants);
  const isInvitee = pending.some((id) => userIdsMatch(id, userId));
  const isActive = participantIds.length >= 2 && pending.length === 0;
  const directPeer = room.directPeer || resolveDirectPeerParticipant(room, userId);

  if (room.directChatStatus === 'active' && room.canMessage !== false) {
    return {
      ...room,
      roomId: room.roomId || room.id,
      chatType: room.chatType || 'direct',
      directChatStatus: 'active',
      invitationPending: false,
      canMessage: true,
      directPeer,
      eventName: undefined,
    };
  }

  return {
    ...room,
    roomId: room.roomId || room.id,
    chatType: room.chatType || 'direct',
    directChatStatus: isActive ? 'active' : 'pending',
    invitationPending: isInvitee,
    canMessage: isActive ? true : room.canMessage === true,
    directPeer,
    eventName: undefined,
  };
}

export function isDraftChatRoom(room?: ChatRoom | null): boolean {
  return Boolean(room?.isDraft || String(room?.roomId || room?.id || '').startsWith('draft:'));
}

export function findDirectRoomWithPeer(
  rooms: ChatRoom[],
  userId: string,
  targetUserId: string,
): ChatRoom | undefined {
  return rooms.find((room) => {
    if (!isDirectChatRoom(room) || isDraftChatRoom(room)) return false;
    const peerId = resolveDirectPeerUserId(room, userId);
    return peerId ? userIdsMatch(peerId, targetUserId) : false;
  });
}

async function requestUserChatRooms(userId: string): Promise<ChatRoom[]> {
  const url = `${chatRestBase()}/chats-rooms-by-user/${encodeURIComponent(userId)}`;
  let response: Response;
  try {
    response = await fetch(url, { headers: authHeaders() });
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'No se pudo conectar al servicio de chat');
  }

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json() as { error?: string; message?: string };
      detail = body.error || body.message || '';
    } catch {
      // ignore parse errors
    }
    throw new Error(detail || 'No se pudieron cargar tus conversaciones');
  }

  const data = await response.json() as ChatRoom[] | { chats?: ChatRoom[]; rooms?: ChatRoom[] };
  const rooms = Array.isArray(data) ? data : data.chats || data.rooms || [];

  return rooms.map((room) => {
    const isDirect = isDirectChatRoom(room);
    const normalized = {
      ...room,
      roomId: room.roomId || room.id,
      eventName: isDirect
        ? undefined
        : (room.eventName || room.event?.nombre || room.event?.name),
      eventImage: isDirect ? undefined : (room.eventImage || room.event?.image),
      lastMessage: room.lastMessage || room.messages?.[room.messages.length - 1]?.text,
      lastMessageAt: room.lastMessageAt || room.messages?.[room.messages.length - 1]?.createdAt,
      unreadCount: Number(room.unreadCount || 0) || 0,
    };
    if (isDirect) {
      return normalizeDirectRoomForUser({ ...normalized, chatType: 'direct' }, userId);
    }
    const pending = room.pendingParticipants || [];
    const participants = extractParticipantIds(room.participants);
    const isInvitee = pending.some((id) => userIdsMatch(id, userId));
    return {
      ...normalized,
      directChatStatus: room.directChatStatus || (isInvitee ? 'pending' : 'active'),
      canMessage: room.canMessage ?? (!isInvitee && participants.length > 0),
      invitationPending: room.invitationPending ?? isInvitee,
    };
  });
}

export async function fetchUserChatRooms(
  userId: string,
  options?: { skipCache?: boolean },
): Promise<ChatRoom[]> {
  if (!options?.skipCache) {
    const cached = getCachedChatRooms(userId);
    if (cached) {
      void revalidateOnce(`chat-rooms:${userId}`, async () => {
        const fresh = await requestUserChatRooms(userId);
        cacheChatRooms(userId, fresh);
      });
      return cached;
    }
  }

  const rooms = await requestUserChatRooms(userId);
  cacheChatRooms(userId, rooms);
  return rooms;
}

async function requestChatMessages(roomId: string): Promise<ChatMessage[]> {
  const response = await fetch(
    `${chatRestBase()}/chat-messages-by-room/${encodeURIComponent(roomId)}`,
    { headers: authHeaders() },
  );

  if (!response.ok) {
    throw new Error('No se pudieron cargar los mensajes');
  }

  const data = await response.json() as { messages?: ChatMessage[] } | ChatMessage[];
  const messages = Array.isArray(data) ? data : data.messages || [];
  return messages.map((message) => normalizeMessage(message));
}

export async function fetchChatMessages(
  roomId: string,
  options?: { skipCache?: boolean },
): Promise<ChatMessage[]> {
  if (!options?.skipCache) {
    const cached = getCachedChatMessages(roomId);
    if (cached) {
      void revalidateOnce(`chat-messages:${roomId}`, async () => {
        const fresh = await requestChatMessages(roomId);
        cacheChatMessages(roomId, fresh);
      });
      return cached;
    }
  }

  const messages = await requestChatMessages(roomId);
  cacheChatMessages(roomId, messages);
  return messages;
}

function normalizeMessage(message: ChatMessage): ChatMessage {
  const sender = message.sender;
  const senderObj = typeof sender === 'object' && sender ? sender : undefined;
  return {
    ...message,
    id: message.id || message.messageId,
    text: message.text || message.content || message.asset || message.media?.url,
    userId: message.userId || (typeof sender === 'string' ? sender : senderObj?.id),
    senderName: message.senderName || senderObj?.name,
  };
}

export async function fetchChatRoomByEvent(eventId: string): Promise<ChatRoom | null> {
  const response = await fetch(
    `${chatRestBase()}/chat-room-by-event/${encodeURIComponent(eventId)}`,
    { headers: authHeaders() },
  );
  if (!response.ok) return null;
  const data = await response.json() as ChatRoom;
  const eventName = data.eventName || data.event?.nombre || data.event?.name;
  const eventImage = data.eventImage || data.event?.image;
  return {
    ...data,
    roomId: data.roomId || data.id,
    eventId: data.eventId || eventId,
    eventName,
    eventImage,
    chatType: data.chatType || 'event',
    event: data.event || {
      id: data.eventId || eventId,
      nombre: eventName,
      name: eventName,
      image: eventImage,
    },
  };
}

export async function requestDirectChat(userId: string, targetUserId: string): Promise<DirectChatRequestResult> {
  let response: Response;
  try {
    response = await fetch(`${chatRestBase()}/get-or-create-direct-chat-room`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ userA: userId, userB: targetUserId }),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'el servicio de mensajes'));
  }
  const body = await response.json().catch(() => ({})) as {
    room?: ChatRoom;
    created?: boolean;
    status?: 'pending' | 'active';
    canMessage?: boolean;
    invitationPending?: boolean;
    error?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(body.error || body.message || 'No se pudo iniciar el chat directo');
  }
  const room = body.room || (body as unknown as ChatRoom);
  const normalizedRoom = normalizeDirectRoomForUser({
    ...room,
    roomId: room.roomId || room.id,
    chatType: 'direct',
    directChatStatus: body.status || room.directChatStatus,
    canMessage: body.canMessage ?? room.canMessage,
    invitationPending: body.invitationPending ?? room.invitationPending,
  }, userId);
  return {
    room: normalizedRoom,
    created: Boolean(body.created),
    status: normalizedRoom.directChatStatus || 'active',
    canMessage: normalizedRoom.canMessage ?? false,
    invitationPending: normalizedRoom.invitationPending ?? false,
  };
}

/** @deprecated Usa requestDirectChat */
export async function getOrCreateDirectChatRoom(userId: string, targetUserId: string): Promise<ChatRoom> {
  const result = await requestDirectChat(userId, targetUserId);
  return result.room;
}

export async function acceptChatInvitation(userId: string, roomId: string): Promise<void> {
  const response = await fetch(`${chatRestBase()}/accept-invitation-chat-room`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ userId, roomId }),
  });
  const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(body.error || body.message || 'No se pudo aceptar la invitación al chat');
  }
}

export async function declineChatInvitation(userId: string, roomId: string): Promise<void> {
  const response = await fetch(`${chatRestBase()}/decline-invitation-chat-room`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ userId, roomId }),
  });
  const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(body.error || body.message || 'No se pudo rechazar la invitación al chat');
  }
}

export async function initChatMediaUpload(input: {
  roomId: string;
  userId: string;
  fileName: string;
  contentType: string;
  size: number;
}): Promise<{ uploadUrl: string; mediaKey?: string; mediaUrl?: string }> {
  let response: Response;
  try {
    response = await fetch(`${chatRestBase()}/chat-media-upload/init`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        roomId: input.roomId,
        fileName: input.fileName,
        fileType: input.contentType,
        size: input.size,
        senderId: input.userId,
      }),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'el servicio de imágenes del chat'));
  }
  const body = await response.json().catch(() => ({})) as {
    uploadUrl?: string;
    mediaKey?: string;
    mediaUrl?: string;
    error?: string;
    message?: string;
  };
  if (!response.ok || !body.uploadUrl) {
    throw new Error(body.error || body.message || 'No se pudo preparar la imagen');
  }
  return {
    uploadUrl: body.uploadUrl,
    mediaKey: body.mediaKey,
    mediaUrl: body.mediaUrl,
  };
}

function resolvePresignedContentType(uploadUrl: string, fallback: string): string {
  try {
    const parsed = new URL(uploadUrl);
    const fromQuery = parsed.searchParams.get('Content-Type')
      || parsed.searchParams.get('content-type');
    if (fromQuery) return decodeURIComponent(fromQuery);
  } catch {
    // ignore malformed URL
  }
  return fallback;
}

export function normalizeChatMediaMime(file: File): string {
  const normalized = String(file.type || '').trim().toLowerCase();
  if (normalized === 'image/jpg') return 'image/jpeg';
  if (normalized) return normalized;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const byExt: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    m4v: 'video/x-m4v',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    zip: 'application/zip',
  };
  return byExt[ext] || 'application/octet-stream';
}

const MAX_DIRECT_CHAT_UPLOAD_BYTES = 8 * 1024 * 1024;

async function prepareChatMediaFile(file: File): Promise<File> {
  const contentType = normalizeChatMediaMime(file);
  if (!contentType.startsWith('image/') || contentType === 'image/gif') {
    return file;
  }
  try {
    return await prepareImageForUpload(file, {
      maxWidth: 1920,
      maxHeight: 1920,
      maxOutputBytes: 3 * 1024 * 1024,
      forceProcess: file.size > 1_500_000,
    });
  } catch {
    return file;
  }
}

async function uploadChatMediaDirect(input: {
  roomId: string;
  userId: string;
  file: File;
}): Promise<{
  mediaUrl: string;
  mediaKey: string;
  media: NonNullable<ChatMessage['media']>;
}> {
  const file = await prepareChatMediaFile(input.file);
  const contentType = normalizeChatMediaMime(file);
  if (file.size > MAX_DIRECT_CHAT_UPLOAD_BYTES) {
    throw new Error('Archivo demasiado grande para subida directa');
  }

  const contentBase64 = await fileToBase64(file);
  let response: Response;
  try {
    response = await fetch(`${chatRestBase()}/chat-media-upload/direct`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        roomId: input.roomId,
        senderId: input.userId,
        fileName: file.name || 'archivo',
        fileType: contentType,
        size: file.size,
        contentBase64,
      }),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'el servicio de imágenes del chat'));
  }

  const body = await response.json().catch(() => ({})) as {
    mediaUrl?: string;
    url?: string;
    mediaKey?: string;
    media?: ChatMessage['media'];
    error?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(body.error || body.message || 'No se pudo guardar el archivo en el servidor.');
  }

  const mediaUrl = body.mediaUrl || body.url || body.media?.url || '';
  const mediaKey = body.mediaKey || body.media?.key || '';
  if (!mediaUrl || !mediaKey) {
    throw new Error('No se obtuvo URL del archivo');
  }

  return {
    mediaUrl,
    mediaKey,
    media: {
      ...body.media,
      key: mediaKey,
      url: mediaUrl,
      fileType: contentType,
      fileName: file.name,
    },
  };
}

async function uploadChatMediaPresigned(input: {
  roomId: string;
  userId: string;
  file: File;
}): Promise<{
  mediaUrl: string;
  mediaKey: string;
  media: NonNullable<ChatMessage['media']>;
}> {
  const contentType = normalizeChatMediaMime(input.file);
  const init = await initChatMediaUpload({
    roomId: input.roomId,
    userId: input.userId,
    fileName: input.file.name || 'archivo',
    contentType,
    size: input.file.size,
  });
  const signedContentType = resolvePresignedContentType(init.uploadUrl, contentType);
  try {
    await putBlobToPresignedUrl(
      init.uploadUrl,
      input.file,
      signedContentType || contentType,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('respondió')) {
      throw new Error('No se pudo guardar el archivo en el servidor.');
    }
    throw err;
  }
  const completed = await completeChatMediaUpload({ mediaKey: init.mediaKey || '' });
  const mediaUrl = completed.url || completed.mediaUrl || init.mediaUrl || '';
  if (!mediaUrl) throw new Error('No se obtuvo URL del archivo');
  return {
    mediaUrl,
    mediaKey: init.mediaKey || completed.media?.key || '',
    media: {
      ...completed.media,
      key: init.mediaKey || completed.media?.key,
      url: mediaUrl,
      fileType: signedContentType || contentType,
      fileName: input.file.name,
    },
  };
}

export async function uploadChatMediaFile(input: {
  roomId: string;
  userId: string;
  file: File;
}): Promise<{
  mediaUrl: string;
  mediaKey: string;
  media: NonNullable<ChatMessage['media']>;
}> {
  const prepared = await prepareChatMediaFile(input.file);
  const payload = { ...input, file: prepared };
  if (prepared.size <= MAX_DIRECT_CHAT_UPLOAD_BYTES) {
    return uploadChatMediaDirect(payload);
  }
  return uploadChatMediaPresigned(payload);
}

export async function completeChatMediaUpload(input: {
  mediaKey: string;
}): Promise<{ url?: string; mediaUrl?: string; media?: ChatMessage['media'] }> {
  let response: Response;
  try {
    response = await fetch(`${chatRestBase()}/chat-media-upload/complete`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ mediaKey: input.mediaKey }),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'el servicio de imágenes del chat'));
  }
  const body = await response.json().catch(() => ({})) as {
    mediaUrl?: string;
    url?: string;
    media?: ChatMessage['media'];
    error?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(body.error || body.message || 'No se pudo confirmar la imagen');
  }
  return {
    url: body.mediaUrl || body.url,
    mediaUrl: body.mediaUrl,
    media: body.media,
  };
}

export function isPrivateGroupRoom(room: ChatRoom): boolean {
  const target = Array.isArray(room.target) ? room.target : [];
  return target.includes('room::private-group');
}

export function isEventRoom(room: ChatRoom): boolean {
  if (isPrivateGroupRoom(room)) return false;
  const target = Array.isArray(room.target) ? room.target : [];
  if (target.includes('room::direct') || target.includes('room::private-group')) return false;
  const eventRef = room.eventId || room.event?.id || (room as { event?: string }).event;
  return room.chatType === 'event' || target.includes('room::event') || Boolean(eventRef);
}

export function resolveEventChatFieldsFromRoom(room: ChatRoom): {
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
    estatus: room.eventStatus || rawEvent?.estatus || rawEvent?.status,
    fechaIni: rawEvent?.fechaIni || rawEvent?.date || room.eventDate,
    fechaFin: rawEvent?.fechaFin,
    horaIni: rawEvent?.horaIni,
    horaFin: rawEvent?.horaFin,
  };
}

export function isClosedEventChatRoom(room?: ChatRoom | null): boolean {
  if (!room || !isEventRoom(room)) return false;
  const display = resolveDisplayEventStatus(resolveEventChatFieldsFromRoom(room));
  return display === 'finalizado' || display === 'cancelado';
}

export function isRoomAdmin(room: ChatRoom, userId?: string): boolean {
  if (!userId) return false;
  if (room.isAdmin) return true;
  const adminIds = [
    ...(Array.isArray(room.adminId) ? room.adminId : room.adminId ? [room.adminId] : []),
    ...(Array.isArray(room.administrators) ? room.administrators : []),
  ];
  if (adminIds.some((id) => userIdsMatch(id, userId))) return true;
  const ownerId = (room as { ownerId?: string; creatorId?: string }).ownerId
    || (room as { creatorId?: string }).creatorId;
  if (ownerId && userIdsMatch(ownerId, userId)) return true;
  return false;
}

export function isAnnouncementMessage(message: ChatMessage): boolean {
  const type = String(message.type || '').trim().toLowerCase().replace(/[\s_]/g, '-');
  return type === 'message-announcement' || type === 'messageannouncement';
}

export function resolveDirectPeerUserId(room: ChatRoom, userId: string): string | undefined {
  if (room.directPeer?.id && !userIdsMatch(room.directPeer.id, userId)) {
    return room.directPeer.id;
  }
  const participantIds = extractParticipantIds(room.participants);
  const pending = Array.isArray(room.pendingParticipants) ? room.pendingParticipants : [];
  const otherParticipant = participantIds.find((id) => !userIdsMatch(id, userId));
  if (otherParticipant) return otherParticipant;
  const otherPending = pending.find((id) => !userIdsMatch(id, userId));
  if (otherPending) return otherPending;
  if (room.inviteeId && !userIdsMatch(room.inviteeId, userId)) return room.inviteeId;
  if (room.initiatorId && !userIdsMatch(room.initiatorId, userId)) return room.initiatorId;
  return undefined;
}

export function resolveAllChatMembers(room: ChatRoom): ChatParticipant[] {
  const map = new Map<string, ChatParticipant>();
  const add = (entry: ChatParticipant | string | undefined) => {
    if (!entry) return;
    if (typeof entry === 'string') {
      if (!map.has(entry)) map.set(entry, { id: entry, name: entry });
      return;
    }
    if (entry.id) map.set(entry.id, entry);
  };
  normalizeParticipants(room).forEach(add);
  (room.pendingParticipantDetails || []).forEach(add);
  (room.pendingParticipants || []).forEach((id) => add(id));
  return Array.from(map.values());
}

export function resolveDirectPeerParticipant(room: ChatRoom, userId?: string): ChatParticipant | undefined {
  if (!userId) return undefined;
  if (room.directPeer?.id && !userIdsMatch(room.directPeer.id, userId)) {
    return room.directPeer;
  }
  return resolveAllChatMembers(room).find(
    (member) => member.id && !userIdsMatch(member.id, userId),
  );
}

export function resolveRoomTitle(room: ChatRoom, userId?: string): string {
  if (isPrivateGroupRoom(room)) {
    return room.roomName?.trim() || 'Grupo privado';
  }
  if (isDirectChatRoom(room)) {
    if (userId) {
      const peer = resolveDirectPeerParticipant(room, userId);
      if (peer?.name?.trim()) return peer.name.trim();
      const peerId = resolveDirectPeerUserId(room, userId);
      if (peerId && room.roomName?.startsWith('Chat con ')) {
        return room.roomName.replace('Chat con ', '').trim();
      }
      if (room.invitationPending && room.hostName?.trim()) {
        return room.hostName.trim();
      }
      if (peerId) return peerId;
    }
    if (room.roomName?.startsWith('Chat con ')) {
      return room.roomName.replace('Chat con ', '').trim();
    }
    return room.roomName?.trim() || 'Chat directo';
  }
  if (room.eventName) return room.eventName;
  if (room.event?.nombre) return room.event.nombre;
  if (room.event?.name) return room.event.name;
  if (userId) {
    const peer = resolveDirectPeerParticipant(room, userId);
    if (peer?.name?.trim()) return peer.name.trim();
  }
  if (room.roomName?.trim()) return room.roomName.trim();
  return 'Sala de chat';
}

function resolveParticipantAvatar(avatar?: string, userId?: string): string | undefined {
  if (!avatar || /default\.jpg/i.test(avatar)) {
    return resolveUserAvatarUrl(undefined, userId);
  }
  return resolveUserAvatarUrl(avatar, userId);
}

export function resolveRoomEventId(room: ChatRoom): string | undefined {
  const raw = room.eventId
    || room.event?.id
    || (typeof (room as { event?: string | { id?: string } }).event === 'string'
      ? (room as { event?: string }).event
      : undefined);
  const trimmed = String(raw || '').trim();
  return trimmed || undefined;
}

export function resolveEventRoomImage(room: ChatRoom): string {
  const raw = room.eventImage || room.event?.image;
  const trimmed = String(raw || '').trim();
  if (trimmed && trimmed !== ' ' && !isPlaceholderEventImage(trimmed)) {
    return resolveEventImageUrl(trimmed);
  }
  return resolveEventImageUrl();
}

export function resolveRoomAvatar(room: ChatRoom, userId?: string): string | undefined {
  if (isEventRoom(room)) {
    return resolveEventRoomImage(room);
  }
  if (isDirectChatRoom(room) && userId) {
    const peer = resolveDirectPeerParticipant(room, userId);
    const resolved = resolveParticipantAvatar(peer?.avatar, peer?.id);
    if (resolved) return resolved;
    return undefined;
  }
  if (room.eventImage) return resolveImageUrl(room.eventImage);
  const eventImage = (room.event as { image?: string } | undefined)?.image;
  if (eventImage && eventImage.trim() && eventImage.trim() !== ' ') {
    return resolveImageUrl(eventImage);
  }
  if (userId) {
    const peer = resolveDirectPeerParticipant(room, userId);
    const resolved = resolveParticipantAvatar(peer?.avatar, peer?.id);
    if (resolved) return resolved;
  }
  const other = normalizeParticipants(room).find(
    (p) => p.id && userId && !userIdsMatch(p.id, userId),
  );
  return resolveParticipantAvatar(other?.avatar, other?.id);
}

export function isRoomArchivedForUser(room: ChatRoom, userId?: string): boolean {
  if (!userId || !Array.isArray(room.archivedBy)) return false;
  return room.archivedBy.includes(userId);
}

export function resolveRoomId(room: ChatRoom): string {
  return room.roomId || room.id || '';
}

export function resolveMessageKey(message: ChatMessage, index: number): string {
  return message.id || message.messageId || `msg-${index}`;
}

export function resolveMessageText(message: ChatMessage): string {
  return message.text || message.content || message.asset || message.media?.url || '';
}

export function resolveMessageSenderId(message: ChatMessage): string {
  if (typeof message.sender === 'object' && message.sender?.id) {
    return String(message.sender.id);
  }
  return String(message.userId || message.sender || '');
}

export function isImageMessage(message: ChatMessage): boolean {
  const text = resolveMessageText(message);
  const type = String(message.type || '').toLowerCase();
  return type.includes('image')
    || type.includes('gif')
    || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(text);
}

export function isGifMessage(message: ChatMessage): boolean {
  const text = resolveMessageText(message);
  const type = String(message.type || '').toLowerCase();
  return type.includes('gif') || /\.gif(\?|$)/i.test(text);
}

export function isVideoMessage(message: ChatMessage): boolean {
  const type = String(message.type || '').toLowerCase();
  const fileType = String(message.media?.fileType || '').toLowerCase();
  return type === 'video'
    || fileType.startsWith('video/')
    || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(resolveMessageText(message));
}

export function isFileMessage(message: ChatMessage): boolean {
  const type = String(message.type || '').toLowerCase();
  const fileType = String(message.media?.fileType || '').toLowerCase();
  return type === 'file'
    || type === 'document'
    || (
      Boolean(message.media?.fileName || message.asset)
      && !isImageMessage(message)
      && !isVideoMessage(message)
      && !isGifMessage(message)
      && (
        fileType.startsWith('application/')
        || fileType === 'text/plain'
        || type.includes('file')
      )
    );
}

export function isLocationMessage(message: ChatMessage): boolean {
  const type = String(message.type || '').toLowerCase().replace(/[\s_]/g, '-');
  return type === 'message-location' || Boolean(message.location?.lat && message.location?.lng);
}

export function isEventShareMessage(message: ChatMessage): boolean {
  const type = String(message.type || '').toLowerCase().replace(/[\s_]/g, '-');
  return type === 'message-event-share' || Boolean(message.sharedEvent?.id);
}

export function hasRenderableMessageContent(message: ChatMessage): boolean {
  return Boolean(
    resolveMessageText(message)
    || isImageMessage(message)
    || isVideoMessage(message)
    || isFileMessage(message)
    || isLocationMessage(message)
    || isEventShareMessage(message),
  );
}

export function resolveMessagePreview(message: ChatMessage): string {
  if (isEventShareMessage(message)) {
    return `🎫 ${message.sharedEvent?.name || message.text || 'Evento compartido'}`;
  }
  if (isLocationMessage(message)) {
    return `📍 ${message.location?.label || message.text || 'Ubicación compartida'}`;
  }
  if (isVideoMessage(message)) return '🎬 Video';
  if (isFileMessage(message)) {
    return `📎 ${message.media?.fileName || message.text || 'Archivo'}`;
  }
  if (isImageMessage(message)) return isGifMessage(message) ? 'GIF' : '📷 Foto';
  return resolveMessageText(message);
}

export function resolveMediaUrl(message: ChatMessage): string {
  const raw = String(message.media?.url || message.asset || '').trim();
  if (!raw) return resolveMessageText(message) || '';
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
    return raw;
  }
  return resolveImageUrl(raw) || chatMediaPublicUrl(raw) || raw;
}

export function normalizeParticipants(room: ChatRoom): ChatParticipant[] {
  if (!Array.isArray(room.participants)) return [];
  return room.participants.map((p) => {
    if (typeof p === 'string') return { id: p, name: p };
    return { id: p.id, name: p.name, username: p.username, avatar: p.avatar };
  });
}

export async function archiveChatRoom(userId: string, roomId: string): Promise<void> {
  const response = await fetch(`${chatRestBase()}/archive-chat-room`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ userId, roomId }),
  });
  const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(body.error || body.message || 'No se pudo archivar el chat');
  }
}

export async function markChatRoomRead(userId: string, roomId: string): Promise<void> {
  const response = await fetch(`${chatRestBase()}/mark-chat-room-read`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId, roomId }),
  });
  const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(body.error || body.message || 'No se pudo marcar el chat como leído');
  }
  try {
    const cached = getCachedChatRooms(userId);
    if (cached?.length) {
      cacheChatRooms(
        userId,
        cached.map((room) => (
          String(room.roomId || room.id) === String(roomId)
            ? { ...room, unreadCount: 0 }
            : room
        )),
      );
    }
  } catch {
    // cache best-effort
  }
}

export async function unarchiveChatRoom(userId: string, roomId: string): Promise<void> {
  const response = await fetch(`${chatRestBase()}/unarchive-chat-room`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ userId, roomId }),
  });
  const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(body.error || body.message || 'No se pudo desarchivar el chat');
  }
}

export async function inviteToEventChat(input: {
  roomId: string;
  eventName: string;
  requestedByUserId: string;
  participants?: string[];
  usernames?: string[];
}): Promise<{ invitedUserIds: string[] }> {
  let response: Response;
  try {
    response = await fetch(`${chatRestBase()}/send-invitation-chat-room`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'el envío de la invitación al chat'));
  }
  const body = await response.json().catch(() => ({})) as {
    invitedUserIds?: string[];
    error?: string;
    message?: string;
    statusDesc?: string;
  };
  if (!response.ok) {
    throw new Error(body.error || body.message || body.statusDesc || 'No se pudo enviar la invitación');
  }
  return { invitedUserIds: body.invitedUserIds || [] };
}

export async function kickFromEventChat(
  roomId: string,
  targetUserId: string,
  requestedByUserId: string,
): Promise<void> {
  const response = await fetch(`${chatRestBase()}/kicked-out-user-by-chat-room`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({
      roomId,
      userId: targetUserId,
      requestedByUserId,
    }),
  });
  const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(body.error || body.message || 'No se pudo expulsar al usuario');
  }
}

export async function reportChatMessage(input: {
  roomId: string;
  messageId: string;
  reportedByUserId: string;
  reason?: string;
}): Promise<void> {
  const response = await fetch(`${chatRestBase()}/report-chat-message`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(body.error || body.message || 'No se pudo reportar el mensaje');
  }
}

export async function createPrivateGroupChat(input: {
  creatorId: string;
  memberIds: string[];
  groupName: string;
}): Promise<ChatRoom> {
  let response: Response;
  try {
    response = await fetch(`${chatRestBase()}/create-private-group-chat`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la creación del grupo'));
  }
  const body = await response.json().catch(() => ({})) as {
    room?: ChatRoom;
    error?: string;
    message?: string;
  };
  if (!response.ok || !body.room) {
    throw new Error(body.error || body.message || 'No se pudo crear el grupo');
  }
  return {
    ...body.room,
    roomId: body.room.roomId || body.room.id,
    chatType: 'group',
  };
}
