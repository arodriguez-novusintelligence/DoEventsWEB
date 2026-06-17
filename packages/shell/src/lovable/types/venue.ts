export interface VenueData {
  id: string;
  name: string;
  venueName: string;
  address: string;
  city: string;
  department: string;
  description: string;
  coverImage?: string;
  images: string[];
  venueTypes: string[];
  eventTypes: string[];
  facilities: string[];
  services: string[];
  accessibility: string[];
  security: string[];
  basePrice: number;
  startTime: string;
  endTime: string;
  capacity: number;
  rating: number;
  eventsCompleted: number;
  hostName: string;
  hostPhone: string;
  hostEmail: string;
  averageTemperature?: string;
  dayConfigs: DayConfig[];
  hasLodging: boolean;
  lodgingDetails?: LodgingDetails;
  cancellationPolicy: string;
  faqs: FAQ[];
  // New fields
  coordinates?: { lat: number; lng: number };
  directions?: string;
  seatingMap?: SeatingMapData;
  paidServices?: PaidService[];
  refundPolicy?: RefundPolicy;
  nearbyReferences?: NearbyReference[];
}

export interface NearbyReference {
  name: string;
  type: string;
  distance: string;
}

export interface DayConfig {
  date: string;
  price?: number;
  blocked: boolean;
}

export interface LodgingDetails {
  rooms: number;
  maxPerRoom: number;
  totalGuests: number;
  acceptsChildren: boolean;
  acceptsPets: boolean;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface SeatingMapData {
  imageUrl: string;
  description: string;
  zones: { name: string; capacity: number; color: string }[];
}

export interface PaidService {
  name: string;
  price: number;
}

export interface RefundPolicy {
  type: "mismo-dia" | "1-dia" | "7-dias" | "30-dias" | "caso-a-caso";
  description: string;
}

// Mock data for demo
export const mockVenue: VenueData = {
  id: "1",
  name: "Finca Corralejas",
  venueName: "Corralejas",
  address: "Calle 48c # 99-75",
  city: "Rionegro",
  department: "Antioquia",
  description: "Lorem ipsum dolor sit amet consectetur. Nibh et ultricies amet oculus a semper placerat. Vitae fringilla massa imperdict elementum in dignissim fringilla amet lectus.",
  coverImage: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60",
  images: [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=60",
  ],
  venueTypes: ["Finca recreacional"],
  eventTypes: ["Fiesta, reunión social o encuentro", "Ceremonia", "Campamento, viaje o retiro"],
  facilities: ["Piscina", "Jardines", "Zona de fumadores", "Juegos infantiles"],
  services: ["Wifi", "Mesas y sillas", "Servicio de venta de bebidas"],
  accessibility: ["Acceso al lugar en vehículo", "Acceso para discapacitados"],
  security: ["Cuenta con seguridad privada", "Parqueadero con seguridad privada"],
  basePrice: 185937,
  startTime: "14:00",
  endTime: "12:00",
  capacity: 80,
  rating: 3,
  eventsCompleted: 12,
  hostName: "Juan Betancur",
  hostPhone: "3108451535",
  hostEmail: "j.betancur@gmail.com",
  averageTemperature: "19 grados",
  dayConfigs: [],
  hasLodging: true,
  lodgingDetails: {
    rooms: 5,
    maxPerRoom: 4,
    totalGuests: 20,
    acceptsChildren: true,
    acceptsPets: true,
  },
  cancellationPolicy: "Reembolso completo hasta 7 días antes del evento. 50% hasta 3 días antes.",
  faqs: [
    { question: "¿Se permite música en vivo?", answer: "Sí, se permite hasta las 11pm" },
    { question: "¿Hay estacionamiento?", answer: "Sí, capacidad para 30 vehículos" },
  ],
  coordinates: { lat: 6.1543, lng: -75.4267 },
  directions: "Tomar la salida norte de Rionegro, después del puente girar a la derecha. La finca está a 500 metros sobre la vía principal.",
  seatingMap: {
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60",
    description: "El lugar cuenta con zona VIP al frente del escenario, mesas generales en el centro y área de bar al fondo.",
    zones: [
      { name: "Zona VIP", capacity: 20, color: "#8B5CF6" },
      { name: "Zona General", capacity: 40, color: "#3B82F6" },
      { name: "Zona Bar", capacity: 20, color: "#10B981" },
    ],
  },
  paidServices: [
    { name: "Servicio de DJ", price: 350000 },
    { name: "Decoración temática", price: 500000 },
    { name: "Servicio de fotografía", price: 800000 },
    { name: "Catering premium", price: 1200000 },
  ],
  refundPolicy: {
    type: "7-dias",
    description: "Reembolso completo hasta 7 días antes del inicio de la reserva. Después de esta fecha no se realizan devoluciones.",
  },
  nearbyReferences: [
    { name: "Centro Comercial San Nicolás", type: "Centro comercial", distance: "1.2 km" },
    { name: "Estación de Policía Rionegro", type: "Seguridad", distance: "2.0 km" },
    { name: "Hospital San Juan de Dios", type: "Salud", distance: "3.5 km" },
    { name: "Aeropuerto José María Córdova", type: "Transporte", distance: "8.0 km" },
    { name: "Parque Principal de Rionegro", type: "Punto de referencia", distance: "1.8 km" },
  ],
};
