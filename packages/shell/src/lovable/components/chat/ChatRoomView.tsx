import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Settings, UserPlus, Megaphone, Shield, Clock, CalendarDays, ChevronRight, MessageSquare, AlertCircle, X, Eye, EyeOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';
import type { EventChatRoom, ChatMessage, ChatAttendee, ChatMessageReply } from '@lovable/data/chatData';
import { cn } from '@lovable/lib/utils';
import { toast } from 'sonner';
import ChatRichMessage from './ChatRichMessage';
import ChatComposeBar from './ChatComposeBar';
import { attendeesToMentionMembers } from './ChatMemberMentionAutocomplete';
import { ChatMessageActionsPopover, ChatMessageContextMenu } from './ChatMessageActionsMenu';
import ChatMessageReactions from './ChatMessageReactions';
import { StoryAvatar } from '../../../components/StoryAvatar';
import { useActiveStoryAuthors } from '../../../contexts/StoriesContext';

interface ChatRoomViewProps {
  chatRoom: EventChatRoom;
  onBack: () => void;
  onUpdateMessages?: (chatId: string, messages: ChatMessage[]) => void;
  onSendMessage?: (
    text: string,
    options?: {
      announcement?: boolean;
      replyTo?: ChatMessageReply;
      editingMessageId?: string;
    },
  ) => void;
  onDeleteMessage?: (messageId: string) => void;
  onReportMessage?: (messageId: string) => void;
  onMediaPick?: (file: File) => void;
  onShareLocation?: () => void;
  onShareEvent?: () => void;
  onEventClick?: (eventId: string) => void;
  onAddPerson?: () => void;
  currentUserId?: string;
  sending?: boolean;
  canMessage?: boolean;
  canBroadcast?: boolean;
  isReadOnly?: boolean;
  canModerate?: boolean;
  onKickParticipant?: (participantId: string, participantName?: string) => void;
  onReactMessage?: (messageId: string, emoji: string) => void;
  onOpenStory?: (userId: string) => void;
  onOpenUserProfile?: (userId: string) => void;
  onCreateStory?: () => void;
}

