import type { EventLocation } from './events';

export interface EventPolicy {
  title?: string;
  description?: string;
}

export interface EventDetailData {
  id: string;
  nombre: string;
  descripcion?: string;
  fechaIni?: string;
  fechaFin?: string;
  horaIni?: string;
  horaFin?: string;
  estatus?: string;
  clase?: string;
  aforo?: string;
  avaliableCapacity?: string;
  ciudad?: string;
  departamento?: string;
  direccion?: string;
  pais?: string;
  userId?: string;
  coAdminIds?: string[];
  organizerName?: string;
  anfitrioName?: string;
  emailAnf?: string;
  categoriaReembolso?: string;
  policies?: EventPolicy[];
  faq?: Array<{ question?: string; answer?: string }>;
  tipoLugar?: string;
  venueId?: string;
  hasSeating?: boolean;
  video?: string;
  Hashtags?: string | string[];
  itinerary?: Array<{ time?: string; title?: string; description?: string }>;
  eventDays?: Array<{
    id?: string;
    dayName?: string;
    date?: string;
    activities?: Array<{
      id?: string;
      startTime?: string;
      endTime?: string;
      startTimeDisplay?: string;
      endTimeDisplay?: string;
      description?: string;
      responsible?: { displayName?: string; nombre?: string; name?: string };
    }>;
  }>;
  ubicacion?: EventLocation;
  latitude?: number;
  longitude?: number;
  Categoria?: string;
}

export interface EventCategoryInfo {
  preference_id?: number | string;
  preference_name_es?: string;
  preference_name_en?: string;
  Category_ES?: string;
}

export interface EventTypeInfo {
  EventType_ES?: string;
  EventType_EN?: string;
}

export interface EventPlaceTypeInfo {
  PlaceType_ES?: string;
  PlaceType_EN?: string;
}

export interface EventPersonInfo {
  id?: string;
  name?: string;
  lastName?: string;
  user?: string;
  email?: string;
  fotoPerfilUrl?: string;
  calificacionPromedio?: number;
  calificacion?: number;
  experiencia?: number;
  totalEventos?: number;
  eventosRealizados?: number;
}

export interface EventDetailResponse {
  event: EventDetailData;
  images: string[];
  category?: EventCategoryInfo | null;
  eventType?: EventTypeInfo | null;
  placeType?: EventPlaceTypeInfo | null;
  organizer?: EventPersonInfo | null;
  host?: EventPersonInfo | null;
}

export interface RefundEligibility {
  canRequestRefund: boolean;
  reason?: string;
  eventName?: string;
  daysUntilEvent?: number;
  orderId?: string;
  refundDeadlineLabel?: string;
}
