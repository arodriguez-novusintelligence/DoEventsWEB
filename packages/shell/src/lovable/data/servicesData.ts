export const SERVICE_SECTORS = [
  'Administración',
  'Catering',
  'Logística',
  'Marketing/publicidad',
  'Multimedia',
  'Entretenimiento',
  'Orador/Experto/Ponente',
  'Maestro Ceremonia/presentador',
  'Servicio de transporte',
  'Seguridad',
  'Empresa integral de gestión de evento',
  'Personal voluntario/staff sin costo',
] as const;

export type ServiceSector = typeof SERVICE_SECTORS[number];

export const SECTOR_ACTIVITIES: Record<string, string[]> = {
  'Administración': [
    'Gestión de eventos',
    'Personal presupuesto y contrataciones',
    'Gestión de staff',
    'Gestión de venue',
  ],
  'Catering': [
    'Mesero',
    'Barman',
    'Chef/cocineros/Personal de cocina',
    'Personal de cafetería',
    'Personal de aseo',
    'Hostess',
  ],
  'Logística': [
    'Personal de armado/Montaje de estructuras',
    'Servicio de decoración',
    'Personal de diseño y montaje de escenografías para producción de eventos',
    'Personal de audio, video e iluminación',
    'Personal electricista/eléctrico',
    'Personal gestión de ingresos/registros',
  ],
  'Marketing/publicidad': [
    'Influencers/branding',
    'Marketing manager',
    'Personal de piezas digitales para redes sociales, página web y E-mail',
    'Community manager',
    'Analista de marketing',
    'Content manager',
    'Especialista en marketing digital',
    'Profesional de User Experience (UI)',
    'Social media manager',
    'Especialista SEO/SEM',
    'Diseñador gráfico/creativo',
    'Gerente de relaciones públicas',
    'Desarrollador web',
  ],
  'Multimedia': [
    'Camarógrafo',
    'Fotógrafo',
    'Periodista',
    'Comunicador social',
    'Producción audiovisual',
    'Ingeniero de sonido',
    'Editor de video',
    'Intérprete',
    'Diseñador de multimedia',
    'Gerente de publicidad',
    'Director artístico',
  ],
  'Entretenimiento': [
    'Cantante',
    'Músico',
    'Artista',
    'Actor',
    'Bailarín',
    'Grupo de danzas',
    'Mago/Ilusionista',
    'Payaso',
    'Malabarista',
    'Celebridad',
    'Influencer',
    'Animador',
    "DJ's",
    'Comediante',
    'Pole Dancer',
    'Striptease',
    'Deportista',
    'Masajista',
    'Instructor de Yoga',
    'Profesor/instructor',
    'Coach',
  ],
  'Orador/Experto/Ponente': [
    'Conferencista',
    'Orador',
    'Ponente',
    'Panelista',
    'Experto/especialista',
    'Consultor',
    'Formador',
    'Facilitador',
    'Coach',
  ],
  'Maestro Ceremonia/presentador': [
    'Orador',
    'Ponente',
    'Moderador',
    'Experto/especialista',
    'Consultor',
    'Formador',
    'Facilitador',
    'Coach',
  ],
  'Servicio de transporte': [
    'Taxi amarillo',
    'Taxi blanco',
    'Botes',
    'Barcos',
    'Yates',
    'Lanchas',
    'Vuelo privado/charter',
    'Avionetas',
    'MiniVan',
    'Acarreos',
    'Domicilios',
    'Bicicletas',
    'Colectivo',
    'Bus grande',
  ],
  'Seguridad': [
    'Guardia de seguridad',
    'Bouncer/Cooler',
    'Seguridad parqueaderos',
    'Seguridad de ingresos',
  ],
  'Empresa integral de gestión de evento': [
    'Administración',
    'Catering',
    'Logística',
    'Marketing/publicidad',
    'Multimedia',
    'Entretenimiento',
    'Servicio de transporte',
    'Seguridad',
    'Alquiler de sonido, luces, tarima y estructuras',
  ],
  'Personal voluntario/staff sin costo': [
    'Administración',
    'Catering',
    'Logística',
    'Marketing/publicidad',
    'Multimedia',
    'Entretenimiento',
    'Orador/Experto/Ponente',
    'Maestro Ceremonia/presentador',
    'Servicio de transporte',
    'Seguridad',
    'Registro/direcciones/entradas/ayuda general',
  ],
};

