import { getAuthToken, getCurrentEnv } from './client';
import { toUserFacingError } from '../lib/apiError';
import { newWizardId } from '../lib/seatGridBuilder';
import {
  buildNearbyVenuesCacheKey,
  cacheNearbyVenues,
  cacheVenueDetail,
  getCachedNearbyVenues,
  getCachedVenueDetail,
  isVenueDetailCacheFresh,
} from '../lib/venuesCache';
import { revalidateOnce } from '../lib/wallCacheRevalidate';
import type {
  EventWizardState,
  SavedVenueSummary,
  WizardCategory,
  WizardFloor,
  WizardGate,
  WizardSeat,
} from '../types/venueWizard';
import type { FloorPlanGeometry, WizardElement } from '../types/floorPlan';

export interface CreateVenueInput {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  department?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateVenueForEventInput {
  name: string;
  ownerUserId: string;
  eventId: string;
  hasSeating: boolean;
  capacity: number;
  address?: string;
  city?: string;
  department?: string;
  country?: string;
  description?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  isTemplate?: boolean;
  /** Tipo de lugar legible (se guarda en tags / type). */
  placeType?: string;
  gates: WizardGate[];
  floors: WizardFloor[];
}

export interface NearbyVenue {
  venueId: string;
  name: string;
  type?: string;
  capacity?: number;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  mainImage?: string | null;
  imageUrls?: string[];
  distance?: number | null;
  hasSeating?: boolean;
  ownerUserId?: string;
  amenities?: string;
  tags?: string;
  rating?: number;
  reviewCount?: number;
  likeCount?: number;
  status?: string;
  isTemplate?: boolean;
  isEventVenue?: boolean;
  eventId?: string;
  baseVenueId?: string;
}

export interface VenueCalification {
  id: string;
  venueId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  authorName?: string;
  authorAvatar?: string | null;
  authorUsername?: string | null;
}

export interface PublishRentalPlaceInput {
  name: string;
  ownerUserId: string;
  hasSeating: boolean;
  capacity: number;
  placeType?: string;
  address?: string;
  city?: string;
  department?: string;
  country?: string;
  description?: string;
  latitude?: number | null;
  longitude?: number | null;
  parking?: boolean;
  features?: string[];
  pricing?: {
    perDay?: string;
    perMultiDay?: string;
    perWeek?: string;
    perMonth?: string;
    currency?: string;
  };
  rentalUnit?: 'day' | 'month';
  datePrices?: Record<string, { price?: string; blocked?: boolean }>;
  promoCodes?: Array<{
    id: string;
    currency: string;
    value: number;
    quantity: number;
    description: string;
    codes: string[];
  }>;
  videos?: string[];
  images?: Array<{ base64: string; fileName: string }>;
  imageUrls?: string[];
  galleryImageImports?: Array<{ imageId?: string; key?: string; url?: string }>;
  selectedDates?: string[];
  blockedDates?: string[];
  globalStartTime?: string;
  globalEndTime?: string;
  bookingPreference?: 'instant' | 'approval';
  refundPolicy?: string;
  directions?: string;
  nearbyReferences?: Array<{ name: string; type: string; distance: string }>;
  addonServices?: import('../data/venueAddonServices').VenueAddonService[];
  facilities?: Array<{ id: string; count: number }>;
  allowedEventTypes?: string[];
  accessibility?: Array<string | { id: string; label: string }>;
  security?: Array<string | { id: string; label: string }>;
  includedServices?: Array<string | { id: string; label: string }>;
  chargeType?: string;
  calendarWeekdays?: number[];
  calendarMonths?: number[];
  hostRole?: string;
  faqs?: Array<{ id?: string; question: string; answer: string }>;
  neighborhood?: string;
  gates: WizardGate[];
  floors: WizardFloor[];
  status?: 'active' | 'draft';
}

function buildVenueAmenitiesJson(input: PublishRentalPlaceInput): string {
  return JSON.stringify({
    parking: Boolean(input.parking),
    features: input.features || [],
    pricing: input.pricing || {},
    rentalUnit: input.rentalUnit || 'day',
    datePrices: input.datePrices || {},
    promoCodes: input.promoCodes || [],
    videos: input.videos || [],
    listingType: 'rental',
    availability: {
      selectedDates: input.selectedDates || [],
      blockedDates: input.blockedDates || [],
      datePrices: input.datePrices || {},
      globalStartTime: input.globalStartTime || '08:00',
      globalEndTime: input.globalEndTime || '22:00',
    },
    bookingPreference: input.bookingPreference || 'instant',
    refundPolicy: input.refundPolicy || '',
    directions: input.directions || '',
    nearbyReferences: input.nearbyReferences || [],
    addonServices: input.addonServices || [],
    facilities: input.facilities || [],
    allowedEventTypes: input.allowedEventTypes || [],
    includedServices: input.includedServices || [],
    accessibility: input.accessibility || [],
    security: input.security || [],
    chargeType: input.chargeType || 'Por día',
    calendarWeekdays: input.calendarWeekdays || [],
    calendarMonths: input.calendarMonths || [],
    hostRole: input.hostRole || '',
    faqs: input.faqs || [],
    neighborhood: input.neighborhood || '',
  });
}

function venuesBase(): string {
  return getCurrentEnv().endpoints.createVenue;
}

function venueItemBase(): string {
  return `${getCurrentEnv().apiBaseUrl}/venues/venues`;
}

function extractVenueId(body: Record<string, unknown>): string | undefined {
  const nested = body.venue as Record<string, unknown> | undefined;
  const fromNested = nested?.venueId ?? nested?.id;
  if (fromNested) return String(fromNested);
  if (body.venueId) return String(body.venueId);
  if (body.id) return String(body.id);
  return undefined;
}

export interface VenueSeatDetail {
  seatId?: string;
  seatCode?: string;
  rowLabel?: string;
  colNumber?: number;
  status?: string;
}

export interface VenueCategoryDetail {
  categoryId: string;
  name: string;
  color?: string;
  relX: number;
  relY: number;
  width: number;
  height: number;
  geometry?: string;
  rotation?: number;
  ringThickness?: number;
  rows?: number;
  seatsPerRow?: number;
  colOrder?: 'asc' | 'desc';
  rowOrder?: 'asc' | 'desc';
  labelDx?: number;
  labelDy?: number;
  labelRotation?: number;
  seats?: VenueSeatDetail[];
}

export interface VenueElementDetail {
  elementId: string;
  name: string;
  geometry?: string;
  relX: number;
  relY: number;
  width: number;
  height: number;
  rotation?: number;
  ringThickness?: number;
  notes?: string;
}

export interface VenueFloorDetail {
  floorId: string;
  name: string;
  categories?: VenueCategoryDetail[];
  elements?: VenueElementDetail[];
}

export interface VenueDetail {
  venueId?: string;
  name?: string;
  ownerUserId?: string;
  coAdminIds?: string[];
  rating?: number;
  reviewCount?: number;
  likeCount?: number;
  floors?: VenueFloorDetail[];
  images?: string;
  imageUrls?: string[];
  mainImage?: string | null;
  amenities?: string;
  address?: string;
  city?: string;
  department?: string;
  country?: string;
  capacity?: number;
  description?: string;
  hasSeating?: boolean;
  tags?: string;
  type?: string;
  latitude?: number;
  longitude?: number;
}

export function extractVenueImageUrls(venue: Record<string, unknown>): string[] {
  const urls: string[] = [];
  const push = (raw?: unknown) => {
    const value = String(raw || '').trim();
    if (value) urls.push(value);
  };

  const rawImages = venue.images;
  if (Array.isArray(rawImages)) {
    rawImages.forEach((entry) => push(entry));
  } else if (typeof rawImages === 'string' && rawImages.trim()) {
    rawImages.split(',').forEach((url) => push(url));
  }

  if (Array.isArray(venue.imageUrls)) {
    venue.imageUrls.forEach((entry) => push(entry));
  }
  push(venue.mainImage);

  const amenitiesRaw = venue.amenities;
  if (typeof amenitiesRaw === 'string' && amenitiesRaw.trim()) {
    try {
      const amenities = JSON.parse(amenitiesRaw) as { gallery?: unknown[] };
      if (Array.isArray(amenities.gallery)) {
        for (const entry of amenities.gallery) {
          if (typeof entry === 'string') push(entry);
          else if (entry && typeof entry === 'object') {
            const item = entry as Record<string, unknown>;
            push(item.url || item.imageUrl || item.publicUrl || item.signedUrl);
          }
        }
      }
    } catch {
      // ignore malformed amenities JSON
    }
  } else if (amenitiesRaw && typeof amenitiesRaw === 'object') {
    const gallery = (amenitiesRaw as { gallery?: unknown[] }).gallery;
    if (Array.isArray(gallery)) {
      for (const entry of gallery) {
        if (typeof entry === 'string') push(entry);
        else if (entry && typeof entry === 'object') {
          const item = entry as Record<string, unknown>;
          push(item.url || item.imageUrl || item.publicUrl || item.signedUrl);
        }
      }
    }
  }

  return [...new Set(urls)];
}

export function parseVenueDetail(body: Record<string, unknown>): VenueDetail {
  const venue = (body.venue || body) as VenueDetail & Record<string, unknown>;
  const raw = venue as Record<string, unknown>;
  const imageUrls = extractVenueImageUrls(raw);
  return {
    ...venue,
    venueId: String(venue.venueId || raw.venue_id || extractVenueId(body) || ''),
    ownerUserId: String(venue.ownerUserId || raw.owner_user_id || raw.ownerUserId || ''),
    coAdminIds: Array.isArray(venue.coAdminIds) ? venue.coAdminIds.map(String) : [],
    rating: venue.rating != null ? Number(venue.rating) : undefined,
    reviewCount: venue.reviewCount != null ? Number(venue.reviewCount) : undefined,
    likeCount: venue.likeCount != null ? Number(venue.likeCount) : undefined,
    floors: venue.floors || [],
    imageUrls: imageUrls.length ? imageUrls : venue.imageUrls,
    mainImage: imageUrls[0] || (venue.mainImage ? String(venue.mainImage) : undefined),
    images: imageUrls.length ? imageUrls.join(',') : venue.images,
  };
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

export async function createVenue(input: CreateVenueInput): Promise<{ venueId?: string; id?: string }> {
  const response = await fetch(getCurrentEnv().endpoints.createVenue, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      name: input.name,
      description: input.description,
      address: input.address,
      city: input.city,
      department: input.department,
      country: input.country || 'Colombia',
      latitude: input.latitude,
      longitude: input.longitude,
    }),
  });

  const body = await response.json().catch(() => ({})) as {
    venueId?: string;
    id?: string;
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(body.message || body.error || 'No se pudo publicar el sitio');
  }

  return body;
}

