import dessertFestival from '@lovable/assets/dessert-festival.jpg';
import modernKitchen from '@lovable/assets/modern-kitchen.jpg';
import outdoorDining from '@lovable/assets/outdoor-dining.jpg';
import vintageCars from '@lovable/assets/vintage-cars.jpg';

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
  /** percentage of canvas width/height (0–100) */
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
  /** Horseshoe/arc inner radius (% of outer). 25-85, default 55 — controls curvature/band width. */
  arcInner?: number;
  /** Horseshoe/arc angular span in degrees. 90-180, default 180 — controls opening. */
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
  /** Plantilla de mapa de silletería (p. ej. Movistar Arena) sin venue guardado */
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
  // Boletería
  ticketingType?: TicketingType;
  seatingLayout?: SeatingLayout;
  gates?: EventGate[];
  seatingMap?: SeatingMap;
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

export interface EventFormData {
  // Información principal
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
  // Lugar y ubicación
  location: EventLocation;
  // Control de accesos: gateId -> array of platform user ids
  accessControl?: Record<string, string[]>;
  // Reembolsos (obligatorio)
  refundPolicy?: RefundPolicy;
  // Fecha y hora de venta de boletería (paso 4)
  salesStartDate?: string;
  salesStartTime?: string;
  salesEndDate?: string;
  salesEndTime?: string;
  // Preguntas frecuentes (opcional)
  faqs: EventFaq[];
  // Agenda (opcional)
  agenda: EventDay[];
  /** ID del evento en backend cuando ya se guardó como borrador */
  persistedEventId?: string;
  /** Paso actual del wizard (1-7) para reanudar */
  wizardStep?: number;
}

export const initialEventFormData: EventFormData = {
  name: '',
  description: '',
  type: '',
  category: '',
  capacity: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
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
  refundPolicy: undefined,
  salesStartDate: '',
  salesStartTime: '',
  salesEndDate: '',
  salesEndTime: '',
  faqs: [],
  agenda: [],
};

export const EVENT_TYPES = [
  'Ceremonia',
  'Fiesta, reunión social o encuentro',
  'Cena o Gala',
  'Canto o presentación musical',
  'Concierto, actuación, teatro',
  'Stand up comedy',
  'Comedia en vivo',
  'Conferencia',
  'Convención',
  'Congreso',
  'Cumbre',
  'Debate',
  'Premiación',
  'Recorrido o Tour',
  'Campamento, viaje o retiro',
  'Capacitación, curso o entrenamiento',
  'Seminario o charla',
  'Festival o feria',
  'Festival',
  'Reunión o evento de networking',
  'Networking',
  'Feria comercial, feria de consumidores o exposición',
  'Exposición',
  'Juego o evento deportivo',
  'Deportivo',
  'Carrera o evento de resistencia',
  'Torneo',
  'Taller',
  'Otro',
];

export const EVENT_CATEGORIES = [
  'Artes escénicas',
  'Música',
  'Gastronomía',
  'Educación',
  'Tecnología',
  'Deportes',
  'Arte y cultura',
  'Negocios',
  'Entretenimiento',
  'Comedia en vivo',
  'Fiesta, Reunión social',
  'Juego o evento',
  'Recorrido',
  'Concierto',
  'Arte',
  'Cultural',
  'Otro',
];

