import type { WizardElement, FloorPlanGeometry, SeatOrder, FloorEditorSettings } from './floorPlan';

export type { WizardElement, FloorPlanGeometry, SeatOrder, FloorEditorSettings };
export * from './floorPlan';

export interface WizardGate {
  gateId: string;
  gateNumber: number;
  name: string;
  description: string;
}

export interface WizardSeat {
  seatId: string;
  rowLabel: string;
  colNumber: number;
  seatCode: string;
  seatType: 'standard' | 'vip' | 'wheelchair';
  status: 'available' | 'occupied' | 'reserved';
  isAccessible: boolean;
}

export interface WizardCategory {
  categoryId: string;
  name: string;
  color: string;
  relX: number;
  relY: number;
  width: number;
  height: number;
  geometry: FloorPlanGeometry;
  rotation: number;
  zIndex: number;
  ringThickness: number;
  locked: boolean;
  gateId: string;
  rows: number;
  seatsPerRow: number;
  seats: WizardSeat[];
  price: number;
  isPaid: boolean;
  currency: string;
  description: string;
  colOrder: SeatOrder;
  rowOrder: SeatOrder;
  disableSeatsEnabled: boolean;
}

export interface WizardFloor {
  floorId: string;
  name: string;
  description: string;
  categories: WizardCategory[];
  elements: WizardElement[];
  editorSettings?: FloorEditorSettings;
}

export interface EventMediaItem {
  id: string;
  file?: File;
  previewUrl: string;
  uploadedUrl?: string;
  name: string;
}

export interface SavedVenueSummary {
  venueId: string;
  name: string;
  capacity?: number;
  city?: string;
  isTemplate?: boolean;
}

export interface EventWizardState {
  step: number;
  showLanding: boolean;
  eventId: string | null;
  venueId: string | null;
  templateVenueId: string | null;
  saveVenueAsTemplate: boolean;
  mediaItems: EventMediaItem[];
  hasSeating: boolean;
  gates: WizardGate[];
  floors: WizardFloor[];
  eventForm: {
    nombre: string;
    descripcion: string;
    fechaIni: string;
    fechaFin: string;
    horaIni: string;
    horaFin: string;
    ubicacion: string;
    ciudad: string;
    departamento: string;
    latitude: string;
    longitude: string;
    pais: string;
    direccion: string;
    tipoEvento: string;
    Categoria: string;
    aforo: string;
    modalidadEvt: string;
    organizerName: string;
    TelPrin: string;
    email: string;
  };
  venueForm: {
    name: string;
    capacity: string;
    description: string;
    phone: string;
    address: string;
    city: string;
    latitude: string;
    longitude: string;
  };
}

export const WIZARD_STEPS = [
  { id: 0, label: 'Detalles' },
  { id: 1, label: 'Plano' },
  { id: 2, label: 'Publicar' },
] as const;

export const CATEGORY_COLORS = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DB2777', '#0891B2'];
