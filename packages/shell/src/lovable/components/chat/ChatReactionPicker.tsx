import { CHAT_QUICK_REACTIONS } from '@doevents/shared';
import { cn } from '@lovable/lib/utils';

interface ChatReactionPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

const ChatReactionPicker = ({ onSelect, className }: ChatReactionPickerProps) => (
  <div className={cn('flex flex-wrap gap-1 rounded-xl bg-secondary/80 p-2', className)}>
    {CHAT_QUICK_REACTIONS.map((emoji) => (
      <button
        key={emoji}
        type="button"
        onClick={() => onSelect(emoji)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-xl transition hover:bg-accent"
        title={`Reaccionar con ${emoji}`}
      >
        {emoji}
      </button>
    ))}
  </div>
);

export default ChatReactionPicker;
