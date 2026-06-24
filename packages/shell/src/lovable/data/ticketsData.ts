/** Tipos de boleta — runtime vía API (`ticketsAdapter`, `TicketDetailPage`). Sin mocks. */
export type TicketStatus = 'aprobada' | 'pendiente' | 'cancelada' | 'finalizada';

export interface Ticket {
  id: string;
  orderNumber: string;
  orderDate: string;
  eventTitle: string;
  eventImage: string;
  eventVideo?: string;
  eventDate: string;
  startTime: string;
  category: string;
  seat: string;
  seatLabel?: string;
  entrance: string;
  qrCode: string;
  qrUrl?: string;
  orderRef?: string;
  status: TicketStatus;
  eventId?: string;
  orderId?: string;
  ticketInstanceId?: string;
  price?: number;
  paymentExpiresAtTs?: number;
  eventTicketCount?: number;
}
import { useSyncExternalStore } from 'react';

let tickets: Ticket[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const getTickets = () => tickets;

export const addTickets = (newTickets: Ticket[]) => {
  tickets = [...newTickets, ...tickets];
  emit();
};

export const useTickets = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => tickets,
    () => tickets,
  );
