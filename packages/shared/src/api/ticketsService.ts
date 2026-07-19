import { getAuthToken, getCurrentEnv } from './client';
import { adjustPurchaseCountsCache } from '../lib/purchasesCountsCache';
import { isTicketTransferredOut } from '../lib/ticketTransfer';

function ordersBase(): string {
  return `${getCurrentEnv().apiBaseUrl}/orders`;
}

export interface UserTicketOrder {
  id?: string;
  order_id?: string;
  amount?: number;
  metadata?: {
    eventId?: string;
    eventName?: string;
    reference?: string;
    orderTotals?: {
      total_amount?: number;
    };
  };
  tickets?: TicketItem[];
  payment_status?: string;
  status?: string;
}

export interface TicketItem {
  id?: string;
  ticket_id?: string;
  ticketInstanceId?: string;
  category?: string;
  seatLabel?: string;
  seat_code?: string;
  seat?: string | {
    seatLabel?: string;
    rowLabel?: string;
    colNumber?: number;
  };
  display_ticket_id?: string;
  qr_url?: string;
  qrCodeKey?: string;
  qr_code?: string;
  categoryColor?: string;
  category_color?: string;
  color?: string;
  ticketCategoryColor?: string;
  price?: number;
  purchasePrice?: number;
  ticket_amount?: number;
  additional_charges_amount?: number;
  additional_charges?: Array<{ amount?: number }>;
  status?: string;
  transfer_status?: string;
  ticket_status?: string;
  refund_status?: string;
  user_id?: string;
  transferred_to?: {
    user_id?: string;
    user_name?: string;
    transferred_at?: string;
    new_order_id?: string;
  };
  transferred_from?: {
    user_id?: string;
    user_name?: string;
    transferred_at?: string;
    original_order_id?: string;
  };
}

export interface TicketEventGroup {
  eventId?: string;
  eventName?: string;
  eventImage?: string;
  eventDate?: string;
  eventTime?: string;
  order?: UserTicketOrder;
  orders?: UserTicketOrder[];
}

export type TicketStatusBucket = 'APPROVED' | 'PENDING' | 'CANCELLED' | 'FINISHED';

export interface GroupedUserTickets {
  APPROVED: TicketEventGroup[];
  PENDING: TicketEventGroup[];
  CANCELLED: TicketEventGroup[];
  FINISHED: TicketEventGroup[];
}

export interface TicketWithOrderRef extends TicketItem {
  orderRef?: string;
  paymentStatus?: string;
}

type RawTicketEventGroup = TicketEventGroup & {
  event_id?: string;
  event_name?: string;
  event_imagen?: string;
  event_fechaIni?: string;
  event_horaIni?: string;
};

function normalizeTicketEventGroup(raw: RawTicketEventGroup): TicketEventGroup {
  const orders = raw.orders || (raw.order ? [raw.order] : []);
  return {
    eventId: raw.eventId || raw.event_id,
    eventName: raw.eventName || raw.event_name || 'Evento',
    eventImage: raw.eventImage || raw.event_imagen,
    eventDate: raw.eventDate || raw.event_fechaIni,
    eventTime: raw.eventTime || raw.event_horaIni,
    order: raw.order,
    orders: orders.length ? orders : undefined,
  };
}

export function countTicketsInGroup(group: TicketEventGroup): number {
  const orders = group.orders || (group.order ? [group.order] : []);
  return orders.reduce((acc, order) => acc + (order.tickets?.length || 0), 0);
}

export function collectTicketsFromGroup(group: TicketEventGroup): TicketWithOrderRef[] {
  const orders = group.orders || (group.order ? [group.order] : []);
  const tickets: TicketWithOrderRef[] = [];
  orders.forEach((order) => {
    const orderAny = order as UserTicketOrder & {
      is_refunded?: boolean;
      refund_status?: string;
      user_id?: string;
      transferred_from?: TicketItem['transferred_from'];
    };
    if (orderAny.is_refunded || orderAny.refund_status === 'PENDING') return;

    const orderRef = order.order_id || order.id || order.metadata?.reference || '';
    const paymentStatus = order.payment_status || order.status;
    const orderUserId = orderAny.user_id;
    const orderTransferFrom = orderAny.transferred_from;
    (order.tickets || []).forEach((ticket) => {
      const withTransferMeta: TicketWithOrderRef = {
        ...ticket,
        orderRef,
        paymentStatus,
        transferred_from: ticket.transferred_from || orderTransferFrom,
      };
      if (isTicketTransferredOut(withTransferMeta, orderUserId)) {
        withTransferMeta.transfer_status = ticket.transfer_status || 'TRANSFERRED';
      }
      tickets.push(withTransferMeta);
    });
  });
  return tickets;
}

/** Conteo ligero para Mis Compras (aprobada + pendiente, sin reembolsos). */
export function countPurchaseTicketsFromGrouped(grouped: GroupedUserTickets): number {
  let total = 0;
  (['APPROVED', 'PENDING'] as const).forEach((bucket) => {
    grouped[bucket].forEach((group) => {
      const orders = group.orders || (group.order ? [group.order] : []);
      orders.forEach((order) => {
        const orderAny = order as UserTicketOrder & { is_refunded?: boolean; refund_status?: string; user_id?: string };
        if (orderAny.is_refunded || orderAny.refund_status === 'PENDING') return;
        (order.tickets || []).forEach((ticket) => {
          if (isTicketTransferredOut(ticket, orderAny.user_id)) return;
          total += 1;
        });
      });
    });
  });
  return total;
}

