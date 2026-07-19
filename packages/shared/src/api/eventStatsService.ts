import { getAuthToken, manageEventsNestedApiUrl } from './client';

import {

  buildEventStatsCacheKey,

  cacheEventStats,

  getCachedEventStats,

  getCachedEventStatsEntry,

  isEventStatsCacheFresh,

  type EventStatsCacheKind,

} from '../lib/eventStatsCache';

import { revalidateOnce } from '../lib/wallCacheRevalidate';



function authHeaders(): Record<string, string> {

  const token = getAuthToken();

  return {

    'Content-Type': 'application/json',

    Accept: 'application/json',

    ...(token ? { Authorization: token } : {}),

  };

}



export interface EventSalesStatistics {

  eventId: string;

  eventName?: string | null;

  venueName?: string | null;

  totalVentas: number;

  boletosVendidos: number;

  boletosDisponibles: number | null;

  ocupacion: string | null;

  preEventoPagado: number;

  preEventoPendiente: number;

  postEventoPagado: number;

  postEventoPendiente: number;

  resumenEstados?: Record<string, number>;

  categorias?: Array<{

    nombre: string;

    vendidos: number;

    netoVendido: number;

    disponibles?: number | null;

    ocupacion?: number | null;

    precioUnitario?: number;

  }>;

}



export interface EventInvitationStatistics {

  eventId: string;

  totalEnviados: number;

  invitadosUnicos: number;

  totalConfirmados: number;

  compradoresTotales: number;

  totalDelivered: number;

  totalOpened: number;

  totalClicked: number;

  deliveryRateAvg?: string | number;

  openRateAvg?: string | number;

  conversionRateAvg?: string | number;

  canales?: Array<{

    nombre?: string;

    canal?: string;

    enviados: number;

    entregados?: number;

    delivered?: number;

    abiertos?: number;

    opened?: number;

    clics?: number;

    clicked?: number;

    confirmados: number;

    compradores?: number;

    deliveryRate?: string;

    openRate?: string;

    clickRate?: string;

    conversionRate?: string;

  }>;

  invitadosDetalle?: Array<{

    userId?: string;

    nombre?: string;

    nombreCompleto?: string;

    email?: string;

    phone?: string;

    avatar?: string;

    canales?: string[];

    comproBoleta?: boolean;

  }>;

}



export interface EventAccessStatistics {

  eventId: string;

  totalBoletos: number;

  accesosConcedidos: number;

  ingresosUnicos: number;

  porcentajeAsistencia: string;

  denegaciones: number;

  dentroActual: number;

  boletosEscaneadosUnicos: number;

  boletosNoEscaneados: number;

  asistentesAlEvento?: Array<{

    categoria: string;

    total: number;

    asistidos: number;

    porcentaje: number;

    asistentes?: Array<{ nombre: string; avatar?: string; estado: string }>;

  }>;

  traficoTipoBleta?: Array<{

    categoria: string;

    total: number;

    escaneados: number;

    porcentaje: number;

  }>;

  boletasDetalle?: Array<Record<string, unknown>>;

  estadosAcceso?: { VALID?: number; INVALID?: number; DUPLICATE?: number };

  estadoAccesoPorPuerta?: Array<{

    puerta?: string;

    totalIntentos?: number;

    concedidos?: number;

    denegados?: number;

    porcentaje?: string;

  }>;

}



export interface EventRefundsStatisticsResponse {

  summary?: {

    totalEventsAffected: number;

    totalReservationsAffected?: number;

    totalRecords: number;

    totalPendingRefunds: number;

    totalCompletedRefunds: number;

    totalRejectedRefunds: number;

    totalPendingAmount: number;

    totalCompletedAmount: number;

    currency: string;

    byType?: {

      event: number;

      venue: number;

      service: number;

    };

  };

  events?: Array<{

    reservationType?: 'event' | 'venue' | 'service';

    reservationId?: string;

    eventId: string;

    eventName?: string;

    eventStatus?: string;

    eventStartDate?: string;

    eventEndDate?: string;

    eventExists?: boolean;

    pendingCount: number;

    completedCount: number;

    rejectedCount: number;

    pendingAmount: number;

    completedAmount: number;

    categoriaReembolso?: string | null;

    policyType?: string | null;

    policyLabel?: string | null;

    policyLimitDays?: number | null;

    refunds?: Array<Record<string, unknown>>;

  }>;

}



export interface EventBuyerTicketEntry {

  ticketId?: string | null;

  categoria?: string;

  precio?: number;

  fecha_compra?: string;

  status?: string;

  row?: string;

  seat?: string | number;

  seatLabel?: string;

}



export interface EventBuyerRecord {

  buyerId?: string;

  orderId?: string;

  userId?: string;

  nombre?: string;

  buyerName?: string;

  email?: string;

  buyerEmail?: string;

  phone?: string;

  buyerPhone?: string;

  category?: string;

  seat?: string;

  amount?: number;

  totalComprado?: number;

  paymentStatus?: string;

