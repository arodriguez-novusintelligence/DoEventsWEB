import type { FeedEventItem, NearbyServiceProvider, NearbyVenue } from '@doevents/shared';
import {
  extractVenueImageUrls,
  isDiscoverableFeedEvent,
  resolveDisplayLocation,
  resolveEventImageUrl,
  resolveImageUrl,
} from '@doevents/shared';
import { getEventCoordinates, getServiceCoordinates, getVenueCoordinates } from './mapGeoUtils';

function resolveVenueMapImage(venue: NearbyVenue): string {
  const fromRecord = extractVenueImageUrls(venue as unknown as Record<string, unknown>);
  const candidate = venue.mainImage || venue.imageUrls?.[0] || fromRecord[0];
  return resolveImageUrl(candidate) || '';
}

function resolveServiceMapImage(service: NearbyServiceProvider): string {
  return resolveEventImageUrl(resolveImageUrl(service.profileImageUrl || service.gallery?.[0]));
}

export interface MapItemData {
  id: string;
  category: 'eventos' | 'lugares' | 'servicios';
  title: string;
  subtitle: string;
  image: string;
  lat: number;
  lng: number;
  date?: string;
  timeRange?: string;
  location?: string;
  rating?: number;
  handle?: string;
  refId?: string;
}

export function feedEventsToMapItems(events: FeedEventItem[]): MapItemData[] {
  return events
    .filter((e) => e.id && e.nombre && isDiscoverableFeedEvent(e))
    .map((event) => {
      const coords = getEventCoordinates(event);
      if (!coords) return null;
      const location = resolveDisplayLocation({
        direccion: event.direccion,
        ciudad: event.ciudad,
        departamento: (event as { departamento?: string }).departamento,
      });
      return {
        id: `event-${event.id}`,
        category: 'eventos' as const,
        title: event.nombre,
        subtitle: event.fechaIni || event.ciudad || 'Evento',
        image: resolveEventImageUrl(event.imagen),
        lat: coords.lat,
        lng: coords.lng,
        date: event.fechaIni,
        timeRange: event.horaIni && event.horaFin
          ? `${event.horaIni} - ${event.horaFin}`
          : event.horaIni || undefined,
        location,
        refId: event.id,
      };
    })
    .filter((item): item is MapItemData => item != null);
}

export function venuesToMapItems(venues: NearbyVenue[]): MapItemData[] {
  return venues
    .filter((v) => v.venueId)
    .map((venue) => {
      const coords = getVenueCoordinates(venue);
      if (!coords) return null;
      const location = resolveDisplayLocation({
        address: venue.address,
        city: venue.city,
      });
      return {
        id: `venue-${venue.venueId}`,
        category: 'lugares' as const,
        title: venue.name,
        subtitle: venue.type || venue.tags || 'Lugar para alquilar',
        image: resolveVenueMapImage(venue),
        lat: coords.lat,
        lng: coords.lng,
        location,
        refId: venue.venueId,
      };
    })
    .filter((item): item is MapItemData => item != null);
}

export function servicesToMapItems(services: NearbyServiceProvider[]): MapItemData[] {
  return services
    .filter((s) => s.serviceId)
    .map((service) => {
      const coords = getServiceCoordinates(service);
      if (!coords) return null;
      const sector = service.category || service.role || 'Servicio';
      return {
        id: `service-${service.serviceId}`,
        category: 'servicios' as const,
        title: service.name || sector,
        subtitle: sector,
        image: resolveServiceMapImage(service),
        lat: coords.lat,
        lng: coords.lng,
        location: resolveDisplayLocation({ city: service.city }),
        rating: service.rating,
        refId: service.serviceId,
      };
    })
    .filter((item): item is MapItemData => item != null);
}
