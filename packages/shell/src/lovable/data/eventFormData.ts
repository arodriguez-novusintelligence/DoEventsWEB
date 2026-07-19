export type EventModality = 'presencial' | 'virtual';
export type EventClass = 'public' | 'private';

export interface EventHost {
  id: string;
  name: string;
  role?: string;
  username?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  avatar?: string;
  initials?: string;
  source?: 'platform' | 'manual' | 'contact';
}

export type VenueMode = 'mine' | 'custom';
export type TicketingType = 'only-tickets' | 'with-seating';
export type SeatingLayout = 'numbered' | 'general';

export interface TicketCategory {
  id: string;
  name: string;
  quantity: number;
  hasPrice: boolean;
  price: number;
  currency: SeatingCurrency;
  description?: string;
  gateId?: string;
}

export interface EventGate {
  id: string;
  number: number;
  name: string;
}

export type SeatingFigureShape =
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'ellipse'
  | 'semicircle'
  | 'rhombus'
  | 'trapezoid'
  | 'horseshoe'
  | 'stadium'
  | 'fan'
  | 'ring'
  | 'semi-ring'
  | 'chevron'
  | 'octagon'
  | 'boomerang'
  | 'superellipse'
  | 'text'
  | 'image';

export type SeatingFigureRole = 'category' | 'element';

export type SeatingCurrency = 'COP' | 'USD' | 'EUR' | 'MXN' | 'DOP' | 'ARS';

export type SeatingOrder =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface SeatingFigure {
  id: string;
  shape: SeatingFigureShape;
  role: SeatingFigureRole;
  name: string;
  /** percentage of canvas width/height (0â€“100) */
  x: number;
  y: number;
  w: number;
  h: number;
  /** rotation in degrees (0-360) */
  rotation?: number;
  /** locked figures cannot be moved, resized or rotated */
  locked?: boolean;
  /** text styling for the label rendered on top of the figure */
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  /** Label offset relative to figure center, in world units. */
  labelDx?: number;
  labelDy?: number;
  /** Label rotation in degrees, independent from the figure rotation. */
  labelRotation?: number;
  color: string;
  /** ---- Category fields ---- */
  priceEnabled?: boolean;
  currency?: SeatingCurrency;
  price?: number;
  floor?: number;
  gateId?: string;
  description?: string;
  rows?: number;
  seatsPerRow?: number;
  disabledSeats?: string[];
  seatingOrder?: SeatingOrder;
  seats?: number;
  /** chair size (percentage of cell, 30-100). Defaults to 90. */
  seatSize?: number;
  /** Horseshoe/arc inner radius (% of outer). 25-85, default 55 â€” controls curvature/band width. */
  arcInner?: number;
  /** Horseshoe/arc angular span in degrees. 90-180, default 180 â€” controls opening. */
  arcSpan?: number;
  /** ---- Element fields ---- */
  notes?: string;
  /** Optional image (data URL or http url) rendered inside the figure. */
  imageUrl?: string;
}

export const CATEGORY_COLORS = [
  '#6366F1',
  '#FBD9B5',
  '#FDE68A',
  '#BBF7D0',
  '#BAE6FD',
  '#E9D5FF',
  '#FBCFE8',
  '#FCA5A5',
  '#A7F3D0',
  '#C7D2FE',
];

export const TEXT_PALETTE = [
  '#0F172A',
  '#1E293B',
  '#1D4ED8',
  '#DC2626',
  '#16A34A',
  '#F59E0B',
  '#7C3AED',
  '#FFFFFF',
];

export const FONT_FAMILIES = [
  { value: 'inherit', label: 'Sistema' },
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Courier New", monospace', label: 'Courier' },
  { value: '"Times New Roman", serif', label: 'Times' },
  { value: 'Arial, sans-serif', label: 'Arial' },
];

export const SEATING_CURRENCIES: SeatingCurrency[] = [
  'COP',
  'USD',
  'EUR',
  'MXN',
  'DOP',
  'ARS',
];

