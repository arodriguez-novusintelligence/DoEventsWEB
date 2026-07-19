import {
  buildLabelFromNominatim,
  formatMapLocationLabel,
  parseNominatimAddress,
  type NominatimAddressParts,
} from './formatMapLocation';
import { loadGoogleMapsScript } from './googleMapsLoader';

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

const NOMINATIM_TIMEOUT_MS = 10000;
const NOMINATIM_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'DoEventsApp/1.0 (https://doeventsapp.com)',
};

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
  'puerto gaitan': { lat: 4.3132, lng: -72.6536, label: 'Puerto Gaitán, Meta', city: 'Puerto Gaitán', departamento: 'Meta', country: 'Colombia' },
  'puerto gaitán': { lat: 4.3132, lng: -72.6536, label: 'Puerto Gaitán, Meta', city: 'Puerto Gaitán', departamento: 'Meta', country: 'Colombia' },
  'santo domingo antioquia': {
    lat: 6.4723,
    lng: -75.1654,
    label: 'Santo Domingo, Antioquia',
    city: 'Santo Domingo',
    departamento: 'Antioquia',
    country: 'Colombia',
  },
};

const INTERNATIONAL_CITIES: Record<string, GeocodedPlace> = {
  'santo domingo republica dominicana': {
    lat: 18.4861,
    lng: -69.9312,
    label: 'Santo Domingo, República Dominicana',
    city: 'Santo Domingo',
    country: 'República Dominicana',
  },
  'santo domingo rd': {
    lat: 18.4861,
    lng: -69.9312,
    label: 'Santo Domingo, República Dominicana',
    city: 'Santo Domingo',
    country: 'República Dominicana',
  },
  'santo domingo dominicana': {
    lat: 18.4861,
    lng: -69.9312,
    label: 'Santo Domingo, República Dominicana',
    city: 'Santo Domingo',
    country: 'República Dominicana',
  },
  'ciudad de mexico': {
    lat: 19.4326,
    lng: -99.1332,
    label: 'Ciudad de México, México',
    city: 'Ciudad de México',
    country: 'México',
  },
  'mexico df': {
    lat: 19.4326,
    lng: -99.1332,
    label: 'Ciudad de México, México',
    city: 'Ciudad de México',
    country: 'México',
  },
  'miami': {
    lat: 25.7617,
    lng: -80.1918,
    label: 'Miami, Florida',
    city: 'Miami',
    departamento: 'Florida',
    country: 'Estados Unidos',
  },
  'madrid': {
    lat: 40.4168,
    lng: -3.7038,
    label: 'Madrid, España',
    city: 'Madrid',
    country: 'España',
  },
  'buenos aires': {
    lat: -34.6037,
    lng: -58.3816,
    label: 'Buenos Aires, Argentina',
    city: 'Buenos Aires',
    country: 'Argentina',
  },
  'lima': {
    lat: -12.0464,
    lng: -77.0428,
    label: 'Lima, Perú',
    city: 'Lima',
    country: 'Perú',
  },
  'santiago chile': {
    lat: -33.4489,
    lng: -70.6693,
    label: 'Santiago, Chile',
    city: 'Santiago',
    country: 'Chile',
  },
};

function normalizePlaceKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function mentionsColombia(key: string): boolean {
  return key.includes('colombia') || key.includes(' antioquia') || key.includes(' cundinamarca');
}

function mentionsDominicanRepublic(key: string): boolean {
  return key.includes('republica dominicana')
    || key.includes('dominican republic')
    || /\brd\b/.test(key)
    || key.includes(' dominicana');
}

function matchKnownPlace(query: string): GeocodedPlace | null {
  const key = normalizePlaceKey(query);
  if (!key) return null;

  if (COLOMBIA_CITIES[key]) return COLOMBIA_CITIES[key];
  if (INTERNATIONAL_CITIES[key]) return INTERNATIONAL_CITIES[key];

  if (mentionsDominicanRepublic(key)) {
    return INTERNATIONAL_CITIES['santo domingo republica dominicana'];
  }

  if (key.includes('santo domingo') && mentionsColombia(key)) {
    return COLOMBIA_CITIES['santo domingo antioquia'];
  }

  for (const [name, place] of Object.entries(COLOMBIA_CITIES)) {
    if (key === name || key.includes(name) || name.includes(key)) {
      return place;
    }
  }

  for (const [name, place] of Object.entries(INTERNATIONAL_CITIES)) {
    if (key.includes(name) || name.includes(key)) {
      if (name === 'santo domingo' && mentionsColombia(key)) continue;
      return place;
    }
  }

  return null;
}

