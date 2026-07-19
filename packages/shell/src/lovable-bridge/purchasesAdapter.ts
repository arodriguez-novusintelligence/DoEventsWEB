import type { UserServiceBooking, UserVenueBooking } from '@doevents/shared';
import { resolveEventImageUrl } from '@doevents/shared';
import type { VenueReservationDetailData } from '@lovable/components/purchases/VenueReservationDetail';
import type { ServiceReservationDetailData } from '@lovable/components/purchases/ServiceReservationDetail';

export type PurchaseTabStatus = 'aprobada' | 'pendiente' | 'cancelada' | 'finalizada';

const VENUE_PLACEHOLDER =
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=70';

export function mapBookingStatus(status?: string): PurchaseTabStatus {
  const raw = String(status || '').toUpperCase();
  if (raw.includes('PENDING') || raw.includes('PEND')) return 'pendiente';
  if (raw.includes('CANCEL') || raw.includes('REJECT') || raw.includes('EXPIRED')) return 'cancelada';
  if (raw.includes('COMPLET') || raw.includes('FINISH') || raw.includes('FINAL')) return 'finalizada';
  if (raw.includes('CONFIRM') || raw.includes('APPROV') || raw.includes('PAID')) return 'aprobada';
  return 'aprobada';
}

export function resolveVenuePurchaseTab(booking: UserVenueBooking): PurchaseTabStatus {
  const raw = String(booking.status || '').toUpperCase();
  if (raw.includes('PENDING') || raw.includes('PEND')) return 'pendiente';
  if (raw.includes('CANCEL') || raw.includes('REJECT') || raw.includes('EXPIRED')) return 'cancelada';
  if (raw.includes('FINAL') || raw.includes('COMPLET')) return 'finalizada';

  const dates = [...(booking.selectedDates || [])].sort();
  const lastDate = dates[dates.length - 1];
  if (lastDate) {
    const end = new Date(`${lastDate}T23:59:59`);
    if (!Number.isNaN(end.getTime()) && end < new Date()) return 'finalizada';
  }

  return 'aprobada';
}

