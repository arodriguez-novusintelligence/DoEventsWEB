import { getAuthToken, getCurrentEnv } from './client';
import { resolveOrderExpiresAtTs } from '../lib/reservationTime';
import type {
  AvailableSeatsResponse,
  CreateOrderResponse,
  CreateOrderTicketRequest,
  PaymentCallbackResponse,
} from '../types/orders';

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

function ordersBase(): string {
  return `${getCurrentEnv().apiBaseUrl}/orders`;
}

export function resolveSeatLabel(seat: {
  seatLabel?: string;
  location?: { seatLabel?: string; rowLabel?: string; colNumber?: number };
}): string {
  if (seat.seatLabel) return seat.seatLabel;
  if (seat.location?.seatLabel) return seat.location.seatLabel;
  if (seat.location?.rowLabel && seat.location?.colNumber) {
    return `${seat.location.rowLabel}${seat.location.colNumber}`;
  }
  return '';
}

export async function fetchAvailableSeats(eventId: string): Promise<AvailableSeatsResponse> {
  const response = await fetch(
    `${ordersBase()}/events/${encodeURIComponent(eventId)}/available-seats`,
    { headers: authHeaders() },
  );

  const body = await response.json() as AvailableSeatsResponse & { message?: string; error?: string };
  if (!response.ok) {
    throw new Error(body.message || body.error || 'No hay boletas disponibles para este evento');
  }
  return body;
}

export async function createTicketOrder(input: {
  eventId: string;
  userId: string;
  tickets: CreateOrderTicketRequest[];
  totalAmount: number;
  reference?: string;
}): Promise<CreateOrderResponse> {
  const reference = input.reference || `WEB-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const response = await fetch(`${ordersBase()}/orders`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      reference,
      amount_in_cents: Math.round(input.totalAmount * 100),
      currency: 'COP',
      metadata: {
        eventId: input.eventId,
        userID: input.userId,
        tickets: input.tickets,
      },
    }),
  });

  const body = await response.json() as { createOrder?: CreateOrderResponse; message?: string; code?: string };
  if (!response.ok) {
    throw new Error(body.message || 'Error al crear la orden');
  }
  const order = body.createOrder || (body as CreateOrderResponse);
  const expiresMs = resolveOrderExpiresAtTs(order);
  if (expiresMs) {
    return { ...order, expires_at_ts: expiresMs };
  }
  return order;
}

export async function confirmTicketPayment(
  reference: string,
): Promise<PaymentCallbackResponse> {
  const response = await fetch(`${ordersBase()}/payments/callback`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      reference,
      status: 'APPROVED',
      payment_data: {
        source: 'DoEventsWEB',
      },
      payment_method: { type: 'web_checkout' },
    }),
  });

  const body = await response.json() as { processPaymentCallback?: PaymentCallbackResponse; message?: string };
  if (!response.ok) {
    throw new Error(body.message || 'Error al confirmar el pago');
  }
  return body.processPaymentCallback || (body as PaymentCallbackResponse);
}

export async function fetchOrderById(orderId: string): Promise<CreateOrderResponse | null> {
  const response = await fetch(`${ordersBase()}/orders/${encodeURIComponent(orderId)}`, {
    headers: authHeaders(),
  });
  if (!response.ok) return null;
  const body = await response.json() as {
    getOrderById?: { order?: CreateOrderResponse };
    order?: CreateOrderResponse;
  } & Partial<CreateOrderResponse>;
  const order = body.getOrderById?.order
    || body.order
    || (body.order_id ? (body as CreateOrderResponse) : null);
  if (!order) return null;
  const expiresMs = resolveOrderExpiresAtTs(order);
  return expiresMs ? { ...order, expires_at_ts: expiresMs } : order;
}

export async function cancelTicketOrder(orderId: string, _userId?: string): Promise<void> {
  const response = await fetch(`${ordersBase()}/orders/cancel`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ orderID: orderId }),
  });
  const body = await response.json() as { message?: string; error?: string };
  if (!response.ok) {
    throw new Error(body.message || body.error || 'No se pudo cancelar la reserva');
  }
}

export async function fetchTicketQrUrl(
  ticketId: string,
  qrKey?: string,
): Promise<string | null> {
  if (!ticketId) return null;
  const params = new URLSearchParams();
  if (qrKey) params.set('qrKey', qrKey);
  const query = params.toString();
  const response = await fetch(
    `${ordersBase()}/tickets/qr/${encodeURIComponent(ticketId)}${query ? `?${query}` : ''}`,
    { headers: authHeaders() },
  );
  if (!response.ok) return null;
  const body = await response.json() as { url?: string; qr_url?: string };
  return body.url || body.qr_url || null;
}

export async function enrichOrderWithQrUrls(
  order: CreateOrderResponse,
): Promise<CreateOrderResponse> {
  if (!order.tickets?.length) return order;
  const tickets = await Promise.all(order.tickets.map(async (ticket) => {
    const ticketId = ticket.ticket_id || ticket.ticketInstanceId || ticket.id;
    if (!ticketId) return ticket;
    const qrKey = ticket.qrCodeKey || ticket.qr_key || ticket.qrKey;
    if (ticket.qr_url) return ticket;
    const qrUrl = await fetchTicketQrUrl(ticketId, qrKey);
    return qrUrl ? { ...ticket, qr_url: qrUrl } : ticket;
  }));
  return { ...order, tickets };
}

export async function enrichTicketsWithQrUrls<T extends {
  ticket_id?: string;
  ticketInstanceId?: string;
  id?: string;
  qrCodeKey?: string;
  qr_key?: string;
  qrKey?: string;
  qr_url?: string;
}>(tickets: T[]): Promise<T[]> {
  return Promise.all(tickets.map(async (ticket) => {
    const ticketId = ticket.ticket_id || ticket.ticketInstanceId || ticket.id;
    if (!ticketId) return ticket;
    const qrKey = ticket.qrCodeKey || ticket.qr_key || ticket.qrKey;
    if (ticket.qr_url) return ticket;
    const qrUrl = await fetchTicketQrUrl(ticketId, qrKey).catch(() => null);
    return qrUrl ? { ...ticket, qr_url: qrUrl } : ticket;
  }));
}
