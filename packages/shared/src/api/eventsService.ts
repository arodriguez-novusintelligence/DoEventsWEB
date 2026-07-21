import { apiRequest, fetchServiceToken, getAuthToken, getCurrentEnv } from './client';
import type { EventDetailResponse, EventPersonInfo, RefundEligibility } from '../types/eventDetail';
import type { EventLocation } from '../types/events';
import type { EventsFeedResponse, FeedEventItem, UserEventItem, UserEventsResponse } from '../types/events';
import {
  cacheEvents,
  cacheFeed,
  cacheUserEvents,
  cacheEventTypes,
  findFeedPublicationByEventId,
  getCachedEvent,
  getCachedFeedEntry,
  getCachedUserEvents,
  getCachedUserEventsEntry,
  getCachedEventTypesEntry,
  invalidateEventsCache,
  isFresh,
} from '../lib/eventsCache';
import { resolveEventIdFromFeedPublication } from '../lib/feedPublicationUtils';
import { resolveFeedPublicationImages } from '../lib/resolveFeedPublicationImages';
import type { FeedPublication } from '../types/feed';
import { invalidateDiscoverCache } from '../lib/discoverCache';
import { resolveImageUrl, resolveEventVideoUrl } from '../lib/resolveImageUrl';
import { fetchEventMedia } from './eventImagesService';
import { googleMapsUrl, resolveMapSearchQuery } from '../lib/geocodePlace';
import { resolveDisplayLocation } from '../lib/formatMapLocation';
import { revalidateOnce } from '../lib/wallCacheRevalidate';
import { parseFetchResponse, toUserFacingError } from '../lib/apiError';
import { isDiscoverableFeedEvent } from '../lib/eventStatusUtils';

export interface EventTypeItem {
  id: string;
  nombre?: string;
  name?: string;
}

export interface CreateEventPayload {
  nombre: string;
  descripcion: string;
  fechaIni: string;
  fechaFin: string;
  horaIni: string;
  horaFin: string;
  organizerName: string;
  TelPrin: string;
  TelSec?: string;
  IndicativoTelPrinOrg?: string;
  IndicativoTelSecOrg?: string;
  email: string;
  userId: string;
  tipoEvento: string;
  Categoria: string;
  aforo: string;
  modalidadEvt: string;
  anfitrioName?: string;
  TelPrinAnf?: string;
  IndicativoTelPrinAnf?: string;
  IndicativoTelSecAnf?: string;
  TelSecAnf?: string;
  emailAnf?: string;
  clase?: string;
  video?: string;
  Hashtags?: string;
  pais: string;
  ubicacion?: string;
  ciudad: string;
  tipoLugar?: string;
  direccion: string;
  departamento: string;
  latitude?: number;
  longitude?: number;
  skipVenue?: boolean;
  faq?: Array<{ question: string; answer: string }>;
  itinerary?: Array<{ time?: string; title?: string; description?: string }>;
  eventDays?: Array<Record<string, unknown>>;
  salesStartAt?: string;
  salesEndAt?: string;
  categoriaReembolso?: string;
}

export interface CreateEventResponse {
  success?: boolean;
  message?: string;
  data?: { id?: string; statusDesc?: string; createDate?: string };
}

function todayFormatted(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function authHeaders(options?: { json?: boolean; token?: string }): Record<string, string> {
  const token = (options?.token ?? getAuthToken()).trim();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options?.json !== false) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
  return headers;
}

function readAuthHeaders(token?: string): Record<string, string> {
  return authHeaders({ json: false, token });
}

function pickRawEventImage(raw: Record<string, unknown>): string | undefined {
  const candidates = [
    raw.imagen,
    raw.imagenPrincipal,
    raw.image,
    raw.imageUrl,
    raw.main_image,
    raw.coverImage,
    raw.cover,
  ];
  for (const candidate of candidates) {
    const value = typeof candidate === 'string' ? candidate.trim() : '';
    if (value) return value;
  }
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    const first = raw.images.find((item) => typeof item === 'string' && item.trim());
    if (typeof first === 'string') return first.trim();
  }
  return undefined;
}

