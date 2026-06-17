import type { EventFormData, EventGate, RefundPolicy, SeatingFigure, SeatingFigureShape } from '@lovable/data/eventFormData';

import {

  buildSeatGrid,

  cloneVenueForEvent,

  createEvent,

  createVenueForEvent,

  saveStaffAssignments,

  newWizardId,

  publishEvent,

  invalidateEventsCache,

  invalidateServicesCache,

  emitNotificationsUpdated,

  fetchSubscriptionStatus,

  checkCanPublishEvent,

  uploadEventMediaBatch,

  updateEvent,

  type EventMediaEntry,

  getAuthToken,

  getCurrentEnv,

  matchCategoryLabel,

  resolveDisplayLocation,

  isPlaceholderLocation,

  type FloorPlanGeometry,

  type WizardCategory,

  type WizardElement,

  type WizardFloor,

  type WizardGate,

  type WizardSeat,

} from '@doevents/shared';



import { NUMERIC_EVENT_CATEGORY_MAP } from '@doevents/shared';
import {
  buildVenuePublishPlan,
  persistClonedVenueFromEventLocation,
  persistOwnVenueFromEventLocation,
} from './eventVenueBridge';

function resolveCategoryId(category: string): string {
  if (/^\d+$/.test(category.trim())) return category.trim();
  const normalized = category.trim().toLowerCase();
  const byLabel = Object.entries(NUMERIC_EVENT_CATEGORY_MAP).find(([, label]) => {
    const l = label.toLowerCase();
    return l === normalized || normalized.includes(l) || l.includes(normalized);
  });
  if (byLabel) return byLabel[0];
  const matched = matchCategoryLabel(category);
  if (matched) {
    const found = Object.entries(NUMERIC_EVENT_CATEGORY_MAP).find(([, v]) => v === matched.id);
    if (found) return found[0];
  }
  return category;
}

function combineIsoDateTime(date?: string, time?: string): string | undefined {
  if (!date?.trim()) return undefined;
  const normalizedTime = (time || '00:00').trim();
  return `${date.trim()}T${normalizedTime}:00`;
}

function buildWizardExtras(form: EventFormData) {
  const faq = (form.faqs || [])
    .filter((item) => item.question?.trim())
    .map((item) => ({
      question: item.question.trim(),
      answer: (item.answer || '').trim(),
    }));

  const eventDays = (form.agenda || [])
    .filter((day) => day.date || day.activities?.length)
    .map((day) => ({
      id: day.id,
      dayName: day.name || 'Día',
      date: day.date ? `${day.date}T00:00:00.000Z` : undefined,
      activities: (day.activities || []).map((activity) => ({
        id: activity.id,
        startTime: combineIsoDateTime(day.date, activity.startTime),
        endTime: combineIsoDateTime(day.date, activity.endTime),
        startTimeDisplay: activity.startTime,
        endTimeDisplay: activity.endTime,
        description: activity.description,
        responsible: activity.responsible
          ? {
              id: activity.responsible.id,
              nombre: activity.responsible.name,
              email: activity.responsible.email,
              username: activity.responsible.username,
              displayName: activity.responsible.name,
            }
          : undefined,
      })),
    }));

  const itinerary = (form.agenda || []).flatMap((day) =>
    (day.activities || []).map((activity) => ({
      time: activity.startTime,
      title: activity.description?.slice(0, 80) || day.name,
      description: activity.description,
    })),
  );

  return {
    faq: faq.length ? faq : undefined,
    eventDays: eventDays.length ? eventDays : undefined,
    itinerary: itinerary.length ? itinerary : undefined,
    salesStartAt: combineIsoDateTime(form.salesStartDate, form.salesStartTime),
    salesEndAt: combineIsoDateTime(form.salesEndDate, form.salesEndTime),
  };
}

function toApiDate(isoDate: string): string {

  if (!isoDate) return '';

  const [year, month, day] = isoDate.split('-');

  if (!year || !month || !day) return isoDate;

  return `${day}/${month}/${year}`;

}