function mapCategoryToPayload(
  category: WizardCategory,
  gates: WizardGate[],
  hasSeating: boolean,
) {
  const gate = gates.find((g) => g.gateId === category.gateId);
  const disabledSeats = hasSeating
    ? [
        ...new Set([
          ...category.seats
            .filter((seat) => seat.status && seat.status !== 'available')
            .map((seat) => seat.seatCode),
          ...(category.disabledSeats || []),
        ]),
      ]
    : [];
  const useGridPayload = hasSeating
    && (category.rows ?? 0) > 0
    && (category.seatsPerRow ?? 0) > 0;

  return {
    categoryId: category.categoryId,
    name: category.name,
    color: category.color,
    relX: category.relX,
    relY: category.relY,
    width: category.width,
    height: category.height,
    geometry: category.geometry || 'RECTANGLE',
    rotation: category.rotation ?? 0,
    labelDx: category.labelDx,
    labelDy: category.labelDy,
    labelRotation: category.labelRotation,
    zIndex: category.zIndex ?? 0,
    ringThickness: category.ringThickness ?? 55,
    rows: category.rows,
    seatsPerRow: category.seatsPerRow,
    colOrder: category.colOrder,
    rowOrder: category.rowOrder,
    description: category.description,
    gateId: category.gateId || null,
    gateName: gate?.name || '',
    hasPrice: category.isPaid,
    costo: category.isPaid,
    valor: category.price,
    moneda: category.currency,
    disabledSeats: useGridPayload ? disabledSeats : undefined,
    seats: hasSeating
      ? (useGridPayload
          ? []
          : category.seats.map((seat: WizardSeat) => ({
              seatId: seat.seatId,
              rowLabel: seat.rowLabel,
              colNumber: seat.colNumber,
              seatCode: seat.seatCode,
              ...(seat.status !== 'available' ? { status: seat.status } : {}),
              ...(seat.isAccessible ? { isAccessible: seat.isAccessible } : {}),
            })))
      : [],
    ticketCategory: {
      categoria: category.name,
      id: category.categoryId,
      cantidadTickets: hasSeating ? category.seats.length : category.rows * category.seatsPerRow || 100,
      moneda: category.currency,
      costo: category.isPaid,
      valor: category.price,
      descripcion: category.description,
      color: category.color,
    },
  };
}