function toFeedCoord(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function mapRawEvent(raw: Record<string, unknown>): FeedEventItem {
  const ubicacion = raw.ubicacion as { latitude?: unknown; longitude?: unknown; lat?: unknown; lng?: unknown } | undefined;
  const lat = toFeedCoord(ubicacion?.latitude ?? ubicacion?.lat ?? raw.latitude ?? raw.lat);
  const lon = toFeedCoord(ubicacion?.longitude ?? ubicacion?.lng ?? raw.longitude ?? raw.lon ?? raw.lng);
  const distanciaRaw = raw.distancia;
  const distancia = typeof distanciaRaw === 'number'
    ? distanciaRaw
    : toFeedCoord(distanciaRaw);
  return {
    id: String(raw.id || ''),
    nombre: String(raw.nombre || raw.name || 'Evento'),
    fechaIni: raw.fechaIni as string | undefined,
    horaIni: raw.horaIni as string | undefined,
    ciudad: raw.ciudad as string | undefined,
    departamento: raw.departamento as string | undefined,
    descripcion: raw.descripcion as string | undefined,
    imagen: resolveImageUrl(pickRawEventImage(raw)),
    liked: Boolean(raw.liked || raw.favorite || raw.isFavorite),
    aforo: raw.aforo != null ? String(raw.aforo) : undefined,
    horaFin: raw.horaFin as string | undefined,
    direccion: raw.direccion as string | undefined,
    pais: raw.pais as string | undefined,
    userId: raw.userId as string | undefined,
    estatus: raw.estatus as string | undefined,
    Categoria: raw.Categoria as string | undefined,
    tipoEvento: raw.tipoEvento as string | undefined,
    distancia: distancia != null && Number.isFinite(distancia) ? distancia : undefined,
    latitude: lat,
    longitude: lon,
    ubicacion: lat != null && lon != null ? { latitude: lat, longitude: lon } : undefined,
  };
}

export function normalizeFeedEventItem(raw: Record<string, unknown>): FeedEventItem {
  return mapRawEvent(raw);
}

export function extractFeedEventItems(data: Record<string, unknown>): Record<string, unknown>[] {
  if (Array.isArray(data.items)) return data.items as Record<string, unknown>[];
  if (Array.isArray(data.events)) return data.events as Record<string, unknown>[];
  if (Array.isArray(data.datosEvento)) return data.datosEvento as Record<string, unknown>[];
  const nested = data.data;
  if (Array.isArray(nested)) return nested as Record<string, unknown>[];
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const obj = nested as Record<string, unknown>;
    if (Array.isArray(obj.datosEvento)) return obj.datosEvento as Record<string, unknown>[];
    if (Array.isArray(obj.items)) return obj.items as Record<string, unknown>[];
    if (Array.isArray(obj.events)) return obj.events as Record<string, unknown>[];
  }
  return [];
}

function normalizeFeedResponse(data: Record<string, unknown>): EventsFeedResponse {
  const itemsRaw = extractFeedEventItems(data);
  const items = itemsRaw
    .map((item) => mapRawEvent(item))
    .filter(isDiscoverableFeedEvent);
  return {
    items,
    nextOffset: (data.nextOffset as number | null | undefined) ?? null,
    total: (data.total as number | undefined) ?? items.length,
  };
}

function buildFeedCacheKey(userId: string | undefined, offset: number, limit: number): string {
  return `${userId || 'anon'}:${offset}:${limit}`;
}

async function requestEventsFeed(userId: string | undefined, offset: number, limit: number): Promise<EventsFeedResponse> {
  const env = getCurrentEnv();
  const payload = {
    userID: userId || '',
    offset,
    limit,
    fechaActual: todayFormatted(),
  };

  const response = await fetch(env.endpoints.eventsFeed, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    const data = await response.json() as Record<string, unknown>;
    const result = normalizeFeedResponse(data);
    cacheEvents(result.items);
    return result;
  }

  try {
    const data = await apiRequest<Record<string, unknown>>({
      method: 'POST',
      url: env.endpoints.eventsFeed,
      data: payload,
    });
    const result = normalizeFeedResponse(data);
    cacheEvents(result.items);
    return result;
  } catch {
    const fallback = await searchEvents('evento').catch(() => ({ items: [] as FeedEventItem[] }));
    return { items: fallback.items, nextOffset: null, total: fallback.items.length };
  }
}

export async function fetchNearbyEvents(
  latitude: number,
  longitude: number,
  maxDistanceKm: number,
  userId?: string,
  limit = 50,
): Promise<FeedEventItem[]> {
  const env = getCurrentEnv();
  const payload = {
    userID: userId || '',
    offset: 0,
    limit,
    fechaActual: todayFormatted(),
    maxDistanceKm,
    userLocation: { latitude, longitude },
  };

  const response = await fetch(env.endpoints.eventsFeed, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(errText || `Error al cargar eventos cercanos (${response.status})`);
  }

  const data = await response.json() as Record<string, unknown>;
  const result = normalizeFeedResponse(data);
  const { filterByOwnerPrivacyFailOpen } = await import('../lib/privacyVisibility');
  const visible = await filterByOwnerPrivacyFailOpen(
    result.items,
    (item) => item.userId,
    userId,
    4000,
  );
  cacheEvents(visible);
  return visible;
}

export async function fetchEventsFeed(
  userId?: string,
  offset = 0,
  limit = 20,
  options?: { forceNetwork?: boolean },
): Promise<EventsFeedResponse> {
  const cacheKey = buildFeedCacheKey(userId, offset, limit);
  const cachedEntry = offset === 0 ? getCachedFeedEntry(cacheKey, true) : null;

  if (offset === 0 && cachedEntry && !options?.forceNetwork && isFresh(cachedEntry.cachedAt)) {
    return cachedEntry.data;
  }

  if (offset === 0 && cachedEntry && !options?.forceNetwork) {
    void revalidateOnce(`events-feed:${cacheKey}`, async () => {
      const fresh = await requestEventsFeed(userId, offset, limit);
      cacheFeed(cacheKey, fresh);
    });
    return cachedEntry.data;
  }

  try {
    const result = await requestEventsFeed(userId, offset, limit);
    if (offset === 0) cacheFeed(cacheKey, result);
    cacheEvents(result.items);
    return result;
  } catch (err) {
    if (cachedEntry) return cachedEntry.data;
    throw err;
  }
}

