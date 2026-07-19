import type { EventDetailResponse } from '@doevents/shared';
import type {
  EventFormData,
  EventDay,
  EventFaq,
  PromoCurrency,
  RefundPolicy,
  TicketCategory as FormTicketCategory,
} from '@lovable/data/eventFormData';
import { initialEventFormData } from '@lovable/data/eventFormData';
import {
  fetchAvailableSeats,
  fetchEventPromoCodes,
  fetchEventStaffAssignments,
  type TicketCategory as ApiTicketCategory,
} from '@doevents/shared';
import { applyVenueToEventLocation } from './eventVenueBridge';

function parseDatePart(value?: string): string {
  if (!value) return '';
  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, dd, mm, yyyy] = slashMatch;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
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
  const raw = String(value || '').trim().toUpperCase();
  if (!raw) return undefined;

  const codeMap: Record<string, RefundPolicy> = {
    '1': '1-day',
    '7': '7-days',
    '30': '30-days',
    '0': 'case-by-case',
    N: 'none',
  };
  if (codeMap[raw]) return codeMap[raw];

  const lower = raw.toLowerCase();
  if (lower.includes('1') && (lower.includes('d') || lower.includes('dia'))) return '1-day';
  if (lower.includes('7')) return '7-days';
  if (lower.includes('30')) return '30-days';
  if (lower.includes('caso')) return 'case-by-case';
  if (lower.includes('no') || lower.includes('none') || lower === 'n') return 'none';
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

function mapHosts(
  detail: EventDetailResponse,
  event: EventDetailResponse['event'],
): EventFormData['hosts'] {
  const hosts: EventFormData['hosts'] = [];
  const organizer = detail.organizer;
  if (organizer?.name || organizer?.email || event.organizerName) {
    hosts.push({
      id: organizer?.id || 'organizer',
      role: 'organizer',
      name: [organizer?.name, organizer?.lastName].filter(Boolean).join(' ')
        || event.organizerName
        || '',
      email: organizer?.email || '',
      phone: '',
      countryCode: '+57',
      source: organizer?.id ? 'platform' : 'manual',
    });
  }
  const host = detail.host;
  if (host?.name || host?.email || event.anfitrioName) {
    hosts.push({
      id: host?.id || 'host',
      role: 'host',
      name: [host?.name, host?.lastName].filter(Boolean).join(' ')
        || event.anfitrioName
        || '',
      email: host?.email || event.emailAnf || '',
      phone: '',
      countryCode: '+57',
      source: host?.id ? 'platform' : 'manual',
    });
  }
  return hosts;
}

