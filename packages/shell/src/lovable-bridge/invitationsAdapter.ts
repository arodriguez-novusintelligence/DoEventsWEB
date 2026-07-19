import type { EventInvitation } from '@doevents/shared';
import { resolveEventImageUrl } from '@doevents/shared';
import type { InvitationEvent } from '@lovable/data/invitationsData';

function mapInvitationStatus(status?: string): InvitationEvent['status'] {
  const raw = String(status || 'pending').toLowerCase();
  if (raw === 'accepted' || raw === 'aceptada') return 'aceptada';
  if (raw === 'rejected' || raw === 'rechazada') return 'rechazada';
  return 'pendiente';
}

/** Corrige firmas generadas con región incorrecta (sa-east-1) del bucket de eventos (us-east-1). */
function normalizeInvitationImageUrl(url?: string | null): string {
  const raw = String(url || '').trim();
  if (!raw) return resolveEventImageUrl();
  const fixed = raw.replace(
    /\.s3\.sa-east-1\.amazonaws\.com\//i,
    '.s3.us-east-1.amazonaws.com/',
  );
  return resolveEventImageUrl(fixed) || resolveEventImageUrl();
}

export function apiInvitationToLovable(inv: EventInvitation): InvitationEvent {
  const image = normalizeInvitationImageUrl(inv.eventImageSigned);
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