function inferCountryCodes(query: string): string | undefined {
  const key = normalizePlaceKey(query);
  if (mentionsDominicanRepublic(key)) return 'do';
  if (key.includes('mexico') || key.includes(' méxico')) return 'mx';
  if (key.includes('estados unidos') || key.includes('united states') || key.includes(' usa')) return 'us';
  if (key.includes('espana') || key.includes('españa') || key.includes('spain')) return 'es';
  if (key.includes('argentina')) return 'ar';
  if (key.includes('peru') || key.includes('perú')) return 'pe';
  if (key.includes('chile')) return 'cl';
  if (mentionsColombia(key)) return 'co';
  return undefined;
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = NOMINATIM_TIMEOUT_MS): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: NOMINATIM_HEADERS,
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
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

async function nominatimSearchMany(
  query: string,
  limit = 1,
  countryCodes?: string,
): Promise<GeocodedPlace[]> {
  const ccParam = countryCodes ? `&countrycodes=${countryCodes}` : '';
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=${limit}&addressdetails=1${ccParam}&q=${encodeURIComponent(query)}`;
  const results = await fetchJsonWithTimeout<Array<{
    lat: string;
    lon: string;
    display_name?: string;
    address?: NominatimAddressParts;
  }>>(url);
  if (!results?.length) return [];
  return results.map((hit) => toGeocodedPlace(Number(hit.lat), Number(hit.lon), hit.address, hit.display_name));
}

async function nominatimSearch(query: string, countryCodes?: string): Promise<GeocodedPlace | null> {
  const hits = await nominatimSearchMany(query, 1, countryCodes);
  return hits[0] || null;
}

async function resolveRemotePlace(query: string, preferColombia = false): Promise<GeocodedPlace | null> {
  const inferred = inferCountryCodes(query);
  if (inferred) {
    const scoped = await nominatimSearch(query, inferred);
    if (scoped) return scoped;
  }

  const global = await nominatimSearch(query);
  if (global) return global;

  if (preferColombia && !inferred) {
    return nominatimSearch(query, 'co');
  }

  return null;
}

export async function reverseGeocodePlace(lat: number, lng: number): Promise<GeocodedPlace | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const hit = await fetchJsonWithTimeout<{
      display_name?: string;
      address?: NominatimAddressParts;
    }>(url);
    if (!hit?.address && !hit?.display_name) return null;
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

function streetFromGoogleComponents(
  components?: google.maps.GeocoderAddressComponent[],
): string | undefined {
  if (!components?.length) return undefined;
  const route = components.find((c) => c.types.includes('route'))?.long_name;
  const streetNumber = components.find((c) => c.types.includes('street_number'))?.long_name;
  const street = [streetNumber, route].filter(Boolean).join(' ').trim();
  return street || undefined;
}

/** Preferir calle corta sobre el label compuesto del geocoder. */
export function streetAddressFromGeocodedPlace(place: GeocodedPlace): string {
  const street = (place.street || '').trim();
  if (street) return street;
  const label = (place.label || '').trim();
  if (!label || label === '—') return '';
  // "Calle 10 #5-32, Medellín, Antioquia, Colombia" → "Calle 10 #5-32"
  const firstSegment = label.split(',')[0]?.trim() || label;
  return firstSegment;
}

async function geocodeWithGoogleMaps(query: string): Promise<GeocodedPlace | null> {
  if (typeof window === 'undefined') return null;
  try {
    const googleMaps = await loadGoogleMapsScript('__initDoEventsGeocode');
    const geocoder = new googleMaps.maps.Geocoder();
    const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
      geocoder.geocode({ address: query }, (res, status) => {
        if (status === 'OK' && res?.length) {
          resolve(res);
          return;
        }
        reject(new Error(status || 'GEOCODE_FAILED'));
      });
    });
    const first = results[0];
    const location = first.geometry?.location;
    if (!location) return null;
    const cityComp = first.address_components?.find((c) => c.types.includes('locality'));
    const deptComp = first.address_components?.find((c) => (
      c.types.includes('administrative_area_level_1')
    ));
    return {
      lat: location.lat(),
      lng: location.lng(),
      label: first.formatted_address || query,
      street: streetFromGoogleComponents(first.address_components),
      city: cityComp?.long_name,
      departamento: deptComp?.long_name,
    };
  } catch {
    return null;
  }
}

export async function geocodePlaceQuery(query: string): Promise<GeocodedPlace | null> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return null;

  const known = matchKnownPlace(trimmed);
  if (known) return known;

  const looksLikeStreetAddress = trimmed.includes(',') || /\d/.test(trimmed);
  if (looksLikeStreetAddress) {
    const exact = await resolveRemotePlace(trimmed, true);
    if (exact) return exact;
    const googleExact = await geocodeWithGoogleMaps(trimmed);
    if (googleExact) return googleExact;
  }

  const suggestions = await searchPlaceSuggestions(trimmed, 1);
  if (suggestions[0]) return suggestions[0];

  return geocodeWithGoogleMaps(trimmed);
}

export function resolveMapSearchQuery(options: {
  address?: string;
  name?: string;
  city?: string;
  lat?: number;
  lng?: number;
}): string | null {
  const address = options.address?.trim();
  const name = options.name?.trim();
  if (address && address.length >= 5) return address;
  if (name && (name.includes(',') || /\d/.test(name))) return name;
  const lat = options.lat;
  const lng = options.lng;
  if (
    typeof lat === 'number'
    && typeof lng === 'number'
    && Number.isFinite(lat)
    && Number.isFinite(lng)
  ) {
    return `${lat},${lng}`;
  }
  const city = options.city?.trim();
  return city || null;
}

function collectKnownMatches(query: string, limit: number): GeocodedPlace[] {
  const key = normalizePlaceKey(query);
  if (key.length < 2) return [];

  const merged: GeocodedPlace[] = [];
  const push = (place: GeocodedPlace) => {
    if (!merged.some((m) => m.label === place.label)) merged.push(place);
  };

  if (COLOMBIA_CITIES[key]) push(COLOMBIA_CITIES[key]);
  if (INTERNATIONAL_CITIES[key]) push(INTERNATIONAL_CITIES[key]);

  if (key.includes('santo domingo')) {
    if (mentionsDominicanRepublic(key)) {
      push(INTERNATIONAL_CITIES['santo domingo republica dominicana']);
    } else if (mentionsColombia(key)) {
      push(COLOMBIA_CITIES['santo domingo antioquia']);
    } else {
      push(COLOMBIA_CITIES['santo domingo antioquia']);
      push(INTERNATIONAL_CITIES['santo domingo republica dominicana']);
    }
  }

  Object.entries({ ...COLOMBIA_CITIES, ...INTERNATIONAL_CITIES }).forEach(([name, place]) => {
    if (!key.includes(name) && !name.includes(key)) return;
    if (name.startsWith('santo domingo') && mentionsColombia(key) && !name.includes('antioquia')) return;
    if (name.startsWith('santo domingo') && mentionsDominicanRepublic(key) && !name.includes('dominicana')) return;
    push(place);
  });

  return merged.slice(0, limit);
}

export async function searchPlaceSuggestions(query: string, limit = 8): Promise<GeocodedPlace[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const knownMatches = collectKnownMatches(trimmed, limit);
  if (knownMatches.length >= limit) return knownMatches;

  try {
    const inferred = inferCountryCodes(trimmed);
    let remote: GeocodedPlace[] = [];
    if (inferred) {
      remote = await nominatimSearchMany(trimmed, limit, inferred);
    }
    if (!remote.length) {
      remote = await nominatimSearchMany(trimmed, limit);
    }
    if (!remote.length && !inferred) {
      remote = await nominatimSearchMany(trimmed, limit, 'co');
    }

    const merged = [...knownMatches];
    remote.forEach((place) => {
      if (!merged.some((m) => m.label === place.label)) merged.push(place);
    });
    return merged.slice(0, limit);
  } catch {
    return knownMatches.slice(0, limit);
  }
}

export function googleMapsUrl(lat: number, lng: number, label?: string): string {
  const q = label
    ? encodeURIComponent(label)
    : encodeURIComponent(`${lat},${lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