export async function fetchUserEvents(
  userId: string,
  options?: { forceNetwork?: boolean; allEvents?: boolean },
): Promise<UserEventsResponse> {
  const includeAll = options?.allEvents ?? false;
  const cacheKey = includeAll ? `${userId}:all` : userId;
  const cachedEntry = getCachedUserEventsEntry(cacheKey, true);

  if (cachedEntry && !options?.forceNetwork) {
    if (isFresh(cachedEntry.cachedAt)) {
      return { data: { datosEvento: cachedEntry.data } };
    }
    void revalidateOnce(`user-events:${cacheKey}`, async () => {
      const fresh = await requestUserEvents(userId, includeAll);
      cacheUserEvents(cacheKey, fresh.data?.datosEvento || []);
    });
    return { data: { datosEvento: cachedEntry.data } };
  }

  try {
    const response = await requestUserEvents(userId, includeAll);
    cacheUserEvents(cacheKey, response.data?.datosEvento || []);
    return response;
  } catch (err) {
    if (cachedEntry) return { data: { datosEvento: cachedEntry.data } };
    throw err;
  }
}

async function requestUserEventsStats(
  userId: string,
  allEvents = true,
): Promise<UserEventsResponse> {
  const env = getCurrentEnv();
  const query = allEvents ? '?allEvents=true' : '';
  const url = `${env.endpoints.getUserEventsStats}/${encodeURIComponent(userId)}${query}`;
  try {
    return await apiRequest<UserEventsResponse>({
      method: 'GET',
      url,
    });
  } catch {
    const response = await fetch(url, {
      headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Error al cargar estadísticas de tus eventos');
    return response.json() as Promise<UserEventsResponse>;
  }
}

export async function fetchUserEventsStats(
  userId: string,
  options?: { forceNetwork?: boolean; allEvents?: boolean },
): Promise<UserEventsResponse> {
  const includeAll = options?.allEvents ?? true;
  const cacheKey = `${includeAll ? `${userId}:all` : userId}:stats`;
  const cachedEntry = getCachedUserEventsEntry(cacheKey, true);

  if (cachedEntry && !options?.forceNetwork) {
    if (isFresh(cachedEntry.cachedAt)) {
      return { data: { datosEvento: cachedEntry.data } };
    }
    void revalidateOnce(`user-events-stats:${cacheKey}`, async () => {
      const fresh = await requestUserEventsStats(userId, includeAll);
      cacheUserEvents(cacheKey, fresh.data?.datosEvento || []);
    });
    return { data: { datosEvento: cachedEntry.data } };
  }

  try {
    const response = await requestUserEventsStats(userId, includeAll);
    cacheUserEvents(cacheKey, response.data?.datosEvento || []);
    return response;
  } catch (err) {
    if (cachedEntry) return { data: { datosEvento: cachedEntry.data } };
    throw err;
  }
}

async function requestUserEvents(
  userId: string,
  allEvents = false,
): Promise<UserEventsResponse> {
  const env = getCurrentEnv();
  const query = allEvents ? '?allEvents=true' : '';
  const url = `${env.endpoints.getUserEvents}/${encodeURIComponent(userId)}${query}`;
  try {
    return await apiRequest<UserEventsResponse>({
      method: 'GET',
      url,
    });
  } catch {
    const response = await fetch(url, {
      headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Error al cargar tus eventos');
    return response.json() as Promise<UserEventsResponse>;
  }
}

function extractEventDetailPayloadFromApi(data: unknown): Record<string, unknown> | null {
  const record = data as Record<string, unknown> | null;
  if (!record || typeof record !== 'object') return null;

  const layers: unknown[] = [record.data, record];
  if (record.data && typeof record.data === 'object') {
    layers.push((record.data as Record<string, unknown>).data);
  }

  for (const layer of layers) {
    if (!layer || typeof layer !== 'object') continue;
    const obj = layer as Record<string, unknown>;
    if (obj.datosEvento || obj.event) return obj;
  }
  return null;
}

function parseEventDetailPayload(eventId: string, payload: Record<string, unknown>): EventDetailResponse | null {
  const rawEvent = (payload?.datosEvento || payload?.event) as Record<string, unknown> | undefined;
  if (!rawEvent || typeof rawEvent !== 'object') return null;

  const mapPerson = (raw: Record<string, unknown> | null | undefined): EventPersonInfo | null => {
    if (!raw || typeof raw !== 'object') return null;
    return {
      id: (raw.id || raw.userId) as string | undefined,
      name: (raw.name || raw.nombre) as string | undefined,
      lastName: (raw.lastName || raw.apellido) as string | undefined,
      user: raw.user as string | undefined,
      email: raw.email as string | undefined,
      fotoPerfilUrl: (raw.fotoPerfilUrl || raw.fotoPerfilSignedUrl) as string | undefined,
      calificacionPromedio: raw.calificacionPromedio != null
        ? Number(raw.calificacionPromedio)
        : (raw.calificacion != null ? Number(raw.calificacion) : undefined),
      calificacion: raw.calificacion != null ? Number(raw.calificacion) : undefined,
      experiencia: raw.experiencia != null ? Number(raw.experiencia) : undefined,
      totalEventos: raw.totalEventos != null ? Number(raw.totalEventos) : undefined,
      eventosRealizados: raw.eventosRealizados != null
        ? Number(raw.eventosRealizados)
        : (raw.totalEventos != null ? Number(raw.totalEventos) : undefined),
    };
  };

  const rawImages = [
    ...((payload.eventImages as string[] | undefined) || []),
    ...((payload.imagenesCargadas as string[] | undefined) || []),
  ];
  const images = rawImages
    .map((url) => resolveImageUrl(url))
    .filter((url): url is string => Boolean(url));
  const ubicacionRaw = rawEvent.ubicacion as { latitude?: number; longitude?: number } | undefined;
  const lat = ubicacionRaw?.latitude ?? (rawEvent.latitude as number | undefined);
  const lon = ubicacionRaw?.longitude ?? (rawEvent.longitude as number | undefined);

  return {
    event: {
      id: String(rawEvent.id || eventId),
      nombre: String(rawEvent.nombre || rawEvent.name || 'Evento'),
      descripcion: rawEvent.descripcion as string | undefined,
      fechaIni: rawEvent.fechaIni as string | undefined,
      fechaFin: rawEvent.fechaFin as string | undefined,
      horaIni: rawEvent.horaIni as string | undefined,
      horaFin: rawEvent.horaFin as string | undefined,
      estatus: rawEvent.estatus as string | undefined,
      clase: rawEvent.clase as string | undefined,
      aforo: String(rawEvent.aforo || rawEvent.avaliableCapacity || ''),
      avaliableCapacity: String(rawEvent.avaliableCapacity || rawEvent.aforo || ''),
      ciudad: rawEvent.ciudad as string | undefined,
      departamento: rawEvent.departamento as string | undefined,
      direccion: rawEvent.direccion as string | undefined,
      pais: rawEvent.pais as string | undefined,
      userId: rawEvent.userId as string | undefined,
      coAdminIds: Array.isArray(rawEvent.coAdminIds)
        ? rawEvent.coAdminIds.map(String)
        : [],
      organizerName: rawEvent.organizerName as string | undefined,
      anfitrioName: rawEvent.anfitrioName as string | undefined,
      emailAnf: rawEvent.emailAnf as string | undefined,
      categoriaReembolso: rawEvent.categoriaReembolso as string | undefined,
      policies: rawEvent.policies as EventDetailResponse['event']['policies'],
      faq: rawEvent.faq as EventDetailResponse['event']['faq'],
      tipoLugar: rawEvent.tipoLugar as string | undefined,
      venueId: (rawEvent.venueId || rawEvent.venue_id) as string | undefined,
      hasSeating: Boolean(rawEvent.hasSeating ?? rawEvent.has_seating),
      video: resolveEventVideoUrl((rawEvent.video || rawEvent.videoUrl) as string | undefined),
      Hashtags: (rawEvent.Hashtags ?? rawEvent.hashtags) as string | string[] | undefined,
      itinerary: rawEvent.itinerary as EventDetailResponse['event']['itinerary'],
      eventDays: rawEvent.eventDays as EventDetailResponse['event']['eventDays'],
      ubicacion: lat != null && lon != null ? { latitude: lat, longitude: lon } as EventLocation : undefined,
      latitude: lat,
      longitude: lon,
      Categoria: rawEvent.Categoria != null ? String(rawEvent.Categoria) : undefined,
    },
    images: images.length
      ? images
      : (resolveImageUrl(rawEvent.imagen as string | undefined)
        ? [resolveImageUrl(rawEvent.imagen as string | undefined)!]
        : []),
    category: (payload.datosCategoria as EventDetailResponse['category']) || null,
    eventType: (payload.datosTipoEvento as EventDetailResponse['eventType']) || null,
    placeType: (payload.datosTipoLugar as EventDetailResponse['placeType']) || null,
    organizer: mapPerson(payload.datosOrganizador as Record<string, unknown>),
    host: mapPerson(payload.datosAnfitrion as Record<string, unknown>),
  };
}

async function enrichEventDetailImages(
  detail: EventDetailResponse,
  eventId: string,
): Promise<EventDetailResponse> {
  try {
    const media = await fetchEventMedia(eventId);
    const mediaUrls = media
      .map((entry) => resolveImageUrl(entry.publicUrl || entry.s3Key))
      .filter((url): url is string => Boolean(url));
    if (!mediaUrls.length) return detail;

    // Merge: no cortar la galería si el detalle ya trae solo la portada.
    const merged: string[] = [];
    for (const url of [...detail.images, ...mediaUrls]) {
      if (url && !merged.includes(url)) merged.push(url);
    }
    return { ...detail, images: merged.length ? merged : detail.images };
  } catch {
    // fallback silencioso: el detalle sigue con las imágenes que ya tenía
  }

  return detail;
}

function buildEventDetailFromFeedEvent(event: FeedEventItem): EventDetailResponse {
  const image = resolveImageUrl(event.imagen) || event.imagen;
  return {
    event: {
      id: event.id,
      nombre: event.nombre || 'Evento',
      descripcion: event.descripcion,
      fechaIni: event.fechaIni,
      horaIni: event.horaIni,
      horaFin: event.horaFin,
      estatus: event.estatus,
      ciudad: event.ciudad,
      departamento: event.departamento,
      direccion: event.direccion,
      pais: event.pais,
      userId: event.userId,
      aforo: event.aforo,
      avaliableCapacity: event.aforo,
      ubicacion: event.ubicacion,
      latitude: event.latitude,
      longitude: event.longitude,
    },
    images: image ? [image] : [],
    category: null,
    eventType: null,
    placeType: null,
    organizer: null,
    host: null,
  };
}

function buildEventDetailFromFeedPublication(publication: FeedPublication): EventDetailResponse | null {
  const resolvedId = resolveEventIdFromFeedPublication(publication);
  if (!resolvedId) return null;
  const images = resolveFeedPublicationImages(publication)
    .map((url) => resolveImageUrl(url) || url)
    .filter(Boolean);
  const meta = (publication.metadata || {}) as Record<string, unknown>;
  const [datePart, timePart] = String(publication.dateLabel || '').split(' - ');
  return {
    event: {
      id: resolvedId,
      nombre: publication.title || 'Evento',
      descripcion: publication.description,
      fechaIni: String(meta.fechaIni || datePart || ''),
      horaIni: String(meta.horaIni || timePart || ''),
      estatus: String(meta.estatus || meta.status || 'activo'),
      ciudad: String(meta.city || meta.ciudad || publication.locationLabel || ''),
      departamento: String(meta.department || meta.departamento || ''),
      userId: publication.author?.id,
      aforo: meta.aforo != null ? String(meta.aforo) : undefined,
      avaliableCapacity: meta.avaliableCapacity != null ? String(meta.avaliableCapacity) : undefined,
    },
    images,
    category: null,
    eventType: null,
    placeType: null,
    organizer: null,
    host: null,
  };
}

function cacheEventDetail(detail: EventDetailResponse): void {
  cacheEvents([{
    id: detail.event.id,
    nombre: detail.event.nombre,
    fechaIni: detail.event.fechaIni,
    horaIni: detail.event.horaIni,
    ciudad: detail.event.ciudad,
    departamento: detail.event.departamento,
    descripcion: detail.event.descripcion,
    imagen: detail.images[0],
    userId: detail.event.userId,
    estatus: detail.event.estatus,
    ubicacion: detail.event.ubicacion,
    latitude: detail.event.latitude,
    longitude: detail.event.longitude,
  }]);
}

async function requestEventDetailFromApi(
  eventId: string,
  headers: Record<string, string>,
): Promise<EventDetailResponse | null> {
  const env = getCurrentEnv();
  const url = `${env.endpoints.getEvent}/${encodeURIComponent(eventId)}`;
  const response = await fetch(url, { headers, cache: 'no-store' });
  if (!response.ok) return null;

  const data = await response.json().catch(() => null);
  const payload = extractEventDetailPayloadFromApi(data);
  if (!payload) return null;

  const parsed = parseEventDetailPayload(eventId, payload);
  if (!parsed) return null;
  return enrichEventDetailImages(parsed, eventId);
}

function eventDetailFromLocalCache(eventId: string): EventDetailResponse | null {
  const cached = getCachedEvent(eventId);
  if (cached) return buildEventDetailFromFeedEvent(cached);

  const publication = findFeedPublicationByEventId(eventId);
  if (publication) return buildEventDetailFromFeedPublication(publication);

  return null;
}

export async function fetchEventDetail(eventId: string): Promise<EventDetailResponse | null> {
  const trimmedId = String(eventId || '').trim();
  if (!trimmedId) return null;

  const authTokens: Array<string | undefined> = [
    undefined,
    getAuthToken().trim() || undefined,
  ];

  try {
    const serviceToken = await fetchServiceToken();
    if (serviceToken) authTokens.push(serviceToken);
  } catch {
    // token de servicio opcional
  }

  const seenTokens = new Set<string>();
  for (const token of authTokens) {
    const tokenKey = token || '__public__';
    if (seenTokens.has(tokenKey)) continue;
    seenTokens.add(tokenKey);

    try {
      const detail = await requestEventDetailFromApi(
        trimmedId,
        token ? readAuthHeaders(token) : readAuthHeaders(),
      );
      if (detail) {
        cacheEventDetail(detail);
        return detail;
      }
    } catch {
      // intentar siguiente estrategia de auth
    }
  }

  const cachedDetail = eventDetailFromLocalCache(trimmedId);
  if (cachedDetail) return cachedDetail;

  return null;
}

export function getPersonDisplayName(person?: EventPersonInfo | null, fallback = ''): string {
  if (!person) return fallback;
  return [person.name, person.lastName].filter(Boolean).join(' ').trim()
    || person.user?.trim()
    || fallback;
}

export function buildMapUrl(event: EventDetailResponse['event']): string | null {
  const lat = event.ubicacion?.latitude ?? event.latitude;
  const lng = event.ubicacion?.longitude ?? event.longitude;
  const ubicacionLabel = typeof event.ubicacion === 'string' ? event.ubicacion : undefined;
  const fallbackAddress = resolveDisplayLocation({
    direccion: event.direccion,
    ciudad: event.ciudad,
    departamento: event.departamento,
    pais: event.pais,
    ubicacion: ubicacionLabel,
  });

  const query = resolveMapSearchQuery({
    address: event.direccion || (fallbackAddress !== '—' ? fallbackAddress : undefined),
    name: ubicacionLabel,
    city: event.ciudad,
    lat,
    lng,
  });

  if (!query) return null;

  return googleMapsUrl(0, 0, query);
}

function todayCompact(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

export async function checkRefundEligibility(
  eventId: string,
  userId: string,
  orderId: string,
): Promise<RefundEligibility | null> {
  const env = getCurrentEnv();
  try {
    const response = await fetch(
      `${env.endpoints.canRequestRefund}/${encodeURIComponent(eventId)}`,
      {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          userId,
          orderId,
          currentDate: todayCompact(),
        }),
      },
    );
    const body = await response.json() as {
      success?: boolean;
      message?: string;
      data?: {
        canRequestRefund?: boolean;
        reason?: string;
        eventName?: string;
        daysUntilEvent?: number;
        orderInfo?: { orderId?: string };
      };
    };
    const data = body.data;
    if (!response.ok || body.success === false) {
      return {
        canRequestRefund: false,
        reason: body.message || data?.reason || 'No se pudo verificar la elegibilidad de reembolso.',
        eventName: data?.eventName,
        daysUntilEvent: data?.daysUntilEvent,
        orderId,
      };
    }
    if (!data) return null;
    return {
      canRequestRefund: Boolean(data.canRequestRefund),
      reason: data.reason,
      eventName: data.eventName,
      daysUntilEvent: data.daysUntilEvent,
      orderId: data.orderInfo?.orderId || orderId,
    };
  } catch {
    return null;
  }
}

export interface RefundRequestResponse {
  refundId: string;
  filingId: string;
  orderId: string;
  ticketsRefunded: number;
  refundAmount: number;
  platformFee?: number;
  subtotal?: number;
  currency: string;
}

export async function requestEventRefund(input: {
  userId: string;
  orderId: string;
  reason?: string;
  ticketInstanceIds?: string[];
}): Promise<RefundRequestResponse> {
  const env = getCurrentEnv();
  const response = await fetch(env.endpoints.processRefund, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      userId: input.userId,
      orderId: input.orderId,
      reason: input.reason || 'Solicitud de reembolso desde la web',
      ticketInstanceIds: input.ticketInstanceIds,
    }),
  });
  const body = await response.json() as {
    success?: boolean;
    message?: string;
    data?: {
      refundId?: string;
      filingId?: string;
      orderId?: string;
      ticketsRefunded?: number;
      refundAmount?: number;
      platformFee?: number;
      subtotal?: number;
      currency?: string;
    };
  };
  if (!response.ok || body.success === false) {
    throw new Error(body.message || 'No se pudo procesar el reembolso');
  }
  const data = body.data || {};
  return {
    refundId: data.refundId || '',
    filingId: data.filingId || data.refundId || '',
    orderId: data.orderId || input.orderId,
    ticketsRefunded: data.ticketsRefunded || input.ticketInstanceIds?.length || 0,
    refundAmount: data.refundAmount || 0,
    platformFee: data.platformFee || 0,
    subtotal: data.subtotal || data.refundAmount || 0,
    currency: data.currency || 'COP',
  };
}

