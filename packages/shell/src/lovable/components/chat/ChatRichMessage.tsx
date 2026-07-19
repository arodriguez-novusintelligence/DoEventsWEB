import { MapPin, FileText, CalendarDays, Megaphone } from 'lucide-react';
import { SafeImage } from '@doevents/shared';
import { resolveEventImageUrl } from '@doevents/shared';
import type { ChatMessage } from '@lovable/data/chatData';
import { cn } from '@lovable/lib/utils';
import MentionText from '../feed/MentionText';

interface Props {
  message: ChatMessage;
  onEventClick?: (eventId: string) => void;
  onMentionClick?: (mention: string) => void;
}

const ChatRichMessage = ({ message, onEventClick, onMentionClick }: Props) => {
  if (message.isAnnouncement) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="mb-1 flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-primary">Recordatorio</span>
        </div>
        <MentionText
          text={message.text}
          onMentionClick={onMentionClick}
          className="text-sm text-foreground break-words [overflow-wrap:anywhere]"
        />
      </div>
    );
  }

  if (message.messageType === 'image' || message.messageType === 'image-gif') {
    return (
      <img
        src={message.mediaUrl || message.image}
        alt={message.messageType === 'image-gif' ? 'GIF' : 'Imagen'}
        className="max-w-full rounded-xl object-cover"
        loading="lazy"
      />
    );
  }

  if (message.messageType === 'video' && message.mediaUrl) {
    return (
      <video
        controls
        playsInline
        preload="metadata"
        src={message.mediaUrl}
        className="max-w-full rounded-xl"
      />
    );
  }

  if (message.messageType === 'file' && message.mediaUrl) {
    return (
      <a
        href={message.mediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm font-medium text-primary"
      >
        <FileText className="h-4 w-4 shrink-0" />
        <span className="truncate">{message.text || 'Archivo'}</span>
      </a>
    );
  }

  if (message.messageType === 'location' && message.location) {
    const { lat, lng, label } = message.location;
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    return (
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5"
      >
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{label || 'Ubicación'}</p>
          <p className="text-xs text-primary">Ver en mapa</p>
        </div>
      </a>
    );
  }

  if (message.messageType === 'event-share' && message.sharedEvent?.id) {
    const ev = message.sharedEvent;
    return (
      <button
        type="button"
        onClick={() => onEventClick?.(ev.id!)}
        className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-2 text-left"
      >
        {ev.image ? (
          <SafeImage
            src={resolveEventImageUrl(ev.image)}
            alt=""
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xl">
            🎫
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground line-clamp-2">{ev.name || 'Evento'}</p>
          {ev.date && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              {ev.date}
            </p>
          )}
        </div>
      </button>
    );
  }

  return (
    <MentionText
      text={message.text}
      onMentionClick={onMentionClick}
      className={cn('text-sm text-foreground whitespace-pre-wrap break-words [overflow-wrap:anywhere]')}
    />
  );
};

export default ChatRichMessage;
