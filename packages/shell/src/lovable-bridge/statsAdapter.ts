import {
  fetchEventAccessStatistics,
  fetchEventBuyers,
  fetchEventInvitationStatistics,
  fetchEventRefundsForEvent,
  fetchEventSalesStatistics,
  resolveDisplayEventStatus,
  resolveEventImageUrl,
  type EventBuyerRecord,
  type UserEventItem,
} from '@doevents/shared';
import type { EventChatRoom, EventStatus } from '@lovable/data/chatData';
import type { EventSalesData, CategorySales, SeatInfo } from '@lovable/data/salesStatsData';
import type { AccessControlData, CategoryAccessData, GateData, SeatAccessInfo } from '@lovable/data/accessControlData';
import type { GuestInfo, GuestStatsData } from '@lovable/data/guestStatsData';
import type { EventRefundsData, RefundReason, RefundRequest, RefundSource } from '@lovable/data/refundsData';

function emptySalesData(event: EventChatRoom): EventSalesData {
  return {
    eventId: event.eventId || event.id || '',
    eventName: event.eventName,
    venueName: '',
    currency: 'COP',
    categories: [],
  };
}

function emptyGuestStats(): GuestStatsData {
  return {
    channels: [],
    avgDeliveryRate: 0,
    avgOpenRate: 0,
    avgConversionRate: 0,
    totalConfirmations: 0,
  };
}

export function getEmptySalesData(event: EventChatRoom): EventSalesData {
  return emptySalesData(event);
}

export function getEmptyGuestStats(): GuestStatsData {
  return emptyGuestStats();
}

export function getEmptyAccessData(): AccessControlData {
  return emptyAccessData();
}

export function getEmptyRefundsData(event: EventChatRoom): EventRefundsData {
  return emptyRefundsData(event);
}

function emptyAccessData(): AccessControlData {
  return {
    totalTickets: 0,
    accessGranted: 0,
    attendance: 0,
    denials: 0,
    currentInside: 0,
    accessStatus: { valid: 0, invalid: 0, duplicate: 0 },
    gates: [],
    trafficByType: [],
    attendeesByType: [],
    categoryAccess: [],
  };
}

function emptyRefundsData(event: EventChatRoom): EventRefundsData {
  return {
    eventId: event.eventId || event.id || '',
    eventName: event.eventName,
    policyType: 'days_1',
    policyLabel: '1 día antes',
    requests: [],
    summary: {
      pending: 0,
      approved: 0,
      rejected: 0,
      pendingAmount: 0,
      processedAmount: 0,
    },
  };
}

const CHANNEL_ICONS: Record<string, 'whatsapp' | 'mail' | 'campaign' | 'push'> = {
  whatsapp: 'whatsapp',
  mail: 'mail',
  email: 'mail',
  campaign: 'campaign',
  sms: 'campaign',
  push: 'push',
  manual: 'campaign',
  'in-app campaign': 'campaign',
  inapp: 'campaign',
};
const CATEGORY_COLORS = [
  { color: 'bg-primary', colorHex: '#6979F8' },
  { color: 'bg-emerald-500', colorHex: '#10b981' },
  { color: 'bg-amber-500', colorHex: '#f59e0b' },
  { color: 'bg-rose-500', colorHex: '#f43f5e' },
];

const COMMISSION_RATE = 0.05;

function parseSeatParts(entry: { row?: string; seat?: string | number }): { row: string; number: number } {
  const rawSeat = entry.seat != null ? String(entry.seat) : '';
  const rawRow = entry.row || '';
  const combined = `${rawRow}${rawSeat}`.trim();
  const match = combined.match(/^([A-Za-z]+)\s*(\d+)?$/);
  if (match) {
    return {
      row: match[1].toUpperCase(),
      number: Number(match[2] || rawSeat || 1) || 1,
    };
  }
  if (rawRow) {
    return { row: rawRow.toUpperCase(), number: Number(rawSeat) || 1 };
  }
  return { row: 'G', number: Number(rawSeat) || 1 };
}

