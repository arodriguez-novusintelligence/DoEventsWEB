export type VenueSource = 'nearby' | 'mine';

export interface Venue {
  id: string;
  name: string;
  shortCode: string;
  capacity: number;
  type: string;
  image?: string;
  address: string;
  source: VenueSource;
  lat?: number;
  lng?: number;
}

/** @deprecated Sin datos mock — usar API real (lugares cercanos / mis lugares) */
export const MOCK_VENUES: Venue[] = [];

export const VENUE_TYPES = [
  'Salón de eventos',
  'Teatro',
  'Arena',
  'Loft privado',
  'Terraza al aire libre',
  'Bar / Restaurante',
  'Espacio cultural',
  'Coworking',
  'Otro',
];
