import type { VenueAddonService, WizardFloor, WizardGate } from '@doevents/shared';
import { newWizardId } from '@doevents/shared';
import type { FacilidadSelected } from '@lovable/components/venues/FacilitiesPicker';
import { VENUE_PLACE_TYPES } from './venueOptions';

export interface PlaceFaq {
  id: string;
  question: string;
  answer: string;
}

export const PLACE_TYPES = [
  ...VENUE_PLACE_TYPES,
] as const;

export type PlaceType = (typeof PLACE_TYPES)[number];

export const PLACE_FEATURES = [
  'WiFi',
  'Cocina',
  'Baños',
  'Aire acondicionado',
  'Sonido',
  'Iluminación',
  'Camerinos',
  'Escenario',
  'Zona verde',
  'Piscina',
] as const;

export interface PlaceMediaItem {
  id: string;
  preview: string;
  file?: File;
  url?: string;
  galleryImageId?: string;
  galleryKey?: string;
  kind: 'image' | 'video';
}

export interface PlacePricing {
  perDay: string;
  perMultiDay: string;
  perWeek: string;
  perMonth: string;
  currency: string;
}

export interface PlaceFormData {
  name: string;
  placeType: string;
  placeTypeOther: string;
  description: string;
  media: PlaceMediaItem[];
  address: string;
  city: string;
  department: string;
  country: string;
  latitude: string;
  longitude: string;
  locationLabel: string;
  hasSeating: boolean;
  capacity: string;
  hasParking: boolean;
  features: string[];
  pricing: PlacePricing;
  selectedDates: string[];
  blockedDates: string[];
  globalStartTime: string;
  globalEndTime: string;
  bookingPreference: 'instant' | 'approval';
  refundPolicy: string;
  directions: string;
  nearbyReferencesText: string;
  gates: WizardGate[];
  floors: WizardFloor[];
  acceptedConditions: boolean;
  neighborhood: string;
  facilities: FacilidadSelected[];
  allowedEventTypes: string[];
  accessibility: string[];
  security: string[];
  hostRole: 'dueno' | 'admin' | '';
  addonServices: VenueAddonService[];
  faqs: PlaceFaq[];
}

export const initialPlaceFormData = (): PlaceFormData => ({
  name: '',
  placeType: '',
  placeTypeOther: '',
  description: '',
  media: [],
  address: '',
  city: '',
  department: '',
  country: 'Colombia',
  latitude: '',
  longitude: '',
  locationLabel: '',
  hasSeating: false,
  capacity: '100',
  hasParking: false,
  features: [],
  pricing: {
    perDay: '',
    perMultiDay: '',
    perWeek: '',
    perMonth: '',
    currency: 'COP',
  },
  selectedDates: [],
  blockedDates: [],
  globalStartTime: '08:00',
  globalEndTime: '22:00',
  bookingPreference: 'instant',
  refundPolicy: '',
  directions: '',
  nearbyReferencesText: '',
  gates: [{ gateId: newWizardId(), gateNumber: 1, name: 'Entrada principal', description: '' }],
  floors: [{
    floorId: newWizardId(),
    name: 'Piso 1',
    description: '',
    categories: [],
    elements: [],
  }],
  acceptedConditions: false,
  neighborhood: '',
  facilities: [],
  allowedEventTypes: [],
  accessibility: [],
  security: [],
  hostRole: '',
  addonServices: [],
  faqs: [],
});
