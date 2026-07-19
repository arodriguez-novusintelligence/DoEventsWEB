import type { FeedEventItem, NearbyServiceProvider, NearbyVenue } from '@doevents/shared';

export function toCoordinate(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : undefined;
}

export function getEventCoordinates(event: FeedEventItem): { lat: number; lng: number } | null {
  const ubicacion = event.ubicacion as { latitude?: unknown; longitude?: unknown } | undefined;
  const lat = toCoordinate(event.latitude ?? ubicacion?.latitude);
  const lng = toCoordinate(event.longitude ?? ubicacion?.longitude);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

export function getVenueCoordinates(venue: NearbyVenue): { lat: number; lng: number } | null {
  const lat = toCoordinate(venue.latitude);
  const lng = toCoordinate(venue.longitude);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

export function getServiceCoordinates(service: NearbyServiceProvider): { lat: number; lng: number } | null {
  const lat = toCoordinate(service.latitude);
  const lng = toCoordinate(service.longitude);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinRadiusKm(
  coords: { lat: number; lng: number } | null,
  userLat: number,
  userLng: number,
  radiusKm: number,
): boolean {
  if (!coords) return false;
  return haversineKm(userLat, userLng, coords.lat, coords.lng) <= radiusKm;
}

export function filterEventsWithinRadius(
  events: FeedEventItem[],
  userLat: number,
  userLng: number,
  radiusKm: number,
): FeedEventItem[] {
  return events.filter((event) => {
    if (
      event.distancia != null
      && Number.isFinite(event.distancia)
      && event.distancia <= radiusKm
    ) {
      return true;
    }
    return isWithinRadiusKm(getEventCoordinates(event), userLat, userLng, radiusKm);
  });
}

export function filterVenuesWithinRadius(
  venues: NearbyVenue[],
  userLat: number,
  userLng: number,
  radiusKm: number,
): NearbyVenue[] {
  return venues.filter((venue) => isWithinRadiusKm(getVenueCoordinates(venue), userLat, userLng, radiusKm));
}

export function filterServicesWithinRadius(
  services: NearbyServiceProvider[],
  userLat: number,
  userLng: number,
  radiusKm: number,
): NearbyServiceProvider[] {
  return services.filter((service) => isWithinRadiusKm(getServiceCoordinates(service), userLat, userLng, radiusKm));
}

export function mapFetchLimitForRadiusKm(radiusKm: number): number {
  return Math.min(100, Math.max(40, Math.ceil(radiusKm * 1.5)));
}
