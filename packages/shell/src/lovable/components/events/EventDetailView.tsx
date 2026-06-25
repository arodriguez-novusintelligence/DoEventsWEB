import { AlertCircle, CalendarDays, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import InvitationEventDetailView from '@lovable/components/invitations/InvitationEventDetailView';
import { useInvitationEventDetail } from '../../../lovable-bridge/useInvitationEventDetail';

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
  const { loading, invitationEvent, error, reload } = useInvitationEventDetail(resolvedId);

  if (!resolvedId) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-10 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CalendarDays className="h-7 w-7 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">Evento no disponible</p>
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando evento…</p>
      </div>
    );
  }

  if (error || !invitationEvent) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm font-semibold text-foreground">No se pudo cargar el evento</p>
        <p className="text-xs text-muted-foreground max-w-[260px]">{error || 'Intenta de nuevo más tarde.'}</p>
        <Button type="button" variant="outline" className="mt-1 rounded-full gap-1.5" onClick={reload}>
          <RefreshCw className="h-3.5 w-3.5" />
          Reintentar
        </Button>
        <Button type="button" className="rounded-full" onClick={onBack}>
          Volver
        </Button>
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
