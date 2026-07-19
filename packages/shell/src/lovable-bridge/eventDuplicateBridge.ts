import type { EventDetailResponse } from '@doevents/shared';
import type { EventFormData } from '@lovable/data/eventFormData';
import { applyVenueToEventLocation } from './eventVenueBridge';
import { eventDetailToFormData } from './eventEditBridge';

const RESUME_STORAGE_PREFIX = 'doevents.event-resume.';

export function storeEventResumePrefill(eventId: string, form: EventFormData): void {
  try {
    sessionStorage.setItem(`${RESUME_STORAGE_PREFIX}${eventId}`, JSON.stringify(form));
  } catch {
    /* quota or private mode */
  }
}

export function readEventResumePrefill(eventId: string): EventFormData | null {
  try {
    const raw = sessionStorage.getItem(`${RESUME_STORAGE_PREFIX}${eventId}`);
    if (!raw) return null;
    return JSON.parse(raw) as EventFormData;
  } catch {
    return null;
  }
}

export function clearEventResumePrefill(eventId: string): void {
  try {
    sessionStorage.removeItem(`${RESUME_STORAGE_PREFIX}${eventId}`);
  } catch {
    /* ignore */
  }
}

export type DuplicateSchedule = {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
};

export async function buildDuplicateEventForm(
  sourceDetail: EventDetailResponse,
  newEventId: string,
  schedule: DuplicateSchedule,
  newVenueId?: string,
): Promise<EventFormData> {
  const form = await eventDetailToFormData(sourceDetail, sourceDetail.images || []);
  const sourceName = (sourceDetail.event.nombre || form.name || 'Evento').trim();
  const copyName = sourceName.toLowerCase().startsWith('copia de ')
    ? sourceName
    : `Copia de ${sourceName}`;

  const next: EventFormData = {
    ...form,
    name: copyName,
    startDate: schedule.startDate || form.startDate,
    endDate: schedule.endDate || form.endDate,
    startTime: schedule.startTime || form.startTime,
    endTime: schedule.endTime || form.endTime,
    persistedEventId: newEventId,
  };

  const venueId = newVenueId || sourceDetail.event.venueId;
  if (venueId) {
    try {
      const locationPatch = await applyVenueToEventLocation(venueId, 'own');
      next.location = {
        ...next.location,
        ...locationPatch,
        mode: 'mine',
        selectedVenueId: venueId,
        venueOwnership: 'own',
      };
    } catch {
      next.location = {
        ...next.location,
        mode: 'mine',
        selectedVenueId: venueId,
        venueOwnership: 'own',
      };
    }
  }

  return next;
}
