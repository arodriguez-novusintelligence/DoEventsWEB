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
export const MOCK_VENUES: Venue[] = [];
