import type { EventFormData, EventGate, EventLocation, RefundPolicy, SeatingFigure, SeatingFigureShape, TicketCategory } from '@lovable/data/eventFormData';
import {
  isRefundPolicyConfigured,
  refundPolicyToApiCode,
  REFUND_POLICY_REQUIRED_MESSAGE,
} from '@lovable/data/eventFormData';

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

  invalidateDiscoverCache,

  invalidateProfileHeaderCache,

  emitNotificationsUpdated,

  fetchSubscriptionStatus,

  checkCanPublishEvent,

  checkPublishLimit,

  syncEventPromoCodes,

  uploadEventMediaBatch,

  fetchEventMedia,

  saveEventMedia,

  isSignedS3Url,

  toPersistentMediaUrl,

  updateEvent,

  fetchEventDetail,

  fetchAvailableSeats,

  ensureEventTicketDistributions,

  getVenueById,

  updateVenueLayout,

  type EventMediaEntry,

  getAuthToken,

  getCurrentEnv,

  matchCategoryLabel,

  resolveDisplayLocation,

  isPlaceholderLocation,

  geocodePlaceQuery,

  type FloorPlanGeometry,

  type WizardCategory,

  type WizardElement,

  type WizardFloor,

  type WizardGate,

  type WizardSeat,

  getPersistedUserDisplayName,

} from '@doevents/shared';



import { NUMERIC_EVENT_CATEGORY_MAP } from '@doevents/shared';
import {
  buildVenuePublishPlan,
  persistClonedVenueFromEventLocation,
  persistOwnVenueFromEventLocation,
} from './eventVenueBridge';

function resolveOrganizerContact(form: EventFormData): {
  name: string;
  email: string;
  phone?: string;
  countryCode?: string;
} {
  const organizer = form.hosts?.find((h) => h.role === 'organizer');
  return {
    name: organizer?.name || getPersistedUserDisplayName() || '',
    email: organizer?.email || '',
    phone: organizer?.phone,
    countryCode: organizer?.countryCode || '+57',
  };
}

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

function hasMapCoordinates(loc: EventLocation): boolean {
  return typeof loc.customLat === 'number'
    && typeof loc.customLng === 'number'
    && Number.isFinite(loc.customLat)
    && Number.isFinite(loc.customLng);
}

