import type { AvailableSeat, TicketCategory } from '../types/orders';

export function normalizeTicketStatus(status?: string): string {
  return String(status || 'AVAILABLE').trim().toUpperCase();
}

export function isSeatStatusAvailable(status?: string): boolean {
  const normalized = normalizeTicketStatus(status);
  return !normalized || normalized === 'AVAILABLE' || normalized === 'LIBRE';
}

export function isSeatReservedByUser(seat: AvailableSeat, userId?: string): boolean {
  if (!userId) return false;
  return normalizeTicketStatus(seat.ticketStatus) === 'RESERVED'
    && Boolean(seat.orderId)
    && String(seat.ownerId || '') === String(userId);
}

/** Boleta seleccionable en checkout (excluye reservas ajenas y vendidas). */
export function isSeatAvailableForPurchase(seat: AvailableSeat, userId?: string): boolean {
  if (isSeatStatusAvailable(seat.ticketStatus)) return true;
  return isSeatReservedByUser(seat, userId);
}

export function filterSelectableSeats(seats: AvailableSeat[] = [], userId?: string): AvailableSeat[] {
  return seats.filter((seat) => isSeatAvailableForPurchase(seat, userId));
}

export function withSelectableSeats(
  categories: TicketCategory[],
  userId?: string,
): TicketCategory[] {
  return categories.map((category) => ({
    ...category,
    seats: filterSelectableSeats(category.seats, userId),
  }));
}

export function buildSeatLookup(categories: TicketCategory[]): Map<string, AvailableSeat> {
  const map = new Map<string, AvailableSeat>();
  categories.forEach((category) => {
    (category.seats || []).forEach((seat) => {
      if (seat.ticketInstanceId) map.set(seat.ticketInstanceId, seat);
    });
  });
  return map;
}

export interface TicketCategoryWithRawSeats extends TicketCategory {
  rawSeats?: AvailableSeat[];
}

export function recoverPendingOrderIdFromCategories(
  categories: TicketCategoryWithRawSeats[],
  userId: string,
): string | null {
  const orderIds = new Set<string>();
  categories.forEach((category) => {
    (category.rawSeats || category.seats || []).forEach((seat: AvailableSeat) => {
      if (isSeatReservedByUser(seat, userId) && seat.orderId) {
        orderIds.add(seat.orderId);
      }
    });
  });
  return orderIds.size === 1 ? [...orderIds][0] : null;
}

export function attachRawSeats(categories: TicketCategory[]): TicketCategoryWithRawSeats[] {
  return categories.map((category) => ({
    ...category,
    rawSeats: category.seats,
    seats: filterSelectableSeats(category.seats),
  }));
}

export function attachRawSeatsForUser(
  categories: TicketCategory[],
  userId?: string,
): TicketCategoryWithRawSeats[] {
  return categories.map((category) => ({
    ...category,
    rawSeats: category.seats,
    seats: filterSelectableSeats(category.seats, userId),
  }));
}

/** Todas las boletas (incl. reservadas/vendidas) para pintar el mapa en checkout. */
export function categoriesForMapDisplay(
  categories: TicketCategoryWithRawSeats[],
): TicketCategory[] {
  return categories.map((category) => ({
    ...category,
    seats: category.rawSeats || category.seats,
  }));
}
