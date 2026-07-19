import type { EventGate, SeatingFigure, SeatingFigureShape, SeatingMap, EventLocation } from './eventFormData';

export type SeatingZoneSeatType = 'numbered' | 'general' | 'vip' | 'accessible';

export interface SeatingZoneSpec {
  id: string;
  name: string;
  floor: number;
  sectors: string;
  seats: number;
  seatType: SeatingZoneSeatType;
  description: string;
}

export interface SeatingLevelSpec {
  floor: number;
  label: string;
  description: string;
}

export interface SeatingMapTemplate {
  id: string;
  name: string;
  description: string;
  venueName: string;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
  placeType?: string;
  /** Aforo de referencia operativo (butacas / sillas modeladas). */
  officialCapacity: number;
  /** Aforo máximo en configuraciones especiales (p. ej. pie en platea). */
  maxCapacity?: number;
  floors: number[];
  levels: SeatingLevelSpec[];
  zones: SeatingZoneSpec[];
  sectionsIncluded: string[];
  sectionsNotIncluded: string[];
  sources: string[];
  gates: EventGate[];
  seatingMap: SeatingMap;
}

type ZoneLayout = {
  shape: SeatingFigureShape;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  gateId: string;
  price: number;
  rotation?: number;
  arcInner?: number;
  arcSpan?: number;
  rows: number;
  seatsPerRow: number;
};

function rowsColsFor(seats: number): { rows: number; seatsPerRow: number } {
  if (seats <= 200) return { rows: 5, seatsPerRow: Math.ceil(seats / 5) };
  if (seats <= 800) return { rows: 8, seatsPerRow: Math.ceil(seats / 8) };
  if (seats <= 2500) return { rows: 12, seatsPerRow: Math.ceil(seats / 12) };
  if (seats <= 6000) return { rows: 24, seatsPerRow: Math.ceil(seats / 24) };
  return { rows: 32, seatsPerRow: Math.ceil(seats / 32) };
}

function buildCategoryFigure(
  zone: SeatingZoneSpec,
  layout: ZoneLayout,
): SeatingFigure {
  const grid = rowsColsFor(zone.seats);
  return {
    id: zone.id,
    shape: layout.shape,
    role: 'category',
    name: zone.name,
    x: layout.x,
    y: layout.y,
    w: layout.w,
    h: layout.h,
    rotation: layout.rotation,
    color: layout.color,
    floor: zone.floor,
    gateId: layout.gateId,
    priceEnabled: true,
    currency: 'COP',
    price: layout.price,
    rows: layout.rows || grid.rows,
    seatsPerRow: layout.seatsPerRow || grid.seatsPerRow,
    seats: zone.seats,
    seatingOrder: 'top-left',
    seatSize: zone.seatType === 'vip' ? 85 : 78,
    arcInner: layout.arcInner,
    arcSpan: layout.arcSpan,
    description: `${zone.sectors}. ${zone.description}`,
  };
}

type ServiceElementSpec = {
  id: string;
  name: string;
  floor: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  shape?: SeatingFigureShape;
  notes?: string;
};

function buildServiceElements(specs: ServiceElementSpec[]): SeatingFigure[] {
  return specs.map((spec) => ({
    id: spec.id,
    shape: spec.shape || 'rectangle',
    role: 'element' as const,
    name: spec.name,
    x: spec.x,
    y: spec.y,
    w: spec.w,
    h: spec.h,
    color: spec.color || '#64748B',
    floor: spec.floor,
    locked: true,
    notes: spec.notes,
  }));
}

const MOVISTAR_GATES: EventGate[] = [
  { id: 'g-ma-p2', number: 1, name: 'Puerta 2 — Acceso Norte' },
  { id: 'g-ma-p8', number: 2, name: 'Puerta 8 — VIP Sur' },
  { id: 'g-ma-platea', number: 3, name: 'Puerta Platea / Cancha' },
  { id: 'g-ma-fan-n', number: 4, name: 'Puerta Tribuna Fan Norte' },
  { id: 'g-ma-fan-s', number: 5, name: 'Puerta Tribuna Fan Sur' },
];