function detectCountryFromLocation(loc: EventLocation): string {
  const haystack = [loc.customAddress, loc.detectedCity, loc.customName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (
    haystack.includes('república dominicana')
    || haystack.includes('republica dominicana')
    || haystack.includes(' dominican')
    || /(^|,\s*)rd\b/.test(haystack)
    || haystack.includes('distrito nacional')
  ) {
    return 'República Dominicana';
  }
  if (haystack.includes('colombia') || haystack.includes('bogotá') || haystack.includes('bogota')) {
    return 'Colombia';
  }
  return 'Colombia';
}

function buildLocationGeocodeQuery(loc: EventLocation): string {
  const address = loc.customAddress?.trim();
  if (address && address.length >= 3) return address;
  const name = loc.customName?.trim();
  if (name && (name.includes(',') || /\d/.test(name))) return name;
  return [name, loc.detectedCity].filter(Boolean).join(', ');
}

/** Solo geocodifica si faltan coordenadas. Nunca pisa el pin que el usuario eligió en el mapa. */
async function withGeocodedLocation(form: EventFormData): Promise<EventFormData> {
  const loc = form.location;
  if (hasMapCoordinates(loc)) {
    return {
      ...form,
      location: {
        ...loc,
        detectedCity: loc.detectedCity?.trim() || undefined,
        customAddress: loc.customAddress?.trim() || loc.customName || undefined,
      },
    };
  }
  const query = buildLocationGeocodeQuery(loc);
  if (!query || query.length < 3) return form;
  try {
    const place = await geocodePlaceQuery(query);
    if (!place) return form;
    return {
      ...form,
      location: {
        ...loc,
        customLat: place.lat,
        customLng: place.lng,
        detectedCity: place.city || loc.detectedCity || place.departamento,
        customAddress: loc.customAddress?.trim() || place.street || place.label,
      },
    };
  } catch {
    return form;
  }
}

function buildPersistedLocationFields(loc: EventLocation) {
  const country = detectCountryFromLocation(loc);
  const locationLine = resolveDisplayLocation({
    direccion: loc.customAddress,
    ciudad: loc.detectedCity,
    ubicacion: loc.customName,
    pais: country,
  });
  const exactAddress = !isPlaceholderLocation(loc.customAddress)
    ? (loc.customAddress || '').trim()
    : '';
  const direccion = exactAddress || locationLine;
  const ciudad = (loc.detectedCity || '').trim() || direccion;
  const departamento = (loc.detectedCity || '').trim();
  const ubicacion = (loc.customName || '').trim() || direccion || locationLine;
  return {
    lat: loc.customLat,
    lng: loc.customLng,
    locationLine,
    direccion,
    ciudad,
    departamento,
    ubicacion,
    pais: country,
  };
}

function resolveAnfitrionContact(form: EventFormData): {
  name: string;
  email: string;
  phone?: string;
  countryCode?: string;
} {
  const organizer = form.hosts?.find((h) => h.role === 'organizer');
  const organizerIds = new Set(
    [organizer?.id, form.ownerUserId].filter(Boolean).map(String),
  );
  const host = (form.hosts || []).find((h) => {
    if (h.role === 'organizer') return false;
    if (organizerIds.has(String(h.id))) return false;
    return Boolean(h.name || h.email);
  });
  if (!host) {
    return { name: '', email: '', phone: '', countryCode: '+57' };
  }
  return {
    name: host.name || '',
    email: host.email || '',
    phone: host.phone,
    countryCode: host.countryCode || '+57',
  };
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
  return refundPolicyToApiCode(policy);
}

function assertRefundPolicyConfigured(form: EventFormData): void {
  if (!isRefundPolicyConfigured(form)) {
    throw new Error(REFUND_POLICY_REQUIRED_MESSAGE);
  }
}

function isStaleEventError(err: unknown): boolean {
  const message = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return message.includes('not found')
    || message.includes('no encontrado')
    || message.includes('requested resource');
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

  const categoryId = cat.id || 'category';

  return buildSeatGrid(rows, seatsPerRow).map((seat) => ({

    ...seat,

    seatId: `${categoryId}__${seat.seatCode}`,

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

    labelDx: cat.labelDx,

    labelDy: cat.labelDy,

    labelRotation: cat.labelRotation,

    zIndex: 0,

    ringThickness: cat.arcInner ?? 55,

    locked: Boolean(cat.locked),

    gateId: cat.gateId || defaultGateId,

    rows,

    seatsPerRow,

    seats: hasSeating ? buildSeatsForCategory(cat) : [],

    price: Number(cat.price || 0),

    isPaid: Boolean(cat.priceEnabled && Number(cat.price) > 0),

    currency: cat.currency || 'COP',

    description: cat.description || '',

    colOrder: 'asc',

    rowOrder: 'asc',

    disableSeatsEnabled: Boolean(cat.disabledSeats?.length),

  };

}



function formTicketCategoriesToFloors(
  ticketCategories: TicketCategory[],
  gates: WizardGate[],
  existingFloorId?: string,
): WizardFloor[] {
  if (!ticketCategories.length) return [];
  const defaultGateId = gates[0]?.gateId || newWizardId();
  return [{
    floorId: existingFloorId || newWizardId(),
    name: 'General',
    description: 'Admisión general',
    elements: [],
    categories: ticketCategories.map((tc) => ({
      categoryId: tc.id || newWizardId(),
      name: tc.name,
      color: '#6366F1',
      relX: 10,
      relY: 10,
      width: 30,
      height: 20,
      geometry: 'RECTANGLE' as const,
      rotation: 0,
      zIndex: 0,
      ringThickness: 55,
      gateId: tc.gateId || defaultGateId,
      rows: 1,
      seatsPerRow: Math.max(1, tc.quantity || 1),
      seats: [],
      price: tc.hasPrice ? tc.price : 0,
      isPaid: Boolean(tc.hasPrice && Number(tc.price) > 0),
      currency: tc.currency || 'COP',
      description: tc.description || '',
      colOrder: 'asc' as const,
      rowOrder: 'asc' as const,
      disableSeatsEnabled: false,
    })),
  }];
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

    notes: fig.imageUrl || fig.notes || '',

  };

}



function seatingFiguresToFloors(

  figures: SeatingFigure[],

  gates: EventGate[],

  hasSeating: boolean,

  existingFloorIdsByNumber?: Map<number, string>,

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
      floorId: existingFloorIdsByNumber?.get(floorNumber) || newWizardId(),
      name: floorNumber === 1 ? 'Planta baja' : `Piso ${floorNumber}`,
      description: '',
      categories,
      elements,
    };
  });

}



