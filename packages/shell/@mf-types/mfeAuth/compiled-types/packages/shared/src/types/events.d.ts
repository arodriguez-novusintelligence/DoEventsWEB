export interface FeedEventItem {
    id: string;
    nombre: string;
    fechaIni?: string;
    horaIni?: string;
    ciudad?: string;
    departamento?: string;
    descripcion?: string;
    imagen?: string;
    liked?: boolean;
    distancia?: number;
    userId?: string;
    estatus?: string;
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
    horaIni?: string;
    ciudad?: string;
    departamento?: string;
    descripcion?: string;
    imagen?: string;
    liked?: boolean;
}
export interface UserEventsResponse {
    data?: {
        datosEvento?: UserEventItem[];
    };
}
