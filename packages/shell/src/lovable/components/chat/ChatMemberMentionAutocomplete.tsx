import { useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';
import { cn } from '@lovable/lib/utils';
import type { ChatAttendee } from '@lovable/data/chatData';

export interface ChatMentionMember {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  initials?: string;
}

interface ChatMemberMentionAutocompleteProps {
  inputValue: string;
  cursorPosition: number;
  members: ChatMentionMember[];
  currentUserId?: string;
  onSelect: (member: ChatMentionMember, mentionStart: number, mentionEnd: number) => void;
  onActiveChange?: (active: boolean) => void;
}

export function resolveChatMentionHandle(member: ChatMentionMember): string {
  const raw = String(member.username || member.name || 'usuario')
    .replace(/^@/, '')
    .trim();
  if (!raw) return 'usuario';
  if (/\s/.test(raw)) return raw.replace(/\s+/g, '');
  return raw;
}

function initialsFromName(name: string, fallback?: string): string {
  if (fallback?.trim()) return fallback.trim().slice(0, 2).toUpperCase();
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'DE';
}

export function attendeesToMentionMembers(attendees: ChatAttendee[]): ChatMentionMember[] {
  return (attendees || []).map((att) => ({
    id: att.id,
    name: att.name,
    username: att.username,
    avatar: att.avatar,
    initials: att.initials,
  }));
}

const ChatMemberMentionAutocomplete = ({
  inputValue,
  cursorPosition,
  members,
  currentUserId,
  onSelect,
  onActiveChange,
}: ChatMemberMentionAutocompleteProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const mentionState = useMemo(() => {
    const textBefore = inputValue.slice(0, cursorPosition);
    const match = textBefore.match(/(^|[^\wáéíóúñüÁÉÍÓÚÑÜ])@([\wáéíóúñüÁÉÍÓÚÑÜ\-]*)$/i);
    if (!match) return null;
    const start = textBefore.lastIndexOf('@');
    const query = String(match[2] || '').trim().toLowerCase();
    return { start, query };
  }, [inputValue, cursorPosition]);

  const results = useMemo(() => {
    if (!mentionState) return [];
    const q = mentionState.query;
    return members
      .filter((m) => {
        if (!m?.id) return false;
        if (currentUserId && String(m.id) === String(currentUserId)) return false;
        const handle = resolveChatMentionHandle(m).toLowerCase();
        const name = String(m.name || '').toLowerCase();
        if (!q) return true;
        return handle.includes(q) || name.includes(q) || name.replace(/\s+/g, '').includes(q);
      })
      .slice(0, 8);
  }, [mentionState, members, currentUserId]);

  const visible = Boolean(mentionState && results.length > 0);

  useEffect(() => {
    onActiveChange?.(visible);
  }, [visible, onActiveChange]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [mentionState?.query, results.length]);

  useEffect(() => {
    if (!visible) return undefined;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => (i + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => (i - 1 + results.length) % results.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        const picked = results[selectedIndex];
        if (picked && mentionState) {
          e.preventDefault();
          e.stopPropagation();
          onSelect(picked, mentionState.start, cursorPosition);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onActiveChange?.(false);
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [visible, results, selectedIndex, mentionState, cursorPosition, onSelect, onActiveChange]);

  if (!visible || !mentionState) return null;

  return (
    <div
      className="absolute left-0 right-0 z-50 overflow-hidden rounded-2xl border border-border bg-popover shadow-lg"
      style={{ bottom: '100%', marginBottom: 8 }}
      role="listbox"
      aria-label="Mencionar integrante"
    >
      <div className="border-b border-border px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Mencionar en el chat
        </p>
      </div>
      <div className="max-h-52 overflow-y-auto py-1">
        {results.map((member, i) => {
          const handle = resolveChatMentionHandle(member);
          return (
            <button
              key={member.id || handle}
              type="button"
              role="option"
              aria-selected={i === selectedIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(member, mentionState.start, cursorPosition);
              }}
              className={cn(
                'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                i === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
              )}
            >
              <Avatar className="h-8 w-8">
                {member.avatar ? <AvatarImage src={member.avatar} alt="" /> : null}
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initialsFromName(member.name, member.initials)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">@{handle}</p>
                <p className="truncate text-xs text-muted-foreground">{member.name}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChatMemberMentionAutocomplete;
