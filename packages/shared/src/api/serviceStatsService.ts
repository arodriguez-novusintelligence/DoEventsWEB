import { getAuthToken, getCurrentEnv } from './client';
import type {
  RentalStatisticsPayload,
  RentalStatsSummary,
} from './venueStatsService';
import { formatRentalMoney, MONTH_LABELS_ES, MONTH_NAMES_ES } from './venueStatsService';

export interface ServiceStatsListItem {
  serviceId: string;
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

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

function servicesApiBase(): string {
  return `${getCurrentEnv().endpoints.servicesBase}`;
}

export async function fetchUserServicesStatistics(userId: string): Promise<ServiceStatsListItem[]> {
  const response = await fetch(
    `${servicesApiBase()}/users/${encodeURIComponent(userId)}/statistics`,
    { headers: authHeaders() },
  );
  const body = await response.json().catch(() => ({})) as {
    services?: ServiceStatsListItem[];
    error?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(body.error || body.message || 'No se pudieron cargar las estadísticas de servicios');
  }
  return body.services || [];
}

export async function fetchServiceStatistics(
  serviceId: string,
  params?: { year?: number; month?: number },
): Promise<RentalStatisticsPayload> {
  const query = new URLSearchParams();
  if (params?.year) query.set('year', String(params.year));
  if (params?.month) query.set('month', String(params.month));
  const suffix = query.toString() ? `?${query}` : '';
  const response = await fetch(
    `${servicesApiBase()}/${encodeURIComponent(serviceId)}/statistics${suffix}`,
    { headers: authHeaders() },
  );
  const body = await response.json().catch(() => ({})) as RentalStatisticsPayload & {
    error?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(body.error || body.message || 'No se pudieron cargar las estadísticas del servicio');
  }
  return body;
}

export async function exportServiceStatisticsExcel(serviceId: string, serviceName: string): Promise<void> {
  const response = await fetch(
    `${servicesApiBase()}/${encodeURIComponent(serviceId)}/statistics/export`,
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
  anchor.download = `ingresos_${serviceName.replace(/\s+/g, '_')}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export type { RentalStatisticsPayload, RentalStatsSummary };
export { formatRentalMoney, MONTH_LABELS_ES, MONTH_NAMES_ES };
