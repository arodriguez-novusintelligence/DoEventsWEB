export interface SeatInfo {
  row: string;
  number: number;
  sold: boolean;
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  purchaseDate?: string;
  paymentAuthorization?: 'before' | 'after';
  /** Etiqueta exacta del backend, p. ej. "Pre-evento (pagado)" */
  paymentStatusLabel?: string;
  isPaid?: boolean;
  amountPaid?: number;
  platformCommission?: number;
  totalWithCommission?: number;
}

export interface CategorySales {
  name: string;
  color: string;
  colorHex: string;
  total: number;
  sold: number;
  available: number;
  occupancy: number;
  revenue: number;
  seats: SeatInfo[];
}

export interface EventSalesData {
  eventId: string;
  eventName: string;
  venueName: string;
  currency: string;
  categories: CategorySales[];
}
import type { EventChatRoom } from './chatData';

export const generateMockSalesData = (event: EventChatRoom): EventSalesData => ({
  eventId: event.id,
  eventName: event.eventName,
  venueName: '',
  currency: 'COP',
  categories: [],
});
