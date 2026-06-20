import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Send, Settings, UserPlus, Megaphone, Copy, Pencil, Trash2, X, Shield, Ban, Clock, CalendarDays, ChevronRight, Plus, CornerUpLeft, UserMinus, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';
import type { EventChatRoom, ChatMessage, ChatAttendee } from '@lovable/data/chatData';
import { cn } from '@lovable/lib/utils';
import { toast } from 'sonner';
import ChatRichMessage from './ChatRichMessage';
import ChatComposeBar from './ChatComposeBar';

interface ChatRoomViewProps {
  chatRoom: EventChatRoom;
  onBack: () => void;
  onUpdateMessages?: (chatId: string, messages: ChatMessage[]) => void;
  onSendMessage?: (text: string, options?: { announcement?: boolean }) => void;
  onDeleteMessage?: (messageId: string) => void;
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
}

/* ── Attendee bubble ── */
const AttendeeBubble = ({ attendee }: { attendee: ChatAttendee }) => (
  <div className="flex flex-col items-center gap-1 min-w-[60px]">
    <div className="relative">
      <Avatar className={cn(
        'h-14 w-14',
        attendee.isAdmin && 'ring-2 ring-primary shadow-md shadow-primary/20'
      )}>
        {attendee.avatar ? (
          <AvatarImage src={attendee.avatar} alt={attendee.name} className="object-cover" />
        ) : null}
        <AvatarFallback className={cn(
          "text-xs font-semibold",
          attendee.isAdmin
            ? "bg-primary text-primary-foreground"
            : "bg-accent text-accent-foreground"
        )}>
          {attendee.initials}
        </AvatarFallback>
      </Avatar>
      {/* Status dot */}
      <span className={cn(
        'absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card',
        attendee.isOnline ? 'bg-success' : 'bg-muted-foreground/40',
      )} />
      {/* Admin badge */}
      {attendee.isAdmin && (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary border-2 border-card">
          <Shield className="h-2.5 w-2.5 text-primary-foreground" />
        </span>
      )}
    </div>
    <span className={cn(
      "max-w-[60px] truncate text-[11px] font-medium",
      attendee.isAdmin ? "text-primary font-bold" : "text-foreground"
    )}>{attendee.name}</span>
    {attendee.isAdmin && (
      <span className="text-[9px] font-bold uppercase tracking-wider text-primary">Admin</span>
    )}
  </div>
);

