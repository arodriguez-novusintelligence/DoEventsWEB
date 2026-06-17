import type { EventDetailResponse } from '@doevents/shared';
import type { EventFormData, EventDay, EventFaq, RefundPolicy } from '@lovable/data/eventFormData';
import { initialEventFormData } from '@lovable/data/eventFormData';
import { applyVenueToEventLocation } from './eventVenueBridge';

function parseDatePart(value?: string): string {
  if (!value) return '';
  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10);
  }
  return value;
}

function parseTimePart(value?: string): string {
  if (!value) return '';
  const match = value.match(/(\d{1,2}:\d{2})/);
  return match ? match[1] : value;
}

function mapRefundPolicy(value?: string): RefundPolicy | undefined {
  const raw = String(value || '').toLowerCase();
  if (!raw) return undefined;
  if (raw.includes('1') && raw.includes('d')) return '1-day';
  if (raw.includes('7')) return '7-days';
  if (raw.includes('30')) return '30-days';
  if (raw.includes('caso')) return 'case-by-case';
  if (raw.includes('no') || raw.includes('none')) return 'none';
  return undefined;
}

function mapAgenda(event: EventDetailResponse['event']): EventDay[] {
  if (event.eventDays?.length) {
    return event.eventDays.map((day, index) => ({
      id: day.id || `day-${index}`,
      name: day.dayName || `Día ${index + 1}`,
      date: parseDatePart(day.date),
      activities: (day.activities || []).map((activity, actIndex) => ({
        id: activity.id || `act-${actIndex}`,
        startTime: activity.startTimeDisplay || parseTimePart(activity.startTime),
        endTime: activity.endTimeDisplay || parseTimePart(activity.endTime),
        description: activity.description || '',
        responsible: activity.responsible
          ? {
              id: '',
              name: activity.responsible.displayName
                || activity.responsible.nombre
                || activity.responsible.name
                || 'Responsable',
              source: 'manual' as const,
            }
          : undefined,
      })),
    }));
  }

  if (event.itinerary?.length) {
    return [{
      id: 'day-1',
      name: 'Agenda',
      date: parseDatePart(event.fechaIni),
      activities: event.itinerary.map((item, index) => ({
        id: `act-${index}`,
        startTime: item.time || '',
        endTime: '',
        description: item.description || item.title || '',
      })),
    }];
  }

  return [];
}

function mapFaqs(event: EventDetailResponse['event']): EventFaq[] {
  return (event.faq || [])
    .filter((item) => item.question?.trim())
    .map((item, index) => ({
      id: `faq-${index}`,
      question: item.question || '',
      answer: item.answer || '',
    }));
}

export async function eventDetailToFormData(
  detail: EventDetailResponse,
  images: string[] = [],
): Promise<EventFormData> {
  const event = detail.event;
  const base: EventFormData = {
    ...initialEventFormData,
    name: event.nombre || '',
    description: event.descripcion || '',
    type: detail.eventType?.EventType_ES || '',
    category: detail.category?.Category_ES || detail.category?.preference_name_es || '',
    capacity: event.aforo || '',
    startDate: parseDatePart(event.fechaIni),
    endDate: parseDatePart(event.fechaFin),
    startTime: parseTimePart(event.horaIni),
    endTime: parseTimePart(event.horaFin),
    modality: 'presencial',
    eventClass: event.clase === 'private' ? 'private' : 'public',
    images: images.filter(Boolean),
    videoUrl: event.video || '',
    refundPolicy: mapRefundPolicy(event.categoriaReembolso),
    faqs: mapFaqs(event),
    agenda: mapAgenda(event),
  };

  if (event.venueId) {
    try {
      const locationPatch = await applyVenueToEventLocation(event.venueId, 'own');
      base.location = {
        ...base.location,
        ...locationPatch,
        mode: 'mine',
        selectedVenueId: event.venueId,
      };
    } catch {
      base.location = {
        ...base.location,
        mode: 'mine',
        selectedVenueId: event.venueId,
      };
    }
  } else {
    base.location = {
      ...base.location,
      mode: 'custom',
      customName: event.direccion || event.nombre || '',
      customAddress: event.direccion || '',
      customLat: event.ubicacion?.latitude ?? event.latitude,
      customLng: event.ubicacion?.longitude ?? event.longitude,
      detectedCity: event.ciudad || '',
      ticketingType: event.hasSeating ? 'with-seating' : 'only-tickets',
      seatingLayout: event.hasSeating ? 'numbered' : 'general',
      showMap: Boolean(event.ubicacion?.latitude ?? event.latitude),
    };
  }

  return { ...base, persistedEventId: event.id };
}
