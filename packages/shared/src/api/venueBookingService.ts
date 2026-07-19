import { getAuthToken, getCurrentEnv } from './client';
import { toUserFacingError } from '../lib/apiError';
import { adjustPurchaseCountsCache } from '../lib/purchasesCountsCache';

export type VenueDayStatus = 'available' | 'reserved' | 'unavailable';

export interface VenueAvailabilityDay {
  status: VenueDayStatus;
  pricePerDay: number;
}

export interface VenueBookingAvailability {
  venueId: string;
  year: number;
  month: number;
  pricePerDay: number;
  rentalUnit?: 'day' | 'month';
  checkIn: string;
  checkOut: string;
  days: Record<string, VenueAvailabilityDay>;
}

export interface VenueBookingServiceItem {
  id: string;
  name: string;
  price: number;
  unit: 'evento' | 'día' | 'dia';
  quantity?: number;
}

export interface CreateVenueBookingInput {
  venueId: string;
  userId: string;
  selectedDates: string[];
  services?: VenueBookingServiceItem[];
  buyer: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateVenueBookingResponse {
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
    venueId: string;
    venueName: string;
    selectedDates: string[];
    status: string;
  };
}

export interface UserVenueBooking {
  bookingId: string;
  venueId: string;
  venueName: string;
  venueImage?: string;
  venueCoverImage?: string;
  venueCity?: string;
  venueAddress?: string;
  orderId: string;
  status: string;
  selectedDates: string[];
  services: VenueBookingServiceItem[];
  pricing: CreateVenueBookingResponse['pricing'];
  createdAt: string;
  confirmedAt?: string | null;
}

function venuesApiBase(): string {
  return `${getCurrentEnv().apiBaseUrl}/venues/venues`;
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

export async function fetchVenueBookingAvailability(
  venueId: string,
  year: number,
  month: number,
): Promise<VenueBookingAvailability | null> {
  try {
    const params = new URLSearchParams({
      year: String(year),
      month: String(month),
    });
    const response = await fetch(
      `${venuesApiBase()}/${encodeURIComponent(venueId)}/bookings/availability?${params}`,
      { headers: authHeaders() },
    );
    const raw = await response.text();
    let body: VenueBookingAvailability & { error?: string } = {} as VenueBookingAvailability;
    if (raw) {
      try {
        body = JSON.parse(raw) as VenueBookingAvailability & { error?: string };
      } catch {
        if (!response.ok) return null;
      }
    }
    if (!response.ok) return null;
    return body;
  } catch {
    return null;
  }
}

export async function createVenueBooking(
  input: CreateVenueBookingInput,
): Promise<CreateVenueBookingResponse> {
  const response = await fetch(
    `${venuesApiBase()}/${encodeURIComponent(input.venueId)}/bookings`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        userId: input.userId,
        selectedDates: input.selectedDates,
        services: input.services || [],
        buyer: input.buyer,
      }),
    },
  );
  const body = await response.json() as CreateVenueBookingResponse & { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(toUserFacingError(body.error || body.message || 'No se pudo crear la reserva', 'reserva del lugar'));
  }
  adjustPurchaseCountsCache(input.userId, { venueCount: 1 });
  return body;
}

export async function fetchUserVenueBookings(userId: string): Promise<UserVenueBooking[]> {
  const response = await fetch(
    `${venuesApiBase()}/bookings/user/${encodeURIComponent(userId)}`,
    { headers: authHeaders() },
  );
  const body = await response.json() as { bookings?: UserVenueBooking[]; error?: string };
  if (!response.ok) {
    throw new Error(toUserFacingError(body.error || 'No se pudieron cargar tus reservas', 'reservas de lugares'));
  }
  return body.bookings || [];
}

export function parseVenuePrice(value?: string | number | null): number {
  if (value == null) return 0;
  const normalized = String(value).replace(/[^\d.-]/g, '');
  const num = Number(normalized);
  return Number.isFinite(num) ? Math.max(0, Math.round(num)) : 0;
}
