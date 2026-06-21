import { Fragment } from 'react';
import { cn } from '@lovable/lib/utils';

interface MentionTextProps {
  text: string;
  className?: string;
  onMentionClick?: (mention: string) => void;
}

/**
 * Parses text for @mentions and renders them as clickable, highlighted spans.
 * Supports @username and @event_name patterns (with underscores or hyphens).
 */
const MentionText = ({ text, className, onMentionClick }: MentionTextProps) => {
  // Match @word patterns (letters, numbers, underscores, hyphens, accented chars)
  const mentionRegex = /(@[\wáéíóúñüÁÉÍÓÚÑÜ][\wáéíóúñüÁÉÍÓÚÑÜ\-]*)/gi;

  const parts = text.split(mentionRegex);

  if (parts.length === 1) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (mentionRegex.test(part)) {
          // Reset regex lastIndex after test
          mentionRegex.lastIndex = 0;
          const mention = part.slice(1); // Remove @
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMentionClick?.(mention);
              }}
              className={cn(
                'inline font-semibold text-primary hover:text-primary/90 hover:underline cursor-pointer',
              )}
            >
              {part}
            </button>
          );
        }
        // Reset regex lastIndex
        mentionRegex.lastIndex = 0;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </span>
  );
};

export default MentionText;