export async function fetchEventById(eventId: string): Promise<FeedEventItem | null> {
  const cached = getCachedEvent(eventId);
  if (cached) return cached;

  const detail = await fetchEventDetail(eventId);
  if (!detail) return null;

  const mapped: FeedEventItem = {
    id: detail.event.id,
    nombre: detail.event.nombre,
    fechaIni: detail.event.fechaIni,
    horaIni: detail.event.horaIni,
    ciudad: detail.event.ciudad,
    departamento: detail.event.departamento,
    descripcion: detail.event.descripcion,
    imagen: detail.images[0],
    userId: detail.event.userId,
    estatus: detail.event.estatus,
    ubicacion: detail.event.ubicacion,
    latitude: detail.event.latitude,
    longitude: detail.event.longitude,
  };
  cacheEvents([mapped]);
  return mapped;
}

export async function searchEvents(query: string): Promise<{ items: FeedEventItem[] }> {
  const term = query.trim();
  if (!term) return { items: [] };
  const env = getCurrentEnv();
  let response: Response;
  try {
    response = await fetch(
      `${env.endpoints.searchEvents}?q=${encodeURIComponent(term)}`,
      { headers: authHeaders() },
    );
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la búsqueda de eventos'));
  }

  const data = await parseFetchResponse<Record<string, unknown>>(response, 'No se pudieron buscar eventos');
  const nested = data.data as Record<string, unknown> | undefined;
  const rawItems = (data.datosEvento
    || nested?.datosEvento
    || data.items
    || data.events
    || nested?.items
    || []) as Record<string, unknown>[];
  const items = (Array.isArray(rawItems) ? rawItems : []).map((item) => mapRawEvent(item));
  return { items };
}