function buyerEntryToSeat(buyer: EventBuyerRecord, entry: NonNullable<EventBuyerRecord['entradas']>[number], index: number): SeatInfo {
  const amount = Number(entry.precio || buyer.totalComprado || buyer.amount || 0);
  const commission = Math.round(amount * COMMISSION_RATE);
  const { row, number } = parseSeatParts(entry);
  const timing = String(buyer.paymentTimingBucket || '').toUpperCase();
  const purchaseDate = entry.fecha_compra || buyer.fecha_compra || buyer.purchaseDate;

  return {
    row,
    number: number || index + 1,
    sold: true,
    buyerName: buyer.nombre || buyer.buyerName,
    buyerPhone: buyer.phone || buyer.buyerPhone,
    buyerEmail: buyer.email || buyer.buyerEmail,
    purchaseDate: purchaseDate ? String(purchaseDate).slice(0, 10) : undefined,
    paymentAuthorization: timing === 'POST_EVENT' ? 'after' : 'before',
    amountPaid: amount,
    platformCommission: commission,
    totalWithCommission: amount + commission,
  };
}

function mapBuyersToCategorySeats(buyers: EventBuyerRecord[], categoryName: string): SeatInfo[] {
  const seats: SeatInfo[] = [];
  buyers.forEach((buyer) => {
    const entries = buyer.entradas?.length
      ? buyer.entradas
      : [{
          categoria: buyer.category || 'General',
          precio: buyer.amount || buyer.totalComprado,
          fecha_compra: buyer.fecha_compra || buyer.purchaseDate,
          seat: buyer.seat,
        }];

    entries.forEach((entry, idx) => {
      const cat = entry.categoria || buyer.category || 'General';
      if (cat !== categoryName) return;
      seats.push(buyerEntryToSeat(buyer, entry, seats.length + idx));
    });
  });
  return seats;
}

function parsePercent(value: string | number | undefined, fallback: number): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return Math.round(value);
  if (value == null || value === '') return fallback;
  const parsed = parseFloat(String(value).replace('%', '').trim());
  return Number.isNaN(parsed) ? fallback : Math.round(parsed);
}

