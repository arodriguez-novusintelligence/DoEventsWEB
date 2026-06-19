import type { FeedEventItem, NearbyServiceProvider, NearbyVenue } from '@doevents/shared';
import { resolveDisplayLocation, resolveEventImageUrl } from '@doevents/shared';
import { resolveImageUrl } from '@doevents/shared';

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

const DEFAULT_CENTER = { lat: 6.2442, lng: -75.5812 };

function offsetPosition(index: number, total: number, base = DEFAULT_CENTER): { lat: number; lng: number } {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  const radius = 0.008 + (index % 3) * 0.004;
  return {
    lat: base.lat + Math.sin(angle) * radius,
    lng: base.lng + Math.cos(angle) * radius,
  };
}

export function feedEventsToMapItems(events: FeedEventItem[]): MapItemData[] {
  return events
    .filter((e) => e.id && e.nombre)
    .map((event, index) => {
      const lat = event.latitude ?? event.ubicacion?.latitude;
      const lng = event.longitude ?? event.ubicacion?.longitude;
      const pos = lat != null && lng != null
        ? { lat, lng }
        : offsetPosition(index, events.length);
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
        image: resolveEventImageUrl(event.imagen) || '',
        lat: pos.lat,
        lng: pos.lng,
        date: event.fechaIni,
        timeRange: event.horaIni && event.horaFin
          ? `${event.horaIni} - ${event.horaFin}`
          : event.horaIni || undefined,
        location,
        refId: event.id,
      };
    });
}

export function venuesToMapItems(venues: NearbyVenue[]): MapItemData[] {
  return venues
    .filter((v) => v.venueId)
    .map((venue, index) => {
      const lat = venue.latitude;
      const lng = venue.longitude;
      const pos = lat != null && lng != null
        ? { lat, lng }
        : offsetPosition(index, venues.length);
      const location = resolveDisplayLocation({
        address: venue.address,
        city: venue.city,
      });
      return {
        id: `venue-${venue.venueId}`,
        category: 'lugares' as const,
        title: venue.name,
        subtitle: venue.type || venue.tags || 'Lugar para alquilar',
        image: resolveImageUrl(venue.mainImage || venue.imageUrls?.[0]) || '',
        lat: pos.lat,
        lng: pos.lng,
        location,
        refId: venue.venueId,
      };
    });
}

export function servicesToMapItems(services: NearbyServiceProvider[]): MapItemData[] {
  return services
    .filter((s) => s.serviceId)
    .map((service, index) => {
      const lat = service.latitude;
      const lng = service.longitude;
      const pos = lat != null && lng != null
        ? { lat, lng }
        : offsetPosition(index, services.length);
      const sector = service.category || service.role || 'Servicio';
      return {
        id: `service-${service.serviceId}`,
        category: 'servicios' as const,
        title: service.name || sector,
        subtitle: sector,
        image: resolveImageUrl(service.profileImageUrl || service.gallery?.[0]) || '',
        lat: pos.lat,
        lng: pos.lng,
        location: resolveDisplayLocation({ city: service.city }),
        rating: service.rating,
        refId: service.serviceId,
      };
    });
}