const MOVISTAR_ZONES: SeatingZoneSpec[] = [
  {
    id: 'ma-platea',
    name: 'Platea (101-106)',
    floor: 1,
    sectors: 'Sectores 101, 102, 103, 104, 105, 106',
    seats: 3540,
    seatType: 'general',
    description: 'Zona a nivel de cancha frente al escenario. Admisión general o numerada según el evento.',
  },
  {
    id: 'ma-p2-occ',
    name: 'Piso 2 Occidental',
    floor: 2,
    sectors: 'Sectores 201, 202, 203, 204, 205, 206, 207',
    seats: 1680,
    seatType: 'numbered',
    description: 'Gradería intermedia occidental con silletería numerada.',
  },
  {
    id: 'ma-p2-cent',
    name: 'Piso 2 Central',
    floor: 2,
    sectors: 'Sectores 208, 209, 210, 211, 212',
    seats: 1440,
    seatType: 'numbered',
    description: 'Gradería intermedia central, vista frontal al escenario.',
  },
  {
    id: 'ma-p2-ori',
    name: 'Piso 2 Oriental',
    floor: 2,
    sectors: 'Sectores 213, 214, 215, 216, 217, 218, 219',
    seats: 1680,
    seatType: 'numbered',
    description: 'Gradería intermedia oriental con silletería numerada.',
  },
  {
    id: 'ma-p3-occ',
    name: 'Piso 3 Occidental',
    floor: 3,
    sectors: 'Sectores 301, 302, 303, 304, 305, 306, 307',
    seats: 1610,
    seatType: 'numbered',
    description: 'Gradería alta occidental.',
  },
  {
    id: 'ma-p3-cent',
    name: 'Piso 3 Central',
    floor: 3,
    sectors: 'Sectores 308, 309, 310, 311, 312',
    seats: 1380,
    seatType: 'numbered',
    description: 'Gradería alta central.',
  },
  {
    id: 'ma-p3-ori',
    name: 'Piso 3 Oriental',
    floor: 3,
    sectors: 'Sectores 313, 314, 315, 316, 317, 318',
    seats: 1610,
    seatType: 'numbered',
    description: 'Gradería alta oriental.',
  },
  {
    id: 'ma-fan-n',
    name: 'Tribuna Fan Norte',
    floor: 1,
    sectors: 'Tribuna Fan Norte',
    seats: 155,
    seatType: 'vip',
    description: 'Zona exclusiva con vista privilegiada al escenario (capacidad oficial: 155 personas).',
  },
  {
    id: 'ma-fan-s',
    name: 'Tribuna Fan Sur',
    floor: 1,
    sectors: 'Tribuna Fan Sur',
    seats: 155,
    seatType: 'vip',
    description: 'Tribuna fanática sur con silletería numerada en conciertos.',
  },
  {
    id: 'ma-suites',
    name: 'Suites VIP',
    floor: 3,
    sectors: '21 suites privadas',
    seats: 420,
    seatType: 'vip',
    description: 'Suites con capacidad aprox. de 20 personas cada una, menú especial y parqueadero privado.',
  },
  {
    id: 'ma-boxes',
    name: 'Boxes VIP',
    floor: 3,
    sectors: '20 boxes superiores',
    seats: 200,
    seatType: 'vip',
    description: 'Boxes en la parte superior del venue con vista panorámica.',
  },
  {
    id: 'ma-accesible',
    name: 'Zona accesible',
    floor: 1,
    sectors: 'Platea — zona PMR',
    seats: 130,
    seatType: 'accessible',
    description: 'Ubicación en platea para personas con movilidad reducida y acompañante.',
  },
];

