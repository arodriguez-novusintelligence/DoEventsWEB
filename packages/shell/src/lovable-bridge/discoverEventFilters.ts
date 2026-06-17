import type { FeedEventItem } from '@doevents/shared';
import { mapDiscoverEventBadge } from '@doevents/shared';
import type { DiscoverEventItem } from './discoverAdapter';

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

function eventDistanceKm(
  event: FeedEventItem,
  lat: number,
  lng: number,
  nearbyDistances: Map<string, number>,
): number | null {
  if (event.id && nearbyDistances.has(event.id)) {
    return nearbyDistances.get(event.id)!;
  }
  if (event.distancia != null && Number.isFinite(event.distancia)) {
    return event.distancia;
  }
  const elat = event.latitude ?? event.ubicacion?.latitude;
  const elng = event.longitude ?? event.ubicacion?.longitude;
  if (elat != null && elng != null) {
    return haversineKm(lat, lng, elat, elng);
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

  let filtered = events.filter(
    (e) => {
      const status = mapDiscoverEventBadge({
        estatus: e.estatus,
        fechaIni: e.fechaIni,
        fechaFin: e.fechaFin,
        horaIni: e.horaIni,
        horaFin: e.horaFin,
      });
      return status !== 'borrador' && status !== 'inactivo';
    },
  );

  if (lat != null && lng != null) {
    filtered = filtered.filter((e) => {
      const dist = eventDistanceKm(e, lat, lng, nearbyDistances);
      return dist == null || dist <= radius;
    });
  }

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