/* ── Context menu ── */
const MessageContextMenu = ({ message, position, isAdmin, canModerate, onClose, onReply, onCopy, onEdit, onDelete, onKick }: {
  message: ChatMessage;
  position: { x: number; y: number };
  isAdmin: boolean;
  canModerate: boolean;
  onClose: () => void;
  onReply: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onKick: () => void;
}) => {
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [onClose]);

  return (
    <div
      className="fixed z-50 min-w-[200px] rounded-2xl border border-border bg-card p-2 shadow-xl"
      style={{ top: position.y, left: Math.min(position.x, window.innerWidth - 220) }}
      onClick={(e) => e.stopPropagation()}
    >
      {!message.isOwn && (
        <button onClick={onReply} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-primary font-semibold hover:bg-accent">
          <CornerUpLeft className="h-4 w-4" /> Responder
        </button>
      )}
      <button onClick={onCopy} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent">
        <Copy className="h-4 w-4" /> Copiar selección
      </button>
      {message.isOwn && (
        <button onClick={onEdit} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent">
          <Pencil className="h-4 w-4" /> Editar
        </button>
      )}
      {message.isOwn && (
        <button onClick={onDelete} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-accent">
          <Trash2 className="h-4 w-4" /> Eliminar
        </button>
      )}
      {!message.isOwn && isAdmin && canModerate && (
        <button onClick={onKick} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-accent">
          <UserMinus className="h-4 w-4" /> Expulsar usuario
        </button>
      )}
      <button onClick={onClose} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent">
        <X className="h-4 w-4" /> Cerrar
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
}: ChatRoomViewProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [contextMenu, setContextMenu] = useState<{ message: ChatMessage; position: { x: number; y: number } } | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      onSendMessage(text, editingMessage ? undefined : undefined);
      setEditingMessage(null);
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
      };
      onUpdateMessages(chatRoom.id, [...chatRoom.messages, msg]);
    }
    setNewMessage('');
  };

  const handleAnnouncement = () => {
    const text = newMessage.trim();
    if (!text) { toast('Escribe un mensaje para el anuncio'); return; }
    if (onSendMessage) {
      onSendMessage(text, { announcement: true });
      setNewMessage('');
      return;
    }
    if (!onUpdateMessages) return;
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
    setNewMessage('');
    toast('📢 Anuncio enviado');
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
  const handleKick = (attendee: ChatAttendee) => {
    if (!canModerate) {
      toast.error('No tienes permisos para expulsar participantes');
      return;
    }
    if (onKickParticipant) {
      onKickParticipant(attendee.id, attendee.name);
      return;
    }
    toast.error('Expulsión no disponible en este chat');
  };
  const handleBan = () => toast.error('Ban de usuarios requiere soporte backend (BACKEND_REQUIRED)');

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] w-full min-w-0 flex-col overflow-hidden bg-secondary">
      {/* Top bar */}
      <div className="shrink-0 z-20 border-b border-border bg-card px-4 py-3 shadow-sm">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-foreground">
            <ChevronLeft className="h-5 w-5" /> Volver
          </button>
          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <button onClick={() => setShowSettings(!showSettings)} className="text-muted-foreground hover:text-primary transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full min-w-0 max-w-lg flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-4">
        {/* Event info card */}
        <button
          type="button"
          className="mb-4 w-full rounded-2xl bg-card p-3 shadow-sm text-left transition hover:bg-accent/30"
          onClick={() => chatRoom.eventId && onEventClick?.(chatRoom.eventId)}
        >
          <div className="flex gap-3">
            {chatRoom.eventImage ? (
              <Avatar className="h-16 w-16 shrink-0 rounded-xl">
                <AvatarImage src={chatRoom.eventImage} className="rounded-xl object-cover" />
                <AvatarFallback className="rounded-xl bg-accent text-accent-foreground text-xs">
                  {chatRoom.eventName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Megaphone className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-foreground line-clamp-1">{chatRoom.eventName}</h2>
              {chatRoom.eventDescription && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{chatRoom.eventDescription}</p>
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
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground self-center" />
          </div>
        </button>

        {isReadOnly && (
          <div className="mb-4 rounded-2xl border border-border bg-muted/60 px-4 py-3 text-center text-sm text-muted-foreground">
            Este chat está cerrado. Solo puedes ver el historial de mensajes.
          </div>
        )}

        {/* Attendees */}
        <p className="mb-2 text-sm font-bold text-foreground">Asistentes al evento</p>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {chatRoom.attendees.map(att => (
            <AttendeeBubble key={att.id} attendee={att} />
          ))}
          {currentUserIsAdmin && !isReadOnly && (
            <button
              type="button"
              className="flex flex-col items-center gap-1 min-w-[60px]"
              onClick={() => onAddPerson?.()}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-primary/40">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[11px] font-medium text-primary">Agregar</span>
            </button>
          )}
        </div>

        {/* Admin settings panel */}
        {showSettings && currentUserIsAdmin && !isReadOnly && canModerate && (
          <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-foreground">Gestión de participantes</h3>
            <div className="space-y-2">
              {chatRoom.attendees.filter(a => !a.isAdmin).map(att => (
                <div key={att.id} className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2.5 w-2.5 rounded-full', att.isOnline ? 'bg-success' : 'bg-muted-foreground/40')} />
                    <span className="text-sm font-medium text-foreground">{att.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleKick(att)} className="rounded-lg bg-accent px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                      Expulsar
                    </button>
                    <button onClick={handleBan} className="rounded-lg bg-destructive/10 px-2 py-1 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors">
                      <Ban className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-3">
          {chatRoom.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Aún no hay mensajes</p>
              <p className="mt-1 text-xs text-muted-foreground">Sé el primero en escribir en este chat</p>
            </div>
          )}
          {chatRoom.messages.map((msg) => {
            if (msg.isAnnouncement) {
              return (
                <div key={msg.id} className="w-full">
                  <ChatRichMessage message={msg} onEventClick={onEventClick} />
                  <p className="mt-1 text-[10px] text-muted-foreground text-right">{msg.timestamp}</p>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                onContextMenu={isReadOnly ? undefined : (e) => handleContextMenu(e, msg)}
                className={cn('flex items-end gap-2', msg.isOwn ? 'flex-row-reverse' : 'flex-row')}
              >
                {!msg.isOwn && (
                  <div className="flex flex-col items-center shrink-0">
                    <Avatar className="h-9 w-9">
                      {msg.senderAvatar ? (
                        <AvatarImage src={msg.senderAvatar} alt={msg.senderName} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-accent text-[10px] font-semibold text-accent-foreground">
                        {msg.senderInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="mt-0.5 text-[9px] text-muted-foreground max-w-[40px] truncate">{msg.senderName}</span>
                  </div>
                )}
                <div className={cn(
                  'max-w-[85%] min-w-0 rounded-2xl px-4 py-3 shadow-sm',
                  msg.isOwn ? 'bg-primary/20 rounded-br-md' : 'bg-card rounded-bl-md',
                )}>
                  {msg.isOwn && (
                    <p className="text-[10px] font-semibold text-primary mb-0.5">{msg.senderName}</p>
                  )}
                  <ChatRichMessage message={msg} onEventClick={onEventClick} />
                  <p className="mt-1 text-[10px] text-muted-foreground text-right">{msg.timestamp}</p>
                </div>
                {msg.isOwn && (
                  <div className="flex flex-col items-center shrink-0">
                    <Avatar className="h-9 w-9">
                      {msg.senderAvatar ? (
                        <AvatarImage src={msg.senderAvatar} alt={msg.senderName} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-primary/20 text-[10px] font-semibold text-primary">
                        {msg.senderInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="mt-0.5 text-[9px] text-muted-foreground">{msg.senderName}</span>
                  </div>
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
        <ChatComposeBar
          value={newMessage}
          onChange={setNewMessage}
          onSend={handleSend}
          sending={sending}
          canMessage={canMessage}
          canBroadcast={canBroadcast}
          onAnnouncement={canBroadcast ? handleAnnouncement : undefined}
          onShareLocation={onShareLocation}
          onShareEvent={onShareEvent}
          onMediaPick={onMediaPick}
          editingMessage={editingMessage}
          onCancelEdit={() => { setEditingMessage(null); setNewMessage(''); }}
        />
      )}

      {/* Context menu */}
      {contextMenu && !isReadOnly && (
        <MessageContextMenu
          message={contextMenu.message}
          position={contextMenu.position}
          isAdmin={currentUserIsAdmin}
          canModerate={canModerate}
          onClose={() => setContextMenu(null)}
          onReply={() => { setNewMessage(`> ${contextMenu.message.senderName}: ${contextMenu.message.text}\n`); inputRef.current?.focus(); setContextMenu(null); }}
          onCopy={handleCopy}
          onEdit={handleEdit}
          onDelete={handleDelete}
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
        />
      )}
    </div>
  );
};

export default ChatRoomView;
