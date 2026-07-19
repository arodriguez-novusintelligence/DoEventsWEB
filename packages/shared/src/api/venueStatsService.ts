import { getAuthToken, getCurrentEnv } from './client';

export interface RentalStatsSummary {
  nights: number;
  avgStay: number;
  occupancyPercent: number;
  reservationsCount: number;
  receivedRevenue: number;
  pendingRevenue: number;
}

export interface RentalMonthlyPoint {
  month: number;
  label: string;
  received: number;
  pending: number;
}

export interface RentalComparisonPoint {
  month: number;
  label: string;
  current: number;
  previous: number;
}

export interface RentalReservationRow {
  bookingId: string;
  guestName: string;
  guestUserId?: string | null;
  startDate: string;
  endDate: string;
  nights: number;
  amount: number;
  status: string;
  statusLabel: string;
}

export interface VenueStatsListItem {
  venueId: string;
  name: string;
  imageUrl?: string | null;
  city?: string;
  address?: string;
  status?: string;
  nights: number;
  avgStay: number;
  occupancyPercent: number;
  reservationsCount: number;
  receivedRevenue: number;
  pendingRevenue: number;
}

export interface RentalStatisticsPayload {
  venueId?: string;
  serviceId?: string;
  venueName?: string;
  serviceName?: string;
  currency: string;
  summary: RentalStatsSummary;
  year: number;
  month: number;
  monthly: RentalMonthlyPoint[];
  comparison: {
    currentYear: number;
    previousYear: number;
    series: RentalComparisonPoint[];
  };
  selectedMonth: {
    received: number;
    pending: number;
    total: number;
    previousYearTotal: number;
  };
  calendar: {
    year: number;
    month: number;
    nights: number;
    reservedDates: string[];
  };
  reservations: RentalReservationRow[];
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

function venuesApiBase(): string {
  return `${getCurrentEnv().apiBaseUrl}/venues`;
}

export async function fetchUserVenuesStatistics(userId: string): Promise<VenueStatsListItem[]> {
  const response = await fetch(
    `${venuesApiBase()}/users/${encodeURIComponent(userId)}/statistics`,
    { headers: authHeaders() },
  );
  const body = await response.json().catch(() => ({})) as {
    venues?: VenueStatsListItem[];
    error?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(body.error || body.message || 'No se pudieron cargar las estadísticas de lugares');
  }
  return body.venues || [];
}

export async function fetchVenueStatistics(
  venueId: string,
  params?: { year?: number; month?: number },
): Promise<RentalStatisticsPayload> {
  const query = new URLSearchParams();
  if (params?.year) query.set('year', String(params.year));
  if (params?.month) query.set('month', String(params.month));
  const suffix = query.toString() ? `?${query}` : '';
  const response = await fetch(
    `${venuesApiBase()}/venues/${encodeURIComponent(venueId)}/statistics${suffix}`,
    { headers: authHeaders() },
  );
  const body = await response.json().catch(() => ({})) as RentalStatisticsPayload & {
    error?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(body.error || body.message || 'No se pudieron cargar las estadísticas del lugar');
  }
  return body;
}

export async function exportVenueStatisticsExcel(venueId: string, venueName: string): Promise<void> {
  const response = await fetch(
    `${venuesApiBase()}/venues/${encodeURIComponent(venueId)}/statistics/export`,
    { headers: authHeaders() },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error || 'No se pudo exportar el Excel de ingresos');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `ingresos_${venueName.replace(/\s+/g, '_')}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function formatRentalMoney(amount: number): string {
  const value = Number(amount) || 0;
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1)} mill $`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)} mil $`;
  }
  return `${value.toLocaleString('es-CO')} $`;
}

export const MONTH_LABELS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const MONTH_NAMES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