export async function fetchUserTickets(userId: string): Promise<UserTicketOrder[]> {
  const env = getCurrentEnv();
  const base = env.endpoints.userTickets || `${env.apiBaseUrl}/orders/users`;
  const token = getAuthToken();
  const response = await fetch(`${base}/${encodeURIComponent(userId)}/tickets`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
    },
  });

  if (!response.ok) {
    throw new Error('Error al cargar tus boletas');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data?.items || data?.tickets || [];
}

function isGroupedEmpty(grouped: GroupedUserTickets): boolean {
  return !grouped.APPROVED.length
    && !grouped.PENDING.length
    && !grouped.CANCELLED.length
    && !grouped.FINISHED.length;
}

function resolveOrderEventId(order: UserTicketOrder & { event_id?: string }): string {
  return order.metadata?.eventId || order.event_id || '';
}

function resolveOrderBucket(order: UserTicketOrder): TicketStatusBucket {
  const raw = String(order.payment_status || order.status || 'PENDING').toUpperCase();
  if (raw === 'SOLD' || raw === 'PAID' || raw === 'APPROVED') return 'APPROVED';
  if (raw === 'CANCELLED' || raw === 'CANCELED' || raw === 'REJECTED') return 'CANCELLED';
  if (raw === 'FINISHED' || raw === 'FINALIZED') return 'FINISHED';
  if (raw === 'PENDING') return 'PENDING';
  return 'PENDING';
}

function flatOrdersToGrouped(orders: UserTicketOrder[]): GroupedUserTickets {
  const grouped: GroupedUserTickets = {
    APPROVED: [],
    PENDING: [],
    CANCELLED: [],
    FINISHED: [],
  };
  const index = new Map<string, TicketEventGroup>();

  orders.forEach((order) => {
    const bucket = resolveOrderBucket(order);
    const eventId = resolveOrderEventId(order);
    const key = `${bucket}::${eventId || 'unknown'}`;
    if (!index.has(key)) {
      index.set(key, {
        eventId: eventId || undefined,
        eventName: order.metadata?.eventName || 'Evento',
        orders: [],
      });
    }
    index.get(key)!.orders!.push(order);
  });

  index.forEach((group, key) => {
    const bucket = key.split('::')[0] as TicketStatusBucket;
    grouped[bucket].push(group);
  });

  return grouped;
}

function normalizeGroupedResponse(
  body: Partial<Record<TicketStatusBucket, RawTicketEventGroup[]>>,
): GroupedUserTickets {
  const normalizeBucket = (items: RawTicketEventGroup[] = []) => items.map(normalizeTicketEventGroup);
  return {
    APPROVED: normalizeBucket(body.APPROVED),
    PENDING: normalizeBucket(body.PENDING),
    CANCELLED: normalizeBucket(body.CANCELLED),
    FINISHED: normalizeBucket(body.FINISHED),
  };
}

export async function fetchGroupedUserTickets(userId: string): Promise<GroupedUserTickets> {
  const empty: GroupedUserTickets = { APPROVED: [], PENDING: [], CANCELLED: [], FINISHED: [] };
  if (!userId) return empty;

  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: token } : {}),
  };

  try {
    const response = await fetch(
      `${getCurrentEnv().apiBaseUrl}/events/ordersList/${encodeURIComponent(userId)}`,
      { headers },
    );

    if (response.ok) {
      const body = await response.json() as Partial<Record<TicketStatusBucket, RawTicketEventGroup[]>>;
      const grouped = normalizeGroupedResponse(body);
      if (!isGroupedEmpty(grouped)) return grouped;
    }

    const fallback = await fetchUserTickets(userId).catch(() => [] as UserTicketOrder[]);
    if (fallback.length) return flatOrdersToGrouped(fallback);
    return empty;
  } catch {
    try {
      const fallback = await fetchUserTickets(userId);
      if (fallback.length) return flatOrdersToGrouped(fallback);
    } catch {
      // ignore
    }
    return empty;
  }
}

export async function transferTicketsToUser(input: {
  ticketIds: string[];
  currentUserId: string;
  orderId?: string;
  newUserId?: string;
  targetEmail?: string;
  targetUsername?: string;
}): Promise<void> {
  const ids = input.ticketIds.filter(Boolean);
  if (!ids.length) throw new Error('No hay boletas para compartir');
  const token = getAuthToken();
  let response: Response;
  try {
    response = await fetch(`${ordersBase()}/tickets/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify({
        ticketIDs: ids,
        ticketID: ids[0],
        ticket_id: ids[0],
        currentUserID: input.currentUserId,
        orderID: input.orderId,
        newUserID: input.newUserId,
        targetEmail: input.targetEmail,
        targetUsername: input.targetUsername,
        recipientEmail: input.targetEmail,
        recipientUser: input.targetUsername,
      }),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.');
  }

  let body: { message?: string; error?: string } = {};
  try {
    body = await response.json() as { message?: string; error?: string };
  } catch {
    if (!response.ok) {
      throw new Error('No se pudo compartir la(s) boleta(s)');
    }
  }
  if (!response.ok) {
    throw new Error(body.message || body.error || 'No se pudo compartir la(s) boleta(s)');
  }
  adjustPurchaseCountsCache(input.currentUserId, { ticketCount: -ids.length });
  if (input.newUserId) {
    adjustPurchaseCountsCache(input.newUserId, { ticketCount: ids.length });
  }
}

export async function transferTicketToUser(input: {
  ticketId: string;
  currentUserId: string;
  targetEmail?: string;
  targetUsername?: string;
}): Promise<void> {
  return transferTicketsToUser({
    ticketIds: [input.ticketId],
    currentUserId: input.currentUserId,
    targetEmail: input.targetEmail,
    targetUsername: input.targetUsername,
  });
}
