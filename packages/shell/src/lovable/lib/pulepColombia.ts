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

const COLOMBIA_PATTERNS = [/colombia/i, /\bco\b/i];

/** Perfil o ubicación del organizador en Colombia. */
export function isColombiaProfile(country?: string | null, city?: string | null): boolean {
  const value = `${country || ''} ${city || ''}`.trim();
  if (!value) return false;
  return COLOMBIA_PATTERNS.some((p) => p.test(value));
}

/** Determina si el evento cae bajo Ley 1493 / PULEP (artes escénicas). */
export function isPulepApplicable(categoryLabel: string, typeLabel: string): boolean {
  const cat = categoryLabel.trim();
  const typ = typeLabel.trim();
  if (!cat && !typ) return false;
  if (CATEGORY_PATTERNS.some((p) => p.test(cat))) return true;
  if (TYPE_PATTERNS.some((p) => p.test(typ))) return true;
  return false;
}

/** PULEP es opcional: solo valida si el usuario empezó a completar el bloque. */
export function isPulepFormValid(formData: EventFormData): boolean {
  if (!formData.pulepRequired) return true;
  const started = Boolean(
    formData.pulepProducerType
    || formData.pulepRegistrationNumber?.trim()
    || formData.pulepAcknowledged,
  );
  if (!started) return true;
  return !!(
    formData.pulepProducerType
    && formData.pulepRegistrationNumber?.trim().length >= 5
    && formData.pulepAcknowledged
  );
}

export const PULEP_PORTAL_URL = 'https://pulep.mincultura.gov.co/';
