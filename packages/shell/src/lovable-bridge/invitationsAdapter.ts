import type { EventInvitation } from '@doevents/shared';
import { resolveEventImageUrl } from '@doevents/shared';
import type { InvitationEvent } from '@lovable/data/invitationsData';

function mapInvitationStatus(status?: string): InvitationEvent['status'] {
  const raw = String(status || 'pending').toLowerCase();
  if (raw === 'accepted' || raw === 'aceptada') return 'aceptada';
  if (raw === 'rejected' || raw === 'rechazada') return 'rechazada';
  return 'pendiente';
}

export function apiInvitationToLovable(inv: EventInvitation): InvitationEvent {
  const image = resolveEventImageUrl(inv.eventImageSigned || undefined) || '';
  return {
    id: inv.eventId || inv.invitationId || inv.id || '',
    title: inv.eventName || 'Evento',
    receivedAt: inv.createdAt || new Date().toISOString(),
    inviter: inv.invitedBy || 'Organizador',
    status: mapInvitationStatus(inv.status),
    image,
    images: image ? [image] : [],
    state: 'activo',
    startDate: '—',
    endDate: '—',
    startTime: '—',
    endTime: '—',
    category: '—',
    eventClass: '—',
    capacity: 0,
    venueType: '—',
    description: inv.message || '',
    agenda: [],
    venue: { name: '—', address: '—', images: [] },
    organizer: { name: 'Organizador', avatar: '', rating: 0, eventsCount: 0, experiencePct: 0 },
    host: { name: 'Anfitrión', avatar: '', rating: 0, eventsCount: 0, experiencePct: 0 },
    refundPolicy: 'Consulta la política del evento.',
  };
}
