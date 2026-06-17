import {

  buildLabelFromNominatim,

  formatMapLocationLabel,

  parseNominatimAddress,

  type NominatimAddressParts,

} from './formatMapLocation';



export type { NominatimAddressParts };



export interface GeocodedPlace {

  lat: number;

  lng: number;

  label: string;

  city?: string;

  departamento?: string;

  street?: string;

  country?: string;

}



const COLOMBIA_CITIES: Record<string, GeocodedPlace> = {

  bogota: { lat: 4.711, lng: -74.0721, label: 'Bogotá, Cundinamarca', city: 'Bogotá', departamento: 'Cundinamarca', country: 'Colombia' },

  'bogota dc': { lat: 4.711, lng: -74.0721, label: 'Bogotá, Cundinamarca', city: 'Bogotá', departamento: 'Cundinamarca', country: 'Colombia' },

  girardot: { lat: 4.3012, lng: -74.8018, label: 'Girardot, Cundinamarca', city: 'Girardot', departamento: 'Cundinamarca', country: 'Colombia' },

  ricaurte: { lat: 4.2855, lng: -74.772, label: 'Ricaurte, Cundinamarca', city: 'Ricaurte', departamento: 'Cundinamarca', country: 'Colombia' },

  fusagasuga: { lat: 4.3365, lng: -74.3638, label: 'Fusagasugá, Cundinamarca', city: 'Fusagasugá', departamento: 'Cundinamarca', country: 'Colombia' },

  melgar: { lat: 4.2047, lng: -74.6408, label: 'Melgar, Tolima', city: 'Melgar', departamento: 'Tolima', country: 'Colombia' },

  medellin: { lat: 6.2442, lng: -75.5812, label: 'Medellín, Antioquia', city: 'Medellín', departamento: 'Antioquia', country: 'Colombia' },

  cali: { lat: 3.4516, lng: -76.532, label: 'Cali, Valle del Cauca', city: 'Cali', departamento: 'Valle del Cauca', country: 'Colombia' },

  cartagena: { lat: 10.391, lng: -75.4794, label: 'Cartagena, Bolívar', city: 'Cartagena', departamento: 'Bolívar', country: 'Colombia' },

  barranquilla: { lat: 10.9685, lng: -74.7813, label: 'Barranquilla, Atlántico', city: 'Barranquilla', departamento: 'Atlántico', country: 'Colombia' },

  ibague: { lat: 4.4389, lng: -75.2322, label: 'Ibagué, Tolima', city: 'Ibagué', departamento: 'Tolima', country: 'Colombia' },

  pereira: { lat: 4.8133, lng: -75.6961, label: 'Pereira, Risaralda', city: 'Pereira', departamento: 'Risaralda', country: 'Colombia' },

};



function normalizePlaceKey(value: string): string {

  return value

    .trim()

    .toLowerCase()

    .normalize('NFD')

    .replace(/[\u0300-\u036f]/g, '')

    .replace(/\s+/g, ' ');

}



function toGeocodedPlace(

  lat: number,

  lng: number,

  address?: NominatimAddressParts | null,

  displayName?: string,

): GeocodedPlace {

  const parsed = parseNominatimAddress(address);

  const label = buildLabelFromNominatim(address, displayName);

  return {

    lat,

    lng,

    label,

    city: parsed.city || undefined,

    departamento: parsed.departamento || undefined,

    street: parsed.street || undefined,

    country: parsed.country || undefined,

  };

}



async function nominatimSearch(query: string): Promise<GeocodedPlace | null> {

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=co&addressdetails=1&q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {

    headers: { Accept: 'application/json' },

  });

  if (!response.ok) return null;

  const results = await response.json() as Array<{

    lat: string;

    lon: string;

    display_name?: string;

    address?: NominatimAddressParts;

  }>;

  const hit = results[0];

  if (!hit) return null;

  return toGeocodedPlace(Number(hit.lat), Number(hit.lon), hit.address, hit.display_name);

}



export async function reverseGeocodePlace(lat: number, lng: number): Promise<GeocodedPlace | null> {

  try {

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

    const response = await fetch(url, { headers: { Accept: 'application/json' } });

    if (!response.ok) return null;

    const hit = await response.json() as {

      display_name?: string;

      address?: NominatimAddressParts;

    };

    if (!hit.address && !hit.display_name) return null;

    const place = toGeocodedPlace(lat, lng, hit.address, hit.display_name);

    if (place.label === '—') {

      return {

        lat,

        lng,

        label: formatMapLocationLabel({ street: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }),

      };

    }

    return place;

  } catch {

    return null;

  }

}



export async function geocodePlaceQuery(query: string): Promise<GeocodedPlace | null> {

  const suggestions = await searchPlaceSuggestions(query, 1);

  return suggestions[0] || null;

}



async function nominatimSearchMany(query: string, limit = 5): Promise<GeocodedPlace[]> {

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=${limit}&countrycodes=co&addressdetails=1&q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {

    headers: { Accept: 'application/json' },

  });

  if (!response.ok) return [];

  const results = await response.json() as Array<{

    lat: string;

    lon: string;

    display_name?: string;

    address?: NominatimAddressParts;

  }>;

  return results.map((hit) => toGeocodedPlace(Number(hit.lat), Number(hit.lon), hit.address, hit.display_name));

}



export async function searchPlaceSuggestions(query: string, limit = 5): Promise<GeocodedPlace[]> {

  const trimmed = query.trim();

  if (trimmed.length < 2) return [];

  const key = normalizePlaceKey(trimmed);

  const knownMatches = Object.entries(COLOMBIA_CITIES)

    .filter(([name]) => key.includes(name) || name.includes(key) || trimmed.toLowerCase().includes(name))

    .map(([, place]) => place)

    .slice(0, limit);

  if (knownMatches.length >= limit) return knownMatches;

  try {

    const remote = await nominatimSearchMany(trimmed, limit);

    const merged = [...knownMatches];

    remote.forEach((place) => {

      if (!merged.some((m) => m.label === place.label)) merged.push(place);

    });

    return merged.slice(0, limit);

  } catch {

    return knownMatches;

  }

}



export function googleMapsUrl(lat: number, lng: number, label?: string): string {
  const q = label
    ? encodeURIComponent(label)
    : encodeURIComponent(`${lat},${lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}


