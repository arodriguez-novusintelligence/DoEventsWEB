import { getAuthToken, getCurrentEnv } from './client';
import { invalidatePurchaseCountsCache, adjustPurchaseCountsCache } from '../lib/purchasesCountsCache';
import { resolveOrderExpiresAtTs } from '../lib/reservationTime';
import { isTicketTransferredOut, type TicketTransferMeta } from '../lib/ticketTransfer';
import type {
  AvailableSeatsResponse,
  CreateOrderResponse,
  CreateOrderTicketRequest,
  PaymentCallbackResponse,
  AvailableSeat,
  TicketCategory,
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

type SeatLabelSource = {
  seatLabel?: string;
  location?: {
    seatLabel?: string;
    rowLabel?: string;
    colNumber?: number;
    row?: string;
    number?: number;
  };
};

export function resolveSeatLabel(seat: SeatLabelSource): string {
  if (seat.seatLabel) return seat.seatLabel.trim();
  if (seat.location?.seatLabel) return seat.location.seatLabel.trim();
  const row = seat.location?.rowLabel || seat.location?.row;
  const col = seat.location?.colNumber ?? seat.location?.number;
  if (row && col != null && col > 0) {
    return `${String(row).trim()}${col}`;
  }
  return '';
}

function normalizeAvailableSeat(raw: Record<string, unknown>): AvailableSeat {
  const locationRaw = (raw.location && typeof raw.location === 'object')
    ? raw.location as Record<string, unknown>
    : {};
  const rowLabel = locationRaw.rowLabel ?? locationRaw.row;
  const colNumber = locationRaw.colNumber ?? locationRaw.number;
  return {
    ticketInstanceId: String(raw.ticketInstanceId || ''),
    distributionId: raw.distributionId ? String(raw.distributionId) : undefined,
    distributionCreateDate: raw.distributionCreateDate ? String(raw.distributionCreateDate) : undefined,
    ticketStatus: raw.ticketStatus ? String(raw.ticketStatus) : undefined,
    price: typeof raw.price === 'number' ? raw.price : Number(raw.price) || 0,
    seatLabel: raw.seatLabel ? String(raw.seatLabel) : undefined,
    ownerId: raw.ownerId ? String(raw.ownerId) : undefined,
    orderId: raw.orderId ? String(raw.orderId) : undefined,
    location: {
      seatLabel: locationRaw.seatLabel ? String(locationRaw.seatLabel) : undefined,
      rowLabel: rowLabel != null ? String(rowLabel) : undefined,
      colNumber: colNumber != null ? Number(colNumber) : undefined,
    },
  };
}

function normalizeTicketCategory(raw: Record<string, unknown>): TicketCategory {
  const seatsRaw = Array.isArray(raw.seats) ? raw.seats : [];
  const colorRaw = raw.categoryColor ?? raw.category_color;
  const categoryColor = colorRaw != null && String(colorRaw).trim()
    ? String(colorRaw).trim()
    : null;
  return {
    categoryId: String(raw.categoryId || raw.boletaId || ''),
    categoryName: String(raw.categoryName || 'Sin categoría'),
    categoryColor,
    distributionId: String(raw.distributionId || raw.id || ''),
    createDate: String(raw.createDate || ''),
    venueId: raw.venueId ? String(raw.venueId) : undefined,
    seats: seatsRaw.map((seat) => normalizeAvailableSeat(seat as Record<string, unknown>)),
  };
}

export async function fetchAvailableSeats(eventId: string): Promise<AvailableSeatsResponse> {
  const response = await fetch(
    `${ordersBase()}/events/${encodeURIComponent(eventId)}/available-seats`,
    { headers: authHeaders() },
  );

  const body = await response.json() as AvailableSeatsResponse & {
    message?: string;
    error?: string;
    categories?: Array<Record<string, unknown>>;
  };
  if (!response.ok) {
    throw new Error(body.message || body.error || 'No hay boletas disponibles para este evento');
  }
  const categories = ((body.categories || []) as Array<Record<string, unknown>>).map(
    (cat) => normalizeTicketCategory(cat),
  );
  return { ...body, categories };
}

export async function createTicketOrder(input: {
  eventId: string;
  userId: string;
  tickets: CreateOrderTicketRequest[];
  totalAmount: number;
  reference?: string;
  promoCode?: string;
  promoDiscount?: number;
  /** true = conoce al organizador (pago inmediato); false = post-evento */
  isReferred?: boolean;
}): Promise<CreateOrderResponse> {
  const reference = input.reference || crypto.randomUUID();
  const response = await fetch(`${ordersBase()}/orders`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      reference,
      amount_in_cents: Math.round(input.totalAmount * 100),
      currency: 'COP',
      ...(typeof input.isReferred === 'boolean'
        ? { isReferred: input.isReferred, is_referred: input.isReferred }
        : {}),
      metadata: {
        eventId: input.eventId,
        userID: input.userId,
        tickets: input.tickets,
        ...(typeof input.isReferred === 'boolean' ? { isReferred: input.isReferred } : {}),
        ...(input.promoCode ? {
          promoCode: input.promoCode,
          promoDiscount: input.promoDiscount ?? 0,
        } : {}),
      },
    }),
  });

  const body = await response.json() as { createOrder?: CreateOrderResponse; message?: string; code?: string };
  if (!response.ok) {
    throw new Error(body.message || 'Error al crear la orden');
  }
  const order = body.createOrder || (body as CreateOrderResponse);
  const ticketDelta = input.tickets.reduce(
    (sum, ticket) => sum + Math.max(1, ticket.seats?.length || 0),
    0,
  );
  adjustPurchaseCountsCache(input.userId, { ticketCount: ticketDelta });
  const expiresMs = resolveOrderExpiresAtTs(order);
  if (expiresMs) {
    return { ...order, expires_at_ts: expiresMs };
  }
  return order;
}