function mapElementToPayload(element: WizardFloor['elements'][number]) {
  return {
    elementId: element.elementId,
    name: element.name,
    type: element.type,
    geometry: element.geometry,
    relX: element.relX,
    relY: element.relY,
    width: element.width,
    height: element.height,
    rotation: element.rotation ?? 0,
    zIndex: element.zIndex ?? 0,
    ringThickness: element.ringThickness ?? 55,
    horseshoeCurvature: element.ringThickness ?? 55,
    notes: element.notes || '',
  };
}

function buildVenueFloorsPayload(
  floors: WizardFloor[],
  gates: WizardGate[],
  hasSeating: boolean,
) {
  return floors.map((floor) => ({
    floorId: floor.floorId,
    name: floor.name,
    description: floor.description,
    elements: (floor.elements || []).map(mapElementToPayload),
    categories: floor.categories.map((cat: WizardCategory) => mapCategoryToPayload(cat, gates, hasSeating)),
  }));
}

export async function publishRentalPlace(
  input: PublishRentalPlaceInput,
): Promise<{ venueId?: string; id?: string; message?: string }> {
  const hasSeating = input.hasSeating;
  const amenities = buildVenueAmenitiesJson(input);

  const payload = {
    name: input.name,
    ownerUserId: input.ownerUserId,
    hasSeating,
    capacity: input.capacity,
    address: input.address || '',
    city: input.city || '',
    department: input.department || '',
    country: input.country || 'Colombia',
    description: input.description || '',
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    isTemplate: true,
    type: input.placeType || 'venue',
    tags: input.placeType || '',
    amenities,
    visibility: 'public',
    status: input.status || 'active',
    images: [
      ...(input.imageUrls || []),
      ...(input.images || []),
    ],
    gates: input.gates.map((gate) => ({
      gateId: gate.gateId,
      gateNumber: gate.gateNumber,
      name: gate.name,
      description: gate.description,
    })),
    floors: buildVenueFloorsPayload(input.floors, input.gates, hasSeating),
  };

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), 120_000)
    : undefined;

  let response: Response;
  try {
    response = await fetch(venuesBase(), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
      signal: controller?.signal,
    });
  } catch (err) {
    const isTimeout = err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError');
    throw new Error(
      isTimeout
        ? 'La publicación del lugar tardó demasiado. Intenta de nuevo.'
        : 'No se pudo conectar con el servidor al publicar el lugar.',
    );
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }

  const body = await response.json().catch(() => ({})) as Record<string, unknown> & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(body.message || body.error || 'No se pudo publicar el lugar');
  }

  const venueId = extractVenueId(body);
  return { ...body, venueId, id: venueId, message: body.message as string | undefined };
}