function refundPolicyToApi(policy?: RefundPolicy): string | undefined {

  const map: Record<RefundPolicy, string> = {

    '1-day': '1',

    '7-days': '7',

    '30-days': '30',

    'case-by-case': '0',

    none: 'N',

  };

  return policy ? map[policy] : undefined;

}



function mapGeometry(shape: SeatingFigureShape): FloorPlanGeometry {

  const table: Partial<Record<SeatingFigureShape, FloorPlanGeometry>> = {

    rectangle: 'RECTANGLE',

    circle: 'CIRCLE',

    ellipse: 'ELLIPSE',

    triangle: 'TRIANGLE',

    trapezoid: 'TRAPEZOID',

    ring: 'RING',

    'semi-ring': 'SEMI_RING',

    horseshoe: 'SEMI_RING',

    semicircle: 'SEMI_RING',

    fan: 'SEMI_RING',

    stadium: 'ELLIPSE',

    chevron: 'CHEVRON',

    octagon: 'OCTAGON',

    image: 'IMAGEN',

    rhombus: 'TRIANGLE',

    boomerang: 'TRAPEZOID',

    superellipse: 'ELLIPSE',

    text: 'RECTANGLE',

  };

  return table[shape] || 'RECTANGLE';

}



function buildSeatsForCategory(cat: SeatingFigure): WizardSeat[] {

  const rows = Math.max(1, cat.rows || 1);

  const seatsPerRow = Math.max(1, cat.seatsPerRow || 1);

  const disabled = new Set(cat.disabledSeats || []);

  return buildSeatGrid(rows, seatsPerRow).map((seat) => ({

    ...seat,

    status: disabled.has(seat.seatCode) ? 'occupied' : 'available',

  }));

}



function figureToCategory(

  cat: SeatingFigure,

  defaultGateId: string,

  hasSeating: boolean,

): WizardCategory {

  const rows = Math.max(1, cat.rows || 1);

  const seatsPerRow = Math.max(1, cat.seatsPerRow || 1);

  return {

    categoryId: cat.id || newWizardId(),

    name: cat.name || 'Zona',

    color: cat.color || '#6366F1',

    relX: cat.x,

    relY: cat.y,

    width: cat.w,

    height: cat.h,

    geometry: mapGeometry(cat.shape),

    rotation: cat.rotation || 0,

    zIndex: 0,

    ringThickness: cat.arcInner ?? 55,

    locked: Boolean(cat.locked),

    gateId: cat.gateId || defaultGateId,

    rows,

    seatsPerRow,

    seats: hasSeating ? buildSeatsForCategory(cat) : [],

    price: Number(cat.price || 0),

    isPaid: Boolean(cat.priceEnabled && cat.price),

    currency: cat.currency || 'COP',

    description: cat.description || '',

    colOrder: 'asc',

    rowOrder: 'asc',

    disableSeatsEnabled: Boolean(cat.disabledSeats?.length),

  };

}



function inferElementType(name: string): WizardElement['type'] {

  const n = name.toLowerCase();

  if (n.includes('escenario') || n.includes('stage')) return 'stage';

  if (n.includes('baño') || n.includes('bathroom')) return 'bathroom';

  if (n.includes('escalera') || n.includes('stairs')) return 'stairs';

  if (n.includes('entrada') || n.includes('entrance')) return 'entrance';

  if (n.includes('salida') || n.includes('exit')) return 'exit';

  return 'other';

}



function figureToElement(fig: SeatingFigure): WizardElement {

  return {

    elementId: fig.id || newWizardId(),

    kind: 'element',

    type: inferElementType(fig.name),

    name: fig.name || 'Elemento',

    geometry: mapGeometry(fig.shape),

    relX: fig.x,

    relY: fig.y,

    width: fig.w,

    height: fig.h,

    rotation: fig.rotation || 0,

    zIndex: 0,

    locked: Boolean(fig.locked),

    ringThickness: fig.arcInner ?? 55,

    notes: fig.notes || '',

  };

}



