import { Loader } from '@doevents/shared';
import type { ChatSharedEvent } from '@doevents/shared';
import { SafeImage, resolveEventImageUrl } from '@doevents/shared';
import { X, CalendarDays } from 'lucide-react';

interface Props {
  open: boolean;
  loading?: boolean;
  events: ChatSharedEvent[];
  onClose: () => void;
  onSelect: (event: ChatSharedEvent) => void;
}

const ChatEventPickerSheet = ({ open, loading, events, onClose, onSelect }: Props) => {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9990] bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[9991] mx-auto max-h-[70vh] max-w-lg overflow-hidden rounded-t-3xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-base font-bold text-foreground">Compartir evento</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 pb-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader />
            </div>
          ) : events.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No hay eventos disponibles</p>
          ) : (
            <div className="space-y-2">
              {events.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onSelect(ev)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-secondary p-3 text-left transition-colors hover:bg-accent"
                >
                  {ev.image ? (
                    <SafeImage
                      src={resolveEventImageUrl(ev.image)}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <CalendarDays className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground line-clamp-2">{ev.name}</p>
                    {ev.date && <p className="text-xs text-muted-foreground mt-0.5">{ev.date}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatEventPickerSheet;