const MOVISTAR_LAYOUTS: Record<string, ZoneLayout> = {
  'ma-platea': { shape: 'rectangle', x: 20, y: 22, w: 60, h: 30, color: '#6366F1', gateId: 'g-ma-platea', price: 280000, rows: 30, seatsPerRow: 118 },
  'ma-p2-occ': { shape: 'horseshoe', x: 4, y: 54, w: 28, h: 36, color: '#10B981', gateId: 'g-ma-p2', price: 160000, arcInner: 48, arcSpan: 150, rows: 14, seatsPerRow: 120 },
  'ma-p2-cent': { shape: 'horseshoe', x: 34, y: 54, w: 32, h: 36, color: '#14B8A6', gateId: 'g-ma-p2', price: 190000, arcInner: 50, arcSpan: 160, rows: 12, seatsPerRow: 120 },
  'ma-p2-ori': { shape: 'horseshoe', x: 68, y: 54, w: 28, h: 36, color: '#10B981', gateId: 'g-ma-p2', price: 160000, arcInner: 48, arcSpan: 150, rows: 14, seatsPerRow: 120 },
  'ma-p3-occ': { shape: 'horseshoe', x: 4, y: 6, w: 28, h: 40, color: '#0EA5E9', gateId: 'g-ma-p2', price: 120000, arcInner: 42, arcSpan: 165, rows: 14, seatsPerRow: 115 },
  'ma-p3-cent': { shape: 'horseshoe', x: 34, y: 4, w: 32, h: 42, color: '#0284C7', gateId: 'g-ma-p2', price: 140000, arcInner: 40, arcSpan: 170, rows: 12, seatsPerRow: 115 },
  'ma-p3-ori': { shape: 'horseshoe', x: 68, y: 6, w: 28, h: 40, color: '#0EA5E9', gateId: 'g-ma-p2', price: 120000, arcInner: 42, arcSpan: 165, rows: 14, seatsPerRow: 115 },
  'ma-fan-n': { shape: 'horseshoe', x: 38, y: 56, w: 24, h: 18, color: '#8B5CF6', gateId: 'g-ma-fan-n', price: 420000, arcInner: 55, arcSpan: 120, rows: 5, seatsPerRow: 31 },
  'ma-fan-s': { shape: 'horseshoe', x: 38, y: 78, w: 24, h: 16, color: '#A855F7', gateId: 'g-ma-fan-s', price: 400000, arcInner: 52, arcSpan: 130, rows: 5, seatsPerRow: 31 },
  'ma-suites': { shape: 'rectangle', x: 2, y: 2, w: 20, h: 12, color: '#EC4899', gateId: 'g-ma-p8', price: 1200000, rows: 3, seatsPerRow: 140 },
  'ma-boxes': { shape: 'rectangle', x: 78, y: 2, w: 20, h: 12, color: '#F43F5E', gateId: 'g-ma-p8', price: 850000, rows: 2, seatsPerRow: 100 },
  'ma-accesible': { shape: 'rectangle', x: 42, y: 48, w: 16, h: 6, color: '#64748B', gateId: 'g-ma-platea', price: 180000, rows: 5, seatsPerRow: 26 },
};

const MOVISTAR_SERVICE_ELEMENTS: ServiceElementSpec[] = [
  { id: 'ma-stage', name: 'Escenario principal', floor: 1, x: 30, y: 2, w: 40, h: 14, color: '#1F2937', shape: 'stadium', notes: 'Escenario orientado al norte. Parrilla técnica 85 t.' },
  { id: 'ma-door-n1', name: 'Puerta principal Norte (P2)', floor: 1, x: 46, y: 18, w: 8, h: 4, color: '#334155', notes: 'Acceso platea norte.' },
  { id: 'ma-door-s1', name: 'Puerta VIP Sur (P8)', floor: 1, x: 46, y: 88, w: 8, h: 4, color: '#334155', notes: 'Acceso tribuna fan sur.' },
  { id: 'ma-bath-p1-a', name: 'Baños platea occidental', floor: 1, x: 8, y: 40, w: 6, h: 5, color: '#94A3B8', notes: 'Servicios sanitarios nivel 1.' },
  { id: 'ma-bath-p1-b', name: 'Baños platea oriental', floor: 1, x: 86, y: 40, w: 6, h: 5, color: '#94A3B8' },
  { id: 'ma-concourse-1', name: 'Concourse / F&B', floor: 1, x: 44, y: 92, w: 12, h: 6, color: '#6B7280', notes: 'Puntos de comida y bebida.' },
  { id: 'ma-door-p2-w', name: 'Puerta Piso 2 Occidente', floor: 2, x: 6, y: 58, w: 5, h: 4, color: '#475569' },
  { id: 'ma-door-p2-e', name: 'Puerta Piso 2 Oriente', floor: 2, x: 89, y: 58, w: 5, h: 4, color: '#475569' },
  { id: 'ma-bath-p2', name: 'Baños gradería media', floor: 2, x: 48, y: 50, w: 8, h: 4, color: '#94A3B8' },
  { id: 'ma-door-p3', name: 'Puertas gradería alta', floor: 3, x: 48, y: 8, w: 8, h: 3, color: '#475569' },
  { id: 'ma-bath-p3-w', name: 'Baños piso 3 occidente', floor: 3, x: 10, y: 12, w: 6, h: 4, color: '#94A3B8' },
  { id: 'ma-bath-p3-e', name: 'Baños piso 3 oriente', floor: 3, x: 84, y: 12, w: 6, h: 4, color: '#94A3B8' },
  { id: 'ma-vip-lounge', name: 'Zona VIP / suites', floor: 3, x: 4, y: 2, w: 18, h: 8, color: '#BE185D', notes: 'Acceso suites y boxes.' },
];

