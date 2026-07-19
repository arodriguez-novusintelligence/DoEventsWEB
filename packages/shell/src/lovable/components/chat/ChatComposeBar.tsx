import { useCallback, useRef, useState } from 'react';
import {
  Send, Plus, X, Image, Video, Paperclip, MapPin, CalendarDays, Megaphone,
} from 'lucide-react';
import { cn } from '@lovable/lib/utils';
import ChatMemberMentionAutocomplete, {
  resolveChatMentionHandle,
  type ChatMentionMember,
} from './ChatMemberMentionAutocomplete';

export interface ChatComposeBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
  canMessage?: boolean;
  canBroadcast?: boolean;
  onAnnouncement?: () => void;
  onShareLocation?: () => void;
  onShareEvent?: () => void;
  onMediaPick?: (file: File) => void;
  editingMessage?: string | null;
  onCancelEdit?: () => void;
  placeholder?: string;
  /** Integrantes del chatroom disponibles para @mención */
  mentionMembers?: ChatMentionMember[];
  currentUserId?: string;
}

const ChatComposeBar = ({
  value,
  onChange,
  onSend,
  sending = false,
  canMessage = true,
  canBroadcast = false,
  onAnnouncement,
  onShareLocation,
  onShareEvent,
  onMediaPick,
  editingMessage,
  onCancelEdit,
  placeholder = 'Escribe tu mensaje...',
  mentionMembers = [],
  currentUserId,
}: ChatComposeBarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionActive, setMentionActive] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const syncCursor = () => {
    const el = inputRef.current;
    if (!el) return;
    setCursorPosition(el.selectionStart ?? el.value.length);
  };

  const handleSelectMention = useCallback((
    member: ChatMentionMember,
    mentionStart: number,
    mentionEnd: number,
  ) => {
    const handle = resolveChatMentionHandle(member);
    const before = value.slice(0, mentionStart);
    const after = value.slice(mentionEnd);
    const next = `${before}@${handle} ${after.replace(/^\s*/, '')}`;
    onChange(next);
    setMentionActive(false);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      const pos = before.length + handle.length + 2; // @handle + space
      el.focus();
      el.setSelectionRange(pos, pos);
      setCursorPosition(pos);
    });
  }, [onChange, value]);

  const handleFile = (file: File | undefined) => {
    if (!file || !onMediaPick) return;
    onMediaPick(file);
    setMenuOpen(false);
  };

  const attachItems = [
    { label: 'Foto', icon: Image, accept: 'image/*', ref: photoRef },
    { label: 'Video', icon: Video, accept: 'video/*', ref: videoRef },
    { label: 'Archivo', icon: Paperclip, accept: '*/*', ref: fileRef },
    { label: 'Ubicación', icon: MapPin, action: onShareLocation },
    { label: 'Evento', icon: CalendarDays, action: onShareEvent },
  ];

  return (
    <div className="shrink-0 z-20 border-t border-border bg-card px-4 py-3 safe-area-bottom">
      <div className="relative mx-auto w-full max-w-lg">
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
            <div className="absolute bottom-full left-0 z-40 mb-2 w-full rounded-2xl border border-border bg-card p-2 shadow-xl">
              <div className="grid grid-cols-3 gap-1">
                {attachItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    disabled={!canMessage || sending}
                    onClick={() => {
                      if (item.action) {
                        item.action();
                        setMenuOpen(false);
                        return;
                      }
                      item.ref.current?.click();
                    }}
                    className="flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-40"
                  >
                    <item.icon className="h-5 w-5 text-primary" />
                    {item.label}
                  </button>
                ))}
                {canBroadcast && onAnnouncement && (
                  <button
                    type="button"
                    disabled={!canMessage || sending}
                    onClick={() => { onAnnouncement(); setMenuOpen(false); }}
                    className="flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-40"
                  >
                    <Megaphone className="h-5 w-5 text-primary" />
                    Anuncio
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <input
          ref={videoRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {mentionMembers.length > 0 && (
          <ChatMemberMentionAutocomplete
            inputValue={value}
            cursorPosition={cursorPosition}
            members={mentionMembers}
            currentUserId={currentUserId}
            onSelect={handleSelectMention}
            onActiveChange={setMentionActive}
          />
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canMessage}
            onClick={() => setMenuOpen((o) => !o)}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary transition-transform hover:scale-105 disabled:opacity-40',
              menuOpen && 'ring-2 ring-primary/30',
            )}
          >
            <Plus className="h-5 w-5" />
          </button>

          {editingMessage && onCancelEdit && (
            <button type="button" onClick={onCancelEdit} className="shrink-0 text-muted-foreground">
              <X className="h-5 w-5" />
            </button>
          )}

          <input
            ref={inputRef}
            type="text"
            placeholder={editingMessage ? 'Editando mensaje...' : placeholder}
            value={value}
            disabled={!canMessage || sending}
            onChange={(e) => {
              onChange(e.target.value);
              setCursorPosition(e.target.selectionStart ?? e.target.value.length);
            }}
            onClick={syncCursor}
            onKeyUp={syncCursor}
            onSelect={syncCursor}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (mentionActive) {
                  // El autocomplete captura Enter (ventana, capture)
                  e.preventDefault();
                  return;
                }
                e.preventDefault();
                onSend();
              }
            }}
            className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />

          <button
            type="button"
            onClick={onSend}
            disabled={!value.trim() || !canMessage || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatComposeBar;
