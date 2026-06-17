import type { VenueData } from '@lovable/types/venue';
import type { PublishedVenueDraft } from '@lovable/components/venues/VenueCreator';

const LOREM =
  'Lugar amplio y versátil con ambientes pensados para reuniones sociales, ceremonias y eventos corporativos. Combina zonas interiores y exteriores con buena iluminación natural, vista despejada y atención personalizada del host durante todo el evento.';

/**
 * Build a complete VenueData mock from a PublishedVenueDraft so the venue
 * detail view can render the "Información adicional del lugar" section for
 * every venue created in the app (mock or user-published).
 */
export const buildVenueMock = (v: PublishedVenueDraft): VenueData => {
  const lowerType = (v.type || '').toLowerCase();
  const isCampestre = /finca|hacienda|hotel|campestre|eco/.test(lowerType);
  const isRooftop = /rooftop|terraza|skyline/.test(lowerType);

  return {
    id: v.id,
    name: v.name,
    venueName: v.name,
    address: v.address,
    city: v.sector || 'Rionegro',
    department: 'Antioquia',
    description: v.description || LOREM,
    coverImage: v.image,
    images: [v.image],
    venueTypes: [v.type],
    eventTypes: [
      'Fiesta, reunión social o encuentro',
      'Ceremonia / boda',
      'Evento corporativo',
      'Cumpleaños y aniversarios',
      isCampestre ? 'Campamento, viaje o retiro' : 'Lanzamiento de producto',
    ],
    facilities: [
      'Parqueadero amplio',
      'Zona de fumadores',
      'Baños independientes hombres y mujeres',
      isCampestre ? 'Piscina y jardines' : 'Aire acondicionado',
      isRooftop ? 'Vista panorámica 360°' : 'Cocina equipada',
    ],
    services: [
      'Wifi de alta velocidad',
      'Mesas y sillas incluidas',
      'Sonido ambiente',
      'Servicio de venta de bebidas',
      'Apoyo del host durante el evento',
    ],
    accessibility: [
      'Acceso al lugar en vehículo particular',
      'Rampas y baño para personas con movilidad reducida',
      'Cercanía a transporte público',
    ],
    security: [
      'Seguridad privada 24/7',
      'Cámaras de vigilancia (CCTV)',
      'Parqueadero con vigilancia',
      'Iluminación perimetral',
    ],
    basePrice: 1_250_000,
    startTime: '12:00',
    endTime: '03:00',
    capacity: v.capacity,
    rating: 4.8,
    eventsCompleted: 24,
    hostName: 'Juan Betancur',
    hostPhone: '310 845 1535',
    hostEmail: 'jbetancur@gmail.com',
    averageTemperature: isCampestre ? '19 grados' : '22 grados',
    dayConfigs: [],
    hasLodging: isCampestre,
    lodgingDetails: isCampestre
      ? {
          rooms: 5,
          maxPerRoom: 4,
          totalGuests: 20,
          acceptsChildren: true,
          acceptsPets: true,
        }
      : undefined,
    cancellationPolicy:
      'Reembolso completo si cancelas hasta 7 días antes del inicio de la reserva. Cancelaciones entre 7 y 3 días: reembolso del 50%. Menos de 3 días o no presentarse: no aplica reembolso.',
    faqs: [
      {
        question: '¿Se permite música en vivo?',
        answer: 'Sí, se permite música en vivo hasta las 11:00 P.M. cumpliendo normativa local de ruido.',
      },
      {
        question: '¿Cuántos vehículos caben en el parqueadero?',
        answer: 'Contamos con capacidad para hasta 30 vehículos sin costo adicional.',
      },
      {
        question: '¿Puedo llevar mi propio catering o decorador?',
        answer: 'Sí, puedes traer proveedores externos. Te pediremos sus datos un día antes del evento.',
      },
      {
        question: '¿Qué pasa si llueve el día del evento?',
        answer: 'El lugar cuenta con plan B techado para cubrir a todos los invitados sin costo extra.',
      },
      {
        question: '¿Se permiten mascotas?',
        answer: isCampestre
          ? 'Sí, las mascotas son bienvenidas en zonas exteriores con correa.'
          : 'Solo se permiten animales de asistencia debidamente identificados.',
      },
    ],
    coordinates: { lat: 6.1543, lng: -75.4267 },
    directions:
      'Tomar la salida principal hacia ' +
      (v.sector || 'Rionegro') +
      '. Después del segundo semáforo girar a la derecha; el lugar se ubica a 300 metros sobre la vía, fachada blanca con letrero iluminado.',
    seatingMap: {
      imageUrl:
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60',
      description:
        'Distribución sugerida: zona VIP frente al escenario, mesas generales en el centro y barra/área de bar al fondo. La distribución puede personalizarse según el tipo de evento.',
      zones: [
        { name: 'Zona VIP', capacity: Math.round(v.capacity * 0.25), color: '#8B5CF6' },
        { name: 'Zona General', capacity: Math.round(v.capacity * 0.5), color: '#3B82F6' },
        { name: 'Zona Bar', capacity: Math.round(v.capacity * 0.25), color: '#10B981' },
      ],
    },
    paidServices: [
      { name: 'Servicio de DJ profesional', price: 350_000 },
      { name: 'Decoración temática completa', price: 500_000 },
      { name: 'Servicio de fotografía y video', price: 800_000 },
      { name: 'Catering premium (por persona)', price: 85_000 },
      { name: 'Coordinador de evento', price: 450_000 },
    ],
    refundPolicy: {
      type: '7-dias',
      description:
        'Reembolso completo hasta 7 días antes del inicio de la reserva. Después de esta fecha el reembolso se evaluará caso a caso.',
    },
    nearbyReferences: [
      { name: 'Centro Comercial San Nicolás', type: 'Centro comercial', distance: '1.2 km' },
      { name: 'Estación de Policía ' + (v.sector || 'Rionegro'), type: 'Seguridad', distance: '2.0 km' },
      { name: 'Hospital San Juan de Dios', type: 'Salud', distance: '3.5 km' },
      { name: 'Aeropuerto José María Córdova', type: 'Transporte', distance: '8.0 km' },
      { name: 'Parque Principal', type: 'Punto de referencia', distance: '1.8 km' },
    ],
  };
};