  statusPago?: string;

  purchaseDate?: string;

  fecha_compra?: string;

  paymentTimingBucket?: string;

  isApproved?: boolean;

  rawStatus?: string;

  entradas?: EventBuyerTicketEntry[];

}



const inflight = new Map<string, Promise<unknown>>();



async function requestJson<T>(url: string): Promise<T | null> {

  const response = await fetch(url, { headers: authHeaders() });

  if (!response.ok) {

    const body = await response.text().catch(() => '');

    console.warn(`[eventStats] ${response.status} ${url}`, body.slice(0, 200));

    return null;

  }

  return response.json() as Promise<T>;

}



async function fetchJsonCached<T>(

  url: string,

  cacheKey: string,

  options?: { forceNetwork?: boolean },

): Promise<T | null> {

  if (!options?.forceNetwork) {

    const cached = getCachedEventStats<T>(cacheKey, true);

    if (cached != null) {

      if (!isEventStatsCacheFresh(cacheKey)) {

        void revalidateOnce(cacheKey, async () => {

          const fresh = await requestJson<T>(url);

          if (fresh != null) cacheEventStats(cacheKey, fresh);

        });

      }

      return cached;

    }

  }



  const existing = inflight.get(cacheKey) as Promise<T | null> | undefined;

  if (existing) return existing;



  const promise = (async () => {

    try {

      const data = await requestJson<T>(url);

      if (data != null) cacheEventStats(cacheKey, data);

      return data;

    } finally {

      inflight.delete(cacheKey);

    }

  })();



  inflight.set(cacheKey, promise);

  return promise;

}



function statsUrl(eventId: string, kind: EventStatsCacheKind, path: string): [string, string] {

  const cacheKey = buildEventStatsCacheKey(eventId, kind);

  const url = manageEventsNestedApiUrl(`/${encodeURIComponent(eventId)}/${path}`);

  return [url, cacheKey];

}



export async function fetchEventSalesStatistics(

  eventId: string,

  options?: { forceNetwork?: boolean },

): Promise<EventSalesStatistics | null> {

  const [url, cacheKey] = statsUrl(eventId, 'sales', 'statistics');

  return fetchJsonCached<EventSalesStatistics>(url, cacheKey, options);

}



export async function fetchEventInvitationStatistics(

  eventId: string,

  options?: { forceNetwork?: boolean },

): Promise<EventInvitationStatistics | null> {

  const [url, cacheKey] = statsUrl(eventId, 'invitations', 'invitations/statistics');

  return fetchJsonCached<EventInvitationStatistics>(url, cacheKey, options);

}



export async function fetchEventAccessStatistics(

  eventId: string,

  options?: { forceNetwork?: boolean },

): Promise<EventAccessStatistics | null> {

  const [url, cacheKey] = statsUrl(eventId, 'access', 'access-stats');

  return fetchJsonCached<EventAccessStatistics>(url, cacheKey, options);

}



export async function fetchEventRefundsStatistics(

  options?: { limit?: number; eventId?: string; forceNetwork?: boolean },

): Promise<EventRefundsStatisticsResponse | null> {

  const params = new URLSearchParams({ limit: String(options?.limit ?? 200) });

  if (options?.eventId) params.set('eventId', options.eventId);

  const cacheKey = options?.eventId

    ? buildEventStatsCacheKey(options.eventId, 'refunds', String(options.limit ?? 200))

    : `refunds:global:${params}`;

  const url = manageEventsNestedApiUrl(`/refunds/statistics?${params}`);

  return fetchJsonCached<EventRefundsStatisticsResponse>(url, cacheKey, options);

}



export async function fetchEventRefundsForEvent(eventId: string): Promise<EventRefundsStatisticsResponse['events']> {

  const data = await fetchEventRefundsStatistics({ eventId, limit: 500 });

  if (!data?.events) return [];

  return data.events.filter((e) => e.eventId === eventId);

}



export async function fetchEventBuyers(

  eventId: string,

  options?: { limit?: number; scope?: string; forceNetwork?: boolean },

): Promise<EventBuyerRecord[]> {

  const params = new URLSearchParams({

    limit: String(options?.limit ?? 500),

    scope: options?.scope ?? 'executed',

  });

  const cacheKey = buildEventStatsCacheKey(

    eventId,

    'buyers',

    `${options?.scope ?? 'executed'}:${options?.limit ?? 500}`,

  );

  const url = manageEventsNestedApiUrl(`/${encodeURIComponent(eventId)}/buyers?${params}`);

  const data = await fetchJsonCached<{ buyers?: EventBuyerRecord[]; items?: EventBuyerRecord[] }>(

    url,

    cacheKey,

    options,

  );

  if (!data) {

    const stale = getCachedEventStatsEntry<{ buyers?: EventBuyerRecord[]; items?: EventBuyerRecord[] }>(cacheKey, true);

    const fallback = stale?.data;

    if (fallback) return fallback.buyers || fallback.items || [];

    return [];

  }

  return data.buyers || data.items || [];

}

