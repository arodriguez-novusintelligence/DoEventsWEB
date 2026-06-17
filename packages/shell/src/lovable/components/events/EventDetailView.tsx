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
