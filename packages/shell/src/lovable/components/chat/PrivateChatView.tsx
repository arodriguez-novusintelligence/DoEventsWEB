import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, MessageSquare } from 'lucide-react';
import ChatRichMessage from './ChatRichMessage';
import ChatComposeBar from './ChatComposeBar';
import { attendeesToMentionMembers } from './ChatMemberMentionAutocomplete';
import { ChatMessageActionsPopover, ChatMessageContextMenu } from './ChatMessageActionsMenu';
import ChatMessageReactions from './ChatMessageReactions';
import { Avatar, AvatarFallback } from '@lovable/components/ui/avatar';
import { StoryAvatar } from '../../../components/StoryAvatar';
import { useActiveStoryAuthors } from '../../../contexts/StoriesContext';
import type { PrivateChat, ChatMessage } from '@lovable/data/chatData';
import { cn } from '@lovable/lib/utils';
import { toast } from 'sonner';

interface PrivateChatViewProps {
  chat: PrivateChat;
  onBack: () => void;
  onUpdateMessages?: (chatId: string, messages: ChatMessage[]) => void;
  onSendMessage?: (text: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onReportMessage?: (messageId: string) => void;
  onReactMessage?: (messageId: string, emoji: string) => void;
  onMediaPick?: (file: File) => void;
  onShareLocation?: () => void;
  onShareEvent?: () => void;
  onEventClick?: (eventId: string) => void;
  currentUserId?: string;
  sending?: boolean;
  canMessage?: boolean;
  onOpenStory?: (userId: string) => void;
  onOpenUserProfile?: (userId: string) => void;
  onCreateStory?: () => void;
}

const PrivateChatView = ({
  chat,
  onBack,
  onUpdateMessages,
  onSendMessage,
  onDeleteMessage,
  onReportMessage,
  onReactMessage,
  onMediaPick,
  onShareLocation,
  onShareEvent,
  onEventClick,
  currentUserId,
  sending = false,
  canMessage = true,
  onOpenStory,
  onOpenUserProfile,
  onCreateStory,
}: PrivateChatViewProps) => {
  const { hasActiveStory } = useActiveStoryAuthors();
  const peerId = chat.user.id;
  const storyActive = Boolean(peerId && hasActiveStory(peerId));
  const isOwnPeer = Boolean(currentUserId && peerId === currentUserId);

  const openPeerProfile = () => {
    if (!peerId) return;
    onOpenUserProfile?.(peerId);
  };

  const handlePeerAvatarClick = () => {
    if (!peerId) return;
    if (storyActive) {
      onOpenStory?.(peerId);
      return;
    }
    if (!isOwnPeer) openPeerProfile();
  };

  const handlePeerNameClick = () => {
    openPeerProfile();
  };
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ message: ChatMessage; position: { x: number; y: number } } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenu]);

  const handleSend = () => {
    const text = newMessage.trim();
    if (!text || !canMessage) return;
    if (onSendMessage) {
      onSendMessage(text);
      setEditingMessage(null);
      setNewMessage('');
      return;
    }
    if (!onUpdateMessages) return;
    if (editingMessage) {
      const updated = chat.messages.map((m) => (m.id === editingMessage ? { ...m, text } : m));
      onUpdateMessages(chat.id, updated);
      setEditingMessage(null);
    } else {
      const msg: ChatMessage = {
        id: `dm-${Date.now()}`,
        senderId: 'me',
        senderName: 'Tú',
        senderInitials: 'TU',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
      };
      onUpdateMessages(chat.id, [...chat.messages, msg]);
    }
    setNewMessage('');
  };

  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent, message: ChatMessage) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setContextMenu({ message, position: { x: clientX, y: clientY } });
  };

  const buildMessageActions = (message: ChatMessage) => ({
    message,
    showKickUser: false,
    onReply: () => {
      setNewMessage(`> ${message.senderName}: ${message.text}\n`);
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
      if (onDeleteMessage) {
        onDeleteMessage(message.id);
      } else if (onUpdateMessages) {
        onUpdateMessages(chat.id, chat.messages.filter((m) => m.id !== message.id));
      }
      toast('Mensaje eliminado');
    },
    onReport: () => {
      if (onReportMessage) onReportMessage(message.id);
      else toast('Reporte no disponible');
    },
    onReact: onReactMessage
      ? (emoji: string) => onReactMessage(message.id, emoji)
      : undefined,
    onClose: () => undefined,
  });

  return (
    <div className="flex h-[100dvh] w-full min-w-0 flex-col overflow-hidden bg-secondary">
      {/* Top bar */}
      <div className="shrink-0 z-20 border-b border-border bg-card px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-primary">
            <ChevronLeft className="h-5 w-5" />
            Volver
          </button>
          <StoryAvatar
            userId={peerId}
            name={chat.user.name}
            imageUrl={chat.user.avatar}
            size={40}
            isOwn={isOwnPeer}
            isOnline={chat.user.isOnline}
            showOnlineStatus
            onCreateStory={isOwnPeer ? onCreateStory : undefined}
            onClick={handlePeerAvatarClick}
          />
          <div className="min-w-0">
            <button
              type="button"
              onClick={handlePeerNameClick}
              className="block w-full text-left"
              title={storyActive ? 'Ver historia' : 'Ver perfil'}
            >
              <h2 className="text-base font-bold text-foreground truncate hover:underline">{chat.user.name}</h2>
            </button>
            <div className="flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', chat.user.isOnline ? 'bg-success animate-pulse' : 'bg-muted-foreground/50')} />
              <span className="text-xs text-muted-foreground">
                {chat.user.isOnline ? 'En línea' : 'Desconectado'}
              </span>
              {storyActive && (
                <span className="text-[10px] font-semibold text-fuchsia-600">Historia</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="mx-auto w-full max-w-lg flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-2">
        <div className="space-y-3">
          {chat.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <MessageSquare className="h-7 w-7 text-primary" />
              </div>
              <Avatar className="h-16 w-16 mb-3">
                <AvatarFallback className="bg-accent text-accent-foreground text-lg font-bold">
                  {chat.user.initials}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold text-foreground">{chat.user.name}</p>
              <p className="text-xs text-muted-foreground mt-1">Envía el primer mensaje</p>
            </div>
          )}

          {chat.messages.map((msg) => (
            <div
              key={msg.id}
              onContextMenu={(e) => handleContextMenu(e, msg)}
              className={cn('flex items-end gap-2', msg.isOwn ? 'flex-row-reverse' : 'flex-row')}
            >
              {!msg.isOwn ? (
                <div className="flex flex-col items-center shrink-0">
                  <StoryAvatar
                    userId={msg.senderId}
                    name={msg.senderName}
                    imageUrl={msg.senderAvatar}
                    size={36}
                    onClick={() => {
                      if (!msg.senderId) return;
                      if (hasActiveStory(msg.senderId)) onOpenStory?.(msg.senderId);
                      else onOpenUserProfile?.(msg.senderId);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => msg.senderId && onOpenUserProfile?.(msg.senderId)}
                    className="mt-0.5 max-w-[56px] truncate text-[9px] text-primary hover:underline"
                    title="Ver perfil"
                  >
                    {msg.senderName}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center shrink-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-semibold">
                      {msg.senderInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="mt-0.5 text-[9px] text-muted-foreground max-w-[40px] truncate">{msg.senderName}</span>
                </div>
              )}
              <div className={cn('flex max-w-[70%] flex-col', msg.isOwn ? 'items-end' : 'items-start')}>
                <div
                  className={cn(
                    'w-full rounded-2xl px-4 py-3 shadow-sm',
                    msg.isOwn ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card rounded-bl-sm',
                  )}
                  onDoubleClick={onReactMessage ? () => onReactMessage(msg.id, '👍') : undefined}
                >
                  <ChatRichMessage
                    message={msg}
                    onEventClick={onEventClick}
                    onMentionClick={(handle) => {
                      const normalized = handle.replace(/^@/, '').toLowerCase();
                      const u = chat.user;
                      const mHandle = String(u.username || u.name || '')
                        .replace(/^@/, '')
                        .replace(/\s+/g, '')
                        .toLowerCase();
                      if ((mHandle === normalized || u.name.toLowerCase() === normalized) && onOpenUserProfile) {
                        onOpenUserProfile(u.id);
                        return;
                      }
                      toast(`@${handle}`);
                    }}
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground text-right">{msg.timestamp}</p>
                </div>
                <ChatMessageReactions
                  message={msg}
                  currentUserId={currentUserId}
                  align={msg.isOwn ? 'end' : 'start'}
                  onReact={onReactMessage}
                />
              </div>
              <ChatMessageActionsPopover
                {...buildMessageActions(msg)}
                align={msg.isOwn ? 'end' : 'start'}
              />
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <ChatComposeBar
        value={newMessage}
        onChange={setNewMessage}
        onSend={handleSend}
        sending={sending}
        canMessage={canMessage}
        onShareLocation={onShareLocation}
        onShareEvent={onShareEvent}
        onMediaPick={onMediaPick}
        editingMessage={editingMessage}
        onCancelEdit={() => { setEditingMessage(null); setNewMessage(''); }}
        mentionMembers={attendeesToMentionMembers([chat.user])}
        currentUserId={currentUserId}
      />

      {/* Context menu */}
      {contextMenu && (
        <ChatMessageContextMenu
          {...buildMessageActions(contextMenu.message)}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onReply={() => {
            setNewMessage(`> ${contextMenu.message.senderName}: ${contextMenu.message.text}\n`);
            inputRef.current?.focus();
            setContextMenu(null);
          }}
          onCopy={() => {
            navigator.clipboard.writeText(contextMenu.message.text);
            toast('Texto copiado');
            setContextMenu(null);
          }}
          onEdit={() => {
            setEditingMessage(contextMenu.message.id);
            setNewMessage(contextMenu.message.text);
            inputRef.current?.focus();
            setContextMenu(null);
          }}
          onDelete={() => {
            if (onDeleteMessage) {
              onDeleteMessage(contextMenu.message.id);
            } else if (onUpdateMessages) {
              onUpdateMessages(chat.id, chat.messages.filter((m) => m.id !== contextMenu.message.id));
            }
            toast('Mensaje eliminado');
            setContextMenu(null);
          }}
          onReport={() => {
            if (onReportMessage) onReportMessage(contextMenu.message.id);
            else toast('Reporte no disponible');
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

export default PrivateChatView;