function formatEventDateLabel(fechaIni?: string): string {
  if (!fechaIni) return '—';
  if (/^\d{8}$/.test(fechaIni)) {
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${fechaIni.slice(6, 8)} ${months[Number(fechaIni.slice(4, 6)) - 1] || ''} ${fechaIni.slice(0, 4)}`;
  }
  const d = new Date(fechaIni);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  return fechaIni;
}

function mapEventStatus(estatus?: string): EventStatus {
  const raw = String(estatus || '').toLowerCase();
  if (raw === 'ejecucion' || raw === 'en_ejecucion') return 'en_ejecucion';
  if (raw === 'finalizado') return 'finalizado';
  if (raw === 'cancelado') return 'cancelado';
  return 'activo';
}

export function userEventsToStatsRooms(events: UserEventItem[]): EventChatRoom[] {
  return events.map((ev) => ({
    id: ev.id,
    eventId: ev.id,
    eventName: ev.nombre || 'Evento',
    eventImage: resolveEventImageUrl(ev.imagen) || undefined,
    eventDate: formatEventDateLabel(ev.fechaIni),
    eventTime: ev.horaIni,
    eventDescription: ev.descripcion,
    eventStatus: mapEventStatus(resolveDisplayEventStatus({
      estatus: ev.estatus,
      fechaIni: ev.fechaIni,
      fechaFin: ev.fechaFin,
      horaIni: ev.horaIni,
      horaFin: ev.horaFin,
    })),
    lastMessage: '',
    lastMessageTime: '',
    unreadCount: 0,
    attendees: [],
    messages: [],
  }));
}

export async function resolveSalesData(event: EventChatRoom): Promise<EventSalesData> {
  const eventId = event.eventId || event.id;
  const empty = emptySalesData(event);
  if (!eventId) return empty;

  const [stats, buyers] = await Promise.all([
    fetchEventSalesStatistics(eventId),
    fetchEventBuyers(eventId).catch(() => [] as EventBuyerRecord[]),
  ]);
  if (!stats) return empty;

  const capacity = stats.boletosDisponibles != null
    ? stats.boletosVendidos + stats.boletosDisponibles
    : stats.boletosVendidos;

  const categories: CategorySales[] = (stats.categorias || []).map((cat, i) => {
    const palette = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
    const sold = cat.vendidos || 0;
    const total = cat.disponibles != null ? sold + (cat.disponibles || 0) : (capacity || sold);
    const categorySeats = mapBuyersToCategorySeats(buyers, cat.nombre);
    return {
      name: cat.nombre,
      color: palette.color,
      colorHex: palette.colorHex,
      total: total || sold,
      sold,
      available: Math.max(0, (total || sold) - sold),
      occupancy: total > 0 ? Math.round((sold / total) * 100) : 0,
      revenue: cat.netoVendido || 0,
      seats: categorySeats,
    };
  });

  if (!categories.length && stats.boletosVendidos > 0) {
    categories.push({
      name: 'General',
      color: CATEGORY_COLORS[0].color,
      colorHex: CATEGORY_COLORS[0].colorHex,
      total: capacity || stats.boletosVendidos,
      sold: stats.boletosVendidos,
      available: Math.max(0, (capacity || stats.boletosVendidos) - stats.boletosVendidos),
      occupancy: capacity > 0 ? Math.round((stats.boletosVendidos / capacity) * 100) : 0,
      revenue: stats.totalVentas || 0,
      seats: [],
    });
  }

  return {
    eventId,
    eventName: event.eventName,
    venueName: '',
    currency: 'COP',
    categories,
  };
}

function channelIconFromName(name: string): 'whatsapp' | 'mail' | 'campaign' | 'push' {
  const key = name.toLowerCase().trim();
  if (key.includes('whatsapp')) return 'whatsapp';
  if (key.includes('email') || key.includes('mail')) return 'mail';
  if (key.includes('push')) return 'push';
  return CHANNEL_ICONS[key] || 'campaign';
}

function channelNameMatches(inviteeChannels: string[], channelName: string): boolean {
  const target = channelName.toLowerCase().trim();
  return inviteeChannels.some((c) => {
    const raw = String(c || '').toLowerCase().trim();
    return raw === target || raw.includes(target) || target.includes(raw);
  });
}

function mapInviteeToGuest(inv: Record<string, unknown>): GuestInfo {
  return {
    name: String(inv.nombre || inv.nombreCompleto || inv.email || 'Invitado'),
    avatar: String(inv.avatar || ''),
    confirmed: Boolean(inv.comproBoleta),
    email: inv.email ? String(inv.email) : undefined,
    phone: inv.phone ? String(inv.phone) : undefined,
  };
}

function mapTicketAccessStatus(raw?: string, scanned?: boolean): SeatAccessInfo['accessStatus'] {
  const status = String(raw || '').toUpperCase();
  if (scanned || status === 'VALID' || status === 'SUCCESS') return 'granted';
  if (['INVALID', 'ALREADYUSED', 'DUPLICATE', 'DENIED', 'WRONGEVENT'].includes(status)) return 'denied';
  if (status === 'NOT_SCANNED' || !status) return 'pending';
  return 'pending';
}

function mapGateStatus(granted: number, denied: number): GateData['status'] {
  if (denied > granted) return 'Alerta';
  if (granted > 0 && denied <= granted * 0.1) return 'Óptimo';
  return 'Normal';
}

function mapBoletasToCategoryAccess(
  boletas: Array<Record<string, unknown>>,
): CategoryAccessData[] {
  const grouped = new Map<string, CategoryAccessData>();

  boletas.forEach((ticket, index) => {
    const name = String(ticket.categoria || 'General');
    const palette = CATEGORY_COLORS[grouped.size % CATEGORY_COLORS.length];
    if (!grouped.has(name)) {
      grouped.set(name, {
        name,
        color: palette.color,
        colorHex: palette.colorHex,
        total: 0,
        granted: 0,
        denied: 0,
        pending: 0,
        seats: [],
      });
    }
    const cat = grouped.get(name)!;
    cat.total += 1;
    const accessStatus = mapTicketAccessStatus(
      String(ticket.statusAcceso || ''),
      Boolean(ticket.scanned),
    );
    if (accessStatus === 'granted') cat.granted += 1;
    else if (accessStatus === 'denied') cat.denied += 1;
    else cat.pending += 1;

    const seatRaw = ticket.seat != null ? String(ticket.seat) : '';
    const { row, number } = parseSeatParts({ row: seatRaw.slice(0, 1), seat: seatRaw.slice(1) || index + 1 });
    cat.seats.push({
      row: row || 'G',
      number,
      sold: true,
      accessStatus,
      buyerName: ticket.comprador ? String(ticket.comprador) : undefined,
    });
  });

  return Array.from(grouped.values());
}

function mapRefundStatus(raw: string): RefundRequest['status'] {
  const s = raw.toUpperCase();
  if (s === 'COMPLETED' || s === 'PROCESSED') return 'processed';
  if (s === 'APPROVED') return 'approved';
  if (s === 'REJECTED') return 'rejected';
  return 'pending';
}

function mapRefundSource(raw?: string): RefundSource {
  const s = String(raw || '').toUpperCase();
  if (s === 'USER_REQUEST') return 'user_request';
  return 'event_cancellation';
}

function mapRefundRecord(
  r: Record<string, unknown>,
  eventDateLabel: string,
): RefundRequest {
  const status = mapRefundStatus(String(r.refundStatus || r.status || 'PENDING'));
  const createdAt = String(r.createdAt || new Date().toISOString());
  const requestDate = createdAt.slice(0, 10);
  const instances = Array.isArray(r.ticketInstances) ? r.ticketInstances : [];
  const tickets = instances.map((t: Record<string, unknown>, i: number) => {
    const seatParts = parseSeatParts({ row: String(t.row || ''), seat: t.seat as string | number | undefined });
    return {
      category: String(t.category || t.categoria || 'General'),
      row: seatParts.row,
      seat: seatParts.number || i + 1,
      amount: Number(t.amount || t.precio || r.refundAmount || 0),
    };
  });
  const totalAmount = Number(r.refundAmount || r.refund_amount || r.originalTotal || 0);
  const buyerName = String(
    r.buyerName || r.userName || r.nombre || `Comprador ${String(r.userId || '').slice(0, 8)}`,
  );

  return {
    id: String(r.id || r.refundId || Math.random()),
    orderId: String(r.orderId || '—'),
    buyerName,
    buyerEmail: String(r.buyerEmail || r.email || ''),
    buyerPhone: String(r.buyerPhone || r.phone || ''),
    buyerAvatar: r.buyerAvatar ? String(r.buyerAvatar) : undefined,
    requestDate,
    eventDate: eventDateLabel,
    daysBeforeEvent: 0,
    tickets,
    totalAmount,
    reason: (String(r.reason || 'Otro') as RefundReason),
    comment: r.comment ? String(r.comment) : undefined,
    status,
    policyLimitDays: 7,
    policyType: 'days_7',
    withinPolicy: status !== 'rejected',
    paymentTiming: 'pre_event',
    payer: 'platform',
    requiresOrganizerReview: false,
    resolutionDeadline: requestDate,
    businessDaysRemaining: 5,
    isOverdue: false,
    source: mapRefundSource(String(r.refundSource || '')),
  };
}

export async function resolveGuestStatsData(event: EventChatRoom) {
  const empty = emptyGuestStats();
  const eventId = event.eventId || event.id;
  if (!eventId) return empty;

  const stats = await fetchEventInvitationStatistics(eventId);
  if (!stats) return empty;

  if (!stats.canales?.length) {
    return {
      channels: [],
      totalConfirmations: stats.totalConfirmados ?? 0,
      avgDeliveryRate: parsePercent(stats.deliveryRateAvg, 0),
      avgOpenRate: parsePercent(stats.openRateAvg, 0),
      avgConversionRate: parsePercent(stats.conversionRateAvg, 0),
    };
  }

  const invitees = (stats.invitadosDetalle || []) as Array<Record<string, unknown>>;

  const channels = stats.canales.map((ch, i) => {
    const sent = ch.enviados || 0;
    const delivered = ch.delivered ?? ch.entregados ?? 0;
    const opened = ch.opened ?? ch.abiertos ?? 0;
    const clicked = ch.clicked ?? ch.clics ?? 0;
    const confirmed = ch.confirmados || 0;
    const conversionRate = parsePercent(
      ch.conversionRate,
      sent > 0 ? Math.round((confirmed / sent) * 100) : 0,
    );
    const channelName = ch.nombre || ch.canal || `Canal ${i + 1}`;
    const channelGuests = invitees
      .filter((inv) => channelNameMatches(
        Array.isArray(inv.canales) ? inv.canales.map(String) : [],
        channelName,
      ))
      .map(mapInviteeToGuest);

    return {
      id: `ch-${i}`,
      name: channelName,
      icon: channelIconFromName(channelName),
      sent,
      confirmedCount: confirmed,
      conversionRate,
      guests: channelGuests,
      funnel: [
        { label: 'Enviados', value: sent, percentage: 100 },
        { label: 'Entregados', value: delivered, percentage: sent > 0 ? Math.round((delivered / sent) * 100) : 0 },
        { label: 'Abiertos', value: opened, percentage: delivered > 0 ? Math.round((opened / delivered) * 100) : 0 },
        { label: 'Clics', value: clicked, percentage: opened > 0 ? Math.round((clicked / opened) * 100) : 0 },
        { label: 'Confirmados', value: confirmed, percentage: clicked > 0 ? Math.round((confirmed / clicked) * 100) : 0 },
      ],
    };
  });

  // Invitados sin canal explícito en agregados
  if (!channels.length && invitees.length > 0) {
    channels.push({
      id: 'ch-all',
      name: 'Todas las invitaciones',
      icon: 'campaign' as const,
      sent: stats.totalEnviados || invitees.length,
      confirmedCount: stats.totalConfirmados || 0,
      conversionRate: parsePercent(stats.conversionRateAvg, 0),
      guests: invitees.map(mapInviteeToGuest),
      funnel: [
        { label: 'Enviados', value: stats.totalEnviados || invitees.length, percentage: 100 },
        { label: 'Entregados', value: stats.totalDelivered || 0, percentage: 0 },
        { label: 'Abiertos', value: stats.totalOpened || 0, percentage: 0 },
        { label: 'Clics', value: stats.totalClicked || 0, percentage: 0 },
        { label: 'Confirmados', value: stats.totalConfirmados || 0, percentage: 0 },
      ],
    });
  }

  return {
    channels,
    avgDeliveryRate: parsePercent(stats.deliveryRateAvg, 0),
    avgOpenRate: parsePercent(stats.openRateAvg, 0),
    avgConversionRate: parsePercent(stats.conversionRateAvg, 0),
    totalConfirmations: stats.totalConfirmados ?? 0,
  };
}

export async function resolveAccessData(event: EventChatRoom) {
  const empty = emptyAccessData();
  const eventId = event.eventId || event.id;
  if (!eventId) return empty;

  const stats = await fetchEventAccessStatistics(eventId);
  if (!stats) return empty;

  const attendance = parseInt(String(stats.porcentajeAsistencia || '0').replace('%', ''), 10) || 0;
  const estados = (stats as { estadosAcceso?: { VALID?: number; INVALID?: number; DUPLICATE?: number } }).estadosAcceso;

  const attendeesByType = (stats.asistentesAlEvento || []).map((row) => ({
    type: row.categoria,
    grantedCount: row.asistidos || 0,
    attendees: (row.asistentes || []).map((a) => ({
      name: a.nombre,
      avatar: a.avatar || '',
      status: (a.estado === 'ASISTIO' ? 'granted' : 'denied') as 'granted' | 'denied' | 'pending',
    })),
  }));

  const gates: GateData[] = ((stats as { estadoAccesoPorPuerta?: Array<Record<string, unknown>> }).estadoAccesoPorPuerta || []).map((row) => {
    const granted = Number(row.concedidos || 0);
    const denied = Number(row.denegados || 0);
  const totalAttempts = Number(row.totalIntentos || granted + denied);
    const pctRaw = String(row.porcentaje || '0').replace('%', '');
    return {
      name: String(row.puerta || 'Sin puerta'),
      totalAttempts,
      granted,
      denied,
      percentage: parseInt(pctRaw, 10) || (totalAttempts > 0 ? Math.round((granted / totalAttempts) * 100) : 0),
      status: mapGateStatus(granted, denied),
    };
  });

  const categoryAccess = mapBoletasToCategoryAccess(
    (stats.boletasDetalle || []) as Array<Record<string, unknown>>,
  );

  const trafficRows = stats.traficoTipoBleta || [];
  const trafficByType = trafficRows.map((t) => ({
    type: t.categoria,
    granted: t.escaneados || 0,
    denied: Math.max(0, (t as { denegados?: number }).denegados ?? ((t.total || 0) - (t.escaneados || 0))),
  }));

  return {
    totalTickets: stats.totalBoletos || 0,
    accessGranted: stats.accesosConcedidos || 0,
    attendance,
    denials: stats.denegaciones || 0,
    currentInside: stats.dentroActual || 0,
    accessStatus: {
      valid: estados?.VALID || stats.accesosConcedidos || 0,
      invalid: estados?.INVALID || stats.denegaciones || 0,
      duplicate: estados?.DUPLICATE || 0,
    },
    gates,
    attendeesByType,
    trafficByType,
    categoryAccess,
  };
}

export async function resolveRefundsData(event: EventChatRoom) {
  const empty = emptyRefundsData(event);
  const eventId = event.eventId || event.id;
  if (!eventId) return empty;

  const groups = await fetchEventRefundsForEvent(eventId);
  const group = groups?.[0];
  if (!group) return empty;

  const eventDateLabel = event.eventDate || '—';
  const requests: RefundRequest[] = (group.refunds || []).map((r) =>
    mapRefundRecord(r as Record<string, unknown>, eventDateLabel),
  );

  if (!requests.length) {
    return {
      ...empty,
      eventName: group.eventName || event.eventName,
      summary: {
        pending: group.pendingCount ?? 0,
        approved: 0,
        rejected: group.rejectedCount ?? 0,
        pendingAmount: group.pendingAmount ?? 0,
        processedAmount: group.completedAmount ?? 0,
      },
    };
  }

  const pending = requests.filter((r) => r.status === 'pending').length;
  const approved = requests.filter((r) => r.status === 'approved').length;
  const rejected = requests.filter((r) => r.status === 'rejected').length;
  const processed = requests.filter((r) => r.status === 'processed').length;

  return {
    eventId,
    eventName: group.eventName || event.eventName,
    policyType: 'days_7' as const,
    policyLabel: 'Según política del evento',
    requests,
    summary: {
      pending,
      approved: approved + processed,
      rejected,
      pendingAmount: group.pendingAmount ?? requests
        .filter((r) => r.status === 'pending')
        .reduce((s, r) => s + r.totalAmount, 0),
      processedAmount: group.completedAmount ?? requests
        .filter((r) => r.status === 'processed' || r.status === 'approved')
        .reduce((s, r) => s + r.totalAmount, 0),
    },
  };
}
