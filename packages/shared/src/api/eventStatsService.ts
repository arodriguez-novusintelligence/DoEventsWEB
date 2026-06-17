import { getAuthToken, getCurrentEnv } from './client';

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

function apiBase(): string {
  return getCurrentEnv().apiBaseUrl;
}

export interface EventSalesStatistics {
  eventId: string;
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
    totalRecords: number;
    totalPendingRefunds: number;
    totalCompletedRefunds: number;
    totalRejectedRefunds: number;
    totalPendingAmount: number;
    totalCompletedAmount: number;
    currency: string;
  };
  events?: Array<{
    eventId: string;
    eventName?: string;
    eventStatus?: string;
    pendingCount: number;
    completedCount: number;
    rejectedCount: number;
    pendingAmount: number;
    completedAmount: number;
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

async function fetchJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url, { headers: authHeaders() });
  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

export async function fetchEventSalesStatistics(eventId: string): Promise<EventSalesStatistics | null> {
  return fetchJson<EventSalesStatistics>(`${apiBase()}/events/${encodeURIComponent(eventId)}/statistics`);
}

export async function fetchEventInvitationStatistics(eventId: string): Promise<EventInvitationStatistics | null> {
  return fetchJson<EventInvitationStatistics>(
    `${apiBase()}/events/${encodeURIComponent(eventId)}/invitations/statistics`,
  );
}

export async function fetchEventAccessStatistics(eventId: string): Promise<EventAccessStatistics | null> {
  return fetchJson<EventAccessStatistics>(
    `${apiBase()}/events/${encodeURIComponent(eventId)}/access-stats`,
  );
}

export async function fetchEventRefundsStatistics(
  options?: { limit?: number; eventId?: string },
): Promise<EventRefundsStatisticsResponse | null> {
  const params = new URLSearchParams({ limit: String(options?.limit ?? 200) });
  if (options?.eventId) params.set('eventId', options.eventId);
  return fetchJson<EventRefundsStatisticsResponse>(
    `${apiBase()}/events/refunds/statistics?${params}`,
  );
}

export async function fetchEventRefundsForEvent(eventId: string): Promise<EventRefundsStatisticsResponse['events']> {
  const data = await fetchEventRefundsStatistics({ eventId, limit: 500 });
  if (!data?.events) return [];
  return data.events.filter((e) => e.eventId === eventId);
}

export async function fetchEventBuyers(
  eventId: string,
  options?: { limit?: number; scope?: string },
): Promise<EventBuyerRecord[]> {
  const params = new URLSearchParams({
    limit: String(options?.limit ?? 500),
    scope: options?.scope ?? 'executed',
  });
  const data = await fetchJson<{ buyers?: EventBuyerRecord[]; items?: EventBuyerRecord[] }>(
    `${apiBase()}/events/${encodeURIComponent(eventId)}/buyers?${params}`,
  );
  if (!data) return [];
  return data.buyers || data.items || [];
}
