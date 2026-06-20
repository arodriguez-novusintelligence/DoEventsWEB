import type { EventFormData } from '@lovable/data/eventFormData';

export type PulepProducerType = 'permanente' | 'ocasional' | '';

const CATEGORY_PATTERNS = [/artes esc[eé]nicas/i, /teatro/i, /danza/i];
const TYPE_PATTERNS = [
  /concierto/i,
  /actuaci[oó]n/i,
  /teatro/i,
  /stand up/i,
  /comedia en vivo/i,
  /presentaci[oó]n musical/i,
];

/** Determina si el evento cae bajo Ley 1493 / PULEP (artes escénicas). */
export function isPulepApplicable(categoryLabel: string, typeLabel: string): boolean {
  const cat = categoryLabel.trim();
  const typ = typeLabel.trim();
  if (!cat && !typ) return false;
  if (CATEGORY_PATTERNS.some((p) => p.test(cat))) return true;
  if (TYPE_PATTERNS.some((p) => p.test(typ))) return true;
  return false;
}

export function isPulepFormValid(formData: EventFormData): boolean {
  if (!formData.pulepRequired) return true;
  return !!(
    formData.pulepProducerType &&
    formData.pulepRegistrationNumber?.trim().length >= 5 &&
    formData.pulepAcknowledged
  );
}

export const PULEP_PORTAL_URL = 'https://pulep.mincultura.gov.co/';