function seatingFiguresToFloors(

  figures: SeatingFigure[],

  gates: EventGate[],

  hasSeating: boolean,

): WizardFloor[] {

  const defaultGateId = gates[0]?.id || newWizardId();

  const floorNumbers = Array.from(
    new Set(figures.map((figure) => figure.floor ?? 1)),
  ).sort((a, b) => a - b);

  if (!floorNumbers.length) floorNumbers.push(1);

  return floorNumbers.map((floorNumber) => {
    const floorFigures = figures.filter((figure) => (figure.floor ?? 1) === floorNumber);
    const categories = floorFigures
      .filter((figure) => figure.role === 'category')
      .map((cat) => figureToCategory(cat, defaultGateId, hasSeating));
    const elements = floorFigures
      .filter((figure) => figure.role === 'element')
      .map(figureToElement);

    return {
      floorId: newWizardId(),
      name: floorNumber === 1 ? 'Planta baja' : `Piso ${floorNumber}`,
      description: '',
      categories,
      elements,
    };
  });

}



function isUploadableMediaSrc(src: string): boolean {
  return src.startsWith('data:') || src.startsWith('blob:') || /^https?:\/\//i.test(src);
}

async function mediaSourceToFile(src: string, index: number): Promise<File> {
  const response = await fetch(src);
  const blob = await response.blob();
  const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  return new File([blob], `event-media-${index}.${ext}`, { type: blob.type || 'image/jpeg' });
}

function youtubeThumbnailFromUrl(videoUrl?: string): string | undefined {
  const match = videoUrl?.trim().match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i,
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : undefined;
}

function resolveCoverUrl(media: EventMediaEntry[], videoUrl?: string): string | undefined {
  const firstImage = media.find((entry) => !entry.isVideo);
  const firstVisual = firstImage || media[0];
  const fromMedia = firstVisual?.publicUrl || firstVisual?.s3Key;
  if (fromMedia) return fromMedia;
  return youtubeThumbnailFromUrl(videoUrl);
}

export async function syncEventMediaFromForm(
  eventId: string,
  form: EventFormData,
  userId: string,
): Promise<void> {
  const coverUrl = await uploadFormImages(eventId, form, userId)
    ?? youtubeThumbnailFromUrl(form.videoUrl);
  await syncEventCoverImage(eventId, coverUrl, userId);
}

async function syncEventCoverImage(
  eventId: string,
  coverUrl: string | undefined,
  userId: string,
): Promise<void> {
  if (!coverUrl?.trim()) return;
  try {
    await updateEvent(eventId, { imagen: coverUrl }, userId);
  } catch {
    // la lambda de imágenes también sincroniza imagen; no bloquear publicación
  }
}

async function uploadFormImages(
  eventId: string,
  form: EventFormData,
  userId: string,
): Promise<string | undefined> {
  const promoSources = form.images.filter((src) => typeof src === 'string' && isUploadableMediaSrc(src));
  const venueSources = (form.location.customImages || [])
    .filter((src) => typeof src === 'string' && isUploadableMediaSrc(src));

  let media: EventMediaEntry[] = [];

  if (promoSources.length) {
    const promoFiles = await Promise.all(promoSources.map((url, i) => mediaSourceToFile(url, i)));
    media = await uploadEventMediaBatch(eventId, promoFiles, userId, media);
  }

  if (venueSources.length) {
    const venueFiles = await Promise.all(
      venueSources.map((url, i) => mediaSourceToFile(url, i + promoSources.length)),
    );
    media = await uploadEventMediaBatch(eventId, venueFiles, userId, media);
  }

  return resolveCoverUrl(media, form.videoUrl);
}



async function persistRefundPolicy(eventId: string, policy?: RefundPolicy): Promise<void> {

  const categoriaReembolso = refundPolicyToApi(policy);

  if (!categoriaReembolso) return;

  try {

    const token = getAuthToken();

    await fetch(`${getCurrentEnv().apiBaseUrl}/events/addEventData`, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json',

        ...(token ? { Authorization: token } : {}),

      },

      body: JSON.stringify({ eventId, categoriaReembolso }),

    });

  } catch {

    // no bloquear publicación

  }

}