export const SEATING_ORDER_LABELS: Record<SeatingOrder, string> = {
  'top-left': 'Superior izquierda',
  'top-right': 'Superior derecha',
  'bottom-left': 'Inferior izquierda',
  'bottom-right': 'Inferior derecha',
};

export interface SeatingMap {
  figures: SeatingFigure[];
}

export interface EventLocation {
  mode: VenueMode;
  // Mis Lugares
  selectedVenueId?: string;
  /** Plantilla de mapa de silleterÃ­a (p. ej. Movistar Arena) sin venue guardado */
  selectedTemplateId?: string;
  /** own = venue del usuario (actualiza plantilla); thirdParty = clona sin tocar el original */
  venueOwnership?: 'own' | 'thirdParty';
  // Personalizado
  customImages?: string[];
  customName?: string;
  customType?: string;
  customLat?: number;
  customLng?: number;
  customAddress?: string;
  detectedCity?: string;
  showMap?: boolean;
  isOwner?: boolean;
  saveToMyVenues?: boolean;
  // BoleterÃ­a
  ticketingType?: TicketingType;
  seatingLayout?: SeatingLayout;
  gates?: EventGate[];
  seatingMap?: SeatingMap;
  ticketCategories?: TicketCategory[];
}

export type RefundPolicy =
  | '1-day'
  | '7-days'
  | '30-days'
  | 'case-by-case'
  | 'none';

export type EventFormUpdater = (
  partial: Partial<EventFormData> | ((prev: EventFormData) => Partial<EventFormData>),
) => void;

export const REFUND_POLICY_OPTIONS: { value: RefundPolicy; label: string }[] = [
  { value: '1-day', label: 'Hasta 1 día antes del inicio del evento.' },
  { value: '7-days', label: 'Hasta 7 días antes del inicio del evento.' },
  { value: '30-days', label: 'Hasta 30 días antes del inicio del evento.' },
  { value: 'case-by-case', label: 'Se evaluará caso a caso' },
  { value: 'none', label: 'Sin reembolsos' },
];

export const REFUND_POLICY_REQUIRED_MESSAGE =
  'Selecciona una política de reembolso para continuar.';

export function isRefundPolicyConfigured(
  form: Pick<EventFormData, 'refundPolicy'>,
): boolean {
  return Boolean(form.refundPolicy);
}

export function refundPolicyToApiCode(policy?: RefundPolicy): string | undefined {
  const map: Record<RefundPolicy, string> = {
    '1-day': '1',
    '7-days': '7',
    '30-days': '30',
    'case-by-case': '0',
    none: 'N',
  };
  return policy ? map[policy] : undefined;
}

export type PromoCurrency = 'COP' | 'USD' | 'EUR' | 'MXN' | 'DOP' | 'ARS';

export type PromoCodeStatus = 'AVAILABLE' | 'SHARED' | 'CANCELLED' | 'REDEEMED';

export interface PromoCodeBatch {
  id: string;
  currency: PromoCurrency;
  value: number;
  quantity: number;
  description: string;
  codes: string[];
  /** Ya persistido en backend (edit event) */
  persisted?: boolean;
  editable?: boolean;
  editableCount?: number;
  redeemedCount?: number;
  cancelledCount?: number;
  codeStatuses?: Record<string, PromoCodeStatus | string>;
  createdAt?: string;
}

export interface EventFaq {
  id: string;
  question: string;
  answer: string;
}

export interface EventActivity {
  id: string;
  startTime: string;
  endTime: string;
  description: string;
  responsible?: EventHost;
}

export interface EventDay {
  id: string;
  name: string;
  date: string;
  activities: EventActivity[];
}

export type PulepProducerType = 'permanente' | 'ocasional' | '';

