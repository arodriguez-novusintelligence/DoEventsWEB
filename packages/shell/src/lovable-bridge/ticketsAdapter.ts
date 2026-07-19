import type {
  GroupedUserTickets,
  TicketEventGroup,
  TicketWithOrderRef,
  UserTicketOrder,
} from '@doevents/shared';
import {
  collectTicketsFromGroup,
  countTicketsInGroup,
  formatTransferredAt,
  buildTransferStampLabel,
  getPersistedUserDisplayName,
  isTicketReceivedByTransfer,
  isTicketTransferredOut,
  resolveEventImageUrl,
  resolveTransferredAt,
  resolveTransferredFromName,
  resolveTransferredToName,
  resolveOrderExpiresAtTs,
  fetchOrderById,
  fetchEventDetail,
  fetchUserTickets,
  fetchAvailableSeats,
  listStoredReservationsForUser,
  saveStoredReservation,
} from '@doevents/shared';
import type { Ticket, TicketStatus } from '@lovable/data/ticketsData';
import type { BoletaEntry } from '@lovable/components/tickets/TransferTicketFlow';
import { parseSeatLabel } from './venueToFigures';
import { formatDisplayOrderId, formatDisplayTicketId } from '@doevents/shared';

export function extractSeatLabel(ticket: TicketWithOrderRef): string {
  const direct = ticket.seatLabel || ticket.seat_code || '';
  if (direct) {
    const parsed = parseSeatLabel(direct);
    return parsed || direct.replace(/^Silla\s*-?\s*/i, '').trim();
  }
  const seat = ticket.seat as
    | string
    | { seatLabel?: string; rowLabel?: string; colNumber?: number }
    | null
    | undefined;
  if (typeof seat === 'string' && seat.trim()) {
    return parseSeatLabel(seat) || seat.trim();
  }
  if (seat && typeof seat === 'object') {
    if (seat.seatLabel) {
      return parseSeatLabel(seat.seatLabel) || seat.seatLabel;
    }
    if (seat.rowLabel && seat.colNumber != null) {
      return `${seat.rowLabel}${seat.colNumber}`;
    }
  }
  return '';
}

function mapPaymentStatus(status?: string): TicketStatus {
  const raw = String(status || '').toLowerCase();
  if (raw.includes('pending') || raw.includes('pend')) return 'pendiente';
  if (raw.includes('cancel') || raw.includes('reject') || raw.includes('refund')) return 'cancelada';
  if (raw.includes('finish') || raw.includes('final') || raw.includes('complete')) return 'finalizada';
  return 'aprobada';
}

function isApiTicketRefunded(
  ticket: TicketWithOrderRef,
  order?: UserTicketOrder | null,
): boolean {
  const ticketAny = ticket as TicketWithOrderRef & {
    refund_status?: string;
    ticket_status?: string;
    is_refunded?: boolean;
    refunded?: boolean;
  };
  if (ticketAny.is_refunded === true || ticketAny.refunded === true) return true;

  const ticketRefund = String(ticketAny.refund_status || '').toUpperCase();
  if (
    ticketRefund === 'REFUNDED'
    || ticketRefund === 'PENDING_REFUND'
    || ticketRefund === 'PENDING'
    || ticketRefund === 'COMPLETED'
  ) {
    return true;
  }

  const ticketStatus = String(ticketAny.ticket_status || '').toUpperCase();
  if (ticketStatus === 'REFUNDED' || ticketStatus === 'PENDING_REFUND') return true;

  const orderAny = order as (UserTicketOrder & {
    is_refunded?: boolean;
    payment_status?: string;
    refund_status?: string;
  }) | null | undefined;
  if (orderAny?.is_refunded === true) return true;

  const orderRefund = String(orderAny?.refund_status || '').toUpperCase();
  if (orderRefund === 'COMPLETED' || orderRefund === 'PENDING' || orderRefund === 'PENDING_REFUND') {
    return true;
  }

  const payment = String(orderAny?.payment_status || '').toUpperCase();
  if (payment === 'REFUNDED') return true;
  if (payment === 'CANCELLED' && Boolean(orderAny?.is_refunded || orderRefund)) return true;

  return false;
}

function formatDate(value?: string): string {
  if (!value) return '';
  if (/^\d{8}$/.test(value)) {
    return `${value.slice(6, 8)}/${value.slice(4, 6)}/${value.slice(0, 4)}`;
  }
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString('es-CO');
  }
  return value;
}

