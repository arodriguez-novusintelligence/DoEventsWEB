export interface AvailableSeat {
  ticketInstanceId: string;
  distributionId?: string;
  distributionCreateDate?: string;
  ticketStatus?: string;
  price?: number;
  seatLabel?: string;
  ownerId?: string;
  orderId?: string;
  location?: {
    seatLabel?: string;
    rowLabel?: string;
    colNumber?: number;
  };
}

export interface TicketCategory {
  categoryId: string;
  categoryName: string;
  /** Color hex del mapa de silletería (p. ej. #E1BEE7) */
  categoryColor?: string | null;
  distributionId: string;
  createDate: string;
  gateId?: string | null;
  /** Venue clonado del evento (fuente de verdad para el mapa de checkout) */
  venueId?: string;
  seats: AvailableSeat[];
}

export interface AvailableSeatsResponse {
  eventId: string;
  categories: TicketCategory[];
  summary?: {
    totalSeats?: number;
    availableSeats?: number;
  };
}

export interface CreateOrderTicketRequest {
  ticket_id: string;
  ticketsDistId: string;
  distributionCreateDate: string;
  category: string;
  seats: string[];
  /** Color hex de la categoría en el mapa (persistido en la orden) */
  categoryColor?: string;
  purchasePrice?: number;
  price?: number;
}

export interface CreateOrderResponse {
  message?: string;
  order_id?: string;
  reference?: string;
  payment_status?: string;
  expires_at?: string;
  expires_at_ts?: number;
  total_amount?: number;
  tickets?: Array<{
    ticket_id?: string;
    ticketInstanceId?: string;
    id?: string;
    category?: string;
    categoryColor?: string;
    category_color?: string;
    seatLabel?: string;
    qr_url?: string;
    qr_code?: string;
    qrCodeKey?: string;
    qr_key?: string;
    qrKey?: string;
    price?: number;
  }>;
  summary?: {
    totalTickets?: number;
  };
  metadata?: {
    orderType?: string;
    venueId?: string;
    venueName?: string;
    selectedDates?: string[];
    [key: string]: unknown;
  };
}

export interface PaymentCallbackResponse {
  message?: string;
  order_id?: string;
  status?: string;
  tickets_confirmed?: number;
}
