import { getAuthToken, getCurrentEnv } from './client';
import { toUserFacingError } from '../lib/apiError';
import { newWizardId } from '../lib/seatGridBuilder';
import {
  buildNearbyVenuesCacheKey,
  cacheNearbyVenues,
  getCachedNearbyVenues,
} from '../lib/venuesCache';
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
  accessibility?: string[];
  security?: string[];
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
    videos: input.videos || [],
    listingType: 'rental',
    availability: {
      selectedDates: input.selectedDates || [],
      blockedDates: input.blockedDates || [],
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
    accessibility: input.accessibility || [],
    security: input.security || [],
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
  const rawImages = venue.images;
  if (Array.isArray(rawImages)) {
    return rawImages.map(String).filter(Boolean);
  }
  if (typeof rawImages === 'string' && rawImages.trim()) {
    return rawImages.split(',').map((url) => url.trim()).filter(Boolean);
  }
  if (Array.isArray(venue.imageUrls)) {
    return venue.imageUrls.map(String).filter(Boolean);
  }
  if (venue.mainImage) {
    return [String(venue.mainImage)];
  }
  return [];
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
    seats: hasSeating
      ? category.seats.map((seat: WizardSeat) => ({
          seatId: seat.seatId,
          rowLabel: seat.rowLabel,
          colNumber: seat.colNumber,
          seatCode: seat.seatCode,
          seatType: seat.seatType,
          status: seat.status,
          isAccessible: seat.isAccessible,
        }))
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
    isTemplate: 'true',
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
  cacheNearbyVenues(cacheKey, venues);
  return venues;
}

function mapVenueRecords(records: Array<Record<string, unknown>>): NearbyVenue[] {
  return records.map((v) => ({
    venueId: String(v.venue_id || v.venueId || ''),
    name: String(v.name || 'Lugar'),
    type: String(v.type || v.tags || ''),
    capacity: Number(v.capacity || 0),
    city: v.city ? String(v.city) : undefined,
    address: v.address ? String(v.address) : undefined,
    latitude: v.latitude != null ? Number(v.latitude) : undefined,
    longitude: v.longitude != null ? Number(v.longitude) : undefined,
    mainImage: v.mainImage ? String(v.mainImage) : null,
    imageUrls: Array.isArray(v.imageUrls) ? v.imageUrls.map(String) : undefined,
    distance: v.distance != null ? Number(v.distance) : null,
    hasSeating: Boolean(v.hasSeating),
    ownerUserId: v.ownerUserId ? String(v.ownerUserId) : undefined,
    amenities: v.amenities ? String(v.amenities) : undefined,
    tags: v.tags ? String(v.tags) : undefined,
    rating: v.rating != null ? Number(v.rating) : undefined,
    reviewCount: v.reviewCount != null ? Number(v.reviewCount) : undefined,
    likeCount: v.likeCount != null ? Number(v.likeCount) : undefined,
    status: v.status ? String(v.status) : undefined,
  })).filter((v) => v.venueId);
}

export async function fetchOwnerProfileVenues(ownerUserId: string): Promise<NearbyVenue[]> {
  const params = new URLSearchParams({
    ownerUserId,
    limit: '50',
    isTemplate: 'true',
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

export async function fetchOwnerRentalVenues(ownerUserId: string): Promise<NearbyVenue[]> {
  const params = new URLSearchParams({
    ownerUserId,
    limit: '50',
    isTemplate: 'true',
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

export function mergeVenuesById(primary: NearbyVenue[], extra: NearbyVenue[]): NearbyVenue[] {
  const seen = new Set(primary.map((v) => v.venueId));
  return [...primary, ...extra.filter((v) => v.venueId && !seen.has(v.venueId))];
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
    type: 'stadium',
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
    hasSeating?: boolean;
    floors: WizardFloor[];
    gates?: WizardGate[];
  },
): Promise<void> {
  try {
    const hasSeating = input.hasSeating ?? true;
    const response = await fetch(`${venueItemBase()}/${encodeURIComponent(venueId)}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        userId: input.userId,
        updatedBy: input.userId,
        hasSeating,
        floors: buildVenueFloorsPayload(input.floors, input.gates || [], hasSeating),
        gates: (input.gates || []).map((gate) => ({
          gateId: gate.gateId,
          gateNumber: gate.gateNumber,
          name: gate.name,
          description: gate.description,
        })),
      }),
    });
    const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
    if (!response.ok) {
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

export async function getVenueById(venueId: string): Promise<VenueDetail> {
  try {
    const response = await fetch(`${venueItemBase()}/${encodeURIComponent(venueId)}`, {
      headers: authHeaders(),
    });
    const body = await response.json().catch(() => ({})) as Record<string, unknown> & { message?: string; error?: string };
    if (!response.ok) {
      throw new Error(body.message || body.error || 'No se pudo cargar el lugar');
    }
    return parseVenueDetail(body);
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la carga del lugar'));
  }
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
  return (body.venues || []).map((v) => ({
    venueId: v.venue_id || v.venueId || '',
    name: v.name || 'Lugar sin nombre',
    capacity: v.capacity,
    city: v.city,
    isTemplate: v.isTemplate,
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
    categories: (floor.categories || []).map((cat, idx) => ({
      categoryId: cat.categoryId || newWizardId(),
      name: cat.name || `Categoría ${idx + 1}`,
      color: cat.color || '#7C3AED',
      relX: cat.relX ?? 10,
      relY: cat.relY ?? 20,
      width: cat.width ?? 30,
      height: cat.height ?? 20,
      geometry: (cat.geometry || 'RECTANGLE') as FloorPlanGeometry,
      rotation: cat.rotation ?? 0,
      zIndex: idx + 1,
      ringThickness: cat.ringThickness ?? 55,
      locked: false,
      gateId: '',
      rows: cat.rows || 4,
      seatsPerRow: cat.seatsPerRow || 5,
      seats: (cat.seats || []).map((s, i) => mapApiSeatToWizard(s as Record<string, unknown>, i)),
      price: Number((cat as unknown as Record<string, unknown>).valor || 50000),
      isPaid: Boolean((cat as unknown as Record<string, unknown>).costo ?? true),
      currency: String((cat as unknown as Record<string, unknown>).moneda || 'COP'),
      description: '',
      colOrder: 'asc' as const,
      rowOrder: 'asc' as const,
      disableSeatsEnabled: false,
    })),
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

