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
