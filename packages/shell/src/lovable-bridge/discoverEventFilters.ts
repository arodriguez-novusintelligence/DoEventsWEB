import type { FeedEventItem, UserEventItem } from '@doevents/shared';
import { isDiscoverableFeedEvent, mapDiscoverEventBadge } from '@doevents/shared';

type DiscoverFeedEventFields = {
  estatus?: string;
  fechaIni?: string;
  fechaFin?: string;
  horaIni?: string;
  horaFin?: string;
  deletedAt?: string;
};

export function filterDiscoverFeedEvents<T extends DiscoverFeedEventFields>(
  events: T[] = [],
): T[] {
  return events.filter((event) => isDiscoverableFeedEvent(event));
}

export function filterVisibleUserEvents(items: UserEventItem[] = []): UserEventItem[] {
  return items.filter((ev) => String(ev.estatus || '').trim().toUpperCase() !== 'DELETED');
}

const STATUS_ORDER: Record<string, number> = {
  activo: 0,
  en_ejecucion: 1,
  reagendado: 2,
  finalizado: 3,
  cancelado: 4,
  borrador: 5,
  inactivo: 6,
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function readEventCoordinates(event: FeedEventItem): { lat: number; lng: number } | null {
  const ubicacion = event.ubicacion as { latitude?: unknown; longitude?: unknown; lat?: unknown; lng?: unknown } | undefined;
  const lat = Number(event.latitude ?? ubicacion?.latitude ?? ubicacion?.lat);
  const lng = Number(event.longitude ?? ubicacion?.longitude ?? ubicacion?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }
  return null;
}

function eventDistanceKm(
  event: FeedEventItem,
  lat: number,
  lng: number,
  nearbyDistances: Map<string, number>,
  options?: { preferCoordinates?: boolean },
): number | null {
  if (event.id && nearbyDistances.has(event.id)) {
    return nearbyDistances.get(event.id)!;
  }
  const coords = readEventCoordinates(event);
  if (options?.preferCoordinates && coords) {
    return haversineKm(lat, lng, coords.lat, coords.lng);
  }
  if (event.distancia != null && Number.isFinite(event.distancia)) {
    return event.distancia;
  }
  if (coords) {
    return haversineKm(lat, lng, coords.lat, coords.lng);
  }
  return null;
}

export function filterAndSortMyPublishedEvents(
  events: FeedEventItem[],
  options?: {
    userLat?: number;
    userLng?: number;
    radiusKm?: number;
    nearbyDistances?: Map<string, number>;
  },
): FeedEventItem[] {
  const radius = options?.radiusKm ?? 100;
  const lat = options?.userLat;
  const lng = options?.userLng;
  const nearbyDistances = options?.nearbyDistances ?? new Map<string, number>();

  let filtered = filterDiscoverFeedEvents(events);

  return filtered.sort((a, b) => {
    const sa = STATUS_ORDER[mapDiscoverEventBadge({
      estatus: a.estatus,
      fechaIni: a.fechaIni,
      fechaFin: a.fechaFin,
      horaIni: a.horaIni,
      horaFin: a.horaFin,
    })] ?? 99;
    const sb = STATUS_ORDER[mapDiscoverEventBadge({
      estatus: b.estatus,
      fechaIni: b.fechaIni,
      fechaFin: b.fechaFin,
      horaIni: b.horaIni,
      horaFin: b.horaFin,
    })] ?? 99;
    if (sa !== sb) return sa - sb;
    if (lat != null && lng != null) {
      const da = eventDistanceKm(a, lat, lng, nearbyDistances) ?? Infinity;
      const db = eventDistanceKm(b, lat, lng, nearbyDistances) ?? Infinity;
      return da - db;
    }
    return (a.fechaIni || '').localeCompare(b.fechaIni || '');
  });
}

export function discoverStatusOrder(status?: string): number {
  return STATUS_ORDER[status || 'activo'] ?? 99;
}

/** Completa eventos cercanos usando el catálogo del feed cuando la API geo devuelve vacío o incompleto. */
export function buildNearbyEventsFromCatalog(
  catalog: FeedEventItem[],
  lat: number,
  lng: number,
  radiusKm: number,
  existing: FeedEventItem[] = [],
): FeedEventItem[] {
  const seen = new Set(existing.map((e) => e.id).filter(Boolean));
  const merged = [...existing];

  for (const event of filterDiscoverFeedEvents(catalog)) {
    if (!event.id || seen.has(event.id)) continue;
    // Catálogo del feed: distancia siempre por coordenadas (evita distancia obsoleta de otra ubicación).
    const distance = eventDistanceKm(event, lat, lng, new Map(), { preferCoordinates: true });
    if (distance == null || distance > radiusKm) continue;
    merged.push({
      ...event,
      distancia: event.distancia ?? distance,
    });
    seen.add(event.id);
  }

  return merged.sort((a, b) => (a.distancia ?? Infinity) - (b.distancia ?? Infinity));
}

function mergeDiscoverCatalogSources(
  primary: FeedEventItem[],
  supplemental: FeedEventItem[] = [],
): FeedEventItem[] {
  const merged = [...primary];
  const seen = new Set(primary.map((event) => event.id).filter(Boolean));
  for (const event of supplemental) {
    if (!event.id || seen.has(event.id)) continue;
    merged.push(event);
    seen.add(event.id);
  }
  return merged;
}

export function discoverNearbyLooksIncomplete(
  nearby: FeedEventItem[],
  catalog: FeedEventItem[],
  lat?: number,
  lng?: number,
  radiusKm = 100,
  supplementalCatalog: FeedEventItem[] = [],
): boolean {
  if (lat == null || lng == null) return false;
  if (nearby.length > 0) return false;
  const mergedCatalog = mergeDiscoverCatalogSources(catalog, supplementalCatalog);
  return buildNearbyEventsFromCatalog(mergedCatalog, lat, lng, radiusKm).length > 0;
}