export async function fetchEventTypes(options?: { forceNetwork?: boolean }): Promise<EventTypeItem[]> {
  const cachedEntry = getCachedEventTypesEntry(true);

  if (cachedEntry && !options?.forceNetwork) {
    if (isFresh(cachedEntry.cachedAt)) {
      return cachedEntry.data as EventTypeItem[];
    }
    void revalidateOnce('event-types', async () => {
      const fresh = await requestEventTypes();
      cacheEventTypes(fresh);
    });
    return cachedEntry.data as EventTypeItem[];
  }

  try {
    const types = await requestEventTypes();
    cacheEventTypes(types);
    return types;
  } catch {
    return (cachedEntry?.data as EventTypeItem[]) || [];
  }
}

async function requestEventTypes(): Promise<EventTypeItem[]> {
  const env = getCurrentEnv();
  const response = await fetch(env.endpoints.eventTypes, { headers: authHeaders() });
  if (!response.ok) return [];
  const data = await response.json();
  const raw = data?.data || data?.items || data || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((item: Record<string, unknown>) => ({
    id: String(item.id || item.tipoEventoId || item.code || ''),
    nombre: String(item.nombre || item.name || item.EventType_ES || item.descripcion || ''),
  })).filter((t) => t.id);
}

function buildCreateEventBody(payload: CreateEventPayload) {
  return {
    ...payload,
    TelSec: payload.TelSec || payload.TelPrin,
    anfitrioName: payload.anfitrioName != null ? payload.anfitrioName : (payload.organizerName || ''),
    TelPrinAnf: payload.TelPrinAnf != null ? payload.TelPrinAnf : (payload.TelPrin || ''),
    IndicativoTelPrinAnf: payload.IndicativoTelPrinAnf || payload.IndicativoTelPrinOrg || '+57',
    IndicativoTelSecAnf: payload.IndicativoTelSecAnf || payload.IndicativoTelSecOrg || '+57',
    TelSecAnf: payload.TelSecAnf != null ? payload.TelSecAnf : (payload.TelSec || payload.TelPrin || ''),
    emailAnf: payload.emailAnf != null ? payload.emailAnf : (payload.email || ''),
    clase: payload.clase || 'general',
    video: payload.video || '',
    Hashtags: payload.Hashtags || '',
    tipoLugar: payload.tipoLugar || 'otro',
    departamento: payload.departamento || '',
    skipVenue: payload.skipVenue ?? true,
  };
}