/** Busca lugares publicados activos por nombre, ciudad, tipo o dirección. */
export async function searchVenues(query: string, limit = 40): Promise<NearbyVenue[]> {
  const term = query.trim().toLowerCase();
  if (!term) return [];

  let response: Response;
  try {
    const params = new URLSearchParams({
      status: 'active',
      limit: String(Math.min(Math.max(limit * 3, 50), 100)),
    });
    response = await fetch(`${venueItemBase()}?${params}`, { headers: authHeaders() });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la búsqueda de lugares'));
  }

  const body = await response.json().catch(() => ({})) as {
    venues?: Array<Record<string, unknown>>;
    message?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(body.message || body.error || 'No se pudieron buscar lugares');
  }

  return mapVenueRecords(body.venues || [])
    .filter((venue) => {
      const haystack = [
        venue.name,
        venue.city,
        venue.address,
        venue.type,
        venue.tags,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(term);
    })
    .slice(0, limit);
}

export async function fetchNearbyVenues(
  lat: number,
  lng: number,
  maxKm = 50,
  limit = 40,
  options?: { forceNetwork?: boolean },
): Promise<NearbyVenue[]> {
  const cacheKey = buildNearbyVenuesCacheKey(lat, lng, maxKm, limit);
  if (!options?.forceNetwork) {
    const cached = getCachedNearbyVenues(cacheKey, true);
    if (cached) return cached;
  }
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    maxDistance: String(maxKm),
    limit: String(limit),
    status: 'active',
  });
  const response = await fetch(`${venueItemBase()}?${params}`, { headers: authHeaders() });
  const body = await response.json().catch(() => ({})) as {
    venues?: Array<Record<string, unknown>>;
    message?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(body.message || body.error || 'No se pudieron cargar lugares cercanos');
  }
  const venues = mapVenueRecords(body.venues || []);
  const { filterByOwnerPrivacyFailOpen } = await import('../lib/privacyVisibility');
  const { getStoredUserId } = await import('./authService');
  const visible = await filterByOwnerPrivacyFailOpen(
    venues,
    (v) => v.ownerUserId,
    getStoredUserId(),
    2500,
  );
  cacheNearbyVenues(cacheKey, visible);
  return visible;
}

function mapVenueRecords(records: Array<Record<string, unknown>>): NearbyVenue[] {
  return records.map((v) => {
    const parsedImages = extractVenueImageUrls(v);
    const imageUrls = Array.isArray(v.imageUrls)
      ? v.imageUrls.map(String).filter(Boolean)
      : parsedImages;
    const mainImage = v.mainImage
      ? String(v.mainImage)
      : imageUrls[0] || null;
    return {
      venueId: String(v.venue_id || v.venueId || ''),
      name: String(v.name || 'Lugar'),
      type: String(v.type || v.tags || ''),
      capacity: Number(v.capacity || 0),
      city: v.city ? String(v.city) : undefined,
      address: v.address ? String(v.address) : undefined,
      latitude: v.latitude != null ? Number(v.latitude) : undefined,
      longitude: v.longitude != null ? Number(v.longitude) : undefined,
      mainImage,
      imageUrls: imageUrls.length ? imageUrls : undefined,
      distance: v.distance != null ? Number(v.distance) : null,
      hasSeating: Boolean(v.hasSeating),
      ownerUserId: v.ownerUserId ? String(v.ownerUserId) : undefined,
      amenities: v.amenities ? String(v.amenities) : undefined,
      tags: v.tags ? String(v.tags) : undefined,
      rating: v.rating != null ? Number(v.rating) : undefined,
      reviewCount: v.reviewCount != null ? Number(v.reviewCount) : undefined,
      likeCount: v.likeCount != null ? Number(v.likeCount) : undefined,
      status: v.status ? String(v.status) : undefined,
      isTemplate: v.isTemplate === true || v.is_template === true
        ? true
        : (v.isTemplate === false || v.is_template === false ? false : undefined),
      isEventVenue: Boolean(v.isEventVenue ?? v.is_event_venue),
      eventId: v.eventId ? String(v.eventId) : v.event_id ? String(v.event_id) : undefined,
      baseVenueId: v.baseVenueId ? String(v.baseVenueId) : v.base_venue_id ? String(v.base_venue_id) : undefined,
    };
  }).filter((v) => v.venueId);
}

/** Lugares publicados por el usuario (excluye clones ligados a un evento). */
export function isOwnerRentalVenueRecord(venue: {
  isEventVenue?: boolean;
  eventId?: string;
  baseVenueId?: string;
  isTemplate?: boolean;
  status?: string;
}): boolean {
  if (venue.isEventVenue || venue.eventId) return false;
  if (venue.baseVenueId) return false;
  const status = String(venue.status || '').trim().toLowerCase();
  if (status === 'deleted' || status === 'archived') return false;
  if (venue.isTemplate === true) return false;
  return true;
}

export function filterOwnerProfileVenues(venues: NearbyVenue[]): NearbyVenue[] {
  return venues.filter(isOwnerRentalVenueRecord);
}