let eventPublishInFlight: Promise<string> | null = null;

async function updateLovableEventDraft(
  eventId: string,
  form: EventFormData,
  userId: string,
): Promise<string> {
  const loc = form.location;
  const host = form.hosts?.[0];
  const locationLine = resolveDisplayLocation({
    direccion: loc.customAddress,
    ciudad: loc.detectedCity,
    ubicacion: loc.customName,
    pais: 'Colombia',
  });
  const ubicacion = loc.customName || locationLine;
  const direccion = isPlaceholderLocation(loc.customAddress)
    ? locationLine
    : (loc.customAddress || locationLine);
  const ciudad = loc.detectedCity || direccion || ubicacion;

  await updateEvent(eventId, {
    nombre: form.name,
    descripcion: form.description,
    fechaIni: toApiDate(form.startDate),
    fechaFin: toApiDate(form.endDate || form.startDate),
    horaIni: form.startTime,
    horaFin: form.endTime,
    ubicacion,
    ciudad,
    direccion,
    aforo: form.capacity,
    tipoEvento: form.type,
    Categoria: resolveCategoryId(form.category),
    video: form.videoUrl || undefined,
    organizerName: host?.name || '',
    email: host?.email || '',
    estatus: 'inactivo',
    ...buildWizardExtras(form),
  }, userId);

  const coverUrl = await uploadFormImages(eventId, form, userId)
    ?? youtubeThumbnailFromUrl(form.videoUrl);
  await syncEventCoverImage(eventId, coverUrl, userId);
  await persistRefundPolicy(eventId, form.refundPolicy);
  return eventId;
}