export async function createEvent(payload: CreateEventPayload): Promise<CreateEventResponse> {
  const env = getCurrentEnv();
  const bodyPayload = buildCreateEventBody(payload);
  try {
    const result = await apiRequest<CreateEventResponse>({
      method: 'POST',
      url: env.endpoints.createEvent,
      data: bodyPayload,
    });
    if (result.success === false) {
      throw new Error(result.message || result.data?.statusDesc || 'Error al crear el evento');
    }
    return result;
  } catch (err) {
    if (err instanceof Error && err.message && !err.message.includes('Network Error')) {
      throw err;
    }
    const response = await fetch(env.endpoints.createEvent, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(bodyPayload),
    });
    const body = await response.json() as CreateEventResponse & {
      statusDesc?: string;
      statusMessage?: { message?: string };
    };
    if (!response.ok || body.success === false) {
      throw new Error(
        body.message
        || body.statusDesc
        || body.statusMessage?.message
        || body.data?.statusDesc
        || 'Error al crear el evento',
      );
    }
    return body;
  }
}

export interface UpdateEventPayload {
  nombre?: string;
  descripcion?: string;
  fechaIni?: string;
  fechaFin?: string;
  horaIni?: string;
  horaFin?: string;
  ciudad?: string;
  departamento?: string;
  direccion?: string;
  pais?: string;
  aforo?: string;
  organizerName?: string;
  email?: string;
  TelPrin?: string;
  skipVenue?: boolean;
  updatedBy?: string;
  [key: string]: unknown;
}

