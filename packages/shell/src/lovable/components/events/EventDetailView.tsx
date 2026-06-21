import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw, CalendarDays } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import {
  extractVenueImageUrls,
  fetchEventDetail,
  getVenueById,
  resolveImageUrl,
} from '@doevents/shared';
import InvitationEventDetailView from '@lovable/components/invitations/InvitationEventDetailView';
import type { InvitationEvent } from '@lovable/data/invitationsData';
import {
  eventDetailToInvitationEvent,
  type EventDetailViewOptions,
} from '../../../lovable-bridge/eventDetailAdapter';

interface BasicEvent {
  id?: string;
  title: string;
  image: string;
  date?: string;
  location?: string;
  description?: string;
}

interface Props {
  event?: BasicEvent;
  eventId?: string;
  onBack: () => void;
  onSuccess?: () => void;
  onPurchaseStart?: () => void;
  onPurchaseEnd?: () => void;
}

const EventDetailView = ({
  event,
  eventId,
  onBack,
  onSuccess,
  onPurchaseStart,
  onPurchaseEnd,
}: Props) => {
  const resolvedId = eventId || event?.id;
  const [loading, setLoading] = useState(Boolean(resolvedId));
  const [invitationEvent, setInvitationEvent] = useState<InvitationEvent | null>(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!resolvedId) {
      setLoading(false);
      setInvitationEvent(null);
      setError('');
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const detail = await fetchEventDetail(resolvedId);
        let venueOptions: EventDetailViewOptions['venue'];
        const venueId = detail?.event?.venueId;
        if (venueId) {
          try {
            const venue = await getVenueById(venueId);
            const images = extractVenueImageUrls(venue as Record<string, unknown>)
              .map((url) => resolveImageUrl(url) || url)
              .filter(Boolean);
            venueOptions = {
              name: venue.name,
              address: venue.address || undefined,
              images,
            };
          } catch {
            /* venue opcional */
          }
        }
        if (!cancelled) {
          setInvitationEvent(eventDetailToInvitationEvent(detail, venueOptions));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el evento');
          setInvitationEvent(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [resolvedId, reloadKey]);

  if (!resolvedId) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-10 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <CalendarDays className="h-7 w-7 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">Evento no disponible</p>
          <p className="text-xs text-muted-foreground max-w-[240px]">
            No se pudo cargar la información del evento.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6">
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-10 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando evento…</p>
        </div>
      </div>
    );
  }

  if (error || !invitationEvent) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-10 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <p className="text-sm font-semibold text-foreground">No se pudo cargar el evento</p>
          <p className="text-xs text-muted-foreground max-w-[260px]">
            {error || 'Intenta de nuevo más tarde.'}
          </p>
          <Button type="button" variant="outline" className="mt-1 rounded-full gap-1.5" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw className="h-3.5 w-3.5" />
            Reintentar
          </Button>
          <Button type="button" className="mt-2 rounded-full" onClick={onBack}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <InvitationEventDetailView
      event={invitationEvent}
      onBack={onBack}
      onSuccess={onSuccess}
      onPurchaseStart={onPurchaseStart}
      onPurchaseEnd={onPurchaseEnd}
    />
  );
};

export default EventDetailView;
