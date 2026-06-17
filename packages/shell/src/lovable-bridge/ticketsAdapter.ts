import type {
  GroupedUserTickets,
  TicketEventGroup,
  TicketWithOrderRef,
} from '@doevents/shared';
import {
  collectTicketsFromGroup,
  countTicketsInGroup,
  resolveEventImageUrl,
} from '@doevents/shared';
import type { Ticket, TicketStatus } from '@lovable/data/ticketsData';
import type { BoletaEntry } from '@lovable/components/tickets/TransferTicketFlow';
import { parseSeatLabel } from './venueToFigures';

function mapPaymentStatus(status?: string): TicketStatus {
  const raw = String(status || '').toLowerCase();
  if (raw.includes('pending') || raw.includes('pend')) return 'pendiente';
  if (raw.includes('cancel') || raw.includes('reject')) return 'cancelada';
  if (raw.includes('finish') || raw.includes('final') || raw.includes('complete')) return 'finalizada';
  return 'aprobada';
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
  const raw = ticket.seatLabel || ticket.seat_code || '';
  if (!raw) return '';
  const parsed = parseSeatLabel(raw);
  return parsed || raw.replace(/^Silla\s*-?\s*/i, '').trim();
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

function ticketFromApi(
  ticket: TicketWithOrderRef,
  group: TicketEventGroup,
  index: number,
): Ticket {
  const orderRef = resolveOrderRef(ticket, group);
  const seatRaw = ticket.seatLabel || ticket.seat_code || '';
  const seatLabel = resolveSeatLabel(ticket);
  const instanceId = resolveTicketInstanceId(ticket, index, group);
  return {
    id: instanceId,
    orderNumber: orderRef ? String(orderRef).slice(-6).toUpperCase() : '—',
    orderDate: formatDate(group.eventDate),
    eventTitle: group.eventName || 'Evento',
    eventImage: resolveEventImageUrl(group.eventImage) || '',
    eventDate: formatDate(group.eventDate),
    startTime: group.eventTime || '',
    category: ticket.category || 'General',
    seat: seatRaw || '—',
    seatLabel: seatLabel || undefined,
    entrance: resolveEntrance(ticket),
    qrCode: ticket.qr_code || ticket.qrCodeKey || instanceId,
    qrUrl: ticket.qr_url || undefined,
    orderRef: orderRef || undefined,
    orderId: orderRef || undefined,
    ticketInstanceId: instanceId,
    price: typeof ticket.price === 'number' ? ticket.price : undefined,
    status: mapPaymentStatus(ticket.paymentStatus || ticket.status),
    eventId: group.eventId,
  };
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
        tickets.forEach((t, idx) => result.push({ ...ticketFromApi(t, group, idx), status }));
      } else if (countTicketsInGroup(group) > 0) {
        const orders = group.orders || (group.order ? [group.order] : []);
        orders.forEach((order, orderIdx) => {
          (order.tickets || []).forEach((rawTicket, ticketIdx) => {
            const withRef: TicketWithOrderRef = {
              ...rawTicket,
              orderRef: order.order_id || order.id || order.metadata?.reference || '',
              paymentStatus: order.payment_status || order.status,
            };
            result.push({
              ...ticketFromApi(withRef, group, orderIdx * 100 + ticketIdx),
              status,
            });
          });
        });
      } else if (countTicketsInGroup(group) === 0 && group.eventId) {
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
    });
  });
  return result;
}

export function groupTicketsForListView(tickets: Ticket[]): Ticket[] {
  const map = new Map<string, Ticket>();
  tickets.forEach((ticket) => {
    const orderKey = ticket.orderId || ticket.orderRef || '';
    const key = `${ticket.status}::${orderKey || ticket.eventId || ticket.eventTitle}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...ticket, eventTicketCount: 1 });
      return;
    }
    const count = (existing.eventTicketCount || 1) + 1;
    map.set(key, {
      ...existing,
      eventTicketCount: count,
      eventImage: existing.eventImage || ticket.eventImage,
      eventVideo: existing.eventVideo || ticket.eventVideo,
      orderId: existing.orderId || ticket.orderId,
      orderRef: existing.orderRef || ticket.orderRef,
    });
  });
  return Array.from(map.values());
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
