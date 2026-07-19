export interface MapLocationParts {
  address?: string | null;
  street?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  city?: string | null;
  departamento?: string | null;
  department?: string | null;
  pais?: string | null;
  country?: string | null;
  ubicacion?: string | null;
  locationLabel?: string | null;
  label?: string | null;
}

export interface NominatimAddressParts {
  road?: string;
  house_number?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  country?: string;
}

const PLACEHOLDER_PATTERNS = [
  /mi\s+ubicaci[oó]n/i,
  /tu\s+ubicaci[oó]n/i,
  /ubicaci[oó]n\s+actual/i,
  /ubicaci[oó]n\s+seleccionada/i,
  /ubicaci[oó]n\s+en\s+mapa/i,
  /current\s+location/i,
  /indica\s+tu\s+ubicaci[oó]n/i,
];

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function isPlaceholderLocation(value?: string | null): boolean {
  const trimmed = (value || '').trim();
  if (!trimmed || trimmed === '—' || trimmed === '-') return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function parseNominatimAddress(address?: NominatimAddressParts | null) {
  const city = address?.city
    || address?.town
    || address?.village
    || address?.municipality
    || '';
  const departamento = address?.state || address?.county || '';
  const country = address?.country || '';
  const road = [address?.road, address?.house_number].filter(Boolean).join(' ').trim();
  const street = road || address?.suburb || address?.neighbourhood || '';
  return { street, city, departamento, country };
}

export function formatMapLocationLabel(parts: {
  street?: string | null;
  address?: string | null;
  city?: string | null;
  departamento?: string | null;
  department?: string | null;
  country?: string | null;
}): string {
  const departamento = parts.departamento || parts.department;
  const street = parts.street || parts.address;
  const segments: string[] = [];

  const push = (value?: string | null) => {
    const text = (value || '').trim();
    if (!text || isPlaceholderLocation(text)) return;
    const token = normalizeToken(text);
    if (segments.some((entry) => normalizeToken(entry) === token)) return;
    segments.push(text);
  };

  push(parts.city);
  push(departamento);
  push(street);
  push(parts.country);

  return segments.join(', ') || '—';
}

export function buildLabelFromNominatim(
  address?: NominatimAddressParts | null,
  displayName?: string,
): string {
  const parsed = parseNominatimAddress(address);
  const built = formatMapLocationLabel(parsed);
  if (built !== '—') return built;
  if (displayName && !isPlaceholderLocation(displayName)) {
    return displayName.split(',').map((part) => part.trim()).filter(Boolean).slice(0, 4).join(', ');
  }
  return '—';
}

export function formatGpsLocationLabel(parts: {
  label?: string | null;
  city?: string | null;
  departamento?: string | null;
  lat: number;
  lng: number;
}): string {
  const direct = (parts.label || '').trim();
  if (direct && direct !== '—' && !isPlaceholderLocation(direct)) {
    return direct;
  }
  const built = formatMapLocationLabel({
    city: parts.city,
    departamento: parts.departamento,
  });
  if (built !== '—') return built;
  return `${parts.lat.toFixed(4)}, ${parts.lng.toFixed(4)}`;
}

export function resolveDisplayLocation(parts: MapLocationParts): string {
  const compositeLabel = [parts.label, parts.locationLabel]
    .map((value) => (value || '').trim())
    .find((value) => value && !isPlaceholderLocation(value) && value.includes(','));
  if (compositeLabel) return compositeLabel;

  const city = parts.ciudad || parts.city;
  const departamento = parts.departamento || parts.department;
  const country = parts.pais || parts.country;

  const rawCandidates = [
    parts.direccion,
    parts.address,
    parts.street,
    parts.ubicacion,
    parts.locationLabel,
    parts.label,
  ];

  let street: string | undefined;
  for (const candidate of rawCandidates) {
    const text = (candidate || '').trim();
    if (!text || isPlaceholderLocation(text)) continue;
    street = text;
    break;
  }

  const built = formatMapLocationLabel({
    city,
    departamento,
    street,
    country,
  });

  if (built !== '—') return built;

  const fallback = [city, departamento, country].filter((value) => {
    const text = (value || '').trim();
    return text && !isPlaceholderLocation(text);
  });

  return fallback.length ? fallback.join(', ') : '—';
}