function buildMovistarFigures(): SeatingFigure[] {
  const categories = MOVISTAR_ZONES.map((zone) => buildCategoryFigure(zone, MOVISTAR_LAYOUTS[zone.id]));
  return [...buildServiceElements(MOVISTAR_SERVICE_ELEMENTS), ...categories];
}

/** Plantilla rigurosa — Movistar Arena Bogotá (Coliseo renovado, aforo estándar ~14.000). */
export const MOVISTAR_ARENA_BOGOTA_TEMPLATE: SeatingMapTemplate = {
  id: 'movistar-arena-bogota',
  name: 'Movistar Arena Bogotá',
  description:
    'Coliseo Movistar Arena: 3 niveles de gradería + platea, tribunas fan, suites y boxes VIP. Aforo estándar ~14.000 sentados.',
  venueName: 'Movistar Arena Bogotá',
  city: 'Bogotá, Colombia',
  address: 'Diagonal 61C #26-36, Bogotá',
  latitude: 4.6486,
  longitude: -74.0928,
  placeType: 'Estadio o coliseo',
  officialCapacity: 14000,
  maxCapacity: 16522,
  floors: [1, 2, 3],
  levels: [
    { floor: 1, label: 'Nivel 1 — Platea y Fan', description: 'Platea 101-106, Tribuna Fan Norte/Sur y zona accesible.' },
    { floor: 2, label: 'Nivel 2 — Gradería media', description: 'Sectores numerados 201-219.' },
    { floor: 3, label: 'Nivel 3 — Gradería alta y VIP', description: 'Sectores 301-318, suites y boxes.' },
  ],
  zones: MOVISTAR_ZONES,
  sectionsIncluded: MOVISTAR_ZONES.map((z) => `${z.name} (${z.sectors})`),
  sectionsNotIncluded: [
    'Party Suite (1 espacio corporativo privado — no incluido en aforo de silletería pública).',
    'Bares VIP (Bar Amex ~100 pax, Bar VIP Sur) — hospitality sin asiento fijo en boleta.',
    'Configuración con público de pie en platea (hasta ~16.522 pax totales) — esta plantilla modela butacas estándar.',
    'Backstage, camerinos, bodegas y zonas operativas.',
  ],
  sources: [
    'https://movistararena.co/preguntas-frecuentes/',
    'https://bogota.gov.co/mi-ciudad/cultura-recreacion-y-deporte/coliseo-movistar-arena-en-bogota',
    'https://movistararena.co/experiencias-vip/',
  ],
  gates: MOVISTAR_GATES,
  seatingMap: { figures: buildMovistarFigures() },
};

const CAMPIN_GATES: EventGate[] = [
  { id: 'g-ec-ori', number: 1, name: 'Ingreso Tribuna Oriental' },
  { id: 'g-ec-occ', number: 2, name: 'Ingreso Tribuna Occidental' },
  { id: 'g-ec-norte', number: 3, name: 'Ingreso Tribuna Norte' },
  { id: 'g-ec-sur', number: 4, name: 'Ingreso Tribuna Sur' },
];

