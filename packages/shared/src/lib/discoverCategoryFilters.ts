import { matchCategoryLabel, NUMERIC_EVENT_CATEGORY_MAP } from '../data/eventCategories';
import { matchesEventCategory } from './eventCategoryMatcher';

export type DiscoverPublicationFilter = 'todos' | 'eventos' | 'lugares' | 'servicios';

export interface DiscoverCategoryChip {
  label: string;
  keywords: string[];
  catalogIds?: string[];
  numericIds?: string[];
  venueTypes?: string[];
}

export const DISCOVER_EVENT_CATEGORIES: DiscoverCategoryChip[] = [
  {
    label: 'Conciertos',
    keywords: ['concierto', 'conciertos', 'musica', 'música'],
    catalogIds: ['Concierto', 'Musica'],
    numericIds: ['1005'],
  },
  {
    label: 'Conferencias',
    keywords: ['conferencia', 'conferencias', 'congreso', 'seminario', 'ponencia'],
    catalogIds: ['Cultural'],
    numericIds: ['1002'],
  },
  {
    label: 'Exposiciones',
    keywords: ['exposicion', 'exposición', 'expo', 'arte', 'galeria', 'galería'],
    catalogIds: ['Arte'],
    numericIds: ['1004'],
  },
  {
    label: 'Ferias',
    keywords: ['feria', 'ferias', 'gastronomia', 'gastronomía', 'mercado'],
    catalogIds: ['Gastronomia', 'Cultural'],
    numericIds: ['1008', '1002'],
  },
  {
    label: 'Standup',
    keywords: ['standup', 'stand up', 'stand-up', 'comedia', 'comedy'],
    catalogIds: ['Comedia en vivo'],
    numericIds: ['1010'],
  },
  {
    label: 'Deportes',
    keywords: ['deporte', 'deportes', 'torneo', 'partido'],
    catalogIds: ['Deportes'],
    numericIds: ['1006'],
  },
  {
    label: 'Recorridos',
    keywords: ['recorrido', 'recorridos', 'tour', 'city tour'],
    catalogIds: ['Recorrido'],
    numericIds: ['1015'],
  },
  {
    label: 'Fiestas',
    keywords: ['fiesta', 'fiestas', 'reunion social', 'reunión social', 'social'],
    catalogIds: ['Fiesta'],
    numericIds: ['1001'],
  },
];

export const DISCOVER_VENUE_CATEGORIES: DiscoverCategoryChip[] = [
  {
    label: 'Casa campestre',
    keywords: ['casa campestre', 'campestre'],
    venueTypes: ['Casa campestre'],
  },
  {
    label: 'Salón eventos',
    keywords: ['salon de eventos', 'salón de eventos', 'salon eventos', 'salón eventos', 'recinto'],
    venueTypes: ['Salón de eventos', 'Salón eventos', 'Recinto', 'Salón comunal'],
  },
  {
    label: 'Finca',
    keywords: ['finca', 'chalet', 'retiro'],
    venueTypes: ['Finca', 'Chalet', 'Retiro'],
  },
  {
    label: 'Hotel',
    keywords: ['hotel'],
    venueTypes: ['Hotel'],
  },
  {
    label: 'Bodega',
    keywords: ['bodega'],
    venueTypes: ['Bodega'],
  },
  {
    label: 'Restaurante',
    keywords: ['restaurante'],
    venueTypes: ['Restaurante'],
  },
];

export const DISCOVER_SERVICE_CATEGORIES: DiscoverCategoryChip[] = [
  { label: 'Catering', keywords: ['catering', 'chef', 'mesero', 'barman', 'hostess', 'cocina'] },
  { label: 'Entretenimiento', keywords: ['entretenimiento', 'musico', 'músico', 'artista', 'bailarin', 'bailarín', 'cantante'] },
  { label: 'Multimedia', keywords: ['multimedia', 'fotografo', 'fotógrafo', 'camarografo', 'camarógrafo', 'video', 'periodista'] },
  { label: 'Logística', keywords: ['logistica', 'logística', 'montaje', 'decoracion', 'decoración', 'audio', 'iluminacion', 'iluminación'] },
  { label: 'Seguridad', keywords: ['seguridad', 'guardia', 'vigilancia'] },
  { label: 'Marketing/publicidad', keywords: ['marketing', 'publicidad', 'community manager', 'social media', 'branding', 'influencer'] },
  { label: 'Maestro Ceremonia/presentador', keywords: ['maestro ceremonia', 'presentador', 'mc', 'animador', 'orador', 'ponente'] },
  { label: 'Servicio de transporte', keywords: ['transporte', 'conductor', 'shuttle', 'bus'] },
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim();
}