export async function updateEvent(
  eventId: string,
  payload: UpdateEventPayload,
  updatedBy: string,
): Promise<Record<string, unknown>> {
  const env = getCurrentEnv();
  let response: Response;
  try {
    response = await fetch(
      `${env.apiBaseUrl}/events/updateEvent/${encodeURIComponent(eventId)}`,
      {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ ...payload, updatedBy }),
      },
    );
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la actualización del evento'));
  }
  const body = await response.json().catch(() => ({})) as {
    success?: boolean;
    data?: Record<string, unknown>;
    error?: string;
    message?: string;
  };
  if (!response.ok || body.success === false) {
    throw new Error(body.error || body.message || 'No se pudo actualizar el evento');
  }
  return body.data || body;
}

export async function publishEvent(eventId: string): Promise<{ success?: boolean; message?: string }> {
  const env = getCurrentEnv();
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), 90_000)
    : undefined;
  let response: Response;
  try {
    response = await fetch(env.endpoints.publishEvent, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ eventId }),
      signal: controller?.signal,
    });
  } catch (err) {
    const isAbort = err instanceof DOMException && err.name === 'AbortError';
    throw new Error(
      isAbort
        ? 'La publicación tardó demasiado. Intenta de nuevo en unos segundos.'
        : 'No se pudo conectar al publicar el evento. Verifica tu conexión e intenta de nuevo.',
    );
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
  const body = await response.json().catch(() => ({})) as {
    success?: boolean;
    message?: string;
    statusDesc?: string;
    data?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(
      body.message || body.statusDesc || body.data?.message || 'Error al publicar el evento',
    );
  }
  return body;
}

export async function likeEvent(userId: string, eventId: string): Promise<{ success?: boolean; message?: string }> {
  return toggleEventLike(userId, eventId, true);
}

export async function unlikeEvent(userId: string, eventId: string): Promise<{ success?: boolean; message?: string }> {
  return toggleEventLike(userId, eventId, false);
}

export async function toggleEventLike(
  userId: string,
  eventId: string,
  like: boolean,
): Promise<{ success?: boolean; message?: string }> {
  const env = getCurrentEnv();
  const response = await fetch(env.endpoints.eventLike, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId, eventId, like }),
  });
  const body = await response.json() as { message?: string; success?: boolean };
  if (!response.ok) {
    if (
      response.status === 400
      && (body.message?.includes('Ya existe') || body.message?.includes('like') || body.message?.includes('No existe'))
    ) {
      return { success: true, message: body.message };
    }
    throw new Error(body.message || (like ? 'Error al marcar favorito' : 'Error al quitar favorito'));
  }
  return body;
}

