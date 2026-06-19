import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ChatMessage,
  ChatParticipant,
  ChatRoom,
  ChatSharedEvent,
  FeedEventItem,
  SendChatMessageInput,
  fetchUserById,
  fetchEventDetail,
  fetchEventsFeed,
  fetchUserEvents,
  Loader,
  RootState,
  SafeImage,
  chatWebSocketClient,
  type ChatWsMessage,
  fetchChatMessages,
  fetchChatRoomByEvent,
  fetchUserChatRooms,
  findDirectRoomWithPeer,
  isDraftChatRoom,
  requestDirectChat,
  cacheChatMessages,
  cacheChatRooms,
  getCachedChatMessages,
  getCachedChatRooms,
  getCachedProfiles,
  patchCachedChatRoom,
  acceptChatInvitation,
  declineChatInvitation,
  archiveChatRoom,
  unarchiveChatRoom,
  createPrivateGroupChat,
  inviteToEventChat,
  kickFromEventChat,
  reportChatMessage,
  isDirectChatRoom,
  isPrivateGroupRoom,
  isEventRoom,
  isClosedEventChatRoom,
  isRoomAdmin,
  isAnnouncementMessage,
  isRoomArchivedForUser,
  resolveDirectPeerParticipant,
  resolveDirectPeerUserId,
  userIdsMatch,
  resolveRoomAvatar,
  resolveEventRoomImage,
  resolveRoomEventId,
  resolveAllChatMembers,
  initChatMediaUpload,
  completeChatMediaUpload,
  hasRenderableMessageContent,
  isImageMessage,
  isGifMessage,
  isVideoMessage,
  isFileMessage,
  isLocationMessage,
  isEventShareMessage,
  normalizeParticipants,
  normalizeDirectRoomForUser,
  resolveEventImageUrl,
  isPlaceholderEventImage,
  resolveMediaUrl,
  resolveMessageKey,
  resolveMessagePreview,
  resolveMessageSenderId,
  resolveMessageText,
  resolveRoomId,
  resolveRoomTitle,
  resolveUserLocation,
  searchUsers,
  useToast,
  UserAvatar,
  blockUser,
  unblockUser,
  fetchBlockedUsers,
  type BlockedUser,
  type SearchUserResult,
  type UserEventItem,
} from '@doevents/shared';
import MessagesListView from '@lovable/components/chat/MessagesListView';
import { CreateStorySheet } from '../components/CreateStorySheet';
import { StoryViewer } from '../components/StoryViewer';
import { useActiveStoryAuthors } from '../contexts/StoriesContext';
import LovableChatThread from '../lovable-bridge/LovableChatThread';
import ChatEventPickerSheet from '@lovable/components/chat/ChatEventPickerSheet';
import {
  chatContactToAttendee,
  roomsToEventChatRooms,
  roomsToPrivateChats,
} from '../lovable-bridge/chatAdapter';

type ChatTab = 'events' | 'private';
type PrivateListTab = 'inbox' | 'archived';
type EventThreadTab = 'chat' | 'members' | 'media';
type InboxFilter = 'all' | 'unread' | 'groups';

interface ChatContact {
  id: string;
  name: string;
  avatar?: string;
  online?: boolean;
}

const QUICK_EMOJIS = [
  '😀', '😂', '🥰', '😍', '❤️', '👍', '👏', '🙏', '🎉', '🔥', '✨', '💯',
  '😎', '🤔', '😢', '😡', '🙌', '💪', '🤝', '👋', '🥳', '😇', '🤩', '💜',
];