async function requestOwnerVenues(
  ownerUserId: string,
  query: Record<string, string>,
): Promise<NearbyVenue[]> {
  const params = new URLSearchParams({ ownerUserId, limit: '100', ...query });
  const response = await fetch(`${venueItemBase()}?${params}`, { headers: authHeaders() });
  const body = await response.json().catch(() => ({})) as {
    venues?: Array<Record<string, unknown>>;
    message?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(body.message || body.error || 'No se pudieron cargar tus lugares');
  }
  return mapVenueRecords(body.venues || []);
}

export async function fetchOwnerProfileVenues(ownerUserId: string): Promise<NearbyVenue[]> {
  const ownedVenues = await requestOwnerVenues(ownerUserId, {});
  return filterOwnerProfileVenues(ownedVenues);
}

export async function fetchOwnerRentalVenues(ownerUserId: string): Promise<NearbyVenue[]> {
  const params = new URLSearchParams({
    ownerUserId,
    limit: '50',
    status: 'active',
  });
  const response = await fetch(`${venueItemBase()}?${params}`, { headers: authHeaders() });
  const body = await response.json().catch(() => ({})) as {
    venues?: Array<Record<string, unknown>>;
    message?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(body.message || body.error || 'No se pudieron cargar tus lugares');
  }
  return mapVenueRecords(body.venues || []);
}

function mergeVenueImageFields(base: NearbyVenue, incoming: NearbyVenue): NearbyVenue {
  const mergedUrls = [
    ...extractVenueImageUrls(base as unknown as Record<string, unknown>),
    ...extractVenueImageUrls(incoming as unknown as Record<string, unknown>),
  ];
  const imageUrls = [...new Set(mergedUrls)];
  const mainImage = base.mainImage || incoming.mainImage || imageUrls[0] || null;
  return {
    ...base,
    ...incoming,
    mainImage,
    imageUrls: imageUrls.length ? imageUrls : undefined,
  };
}

export function mergeVenuesById(primary: NearbyVenue[], extra: NearbyVenue[]): NearbyVenue[] {
  const order: string[] = [];
  const byId = new Map<string, NearbyVenue>();

  const upsert = (venue: NearbyVenue) => {
    if (!venue.venueId) return;
    const existing = byId.get(venue.venueId);
    if (!existing) {
      order.push(venue.venueId);
      byId.set(venue.venueId, venue);
      return;
    }
    byId.set(venue.venueId, mergeVenueImageFields(existing, venue));
  };

  primary.forEach(upsert);
  extra.forEach(upsert);
  return order.map((id) => byId.get(id)!);
}

export async function hydrateMissingVenueImages(venues: NearbyVenue[]): Promise<NearbyVenue[]> {
  const missing = venues.filter(
    (venue) => !extractVenueImageUrls(venue as unknown as Record<string, unknown>).length,
  );
  if (!missing.length) return venues;

  const hydrated = new Map<string, { mainImage: string; imageUrls: string[] }>();
  await Promise.all(missing.map(async (venue) => {
    try {
      const detail = await getVenueById(venue.venueId);
      const urls = extractVenueImageUrls(detail as unknown as Record<string, unknown>);
      if (!urls.length) return;
      hydrated.set(venue.venueId, {
        mainImage: urls[0],
        imageUrls: urls,
      });
    } catch {
      // ignore per-venue fetch errors
    }
  }));

  if (!hydrated.size) return venues;
  return venues.map((venue) => {
    const patch = hydrated.get(venue.venueId);
    if (!patch) return venue;
    return {
      ...venue,
      mainImage: patch.mainImage,
      imageUrls: patch.imageUrls,
    };
  });
}

export async function createVenueForEvent(
  input: CreateVenueForEventInput,
): Promise<{ venueId?: string; id?: string; message?: string }> {
  const hasSeating = input.hasSeating;
  const floorsPayload = buildVenueFloorsPayload(input.floors, input.gates, hasSeating);

  const payload = {
    name: input.name,
    ownerUserId: input.ownerUserId,
    eventId: input.eventId,
    hasSeating,
    capacity: input.capacity,
    address: input.address || '',
    city: input.city || '',
    department: input.department || '',
    country: input.country || 'Colombia',
    description: input.description || '',
    phone: input.phone || '',
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    isTemplate: Boolean(input.isTemplate),
    type: input.placeType || 'venue',
    tags: input.placeType || '',
    status: 'draft',
    gates: input.gates.map((gate) => ({
      gateId: gate.gateId,
      gateNumber: gate.gateNumber,
      name: gate.name,
      description: gate.description,
    })),
    floors: floorsPayload,
  };

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), 120_000)
    : undefined;

  let response: Response;
  try {
    response = await fetch(venuesBase(), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
      signal: controller?.signal,
    });
  } catch (err) {
    const isTimeout = err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError');
    throw new Error(
      isTimeout
        ? 'La creación del lugar tardó demasiado. Intenta de nuevo o reduce la cantidad de zonas/asientos.'
        : 'No se pudo conectar con el servidor al crear el lugar. Verifica tu conexión e intenta de nuevo.',
    );
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }

  const body = await response.json().catch(() => ({})) as Record<string, unknown> & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(body.message || body.error || 'No se pudo crear el lugar con silletería');
  }

  const venueId = extractVenueId(body);
  return { ...body, venueId, id: venueId, message: body.message as string | undefined };
}