export const PRICING_TYPES = [
  'Por día',
  'Por hora',
  'Por evento',
  'Por show',
  'Por canción',
  'Por presentación',
  'Por servicio',
  'Por persona',
] as const;

export type PricingType = typeof PRICING_TYPES[number];

export const CURRENCIES = ['COP', 'USD', 'EUR', 'MXN', 'ARS', 'BRL'] as const;

export const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;
export const DAYS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;

export interface PricingDetail {
  type: string;
  currency: string;
  cost: string;
  description: string;
}

export interface DaySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ActivityPricing {
  currency: string;
  cost: string;
  pricingType: string;
  description: string;
}

export interface ServiceGalleryItem {
  id: string;
  preview: string;
  file?: File;
  url?: string;
  galleryImageId?: string;
  galleryKey?: string;
  kind: 'image' | 'video';
}

export interface ServicePromoCodeBatch {
  id: string;
  currency: string;
  value: number;
  quantity: number;
  description: string;
  codes: string[];
}

export interface ServiceFormData {
  /** URL remota (p. ej. foto de perfil) o preview tras subir */
  coverImageUrl?: string;
  /** Preview local (blob) mientras se sube */
  coverImagePreview?: string;
  /** Archivo pendiente de subir al publicar */
  coverImageFile?: File | null;
  coverGalleryImageId?: string;
  coverGalleryKey?: string;
  gallery: ServiceGalleryItem[];
  latitude?: number;
  longitude?: number;
  locationCity?: string;
  locationLabel?: string;
  sectors: string[];
  sectorOther: string;
  activities: Record<string, string[]>;
  activityOthers: Record<string, string>;
  activityPricing: Record<string, ActivityPricing>; // key: "sector::activity"
  pricingTypes: string[];
  pricingOther: string;
  pricingDetails: PricingDetail[];
  selectedDates: string[];
  blockedDates: string[];
  globalStartTime: string;
  globalEndTime: string;
  bookingPreference: 'instant' | 'approval';
  refundPolicy: string;
  promoEnabled?: boolean;
  promoCodes?: ServicePromoCodeBatch[];
  /** Preview local de foto principal (blob URL) */
  servicePhoto?: string;
  galleryMedia?: { type: 'photo' | 'video'; url: string }[];
  faqs: FAQItem[];
  // legacy fields kept for compatibility
  selectedDays: boolean[];
  customSchedule: boolean;
  daySchedules: DaySchedule[];
  acceptedConditions: boolean;
}

export const REFUND_POLICIES = [
  'El mismo día de la reserva',
  'Hasta 1 día antes del inicio de la reserva',
  'Hasta 7 días antes del inicio de la reserva',
  'Hasta 30 días antes del inicio de la reserva',
  'Se evaluará caso a caso',
] as const;

export const initialFormData: ServiceFormData = {
  coverImageUrl: undefined,
  coverImagePreview: undefined,
  coverImageFile: null,
  gallery: [],
  latitude: undefined,
  longitude: undefined,
  locationCity: undefined,
  locationLabel: undefined,
  sectors: [],
  sectorOther: '',
  activities: {},
  activityOthers: {},
  activityPricing: {},
  pricingTypes: [],
  pricingOther: '',
  pricingDetails: [],
  selectedDates: [],
  blockedDates: [],
  globalStartTime: '08:00',
  globalEndTime: '17:00',
  bookingPreference: 'instant',
  refundPolicy: '',
  promoEnabled: false,
  promoCodes: [],
  faqs: [{ question: '', answer: '' }],
  selectedDays: [false, false, false, false, false, false, false],
  customSchedule: false,
  daySchedules: DAYS_FULL.map(() => ({ enabled: false, startTime: '08:00', endTime: '17:00' })),
  acceptedConditions: false,
};
