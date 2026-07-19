import {
  groupChatReactions,
  resolveUserChatReaction,
} from '@doevents/shared';
import type { ChatMessage } from '@lovable/data/chatData';
import { cn } from '@lovable/lib/utils';

interface ChatMessageReactionsProps {
  message: ChatMessage;
  currentUserId?: string;
  disabled?: boolean;
  align?: 'start' | 'end';
  onReact?: (messageId: string, emoji: string) => void;
}

const ChatMessageReactions = ({
  message,
  currentUserId,
  disabled = false,
  align = 'start',
  onReact,
}: ChatMessageReactionsProps) => {
  const groups = groupChatReactions(message.reactions);
  if (!groups.length) return null;

  const handleReact = (emoji: string) => {
    if (disabled || !onReact) return;
    onReact(message.id, emoji);
  };

  return (
    <div className={cn('mt-1 flex flex-wrap gap-1', align === 'end' ? 'justify-end' : 'justify-start')}>
      {groups.map((group) => {
        const isOwn = Boolean(currentUserId && group.userIds.includes(currentUserId));
        return (
          <button
            key={`${message.id}-${group.emoji}`}
            type="button"
            disabled={disabled || !onReact}
            onClick={() => handleReact(group.emoji)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs shadow-sm transition',
              isOwn
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border bg-card text-foreground hover:bg-accent',
              !disabled && onReact && 'cursor-pointer',
            )}
            title={isOwn ? 'Quitar reacción' : 'Reaccionar con este emoji'}
          >
            <span>{group.emoji}</span>
            <span className="font-semibold">{group.userIds.length}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ChatMessageReactions;