function formatChatTime(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

function isPrivateRoom(room: ChatRoom): boolean {
  if (isEventRoom(room)) return false;
  if (isPrivateGroupRoom(room)) return true;
  const target = Array.isArray(room.target) ? room.target : [];
  return room.chatType === 'direct' || target.includes('room::direct') || room.chatType !== 'group';
}

function resolveRoomSubtitle(room: ChatRoom): string {
  const last = room.messages?.[room.messages.length - 1];
  if (last) return resolveMessagePreview(last);
  if (room.lastMessage) return room.lastMessage;
  return 'Sin mensajes recientes';
}

function formatShareEventDate(raw?: string): string {
  if (!raw) return '';
  if (/^\d{8}$/.test(raw)) return `${raw.slice(6, 8)}/${raw.slice(4, 6)}/${raw.slice(0, 4)}`;
  return raw;
}

function resolveChatFileMime(file: File): string {
  const normalized = String(file.type || '').trim().toLowerCase();
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

function resolveMessageTypeFromFile(contentType: string, fileName: string): string {
  if (contentType.startsWith('video/')) return 'video';
  if (contentType === 'image/gif' || fileName.toLowerCase().endsWith('.gif')) return 'image-gif';
  if (contentType.startsWith('image/')) return 'image';
  return 'file';
}

function ChatMessageBody({
  message,
  onEventClick,
}: {
  message: ChatMessage;
  onEventClick: (eventId: string) => void;
}) {
  if (isImageMessage(message)) {
    return (
      <img
        src={resolveMediaUrl(message)}
        alt={isGifMessage(message) ? 'GIF compartido' : 'Imagen compartida'}
        className={`de-messenger-bubble__image${isGifMessage(message) ? ' de-messenger-bubble__image--gif' : ''}`}
      />
    );
  }
  if (isVideoMessage(message)) {
    return (
      <video
        controls
        playsInline
        preload="metadata"
        src={resolveMediaUrl(message)}
        className="de-messenger-bubble__video"
      />
    );
  }
  if (isFileMessage(message)) {
    const url = resolveMediaUrl(message);
    const name = message.media?.fileName || message.text || 'Archivo';
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="de-messenger-bubble__file">
        <span className="de-messenger-bubble__file-icon" aria-hidden>📎</span>
        <span className="de-messenger-bubble__file-name">{name}</span>
      </a>
    );
  }
  if (isLocationMessage(message) && message.location) {
    const { lat, lng, label } = message.location;
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    return (
      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="de-messenger-bubble__location">
        <span className="de-messenger-bubble__location-pin" aria-hidden>📍</span>
        <div>
          <strong>{label || 'Mi ubicación'}</strong>
          <small>Ver en mapa</small>
        </div>
      </a>
    );
  }
  if (isEventShareMessage(message) && message.sharedEvent?.id) {
    const ev = message.sharedEvent;
    return (
      <button type="button" className="de-messenger-bubble__event" onClick={() => onEventClick(ev.id!)}>
        {ev.image ? (
          <SafeImage src={resolveEventImageUrl(ev.image)} alt="" className="de-messenger-bubble__event-img" />
        ) : (
          <span className="de-messenger-bubble__event-fallback" aria-hidden>🎫</span>
        )}
        <div className="de-messenger-bubble__event-meta">
          <strong>{ev.name || 'Evento'}</strong>
          {ev.date && <span>{ev.date}</span>}
        </div>
      </button>
    );
  }
  return <p>{resolveMessageText(message)}</p>;
}

function hasUsableAvatar(avatar?: string): boolean {
  return Boolean(avatar && !/default\.jpg/i.test(avatar));
}

async function enrichPeerParticipant(
  peer: ChatParticipant | undefined,
  peerId: string,
  fallbackName?: string,
): Promise<ChatParticipant> {
  if (hasUsableAvatar(peer?.avatar) && peer?.name?.trim()) {
    return peer;
  }
  try {
    const profiles = await getCachedProfiles([peerId]);
    const cached = profiles.get(peerId);
    if (cached) {
      return {
        id: peerId,
        name: [cached.nombre, cached.apellido].filter(Boolean).join(' ')
          || cached.username
          || peer?.name
          || fallbackName
          || 'Usuario',
        avatar: cached.imagen || peer?.avatar,
      };
    }
    const profile = await fetchUserById(peerId);
    return {
      id: peerId,
      name: [profile?.nombre, profile?.apellido].filter(Boolean).join(' ')
        || profile?.username
        || peer?.name
        || fallbackName
        || 'Usuario',
      avatar: profile?.imagen || peer?.avatar,
    };
  } catch {
    return {
      id: peerId,
      name: peer?.name || fallbackName || 'Usuario',
      avatar: peer?.avatar,
    };
  }
}

async function buildDraftDirectRoom(
  currentUserId: string,
  targetUserId: string,
  peer?: ChatParticipant,
): Promise<ChatRoom> {
  const enrichedPeer = await enrichPeerParticipant(peer, targetUserId);
  return {
    roomId: `draft:${targetUserId}`,
    chatType: 'direct',
    isDraft: true,
    draftPeerId: targetUserId,
    participants: [currentUserId],
    directPeer: enrichedPeer,
    canMessage: true,
    directChatStatus: 'active',
    messages: [],
  };
}

async function enrichRoomsWithEventImages(rooms: ChatRoom[]): Promise<ChatRoom[]> {
  return Promise.all(rooms.map(async (room) => {
    if (!isEventRoom(room)) return room;
    const eventId = resolveRoomEventId(room);
    if (!eventId) return room;
    try {
      const detail = await fetchEventDetail(eventId);
      if (!detail?.event) return room;
      const event = detail.event;
      const image = resolveEventImageUrl(detail.images?.[0] || event.imagen);
      const fechaIni = event.fechaIni || '';
      const fechaFin = event.fechaFin || '';
      const horaIni = event.horaIni || '';
      const horaFin = event.horaFin || '';
      const eventDate = fechaIni || '—';
      const eventTime = horaIni && horaFin
        ? `${horaIni} – ${horaFin}`
        : horaIni || horaFin || undefined;
      return {
        ...room,
        eventId,
        eventImage: image,
        eventDate,
        eventTime,
        eventName: room.eventName || event.nombre || room.event?.nombre,
        eventStatus: event.estatus,
        event: {
          ...(room.event || {}),
          id: eventId,
          image,
          nombre: event.nombre,
          fechaIni,
          fechaFin,
          horaIni,
          horaFin,
          estatus: event.estatus,
          status: event.estatus,
          date: fechaIni,
        },
      };
    } catch {
      return room;
    }
  }));
}

async function enrichRoomsWithPeerProfiles(rooms: ChatRoom[], currentUserId: string): Promise<ChatRoom[]> {
  return Promise.all(rooms.map(async (room) => {
    if (!isDirectChatRoom(room)) return room;
    const peer = room.directPeer || resolveDirectPeerParticipant(room, currentUserId);
    const peerId = peer?.id || resolveDirectPeerUserId(room, currentUserId);
    if (!peerId) return room;
    const enrichedPeer = await enrichPeerParticipant(peer, peerId, room.hostName);
    return normalizeDirectRoomForUser({ ...room, directPeer: enrichedPeer }, currentUserId);
  }));
}

async function enrichAllRooms(rooms: ChatRoom[], currentUserId: string): Promise<ChatRoom[]> {
  const withEvents = await enrichRoomsWithEventImages(rooms);
  return enrichRoomsWithPeerProfiles(withEvents, currentUserId);
}

function resolveParticipantLabel(participant: ChatParticipant): string {
  const name = participant.name?.trim();
  if (!name) return 'Asistente';
  const parts = name.split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1]?.charAt(0) || ''}.`.trim();
}

export const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const threadRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(() => !(userId && getCachedChatRooms<ChatRoom>(userId)));
  const [rooms, setRooms] = useState<ChatRoom[]>(() => (
    userId ? getCachedChatRooms<ChatRoom>(userId) || [] : []
  ));
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<ChatTab>('private');
  const [privateListTab, setPrivateListTab] = useState<PrivateListTab>('inbox');
  const [eventThreadTab, setEventThreadTab] = useState<EventThreadTab>('chat');
  const [peerProfile, setPeerProfile] = useState<ChatParticipant | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState<SearchUserResult[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [connectionState, setConnectionState] = useState(chatWebSocketClient.getState());
  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState<string | undefined>();
  const [showEmoji, setShowEmoji] = useState(false);
  const [openingDm, setOpeningDm] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<SearchUserResult[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [pickerEvents, setPickerEvents] = useState<ChatSharedEvent[]>([]);
  const [loadingPickerEvents, setLoadingPickerEvents] = useState(false);
  const [announcementMode, setAnnouncementMode] = useState(false);
  const [eventCreatorId, setEventCreatorId] = useState<string | null>(null);
  const [showEventInvite, setShowEventInvite] = useState(false);
  const [eventInviteSearch, setEventInviteSearch] = useState('');
  const [eventInviteResults, setEventInviteResults] = useState<SearchUserResult[]>([]);
  const [searchingEventInvite, setSearchingEventInvite] = useState(false);
  const [eventInviteSearchError, setEventInviteSearchError] = useState<string | null>(null);
  const [messageActionId, setMessageActionId] = useState<string | null>(null);
  const [moderatingBusy, setModeratingBusy] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Record<string, boolean>>({});
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [showBlockedPanel, setShowBlockedPanel] = useState(false);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [storyViewerUserId, setStoryViewerUserId] = useState<string | null>(null);
  const { refreshStories } = useActiveStoryAuthors();
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all');
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const deepLinkHandled = useRef(false);
  const selectedRoomId = selectedRoom ? resolveRoomId(selectedRoom) : '';

  useEffect(() => {
    if (!userId) return;
    chatWebSocketClient.connect(userId);
    return chatWebSocketClient.onStateChange(setConnectionState);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchUserById(userId).then((profile) => {
      setProfileName([profile?.nombre, profile?.apellido].filter(Boolean).join(' ') || profile?.username || 'Tú');
      setProfileAvatar(profile?.imagen);
    }).catch(() => undefined);
    setLoadingBlocked(true);
    fetchBlockedUsers(userId)
      .then((users) => {
        setBlockedUsers(users);
        setBlockedUserIds(new Set(users.map((u) => u.id).filter(Boolean)));
      })
      .catch(() => undefined)
      .finally(() => setLoadingBlocked(false));
  }, [userId]);

  useEffect(() => {
    if (connectionState !== 'connected' || !userId) return;
    const roomIds = rooms
      .filter((room) => !(isEventRoom(room) && isClosedEventChatRoom(room)))
      .map((room) => resolveRoomId(room))
      .filter(Boolean);
    roomIds.forEach((roomId) => {
      try {
        chatWebSocketClient.joinRoom(roomId);
      } catch {
        // ignore join errors for background sync
      }
    });
  }, [connectionState, rooms, userId]);

  const closedEventRoomIds = useMemo(
    () => new Set(
      rooms
        .filter((room) => isEventRoom(room) && isClosedEventChatRoom(room))
        .map((room) => resolveRoomId(room))
        .filter(Boolean),
    ),
    [rooms],
  );

  useEffect(() => {
    if (!userId) return undefined;
    return chatWebSocketClient.onMessage((payload) => {
      const action = String(payload.action || payload.event || '');

      if (action === 'chatMessageAck' || action === 'chat.message.ack') {
        const ack = (payload.message || payload.payload) as {
          clientMessageId?: string;
          serverMessageId?: string;
          roomId?: string;
        };
        const ackRoomId = String(ack?.roomId || payload.roomId || '');
        if (ack?.clientMessageId && ack?.serverMessageId && ackRoomId && ackRoomId === selectedRoomId) {
          setMessages((prev) => prev.map((m) => (
            m.clientMessageId === ack.clientMessageId
              ? { ...m, id: ack.serverMessageId, messageId: ack.serverMessageId }
              : m
          )));
        }
        return;
      }

      const presencePayload = payload as ChatWsMessage & Record<string, unknown>;
      const presenceChannel = String(presencePayload.channel || presencePayload.channelAlt || '');
      const isPresence = presenceChannel.includes('status')
        || action === 'statusConnection'
        || action === 'userPresence'
        || action === 'status-connection';
      if (isPresence) {
        const presenceUserId = String(presencePayload.userId || presencePayload.user_id || '');
        const status = String(
          presencePayload.status || presencePayload.userStatus || presencePayload.connectionStatus || '',
        ).toLowerCase();
        if (presenceUserId) {
          setOnlineUserIds((prev) => ({
            ...prev,
            [presenceUserId]: status !== 'offline' && status !== 'disconnected',
          }));
        }
        return;
      }

      if (action === 'editChatMessage') {
        const editBody = (payload.message || payload.payload || payload) as {
          id?: string;
          status?: string;
          deletedAt?: string;
          text?: string;
          roomId?: string;
        };
        const msgId = editBody?.id;
        if (!msgId) return;
        const editRoomId = String(editBody?.roomId || payload.roomId || '');
        if (editRoomId && closedEventRoomIds.has(editRoomId)) return;
        if (editBody.status === 'deleted' || editBody.deletedAt) {
          setMessages((prev) => prev.filter((m) => (m.id || m.messageId) !== msgId));
        } else {
          setMessages((prev) => prev.map((m) => (
            (m.id || m.messageId) === msgId ? { ...m, text: editBody.text || m.text } : m
          )));
        }
        return;
      }

      const isNewMessage = action === 'sendChatMessage' || action === 'chat.message.new';
      if (!isNewMessage) return;

      const messageBody = (payload.message || payload.payload) as ChatMessage;
      if (!messageBody || typeof messageBody !== 'object') return;

      const incomingRoomId = String(
        payload.roomId || messageBody.roomId || (payload.payload as { roomId?: string })?.roomId || '',
      );
      if (!incomingRoomId) return;
      if (closedEventRoomIds.has(incomingRoomId)) return;

      const text = resolveMessageText(messageBody);
      if (!hasRenderableMessageContent(messageBody)) return;

      const normalized: ChatMessage = {
        ...messageBody,
        id: messageBody.id || messageBody.messageId || `live-${Date.now()}`,
        clientMessageId: messageBody.clientMessageId || payload.clientMessageId,
        text,
        userId: resolveMessageSenderId(messageBody),
        createdAt: messageBody.createdAt || new Date().toISOString(),
      };

      setRooms((prev) => prev.map((room) => (
        resolveRoomId(room) === incomingRoomId
          ? { ...room, lastMessage: resolveMessagePreview(normalized), lastMessageAt: normalized.createdAt }
          : room
      )));

      if (selectedRoomId && incomingRoomId === selectedRoomId) {
        setMessages((prev) => {
          const serverId = normalized.id || normalized.messageId;
          const clientId = normalized.clientMessageId;

          if (serverId && prev.some((m) => (m.id || m.messageId) === serverId && !String(m.id).startsWith('local-'))) {
            return prev;
          }

          if (clientId) {
            const optimisticIdx = prev.findIndex((m) => m.clientMessageId === clientId);
            if (optimisticIdx >= 0) {
              const next = [...prev];
              next[optimisticIdx] = { ...normalized, clientMessageId: clientId };
              return next;
            }
            if (prev.some((m) => m.clientMessageId === clientId)) return prev;
          }

          if (serverId && prev.some((m) => (m.id || m.messageId) === serverId)) return prev;
          return [...prev, normalized];
        });
      }
    });
  }, [selectedRoomId, userId, closedEventRoomIds]);

  useEffect(() => {
    let cancelled = false;
    const loadRooms = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const data = await fetchUserChatRooms(userId);
        const enriched = await enrichAllRooms(data, userId);
        if (!cancelled) {
          setRooms(enriched);
          cacheChatRooms(userId, enriched);
        }
      } catch (err) {
        if (!cancelled) showToast(err instanceof Error ? err.message : 'Error al cargar chats', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadRooms();
    return () => { cancelled = true; };
  }, [userId, showToast]);

  useEffect(() => {
    if (deepLinkHandled.current || loading || !userId) return;
    const eventId = searchParams.get('eventId');
    const roomId = searchParams.get('roomId');
    const peerId = searchParams.get('peerId');

    const openRoom = (room: ChatRoom) => {
      deepLinkHandled.current = true;
      setSelectedRoom(room);
      setActiveTab(isEventRoom(room) ? 'events' : 'private');
      setEventThreadTab('chat');
    };

    if (roomId) {
      const found = rooms.find((r) => resolveRoomId(r) === roomId);
      if (found) {
        openRoom(found);
        return;
      }
      if (!deepLinkHandled.current) {
        deepLinkHandled.current = true;
        fetchUserChatRooms(userId).then(async (data) => {
          const enriched = await enrichAllRooms(data, userId);
          setRooms(enriched);
          const refreshed = enriched.find((r) => resolveRoomId(r) === roomId);
          if (refreshed) {
            openRoom(refreshed);
          } else {
            deepLinkHandled.current = false;
          }
        }).catch(() => {
          deepLinkHandled.current = false;
        });
        return;
      }
    }

    if (peerId && userId) {
      if (loading) return;
      if (!deepLinkHandled.current) {
        deepLinkHandled.current = true;
        void openDirectChat(peerId);
      }
      return;
    }

    if (eventId) {
      const fromList = rooms.find((r) => {
        const rid = r.eventId || r.event?.id || (r as { event?: string }).event;
        return rid === eventId;
      });
      if (fromList) {
        openRoom(fromList);
        return;
      }
      fetchChatRoomByEvent(eventId).then(async (room) => {
        if (!room) return;
        const [enriched] = await enrichRoomsWithEventImages([room]);
        openRoom(enriched);
      }).catch(() => undefined);
    }
  }, [loading, rooms, searchParams, userId]);

  useEffect(() => {
    let cancelled = false;
    const loadMessages = async () => {
      if (!selectedRoom) return;
      if (isDraftChatRoom(selectedRoom)) {
        setMessages([]);
        setLoadingMessages(false);
        return;
      }
      const roomId = resolveRoomId(selectedRoom);
      if (!roomId) return;
      const cachedMessages = getCachedChatMessages<ChatMessage>(roomId);
      if (cachedMessages?.length && !cancelled) {
        setMessages(cachedMessages);
      }
      setLoadingMessages(!cachedMessages?.length);
      try {
        if (selectedRoom.messages?.length) {
          if (!cancelled) {
            setMessages(selectedRoom.messages);
            cacheChatMessages(roomId, selectedRoom.messages);
          }
        } else {
          const data = await fetchChatMessages(roomId);
          if (!cancelled) {
            setMessages(data);
            cacheChatMessages(roomId, data);
          }
        }
        if (connectionState === 'connected') {
          chatWebSocketClient.joinRoom(roomId);
        }
      } catch (err) {
        if (!cancelled) {
          setMessages([]);
          showToast(err instanceof Error ? err.message : 'Error al cargar mensajes', 'error');
        }
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    };
    loadMessages();
    return () => { cancelled = true; };
  }, [selectedRoom, connectionState, showToast]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, selectedRoom, eventThreadTab]);

  useEffect(() => {
    if (!selectedRoom || !userId || isEventRoom(selectedRoom)) {
      setPeerProfile(null);
      return;
    }
    const peer = resolveDirectPeerParticipant(selectedRoom, userId);
    const peerId = peer?.id || resolveDirectPeerUserId(selectedRoom, userId);
    if (!peerId) {
      setPeerProfile(peer || null);
      return;
    }
    let cancelled = false;
    enrichPeerParticipant(peer, peerId, selectedRoom.hostName).then((enriched) => {
      if (!cancelled) setPeerProfile(enriched);
    });
    return () => { cancelled = true; };
  }, [selectedRoom, userId]);

  const openRoom = (room: ChatRoom) => {
    const normalized = userId && room.chatType === 'direct'
      ? normalizeDirectRoomForUser(room, userId)
      : room;
    setSelectedRoom(normalized);
    setEventThreadTab('chat');
    setShowEmoji(false);
    setShowAttachMenu(false);
    setShowEventPicker(false);
    setAnnouncementMode(false);
    setShowEventInvite(false);
    setEventInviteSearch('');
    setMessageActionId(null);
  };

  useEffect(() => {
    if (!showAttachMenu) return undefined;
    const onDocClick = (event: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showAttachMenu]);

  useEffect(() => {
    if (!messageActionId) return undefined;
    const onDocClick = () => setMessageActionId(null);
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [messageActionId]);

  const openDirectChat = async (targetUserId: string) => {
    if (!userId || targetUserId === userId || openingDm) return;
    if (blockedUserIds.has(targetUserId)) {
      showToast('No puedes contactar a este usuario porque lo bloqueaste', 'error');
      return;
    }

    const existing = findDirectRoomWithPeer(rooms, userId, targetUserId);
    if (existing) {
      setActiveTab('private');
      openRoom(existing);
      return;
    }

    setOpeningDm(true);
    try {
      const draftRoom = await buildDraftDirectRoom(userId, targetUserId);
      setActiveTab('private');
      setSelectedRoom(draftRoom);
      setMessages([]);
      setEventThreadTab('chat');
      setDraft('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo abrir el chat directo', 'error');
    } finally {
      setOpeningDm(false);
    }
  };

  const roomAccess = useMemo(() => {
    if (!selectedRoom || !userId) {
      return { canMessage: false, isInvitee: false, isRequesterWaiting: false, isClosedEvent: false };
    }
    const normalized = selectedRoom.chatType === 'direct'
      ? normalizeDirectRoomForUser(selectedRoom, userId)
      : selectedRoom;
    const closedEvent = isEventRoom(normalized) && isClosedEventChatRoom(normalized);
    const pending = normalized.pendingParticipants || [];
    const isInvitee = pending.includes(userId) || normalized.inviteeId === userId;
    const isRequesterWaiting = normalized.directChatStatus === 'pending' && !isInvitee;
    return {
      canMessage: !closedEvent && normalized.canMessage !== false,
      isInvitee,
      isRequesterWaiting,
      isClosedEvent: closedEvent,
    };
  }, [selectedRoom, userId]);

  const canMessageInRoom = roomAccess.canMessage;
  const isClosedEventChat = roomAccess.isClosedEvent;
  const showCannotMessageToast = () => {
    if (isClosedEventChat) {
      showToast('Este chat está cerrado. Solo puedes ver el historial.', 'error');
    } else {
      showToast('Debes aceptar la invitación para poder responder.', 'error');
    }
  };
  const showInvitationBanner = roomAccess.isInvitee && selectedRoom?.directChatStatus === 'pending';
  const showEventInvitationBanner = Boolean(
    selectedRoom
    && isEventRoom(selectedRoom)
    && selectedRoom.invitationPending,
  );
  const showPendingSentBanner = roomAccess.isRequesterWaiting;
  const isEventAdmin = Boolean(selectedRoom && userId && isEventRoom(selectedRoom) && isRoomAdmin(selectedRoom, userId));

  useEffect(() => {
    if (!selectedRoom || !isEventRoom(selectedRoom)) {
      setEventCreatorId(null);
      return;
    }
    const eventId = selectedRoom.eventId || selectedRoom.event?.id;
    if (!eventId) {
      setEventCreatorId(null);
      return;
    }
    let cancelled = false;
    fetchEventDetail(eventId)
      .then((detail) => {
        if (!cancelled) setEventCreatorId(detail?.event?.userId || null);
      })
      .catch(() => {
        if (!cancelled) setEventCreatorId(null);
      });
    return () => { cancelled = true; };
  }, [selectedRoom]);

  const isEventCreator = Boolean(
    userId && eventCreatorId && userIdsMatch(userId, eventCreatorId),
  );

  const sendRoomMessage = async (text: string, options?: { announcement?: boolean }) => {
    const trimmed = text.trim();
    if (!selectedRoom || !trimmed || !userId) return;
    if (!canMessageInRoom) {
      showCannotMessageToast();
      return;
    }
    if (options?.announcement && !isEventCreator) {
      showToast('Solo el creador del evento puede enviar difusiones.', 'error');
      return;
    }
    setSending(true);
    try {
      let activeRoom = selectedRoom;
      if (isDraftChatRoom(selectedRoom)) {
        const targetUserId = selectedRoom.draftPeerId
          || resolveDirectPeerUserId(selectedRoom, userId);
        if (!targetUserId) throw new Error('No se pudo identificar el destinatario');
        const result = await requestDirectChat(userId, targetUserId);
        const [enrichedRoom] = await enrichRoomsWithPeerProfiles([result.room], userId);
        activeRoom = enrichedRoom || result.room;
        setSelectedRoom(activeRoom);
        setRooms((prev) => {
          const roomId = resolveRoomId(activeRoom);
          const without = prev.filter((r) => resolveRoomId(r) !== roomId);
          const next = [activeRoom, ...without];
          cacheChatRooms(userId, next);
          return next;
        });
        patchCachedChatRoom(userId, activeRoom);
        if (result.status === 'pending') {
          showToast('Solicitud enviada. La otra persona debe aceptar para responder.', 'success');
        }
      }

      const roomId = resolveRoomId(activeRoom);
      if (!roomId) throw new Error('No se pudo abrir la conversación');

      if (!chatWebSocketClient.isConnected()) {
        chatWebSocketClient.connect(userId);
        throw new Error('Chat reconectando. Espera unos segundos e intenta de nuevo.');
      }
      const clientMessageId = options?.announcement
        ? chatWebSocketClient.sendChatMessage(roomId, { text: trimmed, type: 'message-announcement' })
        : chatWebSocketClient.sendChatMessage(roomId, trimmed);
      const optimistic = {
        id: `local-${clientMessageId}`,
        clientMessageId,
        roomId,
        userId,
        text: trimmed,
        type: options?.announcement ? 'message-announcement' : undefined,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => {
        const next = [...prev, optimistic];
        cacheChatMessages(roomId, next);
        return next;
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo enviar el mensaje', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!userId || !selectedRoom || inviteBusy) return;
    const roomId = resolveRoomId(selectedRoom);
    setInviteBusy(true);
    try {
      await acceptChatInvitation(userId, roomId);
      const updated = {
        ...selectedRoom,
        invitationPending: false,
        directChatStatus: 'active' as const,
        canMessage: true,
      };
      setSelectedRoom(updated);
      setRooms((prev) => prev.map((r) => (resolveRoomId(r) === roomId ? updated : r)));
      showToast('¡Listo! Ya puedes chatear libremente.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo aceptar la invitación', 'error');
    } finally {
      setInviteBusy(false);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!userId || !selectedRoom || inviteBusy) return;
    const roomId = resolveRoomId(selectedRoom);
    setInviteBusy(true);
    try {
      await declineChatInvitation(userId, roomId);
      showToast('Invitación rechazada', 'success');
      setSelectedRoom(null);
      setRooms((prev) => prev.filter((r) => resolveRoomId(r) !== roomId));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo rechazar la invitación', 'error');
    } finally {
      setInviteBusy(false);
    }
  };

  const handleSend = async () => {
    if (!selectedRoom || !draft.trim() || !userId) return;
    if (!canMessageInRoom) {
      showCannotMessageToast();
      return;
    }
    if (announcementMode && !isEventCreator) {
      showToast('Solo el creador del evento puede enviar difusiones.', 'error');
      return;
    }
    const text = draft.trim();
    setSending(true);
    try {
      let activeRoom = selectedRoom;
      if (isDraftChatRoom(selectedRoom)) {
        const targetUserId = selectedRoom.draftPeerId
          || resolveDirectPeerUserId(selectedRoom, userId);
        if (!targetUserId) throw new Error('No se pudo identificar el destinatario');
        const result = await requestDirectChat(userId, targetUserId);
        const [enrichedRoom] = await enrichRoomsWithPeerProfiles([result.room], userId);
        activeRoom = enrichedRoom || result.room;
        setSelectedRoom(activeRoom);
        setRooms((prev) => {
          const roomId = resolveRoomId(activeRoom);
          const without = prev.filter((r) => resolveRoomId(r) !== roomId);
          const next = [activeRoom, ...without];
          cacheChatRooms(userId, next);
          return next;
        });
        patchCachedChatRoom(userId, activeRoom);
        if (result.status === 'pending') {
          showToast('Solicitud enviada. La otra persona debe aceptar para responder.', 'success');
        }
      }

      const roomId = resolveRoomId(activeRoom);
      if (!roomId) throw new Error('No se pudo abrir la conversación');

      if (!chatWebSocketClient.isConnected()) {
        chatWebSocketClient.connect(userId);
        throw new Error('Chat reconectando. Espera unos segundos e intenta de nuevo.');
      }
      const clientMessageId = announcementMode
        ? chatWebSocketClient.sendChatMessage(roomId, { text, type: 'message-announcement' })
        : chatWebSocketClient.sendChatMessage(roomId, text);
      const optimistic = {
        id: `local-${clientMessageId}`,
        clientMessageId,
        roomId,
        userId,
        text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => {
        const next = [...prev, optimistic];
        cacheChatMessages(roomId, next);
        return next;
      });
      setDraft('');
      setShowEmoji(false);
      if (announcementMode) setAnnouncementMode(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo enviar el mensaje', 'error');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!showEventInvite || !eventInviteSearch.trim() || eventInviteSearch.trim().length < 2) {
      setEventInviteResults([]);
      setEventInviteSearchError(null);
      return undefined;
    }

    const buildInviteSearchQueries = (raw: string): string[] => {
      const trimmed = raw.trim();
      const queries = [trimmed];
      if (trimmed.startsWith('@')) {
        const handle = trimmed.slice(1).trim();
        if (handle) {
          const spaced = handle.replace(/([a-záéíóúñ0-9])([A-ZÁÉÍÓÚÑ])/g, '$1 $2');
          if (spaced !== handle) queries.push(spaced);
          if (handle.includes(' ')) queries.push(handle.replace(/\s+/g, ''));
        }
      }
      return [...new Set(queries)];
    };

    const timer = window.setTimeout(async () => {
      setSearchingEventInvite(true);
      setEventInviteSearchError(null);
      try {
        const queries = buildInviteSearchQueries(eventInviteSearch);
        let users: SearchUserResult[] = [];
        for (const query of queries) {
          const found = await searchUsers(query);
          if (found.length > 0) {
            users = found;
            break;
          }
        }
        setEventInviteResults(users.filter((u) => u.id !== userId));
      } catch (err) {
        setEventInviteResults([]);
        setEventInviteSearchError(err instanceof Error ? err.message : 'No se pudo buscar usuarios');
      } finally {
        setSearchingEventInvite(false);
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [eventInviteSearch, showEventInvite, userId]);

  const handleInviteToEvent = async (target: SearchUserResult) => {
    if (!selectedRoom || !userId || moderatingBusy || isClosedEventChat) return;
    const roomId = resolveRoomId(selectedRoom);
    const eventName = selectedRoom.eventName || selectedRoom.event?.nombre || selectedRoom.event?.name || 'Evento';
    setModeratingBusy(true);
    try {
      await inviteToEventChat({
        roomId,
        eventName,
        requestedByUserId: userId,
        participants: target.id ? [target.id] : [],
        usernames: target.username ? [target.username] : [],
      });
      showToast(`Invitación enviada a ${target.name || target.username}`, 'success');
      setShowEventInvite(false);
      setEventInviteSearch('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo invitar al usuario', 'error');
    } finally {
      setModeratingBusy(false);
    }
  };

  const handleKickParticipant = async (participantId: string, participantName?: string) => {
    if (!selectedRoom || !userId || moderatingBusy || !isEventAdmin || isClosedEventChat) return;
    if (!window.confirm(`¿Expulsar a ${participantName || 'este usuario'} del chat?`)) return;
    setModeratingBusy(true);
    try {
      await kickFromEventChat(resolveRoomId(selectedRoom), participantId, userId);
      setSelectedRoom((prev) => {
        if (!prev) return prev;
        const ids = extractParticipantIdsFromRoom(prev);
        return {
          ...prev,
          participants: ids.filter((id) => !userIdsMatch(id, participantId)),
        };
      });
      showToast('Usuario expulsado del chat', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo expulsar al usuario', 'error');
    } finally {
      setModeratingBusy(false);
    }
  };

  const handleDeleteMessage = (message: ChatMessage) => {
    if (!selectedRoom || !userId) return;
    if (isClosedEventChat) {
      showToast('Este chat está cerrado. Solo puedes ver el historial.', 'error');
      return;
    }
    const roomId = resolveRoomId(selectedRoom);
    const messageId = message.id || message.messageId;
    if (!messageId) return;
    const senderId = resolveMessageSenderId(message);
    const canDelete = userIdsMatch(senderId, userId) || isEventAdmin;
    if (!canDelete) {
      showToast('No puedes eliminar este mensaje', 'error');
      return;
    }
    try {
      chatWebSocketClient.ensureConnected();
      chatWebSocketClient.editChatMessage(roomId, messageId, { deletedAt: new Date().toISOString() });
      setMessages((prev) => prev.filter((m) => (m.id || m.messageId) !== messageId));
      setMessageActionId(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo eliminar el mensaje', 'error');
    }
  };

  const handleDeleteMessageById = (messageId: string) => {
    const message = messages.find((m) => (m.id || m.messageId) === messageId);
    if (message) handleDeleteMessage(message);
  };

  const handleReportMessage = async (message: ChatMessage) => {
    if (!selectedRoom || !userId || moderatingBusy || isClosedEventChat) return;
    const messageId = message.id || message.messageId;
    if (!messageId) return;
    setModeratingBusy(true);
    try {
      await reportChatMessage({
        roomId: resolveRoomId(selectedRoom),
        messageId,
        reportedByUserId: userId,
        reason: 'Mensaje inapropiado o grosero',
      });
      showToast('Reporte enviado al administrador del evento', 'success');
      setMessageActionId(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo reportar el mensaje', 'error');
    } finally {
      setModeratingBusy(false);
    }
  };

  function extractParticipantIdsFromRoom(room: ChatRoom): string[] {
    return normalizeParticipants(room).map((p) => p.id).filter(Boolean);
  }

  useEffect(() => {
    if (!userSearch.trim() || userSearch.trim().length < 2) {
      setUserSearchResults([]);
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setSearchingUsers(true);
      searchUsers(userSearch.trim())
        .then((users) => setUserSearchResults(users.filter((u) => u.id !== userId)))
        .catch(() => setUserSearchResults([]))
        .finally(() => setSearchingUsers(false));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [userSearch, userId]);

  const appendLocalMessage = (roomId: string, clientMessageId: string, payload: SendChatMessageInput) => {
    setMessages((prev) => [...prev, {
      id: `local-${clientMessageId}`,
      clientMessageId,
      roomId,
      userId,
      text: payload.text || '',
      type: payload.type,
      asset: payload.asset,
      media: payload.media,
      location: payload.location,
      sharedEvent: payload.sharedEvent,
      createdAt: new Date().toISOString(),
    }]);
  };

  const sendStructuredMessage = async (payload: SendChatMessageInput) => {
    if (!selectedRoom || !userId) return;
    if (!canMessageInRoom) {
      showCannotMessageToast();
      return;
    }
    const roomId = resolveRoomId(selectedRoom);
    if (!chatWebSocketClient.isConnected()) {
      chatWebSocketClient.connect(userId);
      throw new Error('Chat reconectando. Espera unos segundos e intenta de nuevo.');
    }
    const clientMessageId = chatWebSocketClient.sendChatMessage(roomId, payload);
    appendLocalMessage(roomId, clientMessageId, payload);
    setShowAttachMenu(false);
  };

  const uploadChatAttachment = async (file: File) => {
    if (!selectedRoom || !userId) throw new Error('Chat no disponible');
    const roomId = resolveRoomId(selectedRoom);
    const contentType = resolveChatFileMime(file);
    const init = await initChatMediaUpload({
      roomId,
      userId,
      fileName: file.name || 'archivo',
      contentType,
      size: file.size,
    });
    let uploadResponse: Response;
    try {
      uploadResponse = await fetch(init.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file,
      });
    } catch {
      throw new Error('No se pudo subir el archivo. Revisa tu conexión e intenta de nuevo.');
    }
    if (!uploadResponse.ok) {
      throw new Error('No se pudo guardar el archivo en el servidor.');
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
        fileType: contentType,
        fileName: file.name,
      },
    };
  };

  const handleMediaPick = async (file: File) => {
    if (!canMessageInRoom) {
      showCannotMessageToast();
      return;
    }
    setSending(true);
    try {
      const contentType = resolveChatFileMime(file);
      const msgType = resolveMessageTypeFromFile(contentType, file.name);
      const uploaded = await uploadChatAttachment(file);
      await sendStructuredMessage({
        text: msgType === 'file' ? file.name : '',
        type: msgType,
        asset: uploaded.mediaKey,
        media: uploaded.media,
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo enviar el archivo', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleShareLocation = async () => {
    if (!userId || !canMessageInRoom) {
      if (!canMessageInRoom) showCannotMessageToast();
      return;
    }
    setSending(true);
    try {
      const location = await resolveUserLocation({ prompt: true, force: true, deviceOnly: true });
      if (!location) {
        throw new Error('No se pudo obtener tu ubicación. Activa el GPS o permisos del navegador.');
      }
      await sendStructuredMessage({
        text: location.label || 'Mi ubicación',
        type: 'message-location',
        location: {
          lat: location.lat,
          lng: location.lng,
          label: location.label || 'Mi ubicación',
        },
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo compartir la ubicación', 'error');
    } finally {
      setSending(false);
    }
  };

  const mapToSharedEvent = (event: FeedEventItem | UserEventItem): ChatSharedEvent => ({
    id: event.id,
    name: event.nombre,
    image: event.imagen,
    date: formatShareEventDate(event.fechaIni),
  });

  const openEventPicker = async () => {
    if (!userId) return;
    setShowAttachMenu(false);
    setShowEventPicker(true);
    setLoadingPickerEvents(true);
    try {
      const [mine, feed] = await Promise.all([
        fetchUserEvents(userId, { allEvents: true }).catch(() => ({ data: { datosEvento: [] as UserEventItem[] } })),
        fetchEventsFeed(userId).catch(() => ({ items: [] as FeedEventItem[] })),
      ]);
      const currentEventId = selectedRoom?.eventId || selectedRoom?.event?.id;
      const merged = new Map<string, ChatSharedEvent>();
      (feed.items || []).forEach((event) => {
        if (event.id) merged.set(event.id, mapToSharedEvent(event));
      });
      (mine.data?.datosEvento || []).forEach((event) => {
        if (event.id) merged.set(event.id, mapToSharedEvent(event));
      });
      if (currentEventId && selectedRoom) {
        merged.set(currentEventId, {
          id: currentEventId,
          name: selectedRoom.eventName || selectedRoom.event?.nombre || selectedRoom.event?.name || 'Este evento',
          image: selectedRoom.eventImage || selectedRoom.event?.image,
        });
      }
      setPickerEvents(Array.from(merged.values()));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudieron cargar eventos', 'error');
      setShowEventPicker(false);
    } finally {
      setLoadingPickerEvents(false);
    }
  };

  const handleShareEvent = async (event: ChatSharedEvent) => {
    if (!event.id) return;
    setSending(true);
    try {
      await sendStructuredMessage({
        text: event.name || 'Evento',
        type: 'message-event-share',
        sharedEvent: event,
      });
      setShowEventPicker(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo compartir el evento', 'error');
    } finally {
      setSending(false);
    }
  };

  const eventRooms = useMemo(() => rooms.filter((room) => !isPrivateRoom(room)), [rooms]);
  const privateRooms = useMemo(() => rooms.filter((room) => isPrivateRoom(room)), [rooms]);
  const inboxPrivateRooms = useMemo(
    () => privateRooms.filter((room) => {
      if (isRoomArchivedForUser(room, userId)) return false;
      if (isDirectChatRoom(room) && userId) {
        const peerId = resolveDirectPeerUserId(room, userId);
        if (peerId && blockedUserIds.has(peerId)) return false;
      }
      return true;
    }),
    [privateRooms, userId, blockedUserIds],
  );
  const archivedPrivateRooms = useMemo(
    () => privateRooms.filter((room) => isRoomArchivedForUser(room, userId)),
    [privateRooms, userId],
  );

  const chatContacts = useMemo(() => {
    const map = new Map<string, ChatContact>();
    const addContact = (entry?: ChatParticipant | string) => {
      if (!entry) return;
      const id = typeof entry === 'string' ? entry : entry.id;
      if (!id || !userId || userIdsMatch(id, userId) || blockedUserIds.has(id)) return;
      const name = typeof entry === 'string' ? entry : (entry.name || entry.id || 'Usuario');
      const avatar = typeof entry === 'string' ? undefined : entry.avatar;
      if (!map.has(id)) map.set(id, { id, name, avatar, online: Boolean(onlineUserIds[id]) });
    };
    privateRooms.forEach((room) => {
      if (isDirectChatRoom(room) && userId) {
        const peer = resolveDirectPeerParticipant(room, userId);
        addContact(peer || resolveDirectPeerUserId(room, userId));
      } else {
        normalizeParticipants(room).forEach(addContact);
      }
    });
    return Array.from(map.values()).map((contact) => ({
      ...contact,
      online: Boolean(onlineUserIds[contact.id]),
    }));
  }, [privateRooms, userId, onlineUserIds, blockedUserIds]);

  const onlineContacts = useMemo(
    () => chatContacts.filter((contact) => contact.online),
    [chatContacts],
  );

  const filteredInboxRooms = useMemo(() => {
    let list = inboxPrivateRooms;
    if (inboxFilter === 'unread') {
      list = list.filter((room) => (room.unreadCount || 0) > 0);
    } else if (inboxFilter === 'groups') {
      list = list.filter((room) => isPrivateGroupRoom(room));
    }
    return list;
  }, [inboxPrivateRooms, inboxFilter]);

  const visibleRooms = activeTab === 'events'
    ? eventRooms
    : (privateListTab === 'archived' ? archivedPrivateRooms : filteredInboxRooms);

  const handleBlockUser = async (targetUserId: string, targetName?: string) => {
    if (!userId || moderatingBusy || userIdsMatch(targetUserId, userId)) return;
    if (!window.confirm(`¿Bloquear a ${targetName || 'este usuario'}? No podrá contactarte por chat.`)) return;
    setModeratingBusy(true);
    try {
      await blockUser(userId, targetUserId);
      const users = await fetchBlockedUsers(userId);
      setBlockedUsers(users);
      setBlockedUserIds(new Set(users.map((u) => u.id).filter(Boolean)));
      if (selectedRoom && isDirectChatRoom(selectedRoom)) {
        const peerId = resolveDirectPeerUserId(selectedRoom, userId);
        if (peerId && userIdsMatch(peerId, targetUserId)) {
          setSelectedRoom(null);
        }
      }
      showToast('Usuario bloqueado', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo bloquear al usuario', 'error');
    } finally {
      setModeratingBusy(false);
    }
  };

  const handleUnblockUser = async (targetUserId: string) => {
    if (!userId || moderatingBusy) return;
    setModeratingBusy(true);
    try {
      await unblockUser(userId, targetUserId);
      const users = await fetchBlockedUsers(userId);
      setBlockedUsers(users);
      setBlockedUserIds(new Set(users.map((u) => u.id)));
      showToast('Usuario desbloqueado', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo desbloquear al usuario', 'error');
    } finally {
      setModeratingBusy(false);
    }
  };

  const openUserProfile = (targetUserId?: string) => {
    if (!targetUserId || userIdsMatch(targetUserId, userId)) return;
    navigate(`/users/${encodeURIComponent(targetUserId)}`);
  };

  const handleArchiveRoom = async () => {
    if (!userId || !selectedRoom) return;
    const roomId = resolveRoomId(selectedRoom);
    try {
      await archiveChatRoom(userId, roomId);
      setRooms((prev) => prev.map((room) => (
        resolveRoomId(room) === roomId
          ? { ...room, archivedBy: [...(room.archivedBy || []), userId] }
          : room
      )));
      setSelectedRoom(null);
      showToast('Chat archivado', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo archivar', 'error');
    }
  };

  const handleUnarchiveRoom = async (room: ChatRoom) => {
    if (!userId) return;
    const roomId = resolveRoomId(room);
    try {
      await unarchiveChatRoom(userId, roomId);
      setRooms((prev) => prev.map((item) => (
        resolveRoomId(item) === roomId
          ? { ...item, archivedBy: (item.archivedBy || []).filter((id) => id !== userId) }
          : item
      )));
      showToast('Chat restaurado', 'success');
      setPrivateListTab('inbox');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo restaurar', 'error');
    }
  };

  const toggleGroupMember = (user: SearchUserResult) => {
    if (!user.id) return;
    setGroupMembers((prev) => {
      const exists = prev.some((member) => member.id === user.id);
      if (exists) return prev.filter((member) => member.id !== user.id);
      if (prev.length >= 8) return prev;
      return [...prev, user];
    });
  };

  const handleCreateGroup = async () => {
    if (!userId || creatingGroup) return;
    const name = groupName.trim();
    const memberIds = groupMembers.map((member) => member.id).filter(Boolean) as string[];
    if (!name) {
      showToast('Escribe un nombre para el grupo', 'error');
      return;
    }
    if (memberIds.length < 1) {
      showToast('Agrega al menos un participante', 'error');
      return;
    }
    setCreatingGroup(true);
    try {
      const room = await createPrivateGroupChat({
        creatorId: userId,
        memberIds,
        groupName: name,
      });
      setRooms((prev) => [room, ...prev]);
      setShowCreateGroup(false);
      setGroupName('');
      setGroupMembers([]);
      setUserSearch('');
      setUserSearchResults([]);
      openRoom(room);
      showToast('Grupo creado', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo crear el grupo', 'error');
    } finally {
      setCreatingGroup(false);
    }
  };

  const participants = useMemo(
    () => (selectedRoom ? resolveAllChatMembers(selectedRoom) : []),
    [selectedRoom],
  );

  const participantMap = useMemo(() => {
    const map = new Map<string, { name?: string; avatar?: string }>();
    participants.forEach((p) => {
      if (p.id) map.set(p.id, { name: p.name, avatar: p.avatar });
    });
    if (peerProfile?.id) {
      map.set(peerProfile.id, { name: peerProfile.name, avatar: peerProfile.avatar });
    }
    if (selectedRoom?.hostName && selectedRoom.initiatorId) {
      const existing = map.get(selectedRoom.initiatorId);
      if (!existing?.avatar) {
        map.set(selectedRoom.initiatorId, {
          name: existing?.name || peerProfile?.name || selectedRoom.hostName,
          avatar: peerProfile?.avatar || existing?.avatar,
        });
      }
    }
    return map;
  }, [participants, peerProfile, selectedRoom]);

  const mediaMessages = useMemo(
    () => messages.filter((m) => isImageMessage(m) || isVideoMessage(m)),
    [messages],
  );

  const showEventLayout = selectedRoom ? isEventRoom(selectedRoom) : false;

  const activeEventRoomsForList = useMemo(
    () => eventRooms.filter((room) => !isRoomArchivedForUser(room, userId)),
    [eventRooms, userId],
  );

  const lovableEventRooms = useMemo(
    () => (userId ? roomsToEventChatRooms(activeEventRoomsForList, userId, onlineUserIds) : []),
    [activeEventRoomsForList, userId, onlineUserIds],
  );

  const lovablePrivateChats = useMemo(
    () => (userId ? roomsToPrivateChats(inboxPrivateRooms.filter((room) => !isPrivateGroupRoom(room)), userId, onlineUserIds) : []),
    [inboxPrivateRooms, userId, onlineUserIds],
  );

  const lovableGroupChats = useMemo(
    () => (userId ? roomsToPrivateChats(
      inboxPrivateRooms.filter((room) => isPrivateGroupRoom(room)),
      userId,
      onlineUserIds,
    ) : []),
    [inboxPrivateRooms, userId, onlineUserIds],
  );

  const lovableContacts = useMemo(
    () => chatContacts.map(chatContactToAttendee),
    [chatContacts],
  );

  const archivedChatIds = useMemo(() => {
    const ids = new Set<string>();
    if (!userId) return ids;
    rooms.forEach((room) => {
      if (isRoomArchivedForUser(room, userId)) ids.add(resolveRoomId(room));
    });
    return ids;
  }, [rooms, userId]);

  const handleOpenEventChat = (chatId: string) => {
    const room = rooms.find((r) => resolveRoomId(r) === chatId);
    if (room) {
      setActiveTab('events');
      openRoom(room);
    }
  };

  const handleOpenPrivateChat = (chatId: string) => {
    const room = rooms.find((r) => resolveRoomId(r) === chatId);
    if (room) {
      setActiveTab('private');
      openRoom(room);
      return;
    }
    void openDirectChat(chatId);
  };

  const handleArchiveFromList = async (chatId: string, archive: boolean) => {
    if (!userId) return;
    const room = rooms.find((r) => resolveRoomId(r) === chatId);
    if (!room) return;
    try {
      if (archive) {
        await archiveChatRoom(userId, chatId);
        setRooms((prev) => prev.map((r) => (
          resolveRoomId(r) === chatId
            ? { ...r, archivedBy: [...(r.archivedBy || []), userId] }
            : r
        )));
        showToast('Conversación archivada', 'success');
      } else {
        await handleUnarchiveRoom(room);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo actualizar el archivo', 'error');
    }
  };

  const profileInitials = profileName
    ? profileName.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : 'YO';

  if (selectedRoom) {
    return (
      <>
        <LovableChatThread
          room={selectedRoom}
          messages={messages}
          userId={userId!}
          onlineUserIds={onlineUserIds}
          loadingMessages={loadingMessages}
          sending={sending}
          canMessage={canMessageInRoom}
          showInvitationBanner={showInvitationBanner && !isClosedEventChat}
          showEventInvitationBanner={showEventInvitationBanner && !isClosedEventChat}
          showPendingSentBanner={showPendingSentBanner}
          peerName={peerProfile?.name || selectedRoom.hostName}
          peerAvatar={peerProfile?.avatar}
          inviteBusy={inviteBusy}
          onBack={() => setSelectedRoom(null)}
          onAcceptInvitation={handleAcceptInvitation}
          onDeclineInvitation={handleDeclineInvitation}
          onSendMessage={sendRoomMessage}
          onDeleteMessage={handleDeleteMessageById}
          onMediaPick={handleMediaPick}
          onShareLocation={handleShareLocation}
          onShareEvent={openEventPicker}
          onEventClick={(eventId) => navigate(`/events/${eventId}`)}
          onAddPerson={isEventAdmin && !isClosedEventChat ? () => setShowEventInvite(true) : undefined}
          isEventAdmin={isEventAdmin && !isClosedEventChat}
          canBroadcast={isEventCreator && !isClosedEventChat}
          isEventChat={showEventLayout}
          isPrivateGroup={isPrivateGroupRoom(selectedRoom)}
          isReadOnlyEventChat={isClosedEventChat}
          onKickParticipant={
            isEventAdmin && !isClosedEventChat
              ? (participantId, participantName) => void handleKickParticipant(participantId, participantName)
              : undefined
          }
        />
        <ChatEventPickerSheet
          open={showEventPicker}
          loading={loadingPickerEvents}
          events={pickerEvents}
          onClose={() => setShowEventPicker(false)}
          onSelect={handleShareEvent}
        />
        {showEventInvite && (
          <div className="de-chat-event-picker" role="presentation" onClick={() => setShowEventInvite(false)}>
            <div
              className="de-chat-event-picker__panel de-chat-group-panel"
              role="dialog"
              aria-label="Invitar al chat del evento"
              onClick={(e) => e.stopPropagation()}
            >
              <header>
                <strong>Agregar persona al chat</strong>
                <button type="button" onClick={() => setShowEventInvite(false)} aria-label="Cerrar">×</button>
              </header>
              <div className="de-chat-group-panel__body">
                <p className="de-chat-group-panel__hint">
                  Busca por nombre o usuario. Puedes invitar aunque no se hayan inscrito al evento.
                </p>
                <input
                  type="search"
                  value={eventInviteSearch}
                  placeholder="Buscar usuario..."
                  onChange={(e) => setEventInviteSearch(e.target.value)}
                />
                {searchingEventInvite && <p className="de-chat-group-panel__hint">Buscando…</p>}
                {eventInviteSearchError && (
                  <p className="de-chat-group-panel__hint" style={{ color: 'var(--destructive)' }}>
                    {eventInviteSearchError}
                  </p>
                )}
                {eventInviteResults.length > 0 && (
                  <ul className="de-chat-group-panel__users">
                    {eventInviteResults.map((user) => (
                      <li key={user.id}>
                        <button
                          type="button"
                          disabled={moderatingBusy}
                          onClick={() => void handleInviteToEvent(user)}
                        >
                          <UserAvatar
                            name={user.name || user.nombreCompleto || user.user}
                            imageUrl={user.imagen || user.fotoPerfilUrl}
                            size={36}
                          />
                          <span>{user.name || user.nombreCompleto || user.user}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <Loader />
      </div>
    );
  }

  return (
    <>
      <MessagesListView
        chatRooms={lovableEventRooms}
        privateChats={lovablePrivateChats}
        groupChats={lovableGroupChats}
        contacts={lovableContacts}
        loading={loading}
        profileAvatar={profileAvatar}
        profileInitials={profileInitials}
        archivedIds={archivedChatIds}
        onBack={() => navigate('/')}
        onBlockedClick={() => setShowBlockedPanel(true)}
        onCreateConversation={() => setShowCreateGroup(true)}
        onStartDirectChat={(targetId) => void openDirectChat(targetId)}
        onOpenUserProfile={openUserProfile}
        currentUserId={userId}
        onOpenChat={handleOpenEventChat}
        onOpenPrivateChat={handleOpenPrivateChat}
        onArchiveChat={handleArchiveFromList}
        onOpenStory={(authorId) => setStoryViewerUserId(authorId)}
        onCreateStory={() => setCreateStoryOpen(true)}
      />

      <CreateStorySheet
        open={createStoryOpen}
        onClose={() => setCreateStoryOpen(false)}
        onCreated={() => {
          setCreateStoryOpen(false);
          refreshStories();
        }}
      />
      <StoryViewer
        open={Boolean(storyViewerUserId)}
        authorUserId={storyViewerUserId}
        currentUserId={userId}
        onClose={() => setStoryViewerUserId(null)}
        onStoriesChanged={refreshStories}
      />

{showBlockedPanel && (
        <div className="de-chat-modal-overlay" role="presentation" onClick={() => setShowBlockedPanel(false)}>
          <div
            className="de-chat-blocked-panel"
            role="dialog"
            aria-labelledby="blocked-users-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="de-chat-blocked-panel__header">
              <h2 id="blocked-users-title">Usuarios bloqueados</h2>
              <button type="button" onClick={() => setShowBlockedPanel(false)} aria-label="Cerrar">×</button>
            </header>
            <div className="de-chat-blocked-panel__body">
              {loadingBlocked ? (
                <Loader />
              ) : blockedUsers.length === 0 ? (
                <p className="de-empty-state">No tienes usuarios bloqueados.</p>
              ) : (
                <ul className="de-chat-blocked-panel__list">
                  {blockedUsers.map((blocked) => (
                    <li key={blocked.id} className="de-chat-blocked-panel__item">
                      <button
                        type="button"
                        className="de-chat-blocked-panel__profile"
                        onClick={() => openUserProfile(blocked.id)}
                      >
                        <UserAvatar name={blocked.name || blocked.username || blocked.id} size={44} />
                        <div>
                          <strong>{blocked.name || blocked.username || 'Usuario'}</strong>
                          {blocked.username && <span>@{blocked.username}</span>}
                        </div>
                      </button>
                      <button
                        type="button"
                        className="de-chat-blocked-panel__unblock"
                        disabled={moderatingBusy}
                        onClick={() => handleUnblockUser(blocked.id)}
                      >
                        Desbloquear
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateGroup && (
        <div className="de-chat-event-picker">
          <div className="de-chat-event-picker__panel de-chat-group-panel">
            <header>
              <strong>Crear grupo privado</strong>
              <button type="button" onClick={() => setShowCreateGroup(false)} aria-label="Cerrar">×</button>
            </header>
            <div className="de-chat-group-panel__body">
              <input
                type="text"
                value={groupName}
                placeholder="Nombre del grupo"
                onChange={(e) => setGroupName(e.target.value)}
              />
              <p className="de-chat-group-panel__hint">Busca usuarios y selecciónalos (máx. 8)</p>
              <input
                type="search"
                value={userSearch}
                placeholder="Buscar participantes..."
                onChange={(e) => setUserSearch(e.target.value)}
              />
              {groupMembers.length > 0 && (
                <div className="de-chat-group-panel__chips">
                  {groupMembers.map((member) => (
                    <button key={member.id} type="button" onClick={() => toggleGroupMember(member)}>
                      {(member.name || member.nombreCompleto || member.user)} ×
                    </button>
                  ))}
                </div>
              )}
              {userSearchResults.length > 0 && (
                <ul className="de-chat-group-panel__users">
                  {userSearchResults.map((user) => {
                    const selected = groupMembers.some((member) => member.id === user.id);
                    return (
                      <li key={user.id}>
                        <button type="button" className={selected ? 'is-selected' : ''} onClick={() => toggleGroupMember(user)}>
                          <UserAvatar name={user.name || user.nombreCompleto || user.user} imageUrl={user.imagen || user.fotoPerfilUrl} size={36} />
                          <span>{user.name || user.nombreCompleto || user.user}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <button type="button" className="de-chat-group-panel__create" onClick={handleCreateGroup} disabled={creatingGroup}>
                {creatingGroup ? 'Creando…' : 'Crear grupo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatPage;