function mapTags(event: Record<string, unknown>): string[] {
  const raw = event.Hashtags ?? event.hashtags ?? event.tags;
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(/[,#]/).map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

function resolveEditCategoryId(
  event: EventDetailResponse['event'],
  categoryInfo: EventDetailResponse['category'],
): string {
  if (event.Categoria?.trim()) return event.Categoria.trim();
  const preferenceId = categoryInfo?.preference_id;
  if (preferenceId != null && String(preferenceId).trim()) {
    return String(preferenceId).trim();
  }
  return categoryInfo?.Category_ES || categoryInfo?.preference_name_es || '';
}

function apiCategoriesToFormTicketCategories(
  categories: ApiTicketCategory[],
): FormTicketCategory[] {
  return categories.map((cat) => {
    const extended = cat as ApiTicketCategory & {
      gateId?: string;
      costo?: boolean;
      hasPrice?: boolean;
      valor?: number;
      price?: number;
    };
    const pricedSeat = cat.seats?.find((seat) => typeof seat.price === 'number' && seat.price > 0);
    const seatPrice = pricedSeat?.price ?? cat.seats?.[0]?.price;
    const categoryPrice = Number(
      extended.valor ?? extended.price ?? seatPrice ?? 0,
    ) || 0;
    const hasPrice = extended.costo === true
      || extended.hasPrice === true
      || categoryPrice > 0;
    const categoryId = String(cat.categoryId || '').trim();
    if (!categoryId && !cat.distributionId) {
      // Sin id estable no se puede sincronizar precios después.
    }
    return {
      // Nunca usar distributionId como categoryId: el sync de precios filtra por boletaId.
      id: categoryId || String(cat.distributionId || ''),
      name: cat.categoryName,
      quantity: Math.max(1, cat.seats?.length || 1),
      hasPrice,
      price: categoryPrice,
      currency: 'COP',
      gateId: extended.gateId || undefined,
    };
  });
}

async function hydrateLocationForEdit(
  event: EventDetailResponse['event'],
  placeTypeLabel: string,
): Promise<EventFormData['location']> {
  if (event.venueId) {
    try {
      const locationPatch = await applyVenueToEventLocation(event.venueId, 'own');
      const location: EventFormData['location'] = {
        ...initialEventFormData.location,
        ...locationPatch,
        mode: 'mine',
        selectedVenueId: event.venueId,
      };

      try {
        const seats = await fetchAvailableSeats(event.id);
        if (seats.categories?.length) {
          if (location.ticketingType === 'only-tickets') {
            location.ticketCategories = apiCategoriesToFormTicketCategories(seats.categories);
          } else if (!location.seatingMap?.figures?.some((f) => f.role === 'category')) {
            location.ticketCategories = apiCategoriesToFormTicketCategories(seats.categories);
          }
        }
      } catch {
        // Borrador o evento sin distribuciones aún.
      }

      return location;
    } catch {
      return {
        ...initialEventFormData.location,
        mode: 'mine',
        selectedVenueId: event.venueId,
      };
    }
  }

  return {
    ...initialEventFormData.location,
    mode: 'custom',
    customName: event.direccion || event.nombre || '',
    customType: placeTypeLabel,
    customAddress: event.direccion || '',
    customLat: event.ubicacion?.latitude ?? event.latitude,
    customLng: event.ubicacion?.longitude ?? event.longitude,
    detectedCity: event.ciudad || '',
    ticketingType: event.hasSeating ? 'with-seating' : 'only-tickets',
    seatingLayout: event.hasSeating ? 'numbered' : 'general',
    showMap: Boolean(event.ubicacion?.latitude ?? event.latitude),
  };
}

export async function eventDetailToFormData(
  detail: EventDetailResponse,
  images: string[] = [],
): Promise<EventFormData> {
  const event = detail.event;
  const eventRecord = event as EventDetailResponse['event'] & Record<string, unknown>;
  const placeTypeLabel = detail.placeType?.PlaceType_ES
    || detail.placeType?.PlaceType_EN
    || event.tipoLugar
    || '';
  const hosts = mapHosts(detail, event);
  const base: EventFormData = {
    ...initialEventFormData,
    name: event.nombre || '',
    description: event.descripcion || '',
    type: detail.eventType?.EventType_ES
      || detail.eventType?.EventType_EN
      || (event.tipoEvento && !/^\d+$/.test(String(event.tipoEvento).trim()) ? String(event.tipoEvento) : '')
      || '',
    category: resolveEditCategoryId(event, detail.category),
    capacity: event.aforo || '',
    startDate: parseDatePart(event.fechaIni),
    endDate: parseDatePart(event.fechaFin),
    startTime: parseTimePart(event.horaIni),
    endTime: parseTimePart(event.horaFin),
    modality: String(eventRecord.modalidadEvt || '').toUpperCase() === 'V' ? 'virtual' : 'presencial',
    eventClass: event.clase === 'private' || event.clase === 'P' ? 'private' : 'public',
    images: images.filter(Boolean),
    videoUrl: event.video || '',
    tags: mapTags(eventRecord),
    hosts,
    refundPolicy: mapRefundPolicy(event.categoriaReembolso),
    faqs: mapFaqs(event),
    agenda: mapAgenda(event),
  };

  base.location = await hydrateLocationForEdit(event, placeTypeLabel);

  try {
    const staffView = await fetchEventStaffAssignments(event.id);
    if (staffView.accessControl.length) {
      const accessControl: Record<string, string[]> = {};
      const accessStaff: EventFormData['accessStaff'] = {};
      staffView.accessControl.forEach((gate) => {
        const userIds = gate.assignedUsers
          .map((user) => user.userId)
          .filter((id): id is string => Boolean(id));
        if (!userIds.length) return;
        accessControl[gate.gateId] = userIds;
        gate.assignedUsers.forEach((user) => {
          if (!user.userId) return;
          accessStaff[user.userId] = {
            id: user.userId,
            name: user.name || user.username || user.email || 'Usuario',
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            initials: (user.name || user.username || '?').slice(0, 2).toUpperCase(),
            source: 'platform',
          };
        });
      });
      base.accessControl = accessControl;
      base.accessStaff = accessStaff;
    }
  } catch {
    // Control de acceso opcional al cargar edición.
  }

  try {
    // Los códigos viven en su propia tabla, no en el detalle del evento.
    // Hidratarlos aquí permite gestionarlos desde el paso de códigos del wizard.
    const promo = await fetchEventPromoCodes(event.id);
    base.promoCodes = promo.batches.map((batch) => {
      const codeStatuses = batch.codeStatuses || {};
      const redeemedCount =
        batch.redeemedCount
        ?? batch.codes.filter((code) => codeStatuses[code] === 'REDEEMED' || promo.redemptions?.[code]).length;
      const cancelledCount =
        batch.cancelledCount
        ?? batch.codes.filter((code) => codeStatuses[code] === 'CANCELLED' || promo.cancellationByCode?.[code]).length;
      const editableCount =
        batch.editableCount
        ?? Math.max(0, batch.codes.length - redeemedCount - cancelledCount);
      return {
        ...batch,
        currency: batch.currency as PromoCurrency,
        persisted: true,
        editable: batch.editable ?? editableCount > 0,
        editableCount,
        redeemedCount,
        cancelledCount,
        codeStatuses,
      };
    });
  } catch {
    // La edición del evento no debe quedar bloqueada si la carga de códigos falla.
    base.promoCodes = [];
  }

  return { ...base, persistedEventId: event.id, ownerUserId: event.userId };
}
