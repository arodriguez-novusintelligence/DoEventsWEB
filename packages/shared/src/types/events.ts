export interface EventLocation {
  latitude: number;
  longitude: number;
}

export interface FeedEventItem {
  id: string;
  nombre: string;
  fechaIni?: string;
  horaIni?: string;
  horaFin?: string;
  ciudad?: string;
  departamento?: string;
  direccion?: string;
  pais?: string;
  descripcion?: string;
  imagen?: string;
  liked?: boolean;
  distancia?: number;
  userId?: string;
  estatus?: string;
  Categoria?: string;
  tipoEvento?: string;
  ubicacion?: EventLocation;
  latitude?: number;
  longitude?: number;
  organizerName?: string;
  organizerAvatar?: string;
  aforo?: string;
}

export interface EventsFeedResponse {
  items: FeedEventItem[];
  nextOffset: number | null;
  total: number;
}

export interface UserEventItem {
  id: string;
  nombre: string;
  fechaIni?: string;
  fechaFin?: string;
  horaIni?: string;
  horaFin?: string;
  ciudad?: string;
  departamento?: string;
  direccion?: string;
  descripcion?: string;
  imagen?: string;
  liked?: boolean;
  estatus?: string;
}

export interface UserEventsResponse {
  data?: {
    datosEvento?: UserEventItem[];
  };
}