export interface EventFormData {
  // InformaciÃ³n principal
  name: string;
  description: string;
  type: string;
  category: string;
  capacity: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  modality: EventModality;
  eventClass: EventClass;
  // Material publicitario (opcional)
  images: string[]; // data URLs
  videoUrl: string;
  tags: string[];
  hosts: EventHost[];
  // Lugar y ubicaciÃ³n
  location: EventLocation;
  // Control de accesos: gateId -> array of platform user ids
  accessControl?: Record<string, string[]>;
  /** Perfiles de usuarios asignados a puertas (userId -> host) */
  accessStaff?: Record<string, EventHost>;
  // Reembolsos (obligatorio)
  refundPolicy?: RefundPolicy;
  // Fecha y hora de venta de boleterÃ­a (paso 4)
  salesStartDate?: string;
  salesStartTime?: string;
  salesEndDate?: string;
  salesEndTime?: string;
  // Preguntas frecuentes (opcional)
  faqs: EventFaq[];
  // Agenda (opcional)
  agenda: EventDay[];
  /** ID del evento en backend cuando ya se guardÃ³ como borrador */
  persistedEventId?: string;
  ownerUserId?: string;
  /** Paso actual del wizard (1-7) para reanudar */
  wizardStep?: number;
  /** Ley 1493 / PULEP — obligatorio para artes escénicas (validación frontend) */
  pulepRequired?: boolean;
  pulepProducerType?: PulepProducerType;
  pulepRegistrationNumber?: string;
  pulepAcknowledged?: boolean;
  /** Lotes de códigos promocionales (paso 4) */
  promoCodes?: PromoCodeBatch[];
}

export const initialEventFormData: EventFormData = {
  name: '',
  description: '',
  type: '',
  category: '',
  capacity: '',
  startDate: '',
  startTime: '18:00',
  endDate: '',
  endTime: '22:00',
  modality: 'presencial',
  eventClass: 'public',
  images: [],
  videoUrl: '',
  tags: [],
  hosts: [],
  location: {
    mode: 'custom',
    customImages: [],
    isOwner: false,
    saveToMyVenues: false,
    showMap: true,
    detectedCity: '',
    ticketingType: 'only-tickets',
    seatingLayout: 'general',
    gates: [],
    seatingMap: { figures: [] },
  },
  accessControl: {},
  accessStaff: {},
  refundPolicy: undefined,
  salesStartDate: '',
  salesStartTime: '',
  salesEndDate: '',
  salesEndTime: '',
  faqs: [],
  agenda: [],
  pulepRequired: false,
  pulepProducerType: '',
  pulepRegistrationNumber: '',
  pulepAcknowledged: false,
  promoCodes: [],
};

export const EVENT_TYPES = [
  'Ceremonia',
  'Fiesta, reuniÃ³n social o encuentro',
  'Cena o Gala',
  'Canto o presentaciÃ³n musical',
  'Concierto, actuaciÃ³n, teatro',
  'Stand up comedy',
  'Comedia en vivo',
  'Conferencia',
  'ConvenciÃ³n',
  'Congreso',
  'Cumbre',
  'Debate',
  'PremiaciÃ³n',
  'Recorrido o Tour',
  'Campamento, viaje o retiro',
  'CapacitaciÃ³n, curso o entrenamiento',
  'Seminario o charla',
  'Festival o feria',
  'Festival',
  'ReuniÃ³n o evento de networking',
  'Networking',
  'Feria comercial, feria de consumidores o exposiciÃ³n',
  'ExposiciÃ³n',
  'Juego o evento deportivo',
  'Deportivo',
  'Carrera o evento de resistencia',
  'Torneo',
  'Taller',
  'Otro',
];

export const EVENT_CATEGORIES = [
  'Artes escÃ©nicas',
  'MÃºsica',
  'GastronomÃ­a',
  'EducaciÃ³n',
  'TecnologÃ­a',
  'Deportes',
  'Arte y cultura',
  'Negocios',
  'Entretenimiento',
  'Comedia en vivo',
  'Fiesta, ReuniÃ³n social',
  'Juego o evento',
  'Recorrido',
  'Concierto',
  'Arte',
  'Cultural',
  'Otro',
];
export const mockCompleteEvent: EventFormData = initialEventFormData;
