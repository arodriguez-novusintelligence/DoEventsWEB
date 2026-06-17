import { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback } from '@lovable/components/ui/avatar';
import { cn } from '@lovable/lib/utils';

export interface MentionOption {
  id: string;
  name: string;
  initials: string;
  type: 'user' | 'event';
}

interface MentionAutocompleteProps {
  options: MentionOption[];
  inputValue: string;
  cursorPosition: number;
  onSelect: (option: MentionOption, mentionStart: number, mentionEnd: number) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

const MentionAutocomplete = ({
  options,
  inputValue,
  cursorPosition,
  onSelect,
  anchorRef,
}: MentionAutocompleteProps) => {
  const [visible, setVisible] = useState(false);
  const [filtered, setFiltered] = useState<MentionOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const detectMention = useCallback(() => {
    const textBefore = inputValue.slice(0, cursorPosition);
    // Find last @ that isn't preceded by a word char
    const match = textBefore.match(/(^|[^\wáéíóúñüÁÉÍÓÚÑÜ])@([\wáéíóúñüÁÉÍÓÚÑÜ\- ]*)$/i);
    if (match) {
      const query = match[2].toLowerCase();
      const start = textBefore.lastIndexOf('@');
      const results = options.filter((o) =>
        o.name.toLowerCase().includes(query)
      ).slice(0, 6);
      setMentionStart(start);
      setFiltered(results);
      setVisible(results.length > 0);
      setSelectedIndex(0);
    } else {
      setVisible(false);
    }
  }, [inputValue, cursorPosition, options]);

  useEffect(() => {
    detectMention();
  }, [detectMention]);

  const handleSelect = (option: MentionOption) => {
    const mentionEnd = cursorPosition;
    onSelect(option, mentionStart, mentionEnd);
    setVisible(false);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!visible) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (filtered[selectedIndex]) {
          e.preventDefault();
          handleSelect(filtered[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setVisible(false);
      }
    },
    [visible, filtered, selectedIndex]
  );

  useEffect(() => {
    const el = anchorRef.current;
    if (el) {
      el.addEventListener('keydown', handleKeyDown as any);
      return () => el.removeEventListener('keydown', handleKeyDown as any);
    }
  }, [anchorRef, handleKeyDown]);

  if (!visible || filtered.length === 0) return null;

  return (
    <div
      ref={listRef}
      className="absolute left-0 right-0 z-50 rounded-lg border border-border bg-popover shadow-lg overflow-hidden"
      style={{ bottom: '100%', marginBottom: 4 }}
    >
      <div className="max-h-48 overflow-y-auto py-1">
        {filtered.map((option, i) => (
          <button
            key={option.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleSelect(option);
            }}
            className={cn(
              'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
              i === selectedIndex
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-muted'
            )}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {option.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {option.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {option.type === 'event' ? 'Evento' : 'Usuario'}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MentionAutocomplete;
