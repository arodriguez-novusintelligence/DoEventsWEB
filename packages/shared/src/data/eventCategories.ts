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

export const NUMERIC_EVENT_CATEGORY_MAP: Record<string, string> = {
  '1001': 'Fiesta',
  '1002': 'Cultural',
  '1004': 'Arte',
  '1005': 'Concierto',
  '1006': 'Deportes',
  '1008': 'Gastronomia',
  '1010': 'Comedia en vivo',
  '1015': 'Recorrido',
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