export function isDiscoverableFavoriteEvent(event: {
  estatus?: string;
  fechaIni?: string;
  fechaFin?: string;
  horaIni?: string;
  horaFin?: string;
  deletedAt?: string;
}): boolean {
  return isDiscoverableFeedEvent(event);
}

export async function fetchFavoriteUserEvents(userId: string, limit = 20): Promise<UserEventItem[]> {
  const env = getCurrentEnv();
  try {
    const response = await fetch(
      `${env.endpoints.getFavoriteUserEvents}/${encodeURIComponent(userId)}?limit=${limit}`,
      { headers: authHeaders() },
    );
    if (response.status === 404) return [];
    const body = await response.json() as UserEventsResponse & {
      message?: string;
      datosEvento?: UserEventItem[];
      events?: UserEventItem[];
      items?: UserEventItem[];
    };
    if (!response.ok) throw new Error(body.message || 'No se pudieron cargar favoritos');
    const items = body.data?.datosEvento
      || body.datosEvento
      || body.events
      || body.items
      || [];
    return (Array.isArray(items) ? items : []).filter(isDiscoverableFavoriteEvent);
  } catch {
    return [];
  }
}

export interface DuplicateEventPayload {
  fechaIni: string;
  fechaFin: string;
  horaIni?: string;
  horaFin?: string;
}

export async function duplicateEvent(
  eventId: string,
  schedule: DuplicateEventPayload,
): Promise<{ newEventId?: string; newVenueId?: string; venueOccupied?: boolean; message?: string }> {
  const env = getCurrentEnv();
  const response = await fetch(
    `${env.apiBaseUrl}/events/duplicateEvent/${encodeURIComponent(eventId)}`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(schedule),
    },
  );
  const body = await response.json().catch(() => ({})) as Record<string, unknown> & {
    newEventId?: string;
    newVenueId?: string;
    venueOccupied?: boolean;
    message?: string;
    error?: string;
    data?: { newEventId?: string; newVenueId?: string; venueOccupied?: boolean };
    body?: string;
  };
  if (!response.ok) {
    throw new Error(body.error || body.message || 'No se pudo duplicar el evento');
  }
  let parsed = body;
  if (typeof body.body === 'string') {
    try {
      parsed = { ...body, ...JSON.parse(body.body) as Record<string, unknown> };
    } catch {
      parsed = body;
    }
  }
  return {
    newEventId: String(
      parsed.newEventId
      || parsed.data?.newEventId
      || '',
    ).trim() || undefined,
    newVenueId: String(
      parsed.newVenueId
      || parsed.data?.newVenueId
      || '',
    ).trim() || undefined,
    venueOccupied: Boolean(parsed.venueOccupied || parsed.data?.venueOccupied),
    message: typeof parsed.message === 'string' ? parsed.message : undefined,
  };
}

export async function cancelEvent(eventId: string, reason?: string): Promise<Record<string, unknown>> {
  const env = getCurrentEnv();
  const response = await fetch(`${env.apiBaseUrl}/events/cancelEvent`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ eventId, reason: reason || 'Cancelado por el organizador' }),
  });
  const body = await response.json().catch(() => ({})) as {
    success?: boolean;
    message?: string;
    error?: string;
    data?: Record<string, unknown>;
  };
  if (!response.ok || body.success === false) {
    throw new Error(body.error || body.message || 'No se pudo cancelar el evento');
  }
  return body.data || body;
}

export interface RescheduleEventPayload {
  eventId: string;
  newStartDate: string;
  newEndDate: string;
  newStartTime?: string;
  newEndTime?: string;
  reason?: string;
  ticketSaleStartDate?: string;
  ticketSaleEndDate?: string;
  ticketSaleStartTime?: string;
  ticketSaleEndTime?: string;
}

export async function rescheduleEvent(payload: RescheduleEventPayload): Promise<Record<string, unknown>> {
  const env = getCurrentEnv();
  const response = await fetch(`${env.apiBaseUrl}/events/rescheduleEvent`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({})) as {
    success?: boolean;
    message?: string;
    error?: string;
    data?: Record<string, unknown>;
  };
  if (!response.ok || body.success === false) {
    throw new Error(body.error || body.message || 'No se pudo reprogramar el evento');
  }
  return body.data || body;
}

export async function deleteEvent(eventId: string): Promise<void> {
  const env = getCurrentEnv();
  const response = await fetch(
    `${env.apiBaseUrl}/events/deleteEvent/${encodeURIComponent(eventId)}`,
    { method: 'DELETE', headers: authHeaders() },
  );
  const body = await response.json().catch(() => ({})) as { message?: string; error?: string };
  if (!response.ok) {
    throw new Error(body.error || body.message || 'No se pudo eliminar el evento');
  }
  invalidateEventsCache();
  invalidateDiscoverCache();
}

export async function fetchWallFeed(): Promise<unknown> {
  const env = getCurrentEnv();
  const response = await fetch(env.endpoints.wallFeed, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Error al cargar el muro social');
  return response.json();
}
