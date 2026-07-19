import {
  countPurchaseTicketsFromGrouped,
  fetchGroupedUserTickets,
} from '../api/ticketsService';
import { fetchUserServiceBookings } from '../api/serviceBookingService';
import { fetchUserVenueBookings } from '../api/venueBookingService';
import {
  setCachedPurchaseCounts,
  type PurchaseCounts,
} from './purchasesCountsCache';

export async function fetchPurchaseCounts(userId: string): Promise<PurchaseCounts> {
  const [grouped, venueBookings, serviceBookings] = await Promise.all([
    fetchGroupedUserTickets(userId),
    fetchUserVenueBookings(userId),
    fetchUserServiceBookings(userId),
  ]);
  return {
    ticketCount: countPurchaseTicketsFromGrouped(grouped),
    venueCount: venueBookings.length,
    serviceCount: serviceBookings.length,
  };
}

export async function fetchAndCachePurchaseCounts(userId: string): Promise<PurchaseCounts> {
  const counts = await fetchPurchaseCounts(userId);
  setCachedPurchaseCounts(userId, counts);
  return counts;
}
