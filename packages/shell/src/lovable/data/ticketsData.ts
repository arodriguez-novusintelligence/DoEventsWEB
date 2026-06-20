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
