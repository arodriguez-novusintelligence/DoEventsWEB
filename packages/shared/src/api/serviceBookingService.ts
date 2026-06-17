import { getAuthToken, getCurrentEnv } from './client';
import { toUserFacingError } from '../lib/apiError';

export type ServiceDayStatus = 'available' | 'reserved' | 'unavailable';

export interface ServiceAvailabilityDay {
  status: ServiceDayStatus;
  pricePerDay: number;
}

export interface ServiceBookingAvailability {
  serviceId: string;
  year: number;
  month: number;
  pricePerDay: number;
  checkIn: string;
  checkOut: string;
  days: Record<string, ServiceAvailabilityDay>;
}

export interface ServiceAdditionalBookingItem {
  name: string;
  pricePerDay: number;
  quantity: number;
}

export interface CreateServiceBookingInput {
  serviceId: string;
  userId: string;
  startDate: string;
  endDate: string;
  additionalServices?: ServiceAdditionalBookingItem[];
  buyer: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateServiceBookingResponse {
  bookingId: string;
  orderId: string;
  order_id: string;
  expired_at_ts: number;
  total_amount: number;
  pricing: {
    reservationValue: number;
    servicesTotal: number;
    subtotalReserva: number;
    commission: number;
    commissionIva: number;
    total: number;
    numDays: number;
  };
  booking: {
    bookingId: string;
    serviceId: string;
    serviceName: string;
    startDate: string;
    endDate: string;
    selectedDates: string[];
    status: string;
  };
}

export interface UserServiceBooking {
  bookingId: string;
  serviceId: string;
  serviceName: string;
  orderId: string;
  status: string;
  startDate: string;
  endDate: string;
  selectedDates: string[];
  additionalServices: ServiceAdditionalBookingItem[];
  pricing: CreateServiceBookingResponse['pricing'];
  createdAt: string;
  confirmedAt?: string | null;
}

function servicesBase(): string {
  const env = getCurrentEnv();
  return env.endpoints.servicesBase || `${env.apiBaseUrl}/services`;
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

export async function fetchServiceBookingAvailability(
  serviceId: string,
  year: number,
  month: number,
): Promise<ServiceBookingAvailability> {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
  });
  const response = await fetch(
    `${servicesBase()}/${encodeURIComponent(serviceId)}/bookings/availability?${params}`,
    { headers: authHeaders() },
  );
  const body = await response.json() as ServiceBookingAvailability & { error?: string };
  if (!response.ok) {
    throw new Error(toUserFacingError(body.error || 'No se pudo cargar la disponibilidad', 'disponibilidad del servicio'));
  }
  return body;
}

export async function createServiceBooking(
  input: CreateServiceBookingInput,
): Promise<CreateServiceBookingResponse> {
  const response = await fetch(
    `${servicesBase()}/${encodeURIComponent(input.serviceId)}/bookings`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        userId: input.userId,
        startDate: input.startDate,
        endDate: input.endDate,
        additionalServices: input.additionalServices || [],
        buyer: input.buyer,
      }),
    },
  );
  const body = await response.json() as CreateServiceBookingResponse & { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(toUserFacingError(body.error || body.message || 'No se pudo crear la reserva', 'reserva del servicio'));
  }
  return body;
}

export async function fetchUserServiceBookings(userId: string): Promise<UserServiceBooking[]> {
  const response = await fetch(
    `${servicesBase()}/bookings/user/${encodeURIComponent(userId)}`,
    { headers: authHeaders() },
  );
  const body = await response.json() as { bookings?: UserServiceBooking[]; error?: string };
  if (!response.ok) {
    throw new Error(toUserFacingError(body.error || 'No se pudieron cargar tus reservas', 'reservas de servicios'));
  }
  return body.bookings || [];
}