export const mockCompleteEvent: EventFormData = {
  name: 'Festival Gastronómico Internacional',
  description: 'Una experiencia única que reúne a los mejores chefs del país en una noche inolvidable. Disfruta de degustaciones, maridajes y música en vivo en un ambiente sofisticado y único.',
  type: 'Festival',
  category: 'Gastronomía',
  capacity: '500',
  startDate: '2026-08-15',
  startTime: '18:00',
  endDate: '2026-08-15',
  endTime: '23:30',
  modality: 'presencial',
  eventClass: 'public',
  images: [dessertFestival, modernKitchen, outdoorDining],
  videoUrl: 'https://www.youtube.com/watch?v=demo',
  tags: ['gastronomia', 'festival', 'chef', 'vino', 'maridaje', 'Festivalgastronomico'],
  hosts: [
    { id: 'u-ana',   name: 'Ana Ruiz',      role: 'Anfitrión principal', username: '@anaruiz',  email: 'ana.ruiz@doevents.com',  initials: 'AR', source: 'platform' },
    { id: 'u-carlos', name: 'Carlos Pérez', role: 'Co-anfitrión',        username: '@carlosp',  email: 'carlos.perez@doevents.com', initials: 'CP', source: 'platform' },
  ],
  location: {
    mode: 'custom',
    customImages: [outdoorDining, vintageCars],
    customName: 'Centro de Convenciones Plaza Mayor',
    customType: 'Centro de convenciones',
    customLat: 6.2442,
    customLng: -75.5812,
    customAddress: 'Cra. 65 #7-262, Medellín, Colombia',
    detectedCity: 'Medellín, Antioquia',
    showMap: true,
    isOwner: false,
    saveToMyVenues: true,
    ticketingType: 'with-seating',
    seatingLayout: 'numbered',
    gates: [
      { id: 'g-1', number: 1, name: 'Puerta Norte' },
      { id: 'g-2', number: 2, name: 'Puerta Sur' },
      { id: 'g-3', number: 3, name: 'Puerta VIP' },
    ],
    seatingMap: {
      figures: [
        {
          id: 'fig-stage',
          shape: 'rectangle',
          role: 'element',
          name: 'Escenario Principal',
          x: 30,
          y: 3,
          w: 40,
          h: 12,
          color: '#374151',
          notes: 'Escenario principal con iluminación y sonido profesional',
        },
        {
          id: 'fig-vip',
          shape: 'horseshoe',
          role: 'category',
          name: 'Zona VIP',
          x: 25,
          y: 20,
          w: 50,
          h: 28,
          color: '#F59E0B',
          priceEnabled: true,
          currency: 'COP',
          price: 250000,
          floor: 1,
          gateId: 'g-3',
          rows: 5,
          seatsPerRow: 8,
          seatingOrder: 'top-left',
          seats: 40,
          seatSize: 80,
          arcInner: 55,
          arcSpan: 180,
        },
        {
          id: 'fig-gen-norte',
          shape: 'rectangle',
          role: 'category',
          name: 'Zona General Norte',
          x: 8,
          y: 52,
          w: 38,
          h: 22,
          color: '#6366F1',
          priceEnabled: true,
          currency: 'COP',
          price: 120000,
          floor: 1,
          gateId: 'g-1',
          rows: 8,
          seatsPerRow: 10,
          seatingOrder: 'top-left',
          seats: 80,
          seatSize: 85,
        },
        {
          id: 'fig-gen-sur',
          shape: 'rectangle',
          role: 'category',
          name: 'Zona General Sur',
          x: 54,
          y: 52,
          w: 38,
          h: 22,
          color: '#10B981',
          priceEnabled: true,
          currency: 'COP',
          price: 120000,
          floor: 1,
          gateId: 'g-2',
          rows: 8,
          seatsPerRow: 10,
          seatingOrder: 'top-left',
          seats: 80,
          seatSize: 85,
        },
        {
          id: 'fig-bar',
          shape: 'rectangle',
          role: 'element',
          name: 'Bar Central',
          x: 42,
          y: 78,
          w: 16,
          h: 10,
          color: '#8B5CF6',
          notes: 'Bar central con coctelería y degustaciones',
        },
        {
          id: 'fig-mesa',
          shape: 'circle',
          role: 'element',
          name: 'Mesa de Chef',
          x: 5,
          y: 82,
          w: 10,
          h: 10,
          color: '#EC4899',
          notes: 'Mesa de degustación del chef invitado',
        },
      ],
    },
  },
  accessControl: {
    'g-1': ['u-fer', 'u-isa'],
    'g-2': ['u-jose'],
    'g-3': ['u-laura', 'u-maria'],
  },
  refundPolicy: '7-days',
  salesStartDate: '2026-06-15',
  salesStartTime: '09:00',
  salesEndDate: '2026-08-15',
  salesEndTime: '17:00',
  faqs: [
    { id: 'f-1', question: '¿Está incluida la comida?', answer: 'Sí, la boleta incluye degustaciones de todos los stands gastronómicos y dos copas de maridaje.' },
    { id: 'f-2', question: '¿Hay estacionamiento?', answer: 'El centro de convenciones cuenta con estacionamiento privado con costo adicional.' },
    { id: 'f-3', question: '¿Pueden ingresar menores de edad?', answer: 'El acceso es exclusivo para mayores de 18 años.' },
    { id: 'f-4', question: '¿Cuál es el código de vestimenta?', answer: 'Sugerimos vestimenta semi-formal.' },
  ],
  agenda: [
    {
      id: 'd-1',
      name: 'Día 1 — Apertura',
      date: '2026-08-15',
      activities: [
        { id: 'a-1', startTime: '18:00', endTime: '18:30', description: 'Recepción y bienvenida con cóctel de honor' },
        { id: 'a-2', startTime: '18:30', endTime: '19:30', description: 'Apertura oficial y presentación de chefs invitados' },
        { id: 'a-3', startTime: '19:30', endTime: '21:30', description: 'Degustación de estaciones gastronómicas internacionales' },
        { id: 'a-4', startTime: '21:30', endTime: '22:30', description: 'Show musical en vivo y maridaje premium' },
        { id: 'a-5', startTime: '22:30', endTime: '23:30', description: 'Cierre con DJ set y postres de autor' },
      ],
    },
  ],
};