export function formatPurchaseDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatPurchaseDateShort(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

export function formatCurrency(amount?: number, currency = 'COP'): string {
  if (amount == null || !Number.isFinite(amount)) return '—';
  const prefix = currency === 'USD' ? 'US$' : '$';
  return `${prefix} ${Math.round(amount).toLocaleString('es-CO')}`;
}

export function countByPurchaseStatus<T extends { status?: string; selectedDates?: string[] }>(
  items: T[],
  resolver: (item: T) => PurchaseTabStatus = (item) => mapBookingStatus(item.status),
): Record<PurchaseTabStatus, number> {
  const counts: Record<PurchaseTabStatus, number> = {
    aprobada: 0,
    pendiente: 0,
    cancelada: 0,
    finalizada: 0,
  };
  items.forEach((item) => {
    counts[resolver(item)] += 1;
  });
  return counts;
}

export function resolveVenueImage(booking: UserVenueBooking): string {
  const raw = booking.venueImage || booking.venueCoverImage;
  return resolveEventImageUrl(raw) || VENUE_PLACEHOLDER;
}

export function venueBookingDays(booking: UserVenueBooking): number {
  const fromDates = booking.selectedDates?.length || 0;
  if (fromDates > 0) return fromDates;
  return booking.pricing?.numDays || 1;
}

export function venueDateRange(booking: UserVenueBooking): { start: string; end: string } {
  const dates = [...(booking.selectedDates || [])].sort();
  if (!dates.length) return { start: '—', end: '—' };
  return {
    start: formatPurchaseDate(dates[0]),
    end: formatPurchaseDate(dates[dates.length - 1]),
  };
}

export function serviceDateRange(booking: UserServiceBooking): { start: string; end: string } {
  return {
    start: formatPurchaseDate(booking.startDate),
    end: formatPurchaseDate(booking.endDate || booking.startDate),
  };
}

export function serviceBookingDays(booking: UserServiceBooking): number {
  const fromPricing = booking.pricing?.numDays;
  if (fromPricing && fromPricing > 0) return fromPricing;
  const dates = booking.selectedDates?.length || 0;
  if (dates > 0) return dates;
  return 1;
}

export interface ServicePurchaseGroup {
  id: string;
  serviceId: string;
  serviceName: string;
  serviceProvider?: string;
  serviceSector?: string;
  bookings: UserServiceBooking[];
}

export function groupServiceBookingsByService(bookings: UserServiceBooking[]): ServicePurchaseGroup[] {
  const map = new Map<string, ServicePurchaseGroup>();
  bookings.forEach((booking) => {
    const key = booking.serviceId || booking.serviceName;
    let group = map.get(key);
    if (!group) {
      group = {
        id: key,
        serviceId: booking.serviceId,
        serviceName: booking.serviceName,
        serviceProvider: booking.serviceProvider,
        serviceSector: booking.serviceSector,
        bookings: [],
      };
      map.set(key, group);
    }
    group.bookings.push(booking);
  });
  return Array.from(map.values());
}

export interface VenuePurchaseGroup {
  id: string;
  venueId: string;
  venueName: string;
  city?: string;
  bookings: UserVenueBooking[];
}

export function groupVenueBookingsByVenue(bookings: UserVenueBooking[]): VenuePurchaseGroup[] {
  const map = new Map<string, VenuePurchaseGroup>();
  bookings.forEach((booking) => {
    const key = booking.venueId || booking.venueName;
    let group = map.get(key);
    if (!group) {
      group = {
        id: key,
        venueId: booking.venueId,
        venueName: booking.venueName,
        city: booking.venueCity,
        bookings: [],
      };
      map.set(key, group);
    }
    group.bookings.push(booking);
  });
  return Array.from(map.values());
}

export function venueBookingToDetail(booking: UserVenueBooking): VenueReservationDetailData {
  const range = venueDateRange(booking);
  const days = venueBookingDays(booking);
  const pricing = booking.pricing || {};
  const reservationValue = pricing.reservationValue || 0;
  const servicesTotal = pricing.servicesTotal ?? (booking.services || []).reduce(
    (acc, svc) => acc + (svc.price || 0) * (svc.quantity ?? 1),
    0,
  );
  const subtotalReserva = pricing.subtotalReserva ?? reservationValue + servicesTotal;
  const commission = pricing.commission ?? Math.round(subtotalReserva * 0.12);
  const commissionIva = pricing.commissionIva ?? Math.round(commission * 0.19);
  const total = pricing.total ?? subtotalReserva + commission + commissionIva;
  const basePrice = days > 0 ? Math.round(reservationValue / days) : reservationValue;

  return {
    venueName: booking.venueName || 'Lugar',
    startDate: range.start,
    endDate: range.end,
    days,
    address: [booking.venueAddress, booking.venueCity].filter(Boolean).join(', ') || '—',
    basePrice,
    reservationValue,
    servicesTotal,
    subtotalReserva,
    commission,
    commissionIva,
    total,
    additionalServices: (booking.services || []).map((svc) => ({
      name: svc.name,
      qty: svc.quantity ?? 1,
      price: svc.price,
    })),
    currency: '$',
  };
}

export function serviceBookingToDetail(booking: UserServiceBooking): ServiceReservationDetailData {
  const range = serviceDateRange(booking);
  const days = serviceBookingDays(booking);
  const pricing = booking.pricing || {};
  const reservationValue = pricing.reservationValue || 0;
  const basePrice = days > 0 ? Math.round(reservationValue / days) : reservationValue;
  const orderSuffix = String(booking.orderId || booking.bookingId || '').slice(-6).toUpperCase();

  return {
    serviceName: booking.serviceName || 'Servicio',
    reservationNumber: orderSuffix || '—',
    startDate: range.start,
    endDate: range.end,
    days,
    address: booking.serviceAddress || booking.serviceCity || '—',
    basePrice,
    additionalServices: (booking.additionalServices || []).map((svc) => ({
      name: svc.name,
      price: (svc.pricePerDay || 0) * (svc.quantity ?? 1),
    })),
    currency: '$',
  };
}