function resolveChip(
  chips: DiscoverCategoryChip[],
  uiLabel: string,
): DiscoverCategoryChip | undefined {
  return chips.find((chip) => chip.label === uiLabel);
}

function buildHaystack(parts: Array<string | undefined>): string {
  return normalizeText(parts.filter(Boolean).join(' '));
}

function matchesNumericCategory(rawCategory: string | undefined, numericIds?: string[]): boolean {
  if (!rawCategory || !numericIds?.length) return false;
  const trimmed = String(rawCategory).trim();
  if (numericIds.includes(trimmed)) return true;
  const mapped = NUMERIC_EVENT_CATEGORY_MAP[trimmed];
  if (!mapped) return false;
  return numericIds.some((id) => NUMERIC_EVENT_CATEGORY_MAP[id] === mapped);
}

export function matchesDiscoverEventCategory(
  input: {
    Categoria?: string;
    category?: string;
    tipoEvento?: string;
    nombre?: string;
    title?: string;
    description?: string;
  },
  uiLabel: string | null,
): boolean {
  if (!uiLabel) return true;

  const chip = resolveChip(DISCOVER_EVENT_CATEGORIES, uiLabel);
  if (!chip) {
    return matchesEventCategory(
      {
        id: '',
        nombre: input.nombre || input.title || '',
        Categoria: input.Categoria || input.category || input.tipoEvento,
      },
      [uiLabel],
    );
  }

  const rawCategory = input.Categoria || input.category || input.tipoEvento;
  if (matchesNumericCategory(rawCategory, chip.numericIds)) return true;

  const resolved = matchCategoryLabel(rawCategory || '');
  if (resolved && chip.catalogIds?.includes(resolved.id)) return true;

  const haystack = buildHaystack([
    rawCategory,
    input.tipoEvento,
    input.nombre,
    input.title,
    input.description,
    resolved?.label,
    resolved?.id,
  ]);

  if (chip.keywords.some((kw) => haystack.includes(normalizeText(kw)))) return true;

  return matchesEventCategory(
    {
      id: '',
      nombre: input.nombre || input.title || '',
      Categoria: rawCategory,
    },
    chip.catalogIds || [uiLabel],
  );
}

export function matchesDiscoverVenueCategory(
  input: {
    type?: string;
    name?: string;
    address?: string;
    description?: string;
    sector?: string;
    tags?: string;
  },
  uiLabel: string | null,
): boolean {
  if (!uiLabel) return true;

  const chip = resolveChip(DISCOVER_VENUE_CATEGORIES, uiLabel);
  const haystack = buildHaystack([
    input.type,
    input.name,
    input.address,
    input.description,
    input.sector,
    input.tags,
  ]);

  if (!chip) {
    return haystack.includes(normalizeText(uiLabel));
  }

  if (chip.venueTypes?.some((type) => normalizeText(type) === normalizeText(input.type || ''))) {
    return true;
  }

  if (chip.venueTypes?.some((type) => haystack.includes(normalizeText(type)))) {
    return true;
  }

  return chip.keywords.some((kw) => haystack.includes(normalizeText(kw)));
}

export function matchesDiscoverServiceCategory(
  input: {
    role?: string;
    category?: string;
    name?: string;
    description?: string;
    sectors?: string[];
  },
  uiLabel: string | null,
): boolean {
  if (!uiLabel) return true;

  const chip = resolveChip(DISCOVER_SERVICE_CATEGORIES, uiLabel);
  const haystack = buildHaystack([
    input.role,
    input.category,
    input.name,
    input.description,
    ...(input.sectors || []),
  ]);
  const normalizedLabel = normalizeText(uiLabel);

  if (haystack.includes(normalizedLabel)) return true;

  if (!chip) return false;

  return chip.keywords.some((kw) => haystack.includes(normalizeText(kw)));
}