const CAMPIN_ZONES: SeatingZoneSpec[] = [
  {
    id: 'ec-ori-baja',
    name: 'Tribuna Oriental Baja',
    floor: 1,
    sectors: 'Tribuna Oriental — nivel bajo',
    seats: 9870,
    seatType: 'numbered',
    description: 'Gradería principal baja sobre la lateral oriental del campo.',
  },
  {
    id: 'ec-ori-alta',
    name: 'Tribuna Oriental Alta',
    floor: 2,
    sectors: 'Tribuna Oriental — nivel alto',
    seats: 9870,
    seatType: 'numbered',
    description: 'Segunda altura de la tribuna oriental (mayor aforo del estadio).',
  },
  {
    id: 'ec-occ-baja',
    name: 'Tribuna Occidental Baja',
    floor: 1,
    sectors: 'Tribuna Occidental — nivel bajo',
    seats: 4985,
    seatType: 'numbered',
    description: 'Gradería baja occidental, frente a banca de suplentes.',
  },
  {
    id: 'ec-occ-alta',
    name: 'Tribuna Occidental Alta',
    floor: 2,
    sectors: 'Tribuna Occidental — nivel alto',
    seats: 4984,
    seatType: 'numbered',
    description: 'Segunda altura tribuna occidental.',
  },
  {
    id: 'ec-norte',
    name: 'Tribuna Norte',
    floor: 1,
    sectors: 'Tribuna Norte (cabecera)',
    seats: 4802,
    seatType: 'numbered',
    description: 'Cabecera norte detrás del arco. Incluye preferencial norte en eventos de fútbol.',
  },
  {
    id: 'ec-sur',
    name: 'Tribuna Sur',
    floor: 1,
    sectors: 'Tribuna Sur (cabecera)',
    seats: 5213,
    seatType: 'numbered',
    description: 'Cabecera sur — hinchada visitante/local según evento.',
  },
];

const CAMPIN_LAYOUTS: Record<string, ZoneLayout> = {
  'ec-ori-baja': { shape: 'horseshoe', x: 58, y: 18, w: 38, h: 62, color: '#2563EB', gateId: 'g-ec-ori', price: 85000, arcInner: 38, arcSpan: 155, rows: 38, seatsPerRow: 260 },
  'ec-ori-alta': { shape: 'horseshoe', x: 56, y: 8, w: 42, h: 28, color: '#1D4ED8', gateId: 'g-ec-ori', price: 65000, arcInner: 35, arcSpan: 160, rows: 38, seatsPerRow: 260 },
  'ec-occ-baja': { shape: 'horseshoe', x: 4, y: 18, w: 38, h: 62, color: '#059669', gateId: 'g-ec-occ', price: 75000, arcInner: 38, arcSpan: 155, rotation: 180, rows: 28, seatsPerRow: 178 },
  'ec-occ-alta': { shape: 'horseshoe', x: 2, y: 8, w: 42, h: 28, color: '#047857', gateId: 'g-ec-occ', price: 55000, arcInner: 35, arcSpan: 160, rotation: 180, rows: 28, seatsPerRow: 178 },
  'ec-norte': { shape: 'semicircle', x: 28, y: 2, w: 44, h: 22, color: '#F59E0B', gateId: 'g-ec-norte', price: 45000, arcInner: 45, arcSpan: 170, rows: 22, seatsPerRow: 218 },
  'ec-sur': { shape: 'semicircle', x: 28, y: 76, w: 44, h: 22, color: '#D97706', gateId: 'g-ec-sur', price: 45000, arcInner: 45, arcSpan: 170, rows: 24, seatsPerRow: 217 },
};

const CAMPIN_SERVICE_ELEMENTS: ServiceElementSpec[] = [
  { id: 'ec-field', name: 'Campo de juego', floor: 1, x: 26, y: 28, w: 48, h: 44, color: '#16A34A', notes: 'Cancha reglamentaria FIFA — 105 m x 68 m aprox.' },
  { id: 'ec-benches', name: 'Bancas técnicas', floor: 1, x: 24, y: 46, w: 4, h: 8, color: '#1E293B' },
  { id: 'ec-door-ori', name: 'Ingreso Tribuna Oriental', floor: 1, x: 92, y: 44, w: 6, h: 8, color: '#334155' },
  { id: 'ec-door-occ', name: 'Ingreso Tribuna Occidental', floor: 1, x: 2, y: 44, w: 6, h: 8, color: '#334155' },
  { id: 'ec-door-norte', name: 'Ingreso Tribuna Norte', floor: 1, x: 44, y: 2, w: 12, h: 5, color: '#334155' },
  { id: 'ec-door-sur', name: 'Ingreso Tribuna Sur', floor: 1, x: 44, y: 93, w: 12, h: 5, color: '#334155' },
  { id: 'ec-bath-ori-b', name: 'Baños tribuna oriental baja', floor: 1, x: 88, y: 28, w: 5, h: 6, color: '#94A3B8' },
  { id: 'ec-bath-occ-b', name: 'Baños tribuna occidental baja', floor: 1, x: 7, y: 28, w: 5, h: 6, color: '#94A3B8' },
  { id: 'ec-bath-norte', name: 'Baños tribuna norte', floor: 1, x: 70, y: 6, w: 5, h: 4, color: '#94A3B8' },
  { id: 'ec-bath-sur', name: 'Baños tribuna sur', floor: 1, x: 70, y: 90, w: 5, h: 4, color: '#94A3B8' },
  { id: 'ec-bath-ori-a', name: 'Baños tribuna oriental alta', floor: 2, x: 88, y: 12, w: 5, h: 5, color: '#94A3B8' },
  { id: 'ec-bath-occ-a', name: 'Baños tribuna occidental alta', floor: 2, x: 7, y: 12, w: 5, h: 5, color: '#94A3B8' },
  { id: 'ec-press', name: 'Prensa / cabina', floor: 2, x: 44, y: 10, w: 12, h: 4, color: '#64748B' },
];