export async function confirmTicketPayment(
  reference: string,
  userId?: string,
  options?: {
    transactionId?: string;
    status?: string;
    freeCheckout?: boolean;
    /** true = conoce al organizador (pago inmediato); false = post-evento */
    isReferred?: boolean;
  },
): Promise<PaymentCallbackResponse> {
  const hasIsReferred = typeof options?.isReferred === 'boolean';
  const response = await fetch(`${ordersBase()}/payments/callback`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      reference,
      status: options?.status || 'APPROVED',
      ...(hasIsReferred
        ? {
            isReferred: options!.isReferred,
            is_referred: options!.isReferred,
            referred: options!.isReferred,
          }
        : {}),
      payment_data: {
        source: 'DoEventsWEB',
        gateway: 'wompi',
        ...(options?.transactionId
          ? {
              transactionId: options.transactionId,
              transaction_id: options.transactionId,
            }
          : {}),
        ...(options?.freeCheckout ? { freeCheckout: true } : {}),
        ...(hasIsReferred
          ? {
              isReferred: options!.isReferred,
              is_referred: options!.isReferred,
            }
          : {}),
      },
      payment_method: {
        type: options?.freeCheckout ? 'free_checkout' : 'wompi_checkout',
      },
      ...(options?.transactionId
        ? {
            transactionId: options.transactionId,
            transaction_id: options.transactionId,
          }
        : {}),
    }),
  });

  const body = await response.json() as { processPaymentCallback?: PaymentCallbackResponse; message?: string };
  if (!response.ok) {
    throw new Error(body.message || 'Error al confirmar el pago');
  }
  if (userId) invalidatePurchaseCountsCache(userId);
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

export async function cancelTicketOrder(orderId: string, userId?: string): Promise<void> {
  const response = await fetch(`${ordersBase()}/orders/cancel`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ orderID: orderId }),
  });
  const body = await response.json() as { message?: string; error?: string };
  if (!response.ok) {
    throw new Error(body.message || body.error || 'No se pudo cancelar la reserva');
  }
  if (userId) invalidatePurchaseCountsCache(userId);
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
  const orderUserId = (order as CreateOrderResponse & { user_id?: string }).user_id;
  const orderRefundStatus = String(
    (order as CreateOrderResponse & { refund_status?: string }).refund_status || '',
  ).toUpperCase();
  const orderRefunded = Boolean(
    (order as CreateOrderResponse & { is_refunded?: boolean }).is_refunded
    || String((order as CreateOrderResponse & { payment_status?: string }).payment_status || '').toUpperCase() === 'REFUNDED'
    || orderRefundStatus === 'COMPLETED'
    || orderRefundStatus === 'PENDING'
    || orderRefundStatus === 'PENDING_REFUND',
  );
  const tickets = await Promise.all(order.tickets.map(async (ticket) => {
    const ticketId = ticket.ticket_id || ticket.ticketInstanceId || ticket.id;
    if (!ticketId) return ticket;
    const refundStatus = String(
      (ticket as { refund_status?: string }).refund_status
      || (ticket as { ticket_status?: string }).ticket_status
      || '',
    ).toUpperCase();
    const ticketRefunded = orderRefunded
      || (ticket as { is_refunded?: boolean }).is_refunded === true
      || refundStatus === 'REFUNDED'
      || refundStatus === 'PENDING_REFUND'
      || refundStatus === 'PENDING'
      || refundStatus === 'COMPLETED';
    if (ticketRefunded || isTicketTransferredOut(ticket as TicketTransferMeta, orderUserId)) {
      return { ...ticket, qr_url: '' };
    }
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
  transfer_status?: string;
  ticket_status?: string;
  refund_status?: string;
  is_refunded?: boolean;
  user_id?: string;
}>(tickets: T[], orderUserId?: string): Promise<T[]> {
  return Promise.all(tickets.map(async (ticket) => {
    const ticketId = ticket.ticket_id || ticket.ticketInstanceId || ticket.id;
    if (!ticketId) return ticket;
    const refundStatus = String(ticket.refund_status || ticket.ticket_status || '').toUpperCase();
    const ticketRefunded = ticket.is_refunded === true
      || refundStatus === 'REFUNDED'
      || refundStatus === 'PENDING_REFUND'
      || refundStatus === 'PENDING'
      || refundStatus === 'COMPLETED';
    if (ticketRefunded || isTicketTransferredOut(ticket as TicketTransferMeta, orderUserId)) {
      return { ...ticket, qr_url: '' };
    }
    const qrKey = ticket.qrCodeKey || ticket.qr_key || ticket.qrKey;
    if (ticket.qr_url) return ticket;
    const qrUrl = await fetchTicketQrUrl(ticketId, qrKey).catch(() => null);
    return qrUrl ? { ...ticket, qr_url: qrUrl } : ticket;
  }));
}