function resolveSeatLabel(ticket: TicketWithOrderRef): string {
  return extractSeatLabel(ticket);
}

function resolveTicketInstanceId(ticket: TicketWithOrderRef, index: number, group: TicketEventGroup): string {
  return ticket.ticketInstanceId || ticket.ticket_id || ticket.id || `${group.eventId}-${index}`;
}

function resolveOrderRef(ticket: TicketWithOrderRef, group: TicketEventGroup): string {
  if (ticket.orderRef) return String(ticket.orderRef);
  const orders = group.orders || (group.order ? [group.order] : []);
  for (const order of orders) {
    const ref = order.order_id || order.id || order.metadata?.reference || (order as { reference?: string }).reference;
    if (ref) return String(ref);
  }
  return '';
}

function resolveEntrance(ticket: TicketWithOrderRef): string {
  const gate = (ticket as TicketWithOrderRef & { gate_name?: string }).gate_name;
  if (gate) return gate.replace(/^Puerta\s+/i, '').trim() || gate;
  return 'Puerta principal';
}

function resolveOrderPurchaseDate(order?: UserTicketOrder | null): string {
  if (!order) return '';
  const orderAny = order as UserTicketOrder & { created_at?: string; order_date?: string };
  return formatDate(
    orderAny.order_date
    || orderAny.created_at
    || (order.metadata?.created_at as string | undefined),
  );
}

function ticketFromApi(
  ticket: TicketWithOrderRef,
  group: TicketEventGroup,
  index: number,
  orderUserId?: string,
  order?: UserTicketOrder | null,
): Ticket {
  const orderRef = resolveOrderRef(ticket, group);
  const seatLabel = resolveSeatLabel(ticket);
  const instanceId = resolveTicketInstanceId(ticket, index, group);
  const transferredOut = isTicketTransferredOut(ticket, orderUserId);
  const receivedByTransfer = isTicketReceivedByTransfer(ticket);
  const isRefunded = isApiTicketRefunded(ticket, order);
  const transferredAtRaw = resolveTransferredAt(ticket);
  const displayOrder = formatDisplayOrderId(
    orderRef,
    (ticket as TicketWithOrderRef & { display_order_id?: string }).display_order_id,
  );
  return {
    id: instanceId,
    orderNumber: displayOrder,
    orderDate: resolveOrderPurchaseDate(order) || formatDate(group.eventDate),
    eventTitle: group.eventName || 'Evento',
    eventImage: resolveEventImageUrl(group.eventImage) || '',
    eventDate: formatDate(group.eventDate),
    startTime: group.eventTime || '',
    category: ticket.category || 'General',
    categoryColor:
      ticket.categoryColor
      || ticket.category_color
      || ticket.color
      || ticket.ticketCategoryColor,
    seat: seatLabel || '—',
    seatLabel: seatLabel || undefined,
    entrance: resolveEntrance(ticket),
    qrCode: transferredOut || isRefunded ? '' : formatDisplayTicketId(ticket),
    qrUrl: transferredOut || isRefunded ? undefined : (ticket.qr_url || undefined),
    orderRef: orderRef || undefined,
    orderId: orderRef || undefined,
    ticketInstanceId: instanceId,
    price: typeof ticket.price === 'number' ? ticket.price : undefined,
    status: isRefunded ? 'cancelada' : mapPaymentStatus(ticket.paymentStatus || ticket.status),
    eventId: group.eventId,
    isTransferred: transferredOut || receivedByTransfer,
    isTransferredOut: transferredOut,
    isRefunded,
    refundStatus: String(
      (ticket as TicketWithOrderRef & { refund_status?: string }).refund_status
      || (ticket as TicketWithOrderRef & { ticket_status?: string }).ticket_status
      || '',
    ) || undefined,
    transferredAt: transferredAtRaw ? formatTransferredAt(transferredAtRaw) : undefined,
    transferredFromName: resolveTransferredFromName(ticket),
    transferredToName: resolveTransferredToName(ticket)
      || (receivedByTransfer ? getPersistedUserDisplayName() || undefined : undefined),
  };
}

