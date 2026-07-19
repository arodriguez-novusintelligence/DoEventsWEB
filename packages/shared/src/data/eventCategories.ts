export interface EventCategoryCatalogItem {

  id: string;

  label: string;

  emoji: string;

  color: string;

}



export const EVENT_CATEGORY_CATALOG: EventCategoryCatalogItem[] = [

  { id: 'Comedia en vivo', label: 'Comedia en vivo', emoji: '🎭', color: '#F59E0B' },

  { id: 'Fiesta', label: 'Fiesta, Reunión social', emoji: '🎉', color: '#EC4899' },

  { id: 'Juego', label: 'Juego o evento', emoji: '🎮', color: '#8B5CF6' },

  { id: 'Recorrido', label: 'Recorrido', emoji: '🗺️', color: '#10B981' },

  { id: 'Concierto', label: 'Concierto', emoji: '🎵', color: '#5856EB' },

  { id: 'Deportes', label: 'Deportes', emoji: '⚽', color: '#2563EB' },

  { id: 'Arte', label: 'Arte', emoji: '🎨', color: '#F97316' },

  { id: 'Gastronomia', label: 'Gastronomía', emoji: '🍽️', color: '#EF4444' },

  { id: 'Musica', label: 'Música', emoji: '🎸', color: '#6366F1' },

  { id: 'Cultural', label: 'Cultural', emoji: '🏛️', color: '#14B8A6' },

];



/** Mapa histórico (discover / legacy) — IDs → ids del catálogo UI */

export const NUMERIC_EVENT_CATEGORY_MAP: Record<string, string> = {

  '1001': 'Fiesta',

  '1002': 'Cultural',

  '1004': 'Arte',

  '1005': 'Concierto',

  '1006': 'Deportes',

  '1008': 'Gastronomia',

  '1010': 'Comedia en vivo',

  '1012': 'Gastronomia',

  '1015': 'Recorrido',

  '1017': 'Deportes',

  '1019': 'Fiesta',

};



/**

 * Preferencias reales de Dynamo (Preferences) — labels en español para UI.

 * Fuente de verdad del select de creación/edición vía getPreferences().

 */

export const PREFERENCE_CATEGORY_LABELS: Record<string, string> = {

  '1001': 'Familia',

  '1002': 'Comunidad y cultura',

  '1003': 'Iniciativa social',

  '1004': 'Automóviles, barcos y aeronáutica',

  '1005': 'Cine, medios y entretenimiento',

  '1006': 'Gobierno y política',

  '1007': 'Salud y bienestar',

  '1008': 'Pasatiempos e intereses especiales',

  '1009': 'Música',

  '1010': 'Artes escénicas',

  '1011': 'Moda y belleza',

  '1012': 'Comida y bebida',

  '1013': 'Hogar y estilo de vida',

  '1014': 'Actividades escolares',

  '1015': 'Educación',

  '1016': 'Ciencia y tecnología',

  '1017': 'Deportes y fitness',

  '1018': 'Viajes y actividades al aire libre',

  '1019': 'Festivales y actividades de temporada',

};



const VENUE_TYPE_CODE_LABELS: Record<string, string> = {

  stadium: 'Estadio o coliseo',

  venue: 'Lugar de eventos',

  other: 'Otro',

  otro: 'Otro',

};



export function matchCategoryLabel(value?: string): EventCategoryCatalogItem | undefined {

  if (!value) return undefined;

  const normalized = value.toLowerCase();

  const mapped = NUMERIC_EVENT_CATEGORY_MAP[value] || NUMERIC_EVENT_CATEGORY_MAP[normalized.toUpperCase()];

  if (mapped) {

    return EVENT_CATEGORY_CATALOG.find((c) => c.id === mapped);

  }

  return EVENT_CATEGORY_CATALOG.find(

    (c) => c.id.toLowerCase() === normalized || c.label.toLowerCase().includes(normalized) || normalized.includes(c.id.toLowerCase()),

  );

}



/** Label legible para UI (preview, resumen, detalle). Nunca mostrar IDs crudos tipo "1012". */

export function resolveCategoryDisplayLabel(value?: string | number | null): string {

  if (value == null) return '—';

  const trimmed = String(value).trim();

  if (!trimmed) return '—';

  if (PREFERENCE_CATEGORY_LABELS[trimmed]) return PREFERENCE_CATEGORY_LABELS[trimmed];

  const matched = matchCategoryLabel(trimmed);

  if (matched?.label) return matched.label;

  return trimmed;

}



/** Label legible para tipo de lugar (evita códigos internos como "stadium"). */

export function resolveVenueTypeDisplayLabel(value?: string | null): string {

  if (!value) return '—';

  const trimmed = value.trim();

  if (!trimmed) return '—';

  const codeLabel = VENUE_TYPE_CODE_LABELS[trimmed.toLowerCase()];

  if (codeLabel) return codeLabel;

  if (trimmed.toLowerCase() === 'otro') return '—';

  return trimmed;

}