export async function likeVenue(
  venueId: string,
  userId: string,
  like = true,
): Promise<{ liked: boolean; likeCount: number }> {
  const response = await fetch(`${venueItemBase()}/${encodeURIComponent(venueId)}/like`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId, like }),
  });
  const body = await response.json().catch(() => ({})) as {
    liked?: boolean;
    likeCount?: number;
    error?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(body.error || body.message || 'No se pudo actualizar el me gusta');
  }
  return { liked: Boolean(body.liked), likeCount: Number(body.likeCount || 0) };
}

export async function fetchVenueLikedByUser(
  venueId: string,
  userId: string,
): Promise<boolean> {
  const response = await fetch(
    `${venueItemBase()}/${encodeURIComponent(venueId)}/like/user/${encodeURIComponent(userId)}`,
    { headers: authHeaders() },
  );
  const body = await response.json().catch(() => ({})) as { liked?: boolean };
  if (!response.ok) return false;
  return Boolean(body.liked);
}

export async function fetchLikedVenueIds(
  userId: string,
  venueIds: string[],
): Promise<Set<string>> {
  const unique = [...new Set(venueIds.filter(Boolean))];
  if (!unique.length || !userId) return new Set();
  const results = await Promise.all(
    unique.map(async (id) => {
      const liked = await fetchVenueLikedByUser(id, userId).catch(() => false);
      return liked ? id : null;
    }),
  );
  return new Set(results.filter(Boolean) as string[]);
}

export async function rateVenue(input: {
  venueId: string;
  userId: string;
  rating: number;
  comment?: string;
}): Promise<{ rating: number; reviewCount: number }> {
  const response = await fetch(
    `${venueItemBase()}/${encodeURIComponent(input.venueId)}/rate`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input),
    },
  );
  const body = await response.json().catch(() => ({})) as {
    rating?: number;
    reviewCount?: number;
    error?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(body.error || body.message || 'No se pudo calificar el lugar');
  }
  return {
    rating: Number(body.rating || input.rating),
    reviewCount: Number(body.reviewCount || 0),
  };
}

export async function fetchVenueCalifications(
  venueId: string,
  limit = 20,
): Promise<VenueCalification[]> {
  const response = await fetch(
    `${venueItemBase()}/${encodeURIComponent(venueId)}/califications?limit=${limit}`,
    { headers: authHeaders() },
  );
  const body = await response.json().catch(() => ({})) as {
    califications?: VenueCalification[];
    error?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(body.error || body.message || 'No se pudieron cargar las calificaciones');
  }
  return body.califications || [];
}

export type UpdateRentalVenueInput = Omit<
  PublishRentalPlaceInput,
  'ownerUserId' | 'gates' | 'floors'
> & {
  userId: string;
  venueId?: string;
};