function isVideoMediaUrl(url: string): boolean {
  return /\.(mp4|mov|webm|m4v|avi)(\?|$)/i.test(url);
}

function needsMediaReupload(src: string): boolean {
  if (src.startsWith('data:') || src.startsWith('blob:')) return true;
  return isSignedS3Url(src);
}

function remoteMediaEntry(src: string): EventMediaEntry {
  const publicUrl = toPersistentMediaUrl(src) || src.split('?')[0];
  return {
    publicUrl,
    isVideo: isVideoMediaUrl(publicUrl),
    previewUrl: publicUrl,
  };
}

async function mediaSourceToFile(src: string, index: number): Promise<File> {
  let response: Response;
  try {
    response = await fetch(src);
  } catch {
    throw new Error(
      `No se pudo leer la imagen ${index + 1}. Vuelve a subirla desde tu dispositivo.`,
    );
  }
  if (!response.ok) {
    throw new Error(`No se pudo descargar la imagen ${index + 1} (HTTP ${response.status})`);
  }
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
  const promoSources = form.images.filter((src) => typeof src === 'string' && src.trim());
  const venueSources = (form.location.customImages || [])
    .filter((src) => typeof src === 'string' && src.trim());

  const reuploadSources: string[] = [];
  const remoteEntries: EventMediaEntry[] = [];

  for (const src of [...promoSources, ...venueSources]) {
    if (needsMediaReupload(src)) {
      reuploadSources.push(src);
    } else if (/^https?:\/\//i.test(src)) {
      remoteEntries.push(remoteMediaEntry(src));
    }
  }

  let media: EventMediaEntry[] = [...remoteEntries];

  if (reuploadSources.length) {
    const files = await Promise.all(
      reuploadSources.map((url, index) => mediaSourceToFile(url, index)),
    );
    media = await uploadEventMediaBatch(eventId, files, userId, media);
  } else if (remoteEntries.length) {
    try {
      const existing = await fetchEventMedia(eventId);
      const existingUrls = new Set(existing.map((entry) => entry.publicUrl).filter(Boolean));
      const needsSave = remoteEntries.some((entry) => !existingUrls.has(entry.publicUrl));
      if (needsSave || !existing.length) {
        await saveEventMedia(eventId, remoteEntries, userId);
      }
    } catch {
      // syncEventCoverImage puede usar la URL remota aunque falle la galería
    }
  }

  return resolveCoverUrl(media, form.videoUrl)
    ?? remoteEntries.find((entry) => !entry.isVideo)?.publicUrl
    ?? remoteEntries[0]?.publicUrl;
}



async function persistRefundPolicy(eventId: string, policy?: RefundPolicy): Promise<void> {
  const categoriaReembolso = refundPolicyToApi(policy);
  if (!categoriaReembolso) return;

  const token = getAuthToken();
  const response = await fetch(`${getCurrentEnv().apiBaseUrl}/events/addEventData`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
    },
    body: JSON.stringify({ eventId, categoriaReembolso }),
  });

  const body = await response.json().catch(() => ({})) as {
    success?: boolean;
    statusDesc?: string;
    message?: string;
  };

  if (!response.ok || body.success === false) {
    throw new Error(
      body.statusDesc
      || body.message
      || 'No se pudo guardar la política de reembolsos del evento',
    );
  }
}

async function persistEventPromoCodes(
  eventId: string,
  form: EventFormData,
  options?: { throwOnError?: boolean },
): Promise<void> {
  const batches = form.promoCodes;
  if (!batches?.length) return;
  try {
    await syncEventPromoCodes(eventId, batches);
  } catch (err) {
    if (options?.throwOnError) throw err;
    // En create/publish no bloquear el flujo principal
  }
}



let eventPublishInFlight: Promise<string> | null = null;