function buildCampinFigures(): SeatingFigure[] {
  const categories = CAMPIN_ZONES.map((zone) => buildCategoryFigure(zone, CAMPIN_LAYOUTS[zone.id]));
  return [...buildServiceElements(CAMPIN_SERVICE_ELEMENTS), ...categories];
}

/**
 * Estadio Nemesio Camacho El Campín — configuración operativa actual (~39.724).
 * Proyecto de reconstrucción APP apunta a ~45.000-50.000 (2029).
 */
export const ESTADIO_EL_CAMPIN_TEMPLATE: SeatingMapTemplate = {
  id: 'estadio-el-campin-bogota',
  name: 'Estadio El Campín',
  description:
    'Estadio Nemesio Camacho El Campín: 4 tribunas (Oriental, Occidental, Norte, Sur) en 2 alturas. Aforo operativo ~39.724.',
  venueName: 'Estadio Nemesio Camacho El Campín',
  city: 'Bogotá, Colombia',
  address: 'Av. NQS con Calle 63, Bogotá',
  latitude: 4.6289,
  longitude: -74.0776,
  placeType: 'Estadio o coliseo',
  officialCapacity: 39724,
  maxCapacity: 50000,
  floors: [1, 2],
  levels: [
    { floor: 1, label: 'Tribunas bajas', description: 'Oriental baja, Occidental baja, Norte y Sur.' },
    { floor: 2, label: 'Tribunas altas', description: 'Segunda altura Oriental y Occidental.' },
  ],
  zones: CAMPIN_ZONES,
  sectionsIncluded: CAMPIN_ZONES.map((z) => `${z.name} — ${z.seats.toLocaleString('es-CO')} sillas`),
  sectionsNotIncluded: [
    'Palcos y zonas de hospitalidad corporativa (modelar como categoría adicional si el evento los habilita).',
    'Zona mixta y camerinos (acceso restringido).',
    'Proyección post-reconstrucción APP: Norte 11.708 · Sur 9.237 · Oriental 14.451 · Occidental 9.604 (~45.000-50.000 total).',
  ],
  sources: [
    'https://www.idrd.gov.co/',
    'https://www.noticiasrcn.com/deportes/el-campin-contara-con-45-mil-asientos-y-sera-de-los-mas-modernos-del-continente-825713',
    'https://caracol.com.co/2024/10/30/entra-en-operacion-la-remodelacion-del-campin-idrd-ya-entrego-el-estadio-al-concesionario/',
  ],
  gates: CAMPIN_GATES,
  seatingMap: { figures: buildCampinFigures() },
};

const PLAZA_CLARO_GATES: EventGate[] = [
  { id: 'g-pc-norte', number: 1, name: 'Puerta Norte — Carrera 68' },
  { id: 'g-pc-sur', number: 2, name: 'Puerta Sur — Av. El Dorado' },
  { id: 'g-pc-vip', number: 3, name: 'Acceso VIP / Palco' },
  { id: 'g-pc-occ', number: 4, name: 'Puerta Occidental' },
];