export async function updateVenueLayout(
  venueId: string,
  input: {
    userId: string;
    eventId?: string;
    hasSeating?: boolean;
    floors: WizardFloor[];
    gates?: WizardGate[];
  },
): Promise<void> {
  try {
    const hasSeating = input.hasSeating ?? true;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const timeoutId = controller
      ? window.setTimeout(() => controller.abort(), 120_000)
      : undefined;
    let response: Response;
    try {
      response = await fetch(`${venueItemBase()}/${encodeURIComponent(venueId)}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          userId: input.userId,
          updatedBy: input.userId,
          ...(input.eventId ? { eventId: input.eventId } : {}),
          hasSeating,
          floors: buildVenueFloorsPayload(input.floors, input.gates || [], hasSeating),
          gates: (input.gates || []).map((gate) => ({
            gateId: gate.gateId,
            gateNumber: gate.gateNumber,
            name: gate.name,
            description: gate.description,
          })),
        }),
        signal: controller?.signal,
      });
    } catch (err) {
      const isTimeout = err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError');
      throw new Error(
        isTimeout
          ? 'Guardar el mapa de silletería tardó demasiado. Intenta de nuevo en unos segundos.'
          : toUserFacingError(err, 'la actualización del mapa de silletería'),
      );
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
    const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
    if (!response.ok) {
      if (response.status === 504 || response.status === 502) {
        throw new Error(
          'Guardar el mapa de silletería tardó demasiado. Intenta de nuevo en unos segundos.',
        );
      }
      throw new Error(body.error || body.message || 'No se pudo actualizar el mapa de silletería');
    }
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la actualización del mapa de silletería'));
  }
}

export async function updateRentalVenue(
  venueId: string,
  input: UpdateRentalVenueInput,
): Promise<{ venueId: string }> {
  try {
    const response = await fetch(
      `${venueItemBase()}/${encodeURIComponent(venueId)}/listing`,
      {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(input),
      },
    );
    const body = await response.json().catch(() => ({})) as {
      venueId?: string;
      venue?: { venue_id?: string; venueId?: string };
      error?: string;
      message?: string;
    };
    if (!response.ok) {
      throw new Error(body.error || body.message || 'No se pudo actualizar el lugar');
    }
    return {
      venueId: body.venueId || body.venue?.venue_id || body.venue?.venueId || venueId,
    };
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la actualización del lugar'));
  }
}

export async function deleteVenue(venueId: string, ownerUserId: string): Promise<void> {
  try {
    const response = await fetch(`${venueItemBase()}/${encodeURIComponent(venueId)}`, {
      method: 'DELETE',
      headers: authHeaders(),
      body: JSON.stringify({ userId: ownerUserId, ownerUserId }),
    });
    const body = await response.json().catch(() => ({})) as { message?: string; error?: string };
    if (!response.ok) {
      throw new Error(body.error || body.message || 'No se pudo eliminar el lugar');
    }
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la eliminación del lugar'));
  }
}

export async function getVenueById(
  venueId: string,
  options?: { forceNetwork?: boolean },
): Promise<VenueDetail> {
  if (!options?.forceNetwork) {
    const cached = getCachedVenueDetail(venueId, true);
    if (cached) {
      if (!isVenueDetailCacheFresh(venueId)) {
        void revalidateOnce(`venue-detail:${venueId}`, async () => {
          try {
            const fresh = await requestVenueById(venueId);
            cacheVenueDetail(venueId, fresh as unknown as Record<string, unknown>);
          } catch {
            // background refresh must not break UI
          }
        });
      }
      return cached as unknown as VenueDetail;
    }
  }

  try {
    const detail = await requestVenueById(venueId);
    cacheVenueDetail(venueId, detail as unknown as Record<string, unknown>);
    return detail;
  } catch (err) {
    const stale = getCachedVenueDetail(venueId, true);
    if (stale) return stale as unknown as VenueDetail;
    throw new Error(toUserFacingError(err, 'la carga del lugar'));
  }
}

async function requestVenueById(venueId: string): Promise<VenueDetail> {
  const response = await fetch(`${venueItemBase()}/${encodeURIComponent(venueId)}`, {
    headers: authHeaders(),
  });
  const body = await response.json().catch(() => ({})) as Record<string, unknown> & { message?: string; error?: string };
  if (!response.ok) {
    throw new Error(body.message || body.error || 'No se pudo cargar el lugar');
  }
  return parseVenueDetail(body);
}

export async function listUserVenues(
  ownerUserId: string,
  options?: { isTemplate?: boolean },
): Promise<SavedVenueSummary[]> {
  const params = new URLSearchParams({ ownerUserId, limit: '50' });
  if (options?.isTemplate !== undefined) {
    params.set('isTemplate', String(options.isTemplate));
  }
  const response = await fetch(`${venueItemBase()}?${params}`, { headers: authHeaders() });
  const body = await response.json().catch(() => ({})) as {
    venues?: Array<{
      venue_id?: string;
      venueId?: string;
      name?: string;
      capacity?: number;
      city?: string;
      isTemplate?: boolean;
    }>;
    message?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(body.message || body.error || 'No se pudieron cargar los lugares guardados');
  }
  const rawVenues = body.venues || [];
  const templateById = new Map(
    rawVenues.map((v) => [String(v.venue_id || v.venueId || ''), Boolean(v.isTemplate)]),
  );
  let mapped = mapVenueRecords(rawVenues as Array<Record<string, unknown>>);
  mapped = await hydrateMissingVenueImages(mapped);
  return mapped.map((v) => ({
    venueId: v.venueId,
    name: v.name || 'Lugar sin nombre',
    capacity: v.capacity || undefined,
    city: v.city,
    address: v.address,
    isTemplate: templateById.get(v.venueId),
    mainImage: v.mainImage || v.imageUrls?.[0] || undefined,
    imageUrls: v.imageUrls,
  })).filter((v) => v.venueId);
}

export async function cloneVenueForEvent(input: {
  baseVenueId: string;
  eventId: string;
  name?: string;
  hasSeating?: boolean;
}): Promise<{ venueId?: string }> {
  const response = await fetch(`${venueItemBase()}/clone-for-event`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      baseVenueId: input.baseVenueId,
      eventId: input.eventId,
      name: input.name,
      hasSeating: input.hasSeating ?? true,
    }),
  });
  const body = await response.json().catch(() => ({})) as Record<string, unknown> & { message?: string; error?: string };
  if (!response.ok) {
    throw new Error(body.message || body.error || 'No se pudo reutilizar el lugar');
  }
  const venueId = extractVenueId(body);
  return { venueId, ...body };
}

export async function ensureEventTicketDistributions(eventId: string): Promise<{
  created?: number;
  alreadyExisted?: boolean;
  distributions?: number;
}> {
  const response = await fetch(
    `${venueItemBase()}/events/${encodeURIComponent(eventId)}/ensure-distributions`,
    {
      method: 'POST',
      headers: authHeaders(),
    },
  );
  const body = await response.json().catch(() => ({})) as {
    created?: number;
    alreadyExisted?: boolean;
    distributions?: number;
    message?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(body.message || body.error || 'No se pudieron generar las distribuciones de boletas');
  }
  return body;
}

function mapApiSeatToWizard(seat: Record<string, unknown>, idx: number): WizardSeat {
  return {
    seatId: String(seat.seatId || seat.seat_id || newWizardId()),
    rowLabel: String(seat.rowLabel || seat.row_label || 'A'),
    colNumber: Number(seat.colNumber || seat.col_number || idx + 1),
    seatCode: String(seat.seatCode || seat.seat_code || `S${idx + 1}`),
    seatType: (seat.seatType || seat.seat_type || 'standard') as WizardSeat['seatType'],
    status: (seat.status || 'available') as WizardSeat['status'],
    isAccessible: Boolean(seat.isAccessible || seat.is_accessible),
  };
}

const LARGE_SEATING_GRID = 256;

export function venueDetailToWizardState(venue: VenueDetail & Record<string, unknown>): {
  floors: WizardFloor[];
  gates: WizardGate[];
  venueForm: Partial<EventWizardState['venueForm']>;
  hasSeating: boolean;
} {
  const raw = venue as Record<string, unknown>;
  const floors = (venue.floors || []).map((floor) => ({
    floorId: floor.floorId || newWizardId(),
    name: floor.name || 'Planta',
    description: '',
    elements: (floor.elements || []).map((el) => {
      const rawEl = el as unknown as Record<string, unknown>;
      const elementId = el.elementId || newWizardId();
      return {
        id: elementId,
        elementId,
        kind: 'element' as const,
        name: el.name || 'Elemento',
        type: (rawEl.type || 'other') as WizardElement['type'],
        geometry: (el.geometry || 'RECTANGLE') as FloorPlanGeometry,
        relX: el.relX ?? 10,
        relY: el.relY ?? 10,
        width: el.width ?? 20,
        height: el.height ?? 15,
        rotation: el.rotation ?? 0,
        zIndex: Number(rawEl.zIndex ?? 1),
        locked: Boolean(rawEl.locked),
        ringThickness: el.ringThickness ?? 55,
        notes: String(rawEl.notes || ''),
      };
    }),
    categories: (floor.categories || []).map((cat, idx) => {
      const rawCat = cat as unknown as Record<string, unknown>;
      const rows = Number(cat.rows || 0);
      const seatsPerRow = Number(cat.seatsPerRow || 0);
      const gridSize = rows * seatsPerRow;
      const apiSeats = cat.seats || [];
      const useGridOnly = gridSize > LARGE_SEATING_GRID;
      return {
        categoryId: cat.categoryId || newWizardId(),
        name: cat.name || `Categoría ${idx + 1}`,
        color: cat.color || '#7C3AED',
        relX: cat.relX ?? 10,
        relY: cat.relY ?? 20,
        width: cat.width ?? 30,
        height: cat.height ?? 20,
        geometry: (cat.geometry || 'RECTANGLE') as FloorPlanGeometry,
        rotation: cat.rotation ?? 0,
        labelDx: typeof rawCat.labelDx === 'number' ? rawCat.labelDx : undefined,
        labelDy: typeof rawCat.labelDy === 'number' ? rawCat.labelDy : undefined,
        labelRotation: typeof rawCat.labelRotation === 'number' ? rawCat.labelRotation : undefined,
        zIndex: idx + 1,
        ringThickness: cat.ringThickness ?? 55,
        locked: false,
        gateId: String(rawCat.gateId || rawCat.gate_id || ''),
        rows: rows || 4,
        seatsPerRow: seatsPerRow || 5,
        seats: useGridOnly
          ? []
          : apiSeats.map((s, i) => mapApiSeatToWizard(s as Record<string, unknown>, i)),
        price: Number(rawCat.valor ?? rawCat.ticketPrice ?? 0) || 0,
        isPaid: Boolean(rawCat.costo ?? rawCat.hasPrice ?? false),
        currency: String(rawCat.moneda || 'COP'),
        description: String(rawCat.description || ''),
        colOrder: (rawCat.colOrder as 'asc' | 'desc') || 'asc',
        rowOrder: (rawCat.rowOrder as 'asc' | 'desc') || 'asc',
        disableSeatsEnabled: Boolean(rawCat.disableSeatsEnabled || (rawCat.disabledSeats as string[] | undefined)?.length),
        disabledSeats: Array.isArray(rawCat.disabledSeats)
          ? (rawCat.disabledSeats as string[])
          : [],
      };
    }),
  }));

  const gates = ((raw.gates as WizardGate[]) || []).map((g, i) => ({
    gateId: g.gateId || newWizardId(),
    gateNumber: g.gateNumber || i + 1,
    name: g.name || `Puerta ${i + 1}`,
    description: g.description || '',
  }));

  return {
    floors: floors.length ? floors : [{ floorId: newWizardId(), name: 'Planta baja', description: '', categories: [], elements: [] }],
    gates: gates.length ? gates : [{ gateId: newWizardId(), gateNumber: 1, name: 'Puerta principal', description: '' }],
    venueForm: {
      name: venue.name || '',
      capacity: String(raw.capacity || '100'),
      description: String(raw.description || ''),
      phone: String(raw.phone || raw.contactPhone || ''),
      address: String(raw.address || ''),
      city: String(raw.city || ''),
      latitude: raw.latitude != null ? String(raw.latitude) : '',
      longitude: raw.longitude != null ? String(raw.longitude) : '',
    },
    hasSeating: Boolean(raw.hasSeating ?? raw.has_seating ?? true),
  };
}