function buildPendingOrderTicket(
  order: UserTicketOrder,
  group: TicketEventGroup,
  orderIdx: number,
): Ticket {
  const orderAny = order as UserTicketOrder & {
    created_at?: string;
    order_date?: string;
    display_order_id?: string;
    expired_at_ts?: number;
    expires_at_ts?: number;
    expires_at?: string;
    order_ttl?: number;
  };
  const orderId = String(order.order_id || order.id || '');
  const purchaseDate = formatDate(
    orderAny.order_date || orderAny.created_at || (order.metadata?.created_at as string | undefined),
  );
  const expiresAtTs = resolveOrderExpiresAtTs(orderAny) || undefined;
  return {
    id: `${orderId}-pending-${orderIdx}`,
    orderNumber: formatDisplayOrderId(
      orderId,
      orderAny.display_order_id || order.metadata?.reference,
    ),
    orderDate: purchaseDate || formatDate(group.eventDate),
    eventTitle: group.eventName || 'Evento',
    eventImage: resolveEventImageUrl(group.eventImage) || '',
    eventDate: formatDate(group.eventDate),
    startTime: group.eventTime || '',
    category: 'Pago pendiente',
    seat: '—',
    entrance: '—',
    qrCode: '',
    status: 'pendiente',
    eventId: group.eventId,
    orderId,
    orderRef: orderId,
    paymentExpiresAtTs: expiresAtTs,
  };
}

function ticketWithOrderExpiry(
  ticket: Ticket,
  order: UserTicketOrder | undefined,
  status: TicketStatus,
): Ticket {
  if (status !== 'pendiente' || !order) return ticket;
  const expiresAtTs = resolveOrderExpiresAtTs(order as UserTicketOrder & {
    expired_at_ts?: number;
    expires_at_ts?: number;
    expires_at?: string;
    order_ttl?: number;
  });
  return expiresAtTs ? { ...ticket, paymentExpiresAtTs: expiresAtTs } : ticket;
}

export function groupedTicketsToLovable(grouped: GroupedUserTickets): Ticket[] {
  const buckets: Array<{ status: TicketStatus; groups: TicketEventGroup[] }> = [
    { status: 'aprobada', groups: grouped.APPROVED || [] },
    { status: 'pendiente', groups: grouped.PENDING || [] },
    { status: 'cancelada', groups: grouped.CANCELLED || [] },
    { status: 'finalizada', groups: grouped.FINISHED || [] },
  ];

  const result: Ticket[] = [];
  buckets.forEach(({ status, groups }) => {
    groups.forEach((group) => {
      const tickets = collectTicketsFromGroup(group);
      if (tickets.length) {
        tickets.forEach((t, idx) => {
          const orderRef = resolveOrderRef(t, group);
          const order = (group.orders || []).find(
            (o) => (o.order_id || o.id) === orderRef,
          ) || group.order;
          const orderUserId = (order as { user_id?: string } | undefined)?.user_id;
          result.push(ticketWithOrderExpiry({
            ...ticketFromApi(t, group, idx, orderUserId, order),
            status,
          }, order, status));
        });
      } else if (countTicketsInGroup(group) > 0) {
        const orders = group.orders || (group.order ? [group.order] : []);
        orders.forEach((order, orderIdx) => {
          const orderUserId = (order as { user_id?: string }).user_id;
          const orderAny = order as UserTicketOrder & { created_at?: string; order_date?: string; display_order_id?: string };
          const purchaseDate = formatDate(
            orderAny.order_date || orderAny.created_at || (order.metadata?.created_at as string | undefined),
          );
          (order.tickets || []).forEach((rawTicket, ticketIdx) => {
            const withRef: TicketWithOrderRef = {
              ...rawTicket,
              orderRef: order.order_id || order.id || order.metadata?.reference || '',
              paymentStatus: order.payment_status || order.status,
            };
            result.push(ticketWithOrderExpiry({
              ...ticketFromApi(withRef, group, orderIdx * 100 + ticketIdx, orderUserId, order),
              status,
              orderDate: purchaseDate || formatDate(group.eventDate),
              orderNumber: formatDisplayOrderId(
                order.order_id || order.id || '',
                orderAny.display_order_id || order.metadata?.reference,
              ),
            }, order, status));
          });
        });
      } else {
        const orders = group.orders || (group.order ? [group.order] : []);
        let added = false;
        orders.forEach((order, orderIdx) => {
          const orderId = order.order_id || order.id;
          if (!orderId || (order.tickets?.length || 0) > 0) return;
          if (status !== 'pendiente') return;
          added = true;
          result.push(buildPendingOrderTicket(order, group, orderIdx));
        });
        if (!added && group.eventId) {
        result.push({
          id: `${group.eventId}-${status}`,
          orderNumber: '—',
          orderDate: formatDate(group.eventDate),
          eventTitle: group.eventName || 'Evento',
          eventImage: resolveEventImageUrl(group.eventImage) || '',
          eventDate: formatDate(group.eventDate),
          startTime: group.eventTime || '',
          category: 'General',
          seat: '—',
          entrance: '—',
          qrCode: '',
          status,
          eventId: group.eventId,
        });
        }
      }
    });
  });
  return result;
}

