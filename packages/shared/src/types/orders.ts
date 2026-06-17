export interface AvailableSeat {
  ticketInstanceId: string;
  distributionId?: string;
  distributionCreateDate?: string;
  ticketStatus?: string;
  price?: number;
  seatLabel?: string;
  location?: {
    seatLabel?: string;
    rowLabel?: string;
    colNumber?: number;
  };
}

export interface TicketCategory {
  categoryId: string;
  categoryName: string;
  distributionId: string;
  createDate: string;
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
