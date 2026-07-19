import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback } from '@lovable/components/ui/avatar';
import { cn } from '@lovable/lib/utils';
import { searchUsers, type SearchUserResult } from '@doevents/shared';

interface UserMentionAutocompleteProps {
  inputValue: string;
  cursorPosition: number;
  onSelect: (user: SearchUserResult, mentionStart: number, mentionEnd: number) => void;
  anchorRef: React.RefObject<HTMLTextAreaElement | null>;
}

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'DE';
}

function resolveHandle(user: SearchUserResult): string {
  const label = user.name || user.nombreCompleto || user.username || user.user || 'usuario';
  const handleRaw = (user.username || user.user || label).replace(/^@/, '').trim();
  if (handleRaw.includes(' ')) {
    return label.replace(/\s+/g, '');
  }
  return handleRaw;
}

const UserMentionAutocomplete = ({
  inputValue,
  cursorPosition,
  onSelect,
  anchorRef,
}: UserMentionAutocompleteProps) => {
  const [visible, setVisible] = useState(false);
  const [results, setResults] = useState<SearchUserResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const textBefore = inputValue.slice(0, cursorPosition);
    const match = textBefore.match(/(^|[^\wáéíóúñüÁÉÍÓÚÑÜ])@([\wáéíóúñüÁÉÍÓÚÑÜ\- ]*)$/i);
    if (!match) {
      setVisible(false);
      setMentionStart(-1);
      setResults([]);
      return;
    }

    const start = textBefore.lastIndexOf('@');
    const query = match[2].trim();
    setMentionStart(start);

    if (!query) {
      setVisible(false);
      setResults([]);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const users = await searchUsers(query);
        setResults(users.slice(0, 6));
        setSelectedIndex(0);
        setVisible(users.length > 0);
      } catch {
        setResults([]);
        setVisible(false);
      }
    }, 220);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [inputValue, cursorPosition]);

  const handleSelect = (user: SearchUserResult) => {
    if (mentionStart < 0) return;
    onSelect(user, mentionStart, cursorPosition);
    setVisible(false);
    setResults([]);
  };

  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visible || !results.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + results.length) % results.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (results[selectedIndex]) {
          e.preventDefault();
          handleSelect(results[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setVisible(false);
      }
    };

    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [anchorRef, visible, results, selectedIndex, mentionStart, cursorPosition]);

  if (!visible || !results.length || mentionStart < 0) return null;

  return (
    <div
      className="absolute left-0 right-0 z-50 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
      style={{ bottom: '100%', marginBottom: 4 }}
    >
      <div className="max-h-48 overflow-y-auto py-1">
        {results.map((user, i) => {
          const label = user.name || user.nombreCompleto || user.username || user.user || 'Usuario';
          const handle = resolveHandle(user);
          return (
            <button
              key={user.id || handle}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(user);
              }}
              className={cn(
                'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                i === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initialsFromName(label)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">@{handle}</p>
                <p className="truncate text-xs text-muted-foreground">{label}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default UserMentionAutocomplete;