const PLAZA_CLARO_ZONES: SeatingZoneSpec[] = [
  { id: 'pc-pista', name: 'Pista / Floor', floor: 1, sectors: 'Pista general de pie/sentado', seats: 3200, seatType: 'general', description: 'Zona más cercana al escenario en conciertos.' },
  { id: 'pc-trib-baja', name: 'Tribuna Baja', floor: 1, sectors: 'Anillos 101-118', seats: 4800, seatType: 'numbered', description: 'Primera gradería alrededor del escenario.' },
  { id: 'pc-trib-media', name: 'Tribuna Media', floor: 2, sectors: 'Anillos 201-218', seats: 4200, seatType: 'numbered', description: 'Segunda altura con vista panorámica.' },
  { id: 'pc-trib-alta', name: 'Tribuna Alta', floor: 3, sectors: 'Anillos 301-318', seats: 3800, seatType: 'numbered', description: 'Gradería superior del recinto.' },
  { id: 'pc-vip', name: 'Palcos VIP', floor: 2, sectors: 'Palcos y boxes', seats: 600, seatType: 'vip', description: 'Zona premium con servicio exclusivo.' },
  { id: 'pc-accesible', name: 'Zona accesible', floor: 1, sectors: 'PMR tribuna baja', seats: 120, seatType: 'accessible', description: 'Ubicación para movilidad reducida.' },
];

const PLAZA_CLARO_LAYOUTS: Record<string, ZoneLayout> = {
  'pc-pista': { shape: 'rectangle', x: 28, y: 38, w: 44, h: 28, color: '#7C3AED', gateId: 'g-pc-sur', price: 320000, rows: 20, seatsPerRow: 160 },
  'pc-trib-baja': { shape: 'horseshoe', x: 8, y: 52, w: 84, h: 38, color: '#2563EB', gateId: 'g-pc-norte', price: 180000, arcInner: 42, arcSpan: 200, rows: 24, seatsPerRow: 200 },
  'pc-trib-media': { shape: 'horseshoe', x: 6, y: 28, w: 88, h: 30, color: '#0EA5E9', gateId: 'g-pc-occ', price: 140000, arcInner: 38, arcSpan: 210, rows: 21, seatsPerRow: 200 },
  'pc-trib-alta': { shape: 'horseshoe', x: 4, y: 4, w: 92, h: 28, color: '#0284C7', gateId: 'g-pc-norte', price: 95000, arcInner: 34, arcSpan: 220, rows: 19, seatsPerRow: 200 },
  'pc-vip': { shape: 'rectangle', x: 2, y: 2, w: 18, h: 10, color: '#DB2777', gateId: 'g-pc-vip', price: 850000, rows: 4, seatsPerRow: 150 },
  'pc-accesible': { shape: 'rectangle', x: 42, y: 48, w: 16, h: 6, color: '#64748B', gateId: 'g-pc-sur', price: 160000, rows: 4, seatsPerRow: 30 },
};

const PLAZA_CLARO_SERVICE_ELEMENTS: ServiceElementSpec[] = [
  { id: 'pc-stage', name: 'Escenario / tarima', floor: 1, x: 32, y: 8, w: 36, h: 16, color: '#1F2937', shape: 'stadium', notes: 'Escenario central orientado al sur.' },
  { id: 'pc-door-n', name: 'Puerta principal Norte', floor: 1, x: 46, y: 90, w: 8, h: 4, color: '#334155' },
  { id: 'pc-door-s', name: 'Puerta principal Sur', floor: 1, x: 46, y: 2, w: 8, h: 4, color: '#334155' },
  { id: 'pc-bath-f1-a', name: 'Baños tribuna baja occidente', floor: 1, x: 10, y: 60, w: 6, h: 5, color: '#94A3B8' },
  { id: 'pc-bath-f1-b', name: 'Baños tribuna baja oriente', floor: 1, x: 84, y: 60, w: 6, h: 5, color: '#94A3B8' },
  { id: 'pc-bath-f2', name: 'Baños tribuna media', floor: 2, x: 48, y: 34, w: 8, h: 4, color: '#94A3B8' },
  { id: 'pc-bath-f3', name: 'Baños tribuna alta', floor: 3, x: 48, y: 10, w: 8, h: 4, color: '#94A3B8' },
  { id: 'pc-fnb', name: 'Zona F&B / concourse', floor: 1, x: 44, y: 94, w: 12, h: 4, color: '#6B7280' },
];

