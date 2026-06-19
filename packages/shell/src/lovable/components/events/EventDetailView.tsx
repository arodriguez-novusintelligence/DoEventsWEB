import { AlertCircle } from 'lucide-react';
import InvitationEventDetailView from '@lovable/components/invitations/InvitationEventDetailView';
import type { InvitationEvent } from '@lovable/data/invitationsData';

interface BasicEvent {
  id?: string;
  title: string;
  image: string;
  date?: string;
  location?: string;
  description?: string;
}

interface Props {
  event: BasicEvent;
  onBack: () => void;
  onSuccess?: () => void;
  onPurchaseStart?: () => void;
  onPurchaseEnd?: () => void;
}

const emptyPerson = {
  name: '—',
  avatar: '',
  rating: 0,
  eventsCount: 0,
  experiencePct: 0,
};

function buildInvitationEvent(event: BasicEvent): InvitationEvent {
  const image = event.image || '';
  return {
    id: event.id || '',
    title: event.title || 'Evento',
    receivedAt: new Date().toISOString(),
    inviter: '',
    status: 'aceptada',
    image,
    images: image ? [image] : [],
    state: 'activo',
    startDate: event.date || '—',
    endDate: event.date || '—',
    startTime: '—',
    endTime: '—',
    category: '—',
    eventClass: '—',
    capacity: 0,
    venueType: '—',
    description: event.description || '',
    agenda: [],
    venue: {
      name: event.location || 'Lugar del evento',
      address: event.location || '—',
      images: [],
    },
    organizer: emptyPerson,
    host: emptyPerson,
    refundPolicy: '',
  };
}

const EventDetailView = ({ event, onBack, onSuccess, onPurchaseStart, onPurchaseEnd }: Props) => {
  if (!event.id) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <AlertCircle className="h-7 w-7 text-primary" />
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
    );
  }

  return (
    <InvitationEventDetailView
      event={buildInvitationEvent(event)}
      onBack={onBack}
      onSuccess={onSuccess}
      onPurchaseStart={onPurchaseStart}
      onPurchaseEnd={onPurchaseEnd}
    />
  );
};

export default EventDetailView;