/** Completa categoryColor desde el inventario del evento cuando la orden no lo trajo. */
export async function enrichTicketsCategoryColors(tickets: Ticket[]): Promise<Ticket[]> {
  const missing = tickets.filter((t) => {
    const color = String(t.categoryColor || '').trim();
    return Boolean(t.eventId && t.category) && !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color);
  });
  const eventIds = [...new Set(missing.map((t) => String(t.eventId)))];
  if (!eventIds.length) return tickets;

  const colorMaps = await Promise.all(
    eventIds.map(async (eventId) => {
      const seats = await fetchAvailableSeats(eventId).catch(() => null);
      const map = new Map<string, string>();
      (seats?.categories || []).forEach((cat) => {
        const hex = String(cat.categoryColor || '').trim();
        if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
          map.set(String(cat.categoryName || '').trim().toLocaleLowerCase(), hex);
        }
      });
      return [eventId, map] as const;
    }),
  );
  const byEvent = new Map(colorMaps);

  return tickets.map((ticket) => {
    const existing = String(ticket.categoryColor || '').trim();
    if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(existing) || !ticket.eventId) return ticket;
    const resolved = byEvent
      .get(String(ticket.eventId))
      ?.get(String(ticket.category || '').trim().toLocaleLowerCase());
    return resolved ? { ...ticket, categoryColor: resolved } : ticket;
  });
}

export function groupTicketsForListView(tickets: Ticket[]): Ticket[] {
  return groupTicketsByEventForListView(tickets).map((eventGroup) => ({
    ...eventGroup.representativeTicket,
    eventTicketCount: eventGroup.ticketCount,
    orderCount: eventGroup.orderCount,
  }));
}

export interface TicketOrderSummary {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  tickets: Ticket[];
  ticketCount: number;
}

export interface TicketEventListGroup {
  id: string;
  eventId: string;
  eventTitle: string;
  eventImage: string;
  eventVideo?: string;
  eventDate: string;
  startTime: string;
  status: TicketStatus;
  ticketCount: number;
  orderCount: number;
  orders: TicketOrderSummary[];
  representativeTicket: Ticket;
}