/* ── Attendee bubble ── */
const AttendeeBubble = ({
  attendee,
  currentUserId,
  onOpenStory,
  onOpenUserProfile,
  onCreateStory,
}: {
  attendee: ChatAttendee;
  currentUserId?: string;
  onOpenStory?: (userId: string) => void;
  onOpenUserProfile?: (userId: string) => void;
  onCreateStory?: () => void;
}) => {
  const { hasActiveStory } = useActiveStoryAuthors();
  const isOwn = Boolean(currentUserId && attendee.id === currentUserId);
  const storyActive = Boolean(attendee.id && hasActiveStory(attendee.id));

  const openProfile = () => {
    if (!attendee.id) return;
    onOpenUserProfile?.(attendee.id);
  };

  return (
    <div className="flex flex-col items-center gap-1 min-w-[64px] max-w-[72px]">
      <div className="relative">
        <StoryAvatar
          userId={attendee.id}
          name={attendee.name}
          imageUrl={attendee.avatar}
          size={56}
          isOwn={isOwn}
          isOnline={attendee.isOnline}
          showOnlineStatus
          onCreateStory={isOwn ? onCreateStory : undefined}
          onClick={() => {
            if (!attendee.id) return;
            if (storyActive) {
              onOpenStory?.(attendee.id);
              return;
            }
            if (!isOwn) openProfile();
          }}
          className={cn(
            attendee.isAdmin && !storyActive && 'ring-2 ring-primary shadow-md shadow-primary/20',
          )}
        />
        {attendee.isAdmin && (
          <span className="absolute -top-0.5 -right-0.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary border-2 border-card">
            <Shield className="h-2.5 w-2.5 text-primary-foreground" />
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={openProfile}
        className={cn(
          'max-w-[72px] truncate text-[11px] font-medium hover:underline',
          attendee.isAdmin ? 'text-primary font-bold' : 'text-foreground',
        )}
        title="Ver perfil"
      >
        {attendee.name}
      </button>
      {attendee.isAdmin && (
        <span className="text-[9px] font-bold uppercase tracking-wider text-primary">Admin</span>
      )}
      {storyActive && (
        <span className="text-[9px] font-semibold text-fuchsia-600">Historia</span>
      )}
    </div>
  );
};

/* ── Message author avatar (historia / perfil) ── */
const MessageAuthorChip = ({
  msg,
  onOpenStory,
  onOpenUserProfile,
}: {
  msg: ChatMessage;
  onOpenStory?: (userId: string) => void;
  onOpenUserProfile?: (userId: string) => void;
}) => {
  const { hasActiveStory } = useActiveStoryAuthors();
  const storyActive = Boolean(msg.senderId && hasActiveStory(msg.senderId));

  const openProfile = () => {
    if (!msg.senderId) return;
    onOpenUserProfile?.(msg.senderId);
  };

  return (
    <div className="flex flex-col items-center shrink-0">
      <StoryAvatar
        userId={msg.senderId}
        name={msg.senderName}
        imageUrl={msg.senderAvatar}
        size={36}
        onClick={() => {
          if (!msg.senderId) return;
          if (storyActive) onOpenStory?.(msg.senderId);
          else openProfile();
        }}
      />
      <button
        type="button"
        onClick={openProfile}
        className="mt-0.5 max-w-[56px] truncate text-[9px] text-primary hover:underline"
        title="Ver perfil"
      >
        {msg.senderName}
      </button>
    </div>
  );
};

/* ── Main component ── */
const ChatRoomView = ({
  chatRoom,
  onBack,
  onUpdateMessages,
  onSendMessage,
  onDeleteMessage,
  onReportMessage,
  onMediaPick,
  onShareLocation,
  onShareEvent,
  onEventClick,
  onAddPerson,
  currentUserId,
  sending = false,
  canMessage = true,
  canBroadcast,
  isReadOnly = false,
  canModerate = false,
  onKickParticipant,
  onReactMessage,
  onOpenStory,
  onOpenUserProfile,
  onCreateStory,
}: ChatRoomViewProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [contextMenu, setContextMenu] = useState<{ message: ChatMessage; position: { x: number; y: number } } | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessageReply | null>(null);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [eventHeaderVisible, setEventHeaderVisible] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionMembers = attendeesToMentionMembers(chatRoom.attendees);

  const handleMentionClick = (handle: string) => {
    const normalized = handle.replace(/^@/, '').toLowerCase();
    const match = mentionMembers.find((m) => {
      const mHandle = String(m.username || m.name || '')
        .replace(/^@/, '')
        .replace(/\s+/g, '')
        .toLowerCase();
      return mHandle === normalized || String(m.name || '').toLowerCase() === normalized;
    });
    if (match?.id && onOpenUserProfile) {
      onOpenUserProfile(match.id);
      return;
    }
    toast(`@${handle}`);
  };

  const currentUserIsAdmin = chatRoom.attendees.find(
    (a) => currentUserId ? a.id === currentUserId : a.id === 'me',
  )?.isAdmin ?? false;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatRoom.messages]);

  const handleSend = () => {
    const text = newMessage.trim();
    if (!text || !canMessage) return;

    if (onSendMessage) {
      if (editingMessage) {
        onSendMessage(text, { editingMessageId: editingMessage });
        setEditingMessage(null);
      } else if (replyingTo) {
        onSendMessage(text, { replyTo: replyingTo });
        setReplyingTo(null);
      } else {
        onSendMessage(text);
      }
      setNewMessage('');
      return;
    }

    if (!onUpdateMessages) return;

    if (editingMessage) {
      const updated = chatRoom.messages.map(m => m.id === editingMessage ? { ...m, text } : m);
      onUpdateMessages(chatRoom.id, updated);
      setEditingMessage(null);
    } else {
      const msg: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: 'me',
        senderName: 'Tú',
        senderInitials: 'TU',
        text,
        timestamp: 'Ahora',
        isOwn: true,
        ...(replyingTo ? { replyTo: replyingTo } : {}),
      };
      onUpdateMessages(chatRoom.id, [...chatRoom.messages, msg]);
      setReplyingTo(null);
    }
    setNewMessage('');
  };

  const submitAnnouncement = () => {
    const text = announcementText.trim();
    if (!text) {
      toast('Escribe un mensaje para el anuncio');
      return;
    }
    if (onSendMessage) {
      onSendMessage(text, { announcement: true });
    } else if (onUpdateMessages) {
      const msg: ChatMessage = {
        id: `ann-${Date.now()}`,
        senderId: 'me',
        senderName: 'Tú',
        senderInitials: 'TU',
        text,
        timestamp: 'Ahora',
        isOwn: true,
        isAnnouncement: true,
      };
      onUpdateMessages(chatRoom.id, [...chatRoom.messages, msg]);
    }
    setAnnouncementText('');
    setAnnouncementModalOpen(false);
    toast('Anuncio enviado a todos los participantes');
  };

  const openAnnouncementModal = () => {
    setAnnouncementText('');
    setAnnouncementModalOpen(true);
    setAdminMenuOpen(false);
  };

  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent, message: ChatMessage) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setContextMenu({ message, position: { x: clientX, y: clientY } });
  };

  const handleCopy = () => {
    if (contextMenu) { navigator.clipboard.writeText(contextMenu.message.text); toast('Texto copiado'); }
    setContextMenu(null);
  };
  const handleEdit = () => {
    if (contextMenu) { setEditingMessage(contextMenu.message.id); setNewMessage(contextMenu.message.text); inputRef.current?.focus(); }
    setContextMenu(null);
  };
  const handleDelete = () => {
    if (contextMenu) {
      if (onDeleteMessage) onDeleteMessage(contextMenu.message.id);
      else if (onUpdateMessages) {
        onUpdateMessages(chatRoom.id, chatRoom.messages.filter(m => m.id !== contextMenu.message.id));
        toast('Mensaje eliminado');
      }
    }
    setContextMenu(null);
  };
  const handleReport = () => {
    if (contextMenu) {
      if (onReportMessage) onReportMessage(contextMenu.message.id);
      else toast('Reporte no disponible');
    }
    setContextMenu(null);
  };

  const buildMessageActions = (message: ChatMessage) => ({
    message,
    isAdmin: currentUserIsAdmin,
    canModerate,
    showKickUser: true,
    onReply: () => {
      setReplyingTo({
        id: message.id,
        text: message.text,
        senderName: message.senderName,
        senderId: message.senderId,
      });
      setEditingMessage(null);
      inputRef.current?.focus();
    },
    onCopy: () => {
      navigator.clipboard.writeText(message.text);
      toast('Texto copiado');
    },
    onEdit: () => {
      setEditingMessage(message.id);
      setNewMessage(message.text);
      inputRef.current?.focus();
    },
    onDelete: () => {
      if (onDeleteMessage) onDeleteMessage(message.id);
      else if (onUpdateMessages) {
        onUpdateMessages(chatRoom.id, chatRoom.messages.filter((m) => m.id !== message.id));
        toast('Mensaje eliminado');
      }
    },
    onReport: () => {
      if (onReportMessage) onReportMessage(message.id);
      else toast('Reporte no disponible');
    },
    onKick: () => {
      if (!canModerate) {
        toast.error('No tienes permisos para expulsar participantes');
        return;
      }
      if (onKickParticipant && message.senderId) {
        onKickParticipant(message.senderId, message.senderName);
      } else {
        toast.error('Expulsión no disponible en este chat');
      }
    },
    onReact: onReactMessage
      ? (emoji: string) => onReactMessage(message.id, emoji)
      : undefined,
    onClose: () => undefined,
  });

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] w-full min-w-0 flex-col overflow-hidden bg-secondary">
      {/* Top bar — fijo */}
      <div className="shrink-0 z-30 border-b border-border bg-card px-4 py-3 shadow-sm">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-2">
          <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-foreground">
            <ChevronLeft className="h-5 w-5" /> Volver
          </button>
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEventHeaderVisible((visible) => !visible)}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
              aria-pressed={eventHeaderVisible}
            >
              {eventHeaderVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {eventHeaderVisible ? 'Ocultar evento' : 'Mostrar evento'}
            </button>
            {!isReadOnly && currentUserIsAdmin && canBroadcast && (
              <button
                type="button"
                onClick={() => setAdminMenuOpen((open) => !open)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>
            )}
            {adminMenuOpen && currentUserIsAdmin && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setAdminMenuOpen(false)} />
                <div className="absolute right-0 top-full z-40 mt-2 min-w-[180px] rounded-2xl border border-border bg-card p-2 shadow-xl">
                  <button
                    type="button"
                    onClick={() => { onAddPerson?.(); setAdminMenuOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-primary hover:bg-accent"
                  >
                    <UserPlus className="h-4 w-4" /> Agregar
                  </button>
                  {canBroadcast && (
                    <button
                      type="button"
                      onClick={openAnnouncementModal}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-primary hover:bg-accent"
                    >
                      <Megaphone className="h-4 w-4" /> Anuncio
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Evento + asistentes — fijos (no hacen scroll con los mensajes) */}
      {eventHeaderVisible && (
        <div className="shrink-0 z-20 border-b border-border/60 bg-secondary px-4 pb-3 pt-3">
          <div className="mx-auto w-full max-w-lg">
            <button
              type="button"
              className="mb-3 w-full rounded-2xl bg-card p-3 text-left shadow-sm transition hover:bg-accent/30"
              onClick={() => chatRoom.eventId && onEventClick?.(chatRoom.eventId)}
            >
              <div className="flex gap-3">
                {chatRoom.eventImage ? (
                  <Avatar className="h-16 w-16 shrink-0 rounded-xl">
                    <AvatarImage src={chatRoom.eventImage} className="rounded-xl object-cover" />
                    <AvatarFallback className="rounded-xl bg-accent text-xs text-accent-foreground">
                      {chatRoom.eventName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
                    <Megaphone className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-1 text-sm font-bold text-foreground">{chatRoom.eventName}</h2>
                  {chatRoom.eventDescription && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{chatRoom.eventDescription}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                    {chatRoom.eventTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {chatRoom.eventTime}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" /> {chatRoom.eventDate}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 self-center text-muted-foreground" />
              </div>
            </button>

            {isReadOnly && (
              <div className="mb-3 flex gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
                <AlertCircle className="h-5 w-5 shrink-0 text-primary" />
                <p>Este chat está cerrado. Solo puedes ver el historial de mensajes.</p>
              </div>
            )}

            <p className="mb-2 text-sm font-bold text-foreground">Asistentes al evento</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {chatRoom.attendees.map((att) => (
                <AttendeeBubble
                  key={att.id}
                  attendee={att}
                  currentUserId={currentUserId}
                  onOpenStory={onOpenStory}
                  onOpenUserProfile={onOpenUserProfile}
                  onCreateStory={onCreateStory}
                />
              ))}
              {currentUserIsAdmin && !isReadOnly && (
                <button
                  type="button"
                  className="flex min-w-[60px] flex-col items-center gap-1"
                  onClick={() => onAddPerson?.()}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-primary/40">
                    <UserPlus className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[11px] font-medium text-primary">Agregar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Solo los mensajes hacen scroll */}
      <div className="mx-auto w-full min-w-0 max-w-lg flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {chatRoom.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-card py-12 text-center shadow-sm">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <MessageSquare className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Aún no hay mensajes</p>
              <p className="mt-1 text-xs text-muted-foreground">Sé el primero en escribir en este chat</p>
            </div>
          )}
          {chatRoom.messages.map((msg) => {
            if (msg.isAnnouncement) {
              return (
                <div key={msg.id} className="w-full">
                  <ChatRichMessage message={msg} onEventClick={onEventClick} onMentionClick={handleMentionClick} />
                  <p className="mt-1 text-[10px] text-muted-foreground text-right">{msg.timestamp}</p>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                onContextMenu={isReadOnly ? undefined : (e) => handleContextMenu(e, msg)}
                onTouchStart={isReadOnly ? undefined : (e) => {
                  const touch = e.touches[0];
                  const timer = window.setTimeout(() => {
                    setContextMenu({
                      message: msg,
                      position: { x: touch.clientX, y: touch.clientY },
                    });
                  }, 500);
                  const clear = () => window.clearTimeout(timer);
                  e.currentTarget.addEventListener('touchend', clear, { once: true });
                  e.currentTarget.addEventListener('touchmove', clear, { once: true });
                }}
                className={cn('flex items-end gap-2', msg.isOwn ? 'flex-row-reverse' : 'flex-row')}
              >
                {!msg.isOwn && (
                  <MessageAuthorChip
                    msg={msg}
                    onOpenStory={onOpenStory}
                    onOpenUserProfile={onOpenUserProfile}
                  />
                )}
                <div className={cn('flex max-w-[85%] min-w-0 flex-col', msg.isOwn ? 'items-end' : 'items-start')}>
                  <div
                    className={cn(
                      'w-full min-w-0 rounded-2xl px-4 py-3 shadow-sm',
                      msg.isOwn ? 'bg-primary/20 rounded-br-md' : 'bg-card rounded-bl-md',
                    )}
                    onDoubleClick={isReadOnly || !onReactMessage ? undefined : () => onReactMessage(msg.id, '👍')}
                  >
                    {msg.isOwn && (
                      <p className="text-[10px] font-semibold text-primary mb-0.5">{msg.senderName}</p>
                    )}
                    {msg.replyTo && (
                      <div className="mb-2 rounded-lg border-l-2 border-primary/40 bg-primary/5 px-2 py-1.5">
                        <p className="text-[10px] font-semibold text-primary">{msg.replyTo.senderName}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{msg.replyTo.text}</p>
                      </div>
                    )}
                    <ChatRichMessage message={msg} onEventClick={onEventClick} onMentionClick={handleMentionClick} />
                    <p className="mt-1 text-[10px] text-muted-foreground text-right">{msg.timestamp}</p>
                  </div>
                  <ChatMessageReactions
                    message={msg}
                    currentUserId={currentUserId}
                    disabled={isReadOnly}
                    align={msg.isOwn ? 'end' : 'start'}
                    onReact={onReactMessage}
                  />
                </div>
                {!isReadOnly && (
                  <ChatMessageActionsPopover
                    {...buildMessageActions(msg)}
                    align={msg.isOwn ? 'end' : 'start'}
                  />
                )}
                {msg.isOwn && (
                  <MessageAuthorChip
                    msg={msg}
                    onOpenStory={onOpenStory}
                    onOpenUserProfile={onOpenUserProfile}
                  />
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {isReadOnly ? (
        <div className="shrink-0 z-20 border-t border-border bg-card px-4 py-3 safe-area-bottom">
          <p className="mx-auto max-w-lg text-center text-sm text-muted-foreground">
            Chat cerrado — no se pueden enviar ni recibir mensajes.
          </p>
        </div>
      ) : (
        <>
          {(replyingTo || editingMessage) && (
            <div className="shrink-0 border-t border-border bg-card px-4 py-2">
              <div className="mx-auto flex max-w-lg items-center justify-between gap-2 rounded-xl bg-secondary px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {editingMessage ? 'Editando mensaje' : `Respondiendo a ${replyingTo?.senderName}`}
                  </p>
                  {!editingMessage && replyingTo && (
                    <p className="truncate text-xs text-muted-foreground">{replyingTo.text}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setReplyingTo(null); setEditingMessage(null); setNewMessage(''); }}
                  className="shrink-0 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          <ChatComposeBar
            value={newMessage}
            onChange={setNewMessage}
            onSend={handleSend}
            sending={sending}
            canMessage={canMessage}
            canBroadcast={canBroadcast}
            onAnnouncement={canBroadcast ? openAnnouncementModal : undefined}
            onShareLocation={onShareLocation}
            onShareEvent={onShareEvent}
            onMediaPick={onMediaPick}
            editingMessage={editingMessage}
            onCancelEdit={() => { setEditingMessage(null); setReplyingTo(null); setNewMessage(''); }}
            mentionMembers={mentionMembers}
            currentUserId={currentUserId}
          />
        </>
      )}

      {announcementModalOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 p-5"
          onClick={() => setAnnouncementModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-announcement-title"
            className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="chat-announcement-title" className="text-lg font-extrabold text-foreground">
              Agregar anuncio
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">Mensaje del anuncio</p>
            <textarea
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="Este anuncio se le enviará a todos los participantes..."
              rows={4}
              className="mt-3 w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAnnouncementModalOpen(false)}
                className="rounded-full border border-primary px-4 py-2 text-sm font-bold text-primary"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!announcementText.trim() || sending}
                onClick={submitAnnouncement}
                className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                Enviar anuncio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context menu */}
      {contextMenu && !isReadOnly && (
        <ChatMessageContextMenu
          {...buildMessageActions(contextMenu.message)}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onReply={() => {
            setReplyingTo({
              id: contextMenu.message.id,
              text: contextMenu.message.text,
              senderName: contextMenu.message.senderName,
              senderId: contextMenu.message.senderId,
            });
            setEditingMessage(null);
            inputRef.current?.focus();
            setContextMenu(null);
          }}
          onCopy={handleCopy}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReport={handleReport}
          onKick={() => {
            if (!canModerate) {
              toast.error('No tienes permisos para expulsar participantes');
              setContextMenu(null);
              return;
            }
            const senderId = contextMenu.message.senderId;
            if (onKickParticipant && senderId) {
              onKickParticipant(senderId, contextMenu.message.senderName);
            } else {
              toast.error('Expulsión no disponible en este chat');
            }
            setContextMenu(null);
          }}
          onReact={onReactMessage
            ? (emoji) => {
              onReactMessage(contextMenu.message.id, emoji);
              setContextMenu(null);
            }
            : undefined}
        />
      )}
    </div>
  );
};

export default ChatRoomView;