async function eventHasTicketDistributions(eventId: string): Promise<boolean> {
  try {
    const data = await fetchAvailableSeats(eventId);
    return (data.categories?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

async function repairEventTicketDistributions(eventId: string): Promise<void> {
  if (await eventHasTicketDistributions(eventId)) return;
  try {
    await ensureEventTicketDistributions(eventId);
  } catch {
    // no bloquear publicación si el reparo falla; checkout puede reintentar
  }
}

async function persistEventVenueLayout(
  venueId: string,
  loc: EventLocation,
  userId: string,
  eventId?: string,
): Promise<void> {
  const hasSeating = loc.ticketingType === 'with-seating';
  const gates: WizardGate[] = (loc.gates || []).map((g, idx) => ({
    gateId: g.id,
    gateNumber: g.number || idx + 1,
    name: g.name,
    description: '',
  }));

  let existingFloorId: string | undefined;
  const existingFloorIdsByNumber = new Map<number, string>();
  try {
    const venue = await getVenueById(venueId, { forceNetwork: true });
    const existingFloors = venue.floors || [];
    existingFloorId = existingFloors[0]?.floorId;
    existingFloors.forEach((floor, index) => {
      if (floor.floorId) {
        existingFloorIdsByNumber.set(index + 1, floor.floorId);
      }
    });
  } catch {
    // Si no se puede cargar el venue, se crearán floorIds nuevos (comportamiento previo).
  }

  const floors = hasSeating
    ? seatingFiguresToFloors(
        loc.seatingMap?.figures || [],
        loc.gates || [],
        hasSeating,
        existingFloorIdsByNumber,
      )
    : formTicketCategoriesToFloors(loc.ticketCategories || [], gates, existingFloorId);
  const hasCategories = floors.some((floor) => (floor.categories?.length ?? 0) > 0);
  if (!hasCategories && !gates.length) return;

  await updateVenueLayout(venueId, {
    userId,
    eventId,
    hasSeating,
    floors,
    gates,
  });
}

async function syncEventVenueFromForm(
  eventId: string,
  form: EventFormData,
  userId: string,
  options: { includeLayoutUpdate?: boolean } = {},
): Promise<void> {
  const includeLayoutUpdate = options.includeLayoutUpdate === true;
  if (!includeLayoutUpdate) return;

  const hasDistributions = await eventHasTicketDistributions(eventId);

  const loc = form.location;
  const host = resolveOrganizerContact(form);
  const { lat, lng, direccion, ciudad, ubicacion, pais } = buildPersistedLocationFields(loc);
  const hasSeating = loc.ticketingType === 'with-seating';
  const gates: WizardGate[] = (loc.gates || []).map((g, idx) => ({
    gateId: g.id,
    gateNumber: g.number || idx + 1,
    name: g.name,
    description: '',
  }));

  const eventDetail = await fetchEventDetail(eventId).catch(() => null);
  const existingVenueId = eventDetail?.event?.venueId;

  // Evento ya publicado con boletas: actualizar layout/precios del venue existente.
  if (hasDistributions) {
    if (!existingVenueId) {
      throw new Error(
        'Este evento tiene boletería pero no tiene lugar asociado. No se pudieron guardar los precios.',
      );
    }
    await persistEventVenueLayout(existingVenueId, loc, userId, eventId);
    await ensureEventTicketDistributions(eventId);
    return;
  }

  if (loc.mode === 'mine' && loc.selectedVenueId) {
    if (!existingVenueId) {
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
    } else if (includeLayoutUpdate) {
      await persistEventVenueLayout(existingVenueId, loc, userId, eventId);
      if (hasDistributions) {
        await ensureEventTicketDistributions(eventId);
      }
    }
    await repairEventTicketDistributions(eventId);
    return;
  }

  if (existingVenueId) {
    if (includeLayoutUpdate) {
      await persistEventVenueLayout(existingVenueId, loc, userId, eventId);
      if (hasDistributions) {
        await ensureEventTicketDistributions(eventId);
      }
    }
    await repairEventTicketDistributions(eventId);
    return;
  }

  const floors = hasSeating
    ? seatingFiguresToFloors(loc.seatingMap?.figures || [], loc.gates || [], hasSeating)
    : formTicketCategoriesToFloors(loc.ticketCategories || [], gates);
  const hasVenueContent = hasSeating
    ? floors.some(
      (floor) => (floor.categories?.length ?? 0) > 0 || (floor.elements?.length ?? 0) > 0,
    )
    : (loc.ticketCategories?.length ?? 0) > 0;

  const venueGates = gates.length
    ? gates
    : (!hasSeating && (loc.ticketCategories?.length ?? 0) > 0)
      ? [{
        gateId: 'g-default',
        gateNumber: 1,
        name: 'Principal',
        description: '',
      }]
      : [];

  if (hasVenueContent || venueGates.length) {
    await createVenueForEvent({
      name: loc.customName || form.name,
      ownerUserId: userId,
      eventId,
      hasSeating,
      capacity: Number(form.capacity) || 100,
      address: direccion || ubicacion,
      city: ciudad,
      country: pais,
      description: '',
      phone: host.phone,
      latitude: lat,
      longitude: lng,
      placeType: loc.customType || undefined,
      gates: venueGates,
      floors,
    });
  }

  await repairEventTicketDistributions(eventId);
}

async function updateLovableEventDraft(
  eventId: string,
  form: EventFormData,
  userId: string,
  options: { includeLayoutUpdate?: boolean } = {},
): Promise<string> {
  const geocodedForm = await withGeocodedLocation(form);
  const loc = geocodedForm.location;
  const host = resolveOrganizerContact(geocodedForm);
  const anfitrion = resolveAnfitrionContact(geocodedForm);
  const { lat, lng, direccion, ciudad, departamento, ubicacion, pais } = buildPersistedLocationFields(loc);

  await updateEvent(eventId, {
    nombre: geocodedForm.name,
    descripcion: geocodedForm.description,
    fechaIni: toApiDate(geocodedForm.startDate),
    fechaFin: toApiDate(geocodedForm.endDate || geocodedForm.startDate),
    horaIni: geocodedForm.startTime,
    horaFin: geocodedForm.endTime,
    ubicacion,
    ciudad,
    direccion,
    latitude: lat,
    longitude: lng,
    pais,
    departamento,
    aforo: geocodedForm.capacity,
    tipoEvento: geocodedForm.type,
    Categoria: resolveCategoryId(geocodedForm.category),
    tipoLugar: loc.customType || undefined,
    modalidadEvt: geocodedForm.modality === 'virtual' ? 'V' : 'P',
    clase: geocodedForm.eventClass === 'private' ? 'P' : 'A',
    video: geocodedForm.videoUrl || undefined,
    organizerName: host.name || '',
    email: host.email || '',
    anfitrioName: anfitrion.name || '',
    emailAnf: anfitrion.email || '',
    TelPrinAnf: anfitrion.phone || '',
    IndicativoTelPrinAnf: anfitrion.countryCode || '+57',
    estatus: 'inactivo',
    skipVenue: true,
    categoriaReembolso: refundPolicyToApi(geocodedForm.refundPolicy),
    ...buildWizardExtras(geocodedForm),
  }, userId);

  try {
    const coverUrl = await uploadFormImages(eventId, geocodedForm, userId)
      ?? youtubeThumbnailFromUrl(geocodedForm.videoUrl);
    await syncEventCoverImage(eventId, coverUrl, userId);
  } catch {
    // La portada puede sincronizarse después; no bloquear guardado ni publicación.
  }
  try {
    await persistRefundPolicy(eventId, geocodedForm.refundPolicy);
  } catch {
    // categoriaReembolso ya viaja en updateEvent; addEventData es redundante.
  }
  await persistEventPromoCodes(eventId, geocodedForm);
  try {
    await syncEventVenueFromForm(eventId, geocodedForm, userId, options);
  } catch {
    // No bloquear guardado de borrador si el mapa de silletería no pudo sincronizarse.
  }
  return eventId;
}

async function persistLovableEvent(
  form: EventFormData,
  userId: string,
  options: { publish: boolean },
): Promise<string> {
  let geocodedForm = await withGeocodedLocation(form);

  if (geocodedForm.persistedEventId) {
    try {
      const eventId = await updateLovableEventDraft(
        geocodedForm.persistedEventId,
        geocodedForm,
        userId,
        { includeLayoutUpdate: true },
      );

      try {
        const accessControl = geocodedForm.accessControl || {};
        const gateEntries = Object.entries(accessControl).filter(([, users]) => users?.length);
        if (gateEntries.length) {
          const gateNameById = new Map((geocodedForm.location.gates || []).map((gate) => [gate.id, gate.name]));
          await saveStaffAssignments({
            eventId,
            eventName: geocodedForm.name,
            venueId: geocodedForm.location.selectedVenueId || eventId,
            venueName: geocodedForm.location.customName || geocodedForm.name,
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
        await repairEventTicketDistributions(eventId);
        invalidateEventsCache();
        invalidateServicesCache();
        invalidateDiscoverCache();
        invalidateProfileHeaderCache(userId);
        emitNotificationsUpdated();
      } else {
        invalidateEventsCache();
        invalidateProfileHeaderCache(userId);
      }
      return eventId;
    } catch (err) {
      if (options.publish || !isStaleEventError(err)) throw err;
      geocodedForm = { ...geocodedForm, persistedEventId: undefined };
    }
  }

  const loc = geocodedForm.location;

  const host = resolveOrganizerContact(geocodedForm);
  const anfitrion = resolveAnfitrionContact(geocodedForm);
  const { lat, lng, direccion, ciudad, departamento, ubicacion, pais } = buildPersistedLocationFields(loc);

  const wizardExtras = buildWizardExtras(geocodedForm);

  const eventResult = await createEvent({

    nombre: geocodedForm.name,

    descripcion: geocodedForm.description,

    fechaIni: toApiDate(geocodedForm.startDate),

    fechaFin: toApiDate(geocodedForm.endDate || geocodedForm.startDate),

    horaIni: geocodedForm.startTime,

    horaFin: geocodedForm.endTime,

    ubicacion,

    ciudad,

    latitude: lat,

    longitude: lng,

    pais,

    aforo: geocodedForm.capacity,

    tipoEvento: geocodedForm.type,

    Categoria: resolveCategoryId(geocodedForm.category),

    tipoLugar: loc.customType || undefined,

    modalidadEvt: geocodedForm.modality === 'virtual' ? 'V' : 'P',

    clase: geocodedForm.eventClass === 'private' ? 'P' : 'A',

    video: geocodedForm.videoUrl || undefined,

    Hashtags: geocodedForm.tags?.length ? geocodedForm.tags.join(',') : undefined,

    userId,

    organizerName: host.name || '',

    email: host.email || '',

    TelPrin: host.phone || '',

    IndicativoTelPrinOrg: host.countryCode || '+57',

    anfitrioName: anfitrion.name || '',

    emailAnf: anfitrion.email || '',

    TelPrinAnf: anfitrion.phone || '',

    IndicativoTelPrinAnf: anfitrion.countryCode || '+57',

    direccion,

    departamento,

    skipVenue: true,

    categoriaReembolso: refundPolicyToApi(geocodedForm.refundPolicy),

    ...wizardExtras,

  });



  const eventId = eventResult.data?.id;

  if (!eventId) throw new Error('No se recibió el ID del evento');

  await syncEventVenueFromForm(eventId, geocodedForm, userId, { includeLayoutUpdate: true });

  const coverUrl = await uploadFormImages(eventId, geocodedForm, userId)
    ?? youtubeThumbnailFromUrl(geocodedForm.videoUrl);
  await syncEventCoverImage(eventId, coverUrl, userId);

  try {
    await persistRefundPolicy(eventId, geocodedForm.refundPolicy);
  } catch {
    // categoriaReembolso ya se envió en createEvent cuando aplica.
  }
  await persistEventPromoCodes(eventId, geocodedForm);

  try {
    await persistStaffAccessFromForm(eventId, geocodedForm);
  } catch {
    // no bloquear publicación
  }

  if (options.publish) {
    await publishEvent(eventId);
    await repairEventTicketDistributions(eventId);
    invalidateEventsCache();
    invalidateServicesCache();
    invalidateDiscoverCache();
    invalidateProfileHeaderCache(userId);
    emitNotificationsUpdated();
  } else {
    invalidateEventsCache();
    invalidateProfileHeaderCache(userId);
  }

  return eventId;
}

export type LovableEventEditSaveResult = {
  eventId: string;
  venueSyncWarning?: string;
};

async function persistStaffAccessFromForm(
  eventId: string,
  form: EventFormData,
): Promise<void> {
  const loc = form.location;
  const accessControl = form.accessControl || {};
  const gateEntries = Object.entries(accessControl).filter(([, users]) => users?.length);
  if (!gateEntries.length) return;

  const gateNameById = new Map((loc.gates || []).map((gate) => [gate.id, gate.name]));
  const venueId = loc.selectedVenueId || eventId;
  await saveStaffAssignments({
    eventId,
    eventName: form.name,
    venueId,
    venueName: loc.customName || form.name,
    accessControl: gateEntries.map(([gateId, assignedUsers]) => ({
      gateId,
      gateName: gateNameById.get(gateId),
      assignedUsers,
    })),
  });
}

/** Actualiza un evento publicado o en borrador sin cambiar su estatus ni republicar. */
export async function updateLovableEventFromEdit(
  eventId: string,
  form: EventFormData,
  userId: string,
  options: {
    includeLayoutUpdate?: boolean;
    skipVenueSync?: boolean;
    persistStaffAccess?: boolean;
  } = {},
): Promise<LovableEventEditSaveResult> {
  assertRefundPolicyConfigured(form);
  const geocodedForm = await withGeocodedLocation({ ...form, persistedEventId: eventId });
  const loc = geocodedForm.location;
  const host = resolveOrganizerContact(geocodedForm);
  const anfitrion = resolveAnfitrionContact(geocodedForm);
  const { lat, lng, direccion, ciudad, departamento, ubicacion, pais } = buildPersistedLocationFields(loc);

  await updateEvent(eventId, {
    nombre: geocodedForm.name,
    descripcion: geocodedForm.description,
    fechaIni: toApiDate(geocodedForm.startDate),
    fechaFin: toApiDate(geocodedForm.endDate || geocodedForm.startDate),
    horaIni: geocodedForm.startTime,
    horaFin: geocodedForm.endTime,
    ubicacion,
    ciudad,
    direccion,
    latitude: lat,
    longitude: lng,
    pais,
    departamento,
    aforo: geocodedForm.capacity,
    tipoEvento: geocodedForm.type || undefined,
    Categoria: resolveCategoryId(geocodedForm.category),
    tipoLugar: loc.customType || undefined,
    modalidadEvt: geocodedForm.modality === 'virtual' ? 'V' : 'P',
    clase: geocodedForm.eventClass === 'private' ? 'P' : 'A',
    video: geocodedForm.videoUrl || undefined,
    organizerName: host.name || '',
    email: host.email || '',
    anfitrioName: anfitrion.name || '',
    emailAnf: anfitrion.email || '',
    TelPrinAnf: anfitrion.phone || '',
    IndicativoTelPrinAnf: anfitrion.countryCode || '+57',
    skipVenue: true,
    categoriaReembolso: refundPolicyToApi(geocodedForm.refundPolicy),
    ...buildWizardExtras(geocodedForm),
  }, userId);

  try {
    const coverUrl = await uploadFormImages(eventId, geocodedForm, userId)
      ?? youtubeThumbnailFromUrl(geocodedForm.videoUrl);
    await syncEventCoverImage(eventId, coverUrl, userId);
  } catch {
    // Imágenes opcionales: no bloquear guardado de metadatos en edición.
  }
  try {
    await persistRefundPolicy(eventId, geocodedForm.refundPolicy);
  } catch {
    // categoriaReembolso ya viaja en updateEvent.
  }
  await persistEventPromoCodes(eventId, geocodedForm, { throwOnError: true });
  let venueSyncWarning: string | undefined;
  if (!options.skipVenueSync) {
    try {
      await syncEventVenueFromForm(eventId, geocodedForm, userId, {
        includeLayoutUpdate: options.includeLayoutUpdate === true,
      });
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'No se pudo actualizar la boletería / silletería';
      // En edición con layout, fallar el guardado: el toast de éxito mentiría sobre precios.
      if (options.includeLayoutUpdate) {
        throw new Error(message);
      }
      venueSyncWarning = message;
    }
  }
  if (options.persistStaffAccess) {
    try {
      await persistStaffAccessFromForm(eventId, geocodedForm);
    } catch (err) {
      const staffMessage = err instanceof Error ? err.message : 'No se pudo guardar el control de acceso';
      venueSyncWarning = venueSyncWarning
        ? `${venueSyncWarning}. ${staffMessage}`
        : staffMessage;
    }
  }
  return { eventId, venueSyncWarning };
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
  assertRefundPolicyConfigured(form);
  if (eventPublishInFlight) return eventPublishInFlight;
  eventPublishInFlight = (async () => {
    const [sub, backendLimit] = await Promise.all([
      fetchSubscriptionStatus(userId).catch(() => null),
      checkPublishLimit(userId, 'event').catch(() => null),
    ]);

    if (backendLimit && !backendLimit.allowed) {
      throw new Error(
        backendLimit.reason || 'Has alcanzado el límite de eventos en tu plan.',
      );
    }

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