function resolveOrderSortTs(orderDate: string): number {
  if (!orderDate) return 0;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(orderDate)) {
    const [day, month, year] = orderDate.split('/');
    const parsed = new Date(Number(year), Number(month) - 1, Number(day)).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  const parsed = new Date(orderDate).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Agrupa boletas por evento; dentro de cada evento conserva las órdenes y sus boletas. */
export function groupTicketsByEventForListView(tickets: Ticket[]): TicketEventListGroup[] {
  const eventMap = new Map<string, TicketEventListGroup>();

  tickets.forEach((ticket) => {
    const eventKey = `${ticket.status}::${ticket.eventId || ticket.eventTitle}`;
    let eventGroup = eventMap.get(eventKey);
    if (!eventGroup) {
      eventGroup = {
        id: eventKey,
        eventId: ticket.eventId || ticket.eventTitle,
        eventTitle: ticket.eventTitle,
        eventImage: ticket.eventImage,
        eventVideo: ticket.eventVideo,
        eventDate: ticket.eventDate,
        startTime: ticket.startTime,
        status: ticket.status,
        ticketCount: 0,
        orderCount: 0,
        orders: [],
        representativeTicket: ticket,
      };
      eventMap.set(eventKey, eventGroup);
    }

    if (!eventGroup.eventImage && ticket.eventImage) eventGroup.eventImage = ticket.eventImage;
    if (!eventGroup.eventVideo && ticket.eventVideo) eventGroup.eventVideo = ticket.eventVideo;

    const rawOrderId = ticket.orderId || ticket.orderRef || '';
    const orderKey = rawOrderId || `event:${eventGroup.eventId}`;
    let order = eventGroup.orders.find((entry) => entry.orderId === orderKey);
    if (!order) {
      order = {
        orderId: orderKey,
        orderNumber: rawOrderId ? ticket.orderNumber || rawOrderId : 'Orden sin referencia',
        orderDate: ticket.orderDate,
        tickets: [],
        ticketCount: 0,
      };
      eventGroup.orders.push(order);
    }

    order.tickets.push(ticket);
    if (!ticket.isTransferred) {
      order.ticketCount += 1;
      eventGroup.ticketCount += 1;
    }
  });

  return Array.from(eventMap.values())
    .map((group) => ({
      ...group,
      orderCount: group.orders.length,
      orders: [...group.orders].sort(
        (a, b) => resolveOrderSortTs(b.orderDate) - resolveOrderSortTs(a.orderDate),
      ),
    }))
    .sort((a, b) => resolveOrderSortTs(b.eventDate) - resolveOrderSortTs(a.eventDate));
}

/** Recupera órdenes PENDING activas que no llegaron en el listado agrupado (p. ej. tras recargar). */
export async function recoverMissingPendingTickets(
  userId: string,
  tickets: Ticket[],
): Promise<Ticket[]> {
  const pendingOrderIds = new Set(
    tickets
      .filter((t) => t.status === 'pendiente')
      .map((t) => t.orderId || t.orderRef)
      .filter(Boolean) as string[],
  );

  const reservations = listStoredReservationsForUser(userId);
  const missingReservations = reservations.filter((r) => !pendingOrderIds.has(r.orderId));

  const recovered: Ticket[] = [];
  for (const reservation of missingReservations) {
    const order = await fetchOrderById(reservation.orderId).catch(() => null);
    const paymentStatus = String(order?.payment_status || '').toUpperCase();
    if (!order || (paymentStatus && paymentStatus !== 'PENDING')) continue;

    const expiresAtTs = resolveOrderExpiresAtTs(order) || reservation.expiresAtTs;
    if (!expiresAtTs || expiresAtTs <= Date.now()) continue;

    saveStoredReservation({
      ...reservation,
      expiresAtTs,
      expiresAtIso: order.expires_at,
      totalAmount: order.total_amount,
      ticketCount: order.tickets?.length || reservation.ticketCount,
    });

    const orderId = order.order_id || reservation.orderId;
    pendingOrderIds.add(orderId);

    const detail = await fetchEventDetail(reservation.eventId).catch(() => null);
    const eventTitle = detail?.event?.nombre || 'Evento';
    const eventImage = resolveEventImageUrl(
      detail?.images?.[0] || detail?.event?.imagen,
    ) || '';
    const fechaIni = detail?.event?.fechaIni;
    const eventDate = fechaIni && fechaIni.length >= 8
      ? `${fechaIni.substring(6, 8)}/${fechaIni.substring(4, 6)}/${fechaIni.substring(0, 4)}`
      : '';
    const group: TicketEventGroup = {
      eventId: reservation.eventId,
      eventName: eventTitle,
      eventImage,
      eventDate,
      eventTime: detail?.event?.horaIni || '',
    };

    const orderTickets = order.tickets || [];
    if (orderTickets.length) {
      orderTickets.forEach((rawTicket, ticketIdx) => {
        const withRef: TicketWithOrderRef = {
          ...rawTicket,
          orderRef: orderId,
          paymentStatus: 'PENDING',
        };
        recovered.push({
          ...ticketFromApi(withRef, group, ticketIdx, userId, order),
          status: 'pendiente',
          orderId,
          orderRef: orderId,
          paymentExpiresAtTs: expiresAtTs,
        });
      });
    } else {
      recovered.push({
        ...buildPendingOrderTicket(
          { ...order, order_id: orderId, payment_status: 'PENDING' },
          group,
          0,
        ),
        paymentExpiresAtTs: expiresAtTs,
        eventTitle,
        eventImage,
        eventDate,
        startTime: group.eventTime || '',
      });
    }
  }

  const flatOrders = await fetchUserTickets(userId).catch(() => []);
  for (const order of flatOrders) {
    const paymentStatus = String(order.payment_status || order.status || '').toUpperCase();
    if (paymentStatus !== 'PENDING') continue;

    const orderId = String(order.order_id || order.id || '');
    if (!orderId || pendingOrderIds.has(orderId)) continue;

    const expiresAtTs = resolveOrderExpiresAtTs(order);
    if (!expiresAtTs || expiresAtTs <= Date.now()) continue;

    const eventId = String(
      order.event_id || order.metadata?.eventId || order.metadata?.event_id || '',
    );
    if (!eventId) continue;

    pendingOrderIds.add(orderId);
    saveStoredReservation({
      orderId,
      eventId,
      userId,
      expiresAtTs,
      expiresAtIso: order.expires_at,
      totalAmount: order.total_amount,
      ticketCount: order.tickets?.length,
    });

    const detail = await fetchEventDetail(eventId).catch(() => null);
    const group: TicketEventGroup = {
      eventId,
      eventName: detail?.event?.nombre || String(order.metadata?.eventName || 'Evento'),
      eventImage: resolveEventImageUrl(detail?.images?.[0] || detail?.event?.imagen) || '',
      eventDate: '',
      eventTime: detail?.event?.horaIni || '',
    };

    const orderTickets = order.tickets || [];
    if (orderTickets.length) {
      orderTickets.forEach((rawTicket, ticketIdx) => {
        recovered.push({
          ...ticketFromApi(
            {
              ...rawTicket,
              orderRef: orderId,
              paymentStatus: 'PENDING',
            },
            group,
            ticketIdx,
            userId,
            order,
          ),
          status: 'pendiente',
          orderId,
          orderRef: orderId,
          paymentExpiresAtTs: expiresAtTs,
        });
      });
    } else {
      recovered.push({
        ...buildPendingOrderTicket(order, group, 0),
        paymentExpiresAtTs: expiresAtTs,
      });
    }
  }

  return recovered.length ? [...tickets, ...recovered] : tickets;
}

export function ticketHasSeat(ticket: Ticket): boolean {
  const seat = ticket.seatLabel || ticket.seat || '';
  if (!seat || seat === '—') return false;
  return !/general|admisi[oó]n/i.test(seat);
}

export function ticketsToBoletaEntries(tickets: Ticket[]): BoletaEntry[] {
  return tickets.map((t, i) => {
    const id = t.ticketInstanceId || t.id || `ticket-${i}`;
    const code = (t.seatLabel || t.seat || `A${i + 1}`).replace(/^Silla\s*-?\s*/i, '');
    return {
      id,
      code,
      date: t.eventDate || t.orderDate,
      qrData: t.qrCode || id,
      qrUrl: t.qrUrl,
      value: typeof t.price === 'number' ? t.price : 0,
      ticketInstanceId: t.ticketInstanceId || t.id || id,
      seatLabel: t.seatLabel || (t.seat !== '—' ? t.seat : undefined),
      category: t.category,
    };
  });
}

function mapTicketStatusToPayment(status: Ticket['status']): string {
  if (status === 'pendiente') return 'PENDING';
  if (status === 'cancelada') return 'CANCELLED';
  if (status === 'finalizada') return 'FINISHED';
  return 'APPROVED';
}

export function lovableTicketsToOrderRefs(tickets: Ticket[]): TicketWithOrderRef[] {
  return tickets.map((ticket) => ({
    ticket_id: ticket.ticketInstanceId || ticket.id,
    ticketInstanceId: ticket.ticketInstanceId || ticket.id,
    id: ticket.ticketInstanceId || ticket.id,
    category: ticket.category,
    seatLabel: ticket.seatLabel || ticket.seat,
    seat_code: ticket.seatLabel || ticket.seat,
    qr_code: ticket.qrCode,
    qr_url: ticket.qrUrl,
    price: ticket.price,
    orderRef: ticket.orderId || ticket.orderRef,
    paymentStatus: mapTicketStatusToPayment(ticket.status),
    transfer_status: ticket.isTransferred && !ticket.qrUrl && !ticket.qrCode
      ? 'TRANSFERRED'
      : undefined,
    transferred_from: ticket.isTransferred && ticket.qrUrl
      ? { transferred_at: ticket.transferredAt }
      : undefined,
  }));
}

export function countTicketsByStatus(tickets: Ticket[]): Record<TicketStatus, number> {
  return {
    aprobada: tickets.filter((t) => t.status === 'aprobada').length,
    pendiente: tickets.filter((t) => t.status === 'pendiente').length,
    cancelada: tickets.filter((t) => t.status === 'cancelada').length,
    finalizada: tickets.filter((t) => t.status === 'finalizada').length,
  };
}