async function persistLovableEvent(
  form: EventFormData,
  userId: string,
  options: { publish: boolean },
): Promise<string> {

  if (form.persistedEventId) {
    const eventId = await updateLovableEventDraft(form.persistedEventId, form, userId);
    if (options.publish) {
      await publishEvent(eventId);
      invalidateEventsCache();
      invalidateServicesCache();
      emitNotificationsUpdated();
    } else {
      invalidateEventsCache();
    }
    return eventId;
  }

  const loc = form.location;

  const host = form.hosts?.[0];

  const lat = loc.customLat;

  const lng = loc.customLng;

  const locationLine = resolveDisplayLocation({
    direccion: loc.customAddress,
    ciudad: loc.detectedCity,
    ubicacion: loc.customName,
    pais: 'Colombia',
  });

  const ubicacion = loc.customName || locationLine;

  const direccion = isPlaceholderLocation(loc.customAddress)
    ? locationLine
    : (loc.customAddress || locationLine);

  const ciudad = loc.detectedCity || direccion || ubicacion;

  const departamento = loc.detectedCity || ciudad;

  const hasSeating = loc.ticketingType === 'with-seating';

  const gates: WizardGate[] = (loc.gates || []).map((g, idx) => ({

    gateId: g.id,

    gateNumber: g.number || idx + 1,

    name: g.name,

    description: '',

  }));



  const wizardExtras = buildWizardExtras(form);

  const eventResult = await createEvent({

    nombre: form.name,

    descripcion: form.description,

    fechaIni: toApiDate(form.startDate),

    fechaFin: toApiDate(form.endDate || form.startDate),

    horaIni: form.startTime,

    horaFin: form.endTime,

    ubicacion,

    ciudad,

    latitude: lat,

    longitude: lng,

    pais: 'Colombia',

    aforo: form.capacity,

    tipoEvento: form.type,

    Categoria: resolveCategoryId(form.category),

    tipoLugar: loc.customType || undefined,

    modalidadEvt: form.modality === 'virtual' ? 'V' : 'P',

    clase: form.eventClass === 'private' ? 'P' : 'A',

    video: form.videoUrl || undefined,

    Hashtags: form.tags?.length ? form.tags.join(',') : undefined,

    userId,

    organizerName: host?.name || '',

    email: host?.email || '',

    TelPrin: host?.phone || '',

    IndicativoTelPrinOrg: host?.countryCode || '+57',

    direccion,

    departamento,

    skipVenue: true,

    ...wizardExtras,

  });



  const eventId = eventResult.data?.id;

  if (!eventId) throw new Error('No se recibió el ID del evento');



  if (loc.mode === 'mine' && loc.selectedVenueId) {
    const plan = buildVenuePublishPlan(loc);
    if (plan.shouldUpdateBase) {
      await persistOwnVenueFromEventLocation(loc, userId, form.capacity);
    }
    const cloneResult = await cloneVenueForEvent({
      baseVenueId: loc.selectedVenueId,
      eventId,
      name: loc.customName || form.name,
      hasSeating,
    });
    const clonedVenueId = cloneResult.venueId;
    if (clonedVenueId && loc.venueOwnership === 'thirdParty') {
      await persistClonedVenueFromEventLocation(clonedVenueId, loc, userId);
    }
  } else {

    const floors = seatingFiguresToFloors(loc.seatingMap?.figures || [], loc.gates || [], hasSeating);

    const hasVenueContent = floors.some(
      (floor) => (floor.categories?.length ?? 0) > 0 || (floor.elements?.length ?? 0) > 0,
    );

    if (hasVenueContent || gates.length) {

      await createVenueForEvent({

        name: loc.customName || form.name,

        ownerUserId: userId,

        eventId,

        hasSeating,

        capacity: Number(form.capacity) || 100,

        address: direccion || ubicacion,

        city: ciudad,

        country: 'Colombia',

        description: '',

        phone: host?.phone,

        latitude: lat,

        longitude: lng,

        gates,

        floors,

      });

    }

  }



  const coverUrl = await uploadFormImages(eventId, form, userId)
    ?? youtubeThumbnailFromUrl(form.videoUrl);
  await syncEventCoverImage(eventId, coverUrl, userId);

  await persistRefundPolicy(eventId, form.refundPolicy);

  try {
    const accessControl = form.accessControl || {};
    const gateEntries = Object.entries(accessControl).filter(([, users]) => users?.length);
    if (gateEntries.length) {
      const gateNameById = new Map((loc.gates || []).map((gate) => [gate.id, gate.name]));
      await saveStaffAssignments({
        eventId,
        eventName: form.name,
        venueId: loc.selectedVenueId || eventId,
        venueName: loc.customName || form.name,
        accessControl: gateEntries.map(([gateId, assignedUsers]) => ({
          gateId,
          gateName: gateNameById.get(gateId),
          assignedUsers,
        })),
      });
    }
  } catch {
    // no bloquear publicación
  }

  if (options.publish) {
    await publishEvent(eventId);
    invalidateEventsCache();
    invalidateServicesCache();
    emitNotificationsUpdated();
  } else {
    invalidateEventsCache();
  }

  return eventId;
}

export async function saveLovableEventDraft(
  form: EventFormData,
  userId: string,
): Promise<string> {
  if (!form.name?.trim()) {
    throw new Error('Agrega al menos el nombre del evento para guardar el borrador');
  }
  return persistLovableEvent(form, userId, { publish: false });
}

export async function publishLovableEvent(
  form: EventFormData,
  userId: string,
): Promise<string> {
  if (eventPublishInFlight) return eventPublishInFlight;
  eventPublishInFlight = (async () => {
    const sub = await fetchSubscriptionStatus(userId).catch(() => null);
    const check = checkCanPublishEvent(
      sub?.plan,
      sub?.platformRole,
      sub?.usage,
    );
    if (!check.allowed) {
      throw new Error(check.reason || 'Límite del plan alcanzado');
    }
    return persistLovableEvent(form, userId, { publish: true });
  })().finally(() => {
    eventPublishInFlight = null;
  });
  return eventPublishInFlight;
}