function buildPlazaClaroFigures(): SeatingFigure[] {
  const categories = PLAZA_CLARO_ZONES.map((zone) => buildCategoryFigure(zone, PLAZA_CLARO_LAYOUTS[zone.id]));
  return [...buildServiceElements(PLAZA_CLARO_SERVICE_ELEMENTS), ...categories];
}

/** Plaza Claro Bogotá — recinto indoor multipropósito (~12.720 butacas en conciertos). */
export const PLAZA_CLARO_BOGOTA_TEMPLATE: SeatingMapTemplate = {
  id: 'plaza-claro-bogota',
  name: 'Plaza Claro Bogotá',
  description:
    'Plaza Claro Bogotá: escenario central, pista, tribunas en 3 niveles y palcos VIP. Aforo típico en conciertos ~12.700.',
  venueName: 'Plaza Claro Bogotá',
  city: 'Bogotá, Colombia',
  address: 'Av. El Dorado # 68C-61, Bogotá',
  latitude: 4.6312,
  longitude: -74.0945,
  placeType: 'Estadio o coliseo',
  officialCapacity: 12720,
  maxCapacity: 14000,
  floors: [1, 2, 3],
  levels: [
    { floor: 1, label: 'Nivel 1 — Pista y tribuna baja', description: 'Pista y anillos inferiores 101-118.' },
    { floor: 2, label: 'Nivel 2 — Tribuna media y VIP', description: 'Anillos 201-218 y palcos.' },
    { floor: 3, label: 'Nivel 3 — Tribuna alta', description: 'Anillos superiores 301-318.' },
  ],
  zones: PLAZA_CLARO_ZONES,
  sectionsIncluded: PLAZA_CLARO_ZONES.map((z) => `${z.name} (${z.sectors})`),
  sectionsNotIncluded: [
    'Backstage, camerinos y zonas técnicas.',
    'Configuraciones con pista 100% de pie (aforo superior al modelo sentado).',
  ],
  sources: [
    'https://plazaclaro.com/',
    'https://bogota.gov.co/',
  ],
  gates: PLAZA_CLARO_GATES,
  seatingMap: { figures: buildPlazaClaroFigures() },
};

export const SEATING_MAP_TEMPLATES: SeatingMapTemplate[] = [
  MOVISTAR_ARENA_BOGOTA_TEMPLATE,
  PLAZA_CLARO_BOGOTA_TEMPLATE,
  ESTADIO_EL_CAMPIN_TEMPLATE,
];

export function getSeatingTemplate(id: string): SeatingMapTemplate | undefined {
  return SEATING_MAP_TEMPLATES.find((t) => t.id === id);
}

export function estimateTemplateCapacity(tpl: SeatingMapTemplate): number {
  const fromFigures = tpl.seatingMap.figures
    .filter((f) => f.role === 'category')
    .reduce((sum, f) => sum + (f.seats ?? (f.rows || 0) * (f.seatsPerRow || 0)), 0);
  return tpl.officialCapacity || fromFigures;
}

export function formatTemplateCapacityLabel(tpl: SeatingMapTemplate): string {
  const seated = estimateTemplateCapacity(tpl);
  if (tpl.maxCapacity && tpl.maxCapacity > seated) {
    return `${seated.toLocaleString('es-CO')} sentados (hasta ${tpl.maxCapacity.toLocaleString('es-CO')} en config. especial)`;
  }
  return `${seated.toLocaleString('es-CO')} asientos`;
}

/** Aplica una plantilla al paso de ubicación del evento (modo Mis Lugares → Plantillas). */
export function applySeatingTemplateToLocation(tpl: SeatingMapTemplate): Partial<EventLocation> {
  return {
    mode: 'mine',
    selectedVenueId: undefined,
    selectedTemplateId: tpl.id,
    venueOwnership: undefined,
    customName: tpl.venueName,
    detectedCity: tpl.city,
    customAddress: tpl.address,
    customType: tpl.placeType || 'Estadio o coliseo',
    customLat: tpl.latitude,
    customLng: tpl.longitude,
    showMap: tpl.latitude != null && tpl.longitude != null,
    ticketingType: 'with-seating',
    seatingLayout: 'numbered',
    gates: tpl.gates,
    seatingMap: tpl.seatingMap,
  };
}
