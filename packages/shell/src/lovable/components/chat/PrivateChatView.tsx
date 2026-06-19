import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, CornerUpLeft, Copy, Pencil, Trash2, X } from 'lucide-react';
import ChatRichMessage from './ChatRichMessage';
import ChatComposeBar from './ChatComposeBar';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';
import type { PrivateChat, ChatMessage } from '@lovable/data/chatData';
import { cn } from '@lovable/lib/utils';
import { toast } from 'sonner';

interface PrivateChatViewProps {
  chat: PrivateChat;
  onBack: () => void;
  onUpdateMessages?: (chatId: string, messages: ChatMessage[]) => void;
  onSendMessage?: (text: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onMediaPick?: (file: File) => void;
  onShareLocation?: () => void;
  onShareEvent?: () => void;
  onEventClick?: (eventId: string) => void;
  currentUserId?: string;
  sending?: boolean;
  canMessage?: boolean;
}

const PrivateChatView = ({
  chat,
  onBack,
  onUpdateMessages,
  onSendMessage,
  onDeleteMessage,
  onMediaPick,
  onShareLocation,
  onShareEvent,
  onEventClick,
  sending = false,
  canMessage = true,
}: PrivateChatViewProps) => {
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

  return (
    <div className="flex h-[100dvh] w-full min-w-0 flex-col overflow-hidden bg-secondary">
      {/* Top bar */}
      <div className="shrink-0 z-20 border-b border-border bg-card px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-primary">
            <ChevronLeft className="h-5 w-5" />
            Volver
          </button>
          <Avatar className="h-10 w-10 shrink-0">
            {chat.user.avatar ? (
              <AvatarImage src={chat.user.avatar} alt={chat.user.name} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-accent text-accent-foreground text-sm font-semibold">
              {chat.user.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground truncate">{chat.user.name}</h2>
            <div className="flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', chat.user.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/50')} />
              <span className="text-xs text-muted-foreground">
                {chat.user.isOnline ? 'En línea' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="mx-auto w-full max-w-lg flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-2">
        <div className="space-y-3">
          {chat.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
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
              <div className="flex flex-col items-center shrink-0">
                <Avatar className="h-9 w-9">
                  <AvatarFallback
                    className={cn(
                      'text-[10px] font-semibold',
                      msg.isOwn ? 'bg-primary/20 text-primary' : 'bg-accent text-accent-foreground'
                    )}
                  >
                    {msg.senderInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="mt-0.5 text-[9px] text-muted-foreground max-w-[40px] truncate">{msg.senderName}</span>
              </div>
              <div
                className={cn(
                  'max-w-[70%] rounded-2xl px-4 py-3 shadow-sm cursor-pointer',
                  msg.isOwn ? 'bg-primary/20 rounded-br-md' : 'bg-card rounded-bl-md'
                )}
                onClick={(e) => { e.stopPropagation(); }}
                onDoubleClick={(e) => handleContextMenu(e, msg)}
              >
                <ChatRichMessage message={msg} onEventClick={onEventClick} />
                <p className="mt-1 text-[10px] text-muted-foreground text-right">{msg.timestamp}</p>
              </div>
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
      />

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[200px] rounded-2xl border border-border bg-card p-2 shadow-xl"
          style={{
            top: contextMenu.position.y,
            left: Math.min(contextMenu.position.x, window.innerWidth - 220),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setNewMessage(`> ${contextMenu.message.senderName}: ${contextMenu.message.text}\n`);
              inputRef.current?.focus();
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-primary font-semibold hover:bg-accent"
          >
            <CornerUpLeft className="h-4 w-4" /> Responder
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(contextMenu.message.text);
              toast('Texto copiado');
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent"
          >
            <Copy className="h-4 w-4" /> Copiar selección
          </button>
          {contextMenu.message.isOwn && (
            <button
              onClick={() => {
                setEditingMessage(contextMenu.message.id);
                setNewMessage(contextMenu.message.text);
                inputRef.current?.focus();
                setContextMenu(null);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent"
            >
              <Pencil className="h-4 w-4" /> Editar
            </button>
          )}
          {contextMenu.message.isOwn && (
            <button
              onClick={() => {
                if (onDeleteMessage) {
                  onDeleteMessage(contextMenu.message.id);
                } else if (onUpdateMessages) {
                  onUpdateMessages(chat.id, chat.messages.filter((m) => m.id !== contextMenu.message.id));
                }
                toast('Mensaje eliminado');
                setContextMenu(null);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-accent"
            >
              <Trash2 className="h-4 w-4" /> Eliminar
            </button>
          )}
          <button
            onClick={() => setContextMenu(null)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" /> Cerrar
          </button>
        </div>
      )}
    </div>
  );
};

export default PrivateChatView;
