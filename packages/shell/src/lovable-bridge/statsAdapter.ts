import {
  fetchEventAccessStatistics,
  fetchEventBuyers,
  fetchEventInvitationStatistics,
  fetchEventRefundsForEvent,
  fetchEventSalesStatistics,
  fetchAvailableSeats,
  resolveDisplayEventStatus,
  resolveEventImageUrl,
  resolveSeatLabel,
  type AvailableSeat,
  type EventBuyerRecord,
  type TicketCategory,
  type UserEventItem,
} from '@doevents/shared';
import type { EventChatRoom, EventStatus } from '@lovable/data/chatData';
import type { EventSalesData, CategorySales, SeatInfo } from '@lovable/data/salesStatsData';
import type { AccessControlData, CategoryAccessData, GateData, SeatAccessInfo } from '@lovable/data/accessControlData';
import type { GuestInfo, GuestStatsData } from '@lovable/data/guestStatsData';
import {
  addBusinessDays,
  businessDaysUntil,
  REFUND_RESOLUTION_BUSINESS_DAYS,
  resolveRefundPayer,
  type EventRefundsData,
  type PaymentTiming,
  type RefundPolicyType,
  type RefundReason,
  type RefundRequest,
  type RefundSource,
  type RefundTicket,
} from '@lovable/data/refundsData';

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
    currency: 'COP',
    policyType: 'days_1',
    policyLabel: 'Hasta 1 día antes del inicio del evento',
    policyLimitDays: 1,
    requests: [],
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
  const cleaned = combined
    .replace(/silla\s*-?\s*/i, '')
    .replace(/asiento\s*-?\s*/i, '')
    .replace(/fila\s*-?\s*/i, '')
    .trim();
  const match = cleaned.match(/([A-Za-z]+)\s*[-\s]?(\d+)/);
  if (match) {
    return {
      row: match[1].toUpperCase(),
      number: Number(match[2]) || 1,
    };
  }
  if (rawRow) {
    return { row: rawRow.toUpperCase(), number: Number(rawSeat) || 1 };
  }
  return { row: 'G', number: Number(rawSeat) || 1 };
}

function seatKey(row: string, number: number): string {
  return `${String(row || '').toUpperCase()}${number}`;
}

function sortSeats(seats: SeatInfo[]): SeatInfo[] {
  return [...seats].sort((a, b) => {
    const rowCmp = a.row.localeCompare(b.row, 'es');
    if (rowCmp !== 0) return rowCmp;
    return a.number - b.number;
  });
}

function mergeInventoryAndSoldSeats(
  inventorySeats: AvailableSeat[],
  soldSeats: SeatInfo[],
): SeatInfo[] {
  const soldMap = new Map<string, SeatInfo>();
  const unmatchedBuyers: SeatInfo[] = [];
  soldSeats.forEach((seat) => {
    const key = seatKey(seat.row, seat.number);
    // Labels genéricas (G1…) no coinciden con el mapa: se asignan después a sillas SOLD.
    if (!seat.row || seat.row === 'G') {
      unmatchedBuyers.push(seat);
      return;
    }
    if (!soldMap.has(key)) soldMap.set(key, seat);
    else unmatchedBuyers.push(seat);
  });

  const result: SeatInfo[] = [];
  const seen = new Set<string>();
  const usedBuyerKeys = new Set<string>();

  inventorySeats.forEach((seat) => {
    const label = resolveSeatLabel(seat);
    if (!label) return;
    const parts = parseSeatParts({ seat: label });
    const key = seatKey(parts.row, parts.number);
    if (seen.has(key)) return;
    seen.add(key);
    const sold = soldMap.get(key);
    if (sold) {
      usedBuyerKeys.add(key);
      result.push({ ...sold, row: parts.row, number: parts.number, sold: true });
      return;
    }
    const status = String(seat.ticketStatus || '').toUpperCase();
    const isSold = status === 'SOLD' || status === 'USED' || status === 'RESERVED';
    result.push({
      row: parts.row,
      number: parts.number,
      sold: isSold,
    });
  });

  soldMap.forEach((seat, key) => {
    if (!seen.has(key)) {
      result.push(seat);
      usedBuyerKeys.add(key);
    }
  });

  const leftoverBuyers = [
    ...unmatchedBuyers,
    ...[...soldMap.entries()]
      .filter(([key]) => !usedBuyerKeys.has(key) && !seen.has(key))
      .map(([, seat]) => seat),
  ];

  // Rellenar sillas marcadas vendidas sin comprador (orden sin seatLabel legible).
  result.forEach((seat, idx) => {
    if (!seat.sold || seat.buyerName || !leftoverBuyers.length) return;
    const buyer = leftoverBuyers.shift()!;
    result[idx] = {
      ...buyer,
      row: seat.row,
      number: seat.number,
      sold: true,
    };
  });

  return sortSeats(result);
}

function synthesizeSeatGrid(soldSeats: SeatInfo[], total: number): SeatInfo[] {
  if (total <= 0) return sortSeats(soldSeats);
  if (soldSeats.length >= total) return sortSeats(soldSeats.slice(0, total));

  const byKey = new Map(soldSeats.map((s) => [seatKey(s.row, s.number), s]));
  const rows = [...new Set(soldSeats.map((s) => s.row).filter(Boolean))].sort();
  const rowLetters = rows.length ? rows : ['A', 'B', 'C', 'D'];
  const cols = Math.max(5, Math.ceil(total / rowLetters.length));
  const result: SeatInfo[] = [];

  for (const row of rowLetters) {
    for (let n = 1; n <= cols; n += 1) {
      if (result.length >= total) break;
      const key = seatKey(row, n);
      result.push(byKey.get(key) || { row, number: n, sold: false });
      byKey.delete(key);
    }
    if (result.length >= total) break;
  }

  byKey.forEach((seat) => {
    if (result.length < total) result.push(seat);
  });

  return sortSeats(result).slice(0, Math.max(total, soldSeats.length));
}

function resolveCategoryHex(
  categoryName: string,
  inventoryCats: TicketCategory[],
  fallbackHex: string,
): string {
  const normalized = String(categoryName || '').trim().toLocaleLowerCase();
  const match = inventoryCats.find(
    (cat) => String(cat.categoryName || '').trim().toLocaleLowerCase() === normalized,
  );
  const color = match?.categoryColor;
  if (color && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) return color;
  return fallbackHex;
}

function inventorySeatsForCategory(
  categoryName: string,
  inventoryCats: TicketCategory[],
): AvailableSeat[] {
  const normalized = String(categoryName || '').trim().toLocaleLowerCase();
  return inventoryCats
    .filter((cat) => String(cat.categoryName || '').trim().toLocaleLowerCase() === normalized)
    .flatMap((cat) => cat.seats || []);
}

function buyerEntryToSeat(buyer: EventBuyerRecord, entry: NonNullable<EventBuyerRecord['entradas']>[number], index: number): SeatInfo {
  const amount = Number(entry.precio || buyer.totalComprado || buyer.amount || 0);
  const commission = Math.round(amount * COMMISSION_RATE);
  const seatRaw = entry.seatLabel || entry.seat || buyer.seat;
  const { row, number } = parseSeatParts({
    row: entry.row,
    seat: seatRaw,
  });
  const timing = String(buyer.paymentTimingBucket || '').toUpperCase();
  const purchaseDate = entry.fecha_compra || buyer.fecha_compra || buyer.purchaseDate;
  const statusLabel = String(buyer.statusPago || '').trim();
  const isPaid = Boolean(buyer.isApproved)
    || /pagado/i.test(statusLabel)
    || ['APPROVED', 'PAID', 'SOLD', 'FINISHED', 'COMPLETED'].includes(
      String(buyer.rawStatus || entry.status || '').toUpperCase(),
    );
  const paymentAuthorization: 'before' | 'after' =
    timing === 'POST_EVENT' || /post-evento/i.test(statusLabel) ? 'after' : 'before';

  let purchaseDateIso: string | undefined;
  if (purchaseDate) {
    const d = new Date(purchaseDate);
    purchaseDateIso = Number.isNaN(d.getTime())
      ? String(purchaseDate).slice(0, 10)
      : d.toISOString().slice(0, 10);
  }

  return {
    row,
    number: number || index + 1,
    sold: true,
    buyerName: buyer.nombre || buyer.buyerName || 'Comprador',
    buyerPhone: buyer.phone || buyer.buyerPhone || undefined,
    buyerEmail: buyer.email || buyer.buyerEmail || undefined,
    purchaseDate: purchaseDateIso,
    paymentAuthorization,
    paymentStatusLabel: statusLabel || undefined,
    isPaid: paymentAuthorization === 'after' ? false : isPaid,
    amountPaid: amount,
    platformCommission: commission,
    totalWithCommission: amount + commission,
  };
}

function mapBuyersToCategorySeats(buyers: EventBuyerRecord[], categoryName: string): SeatInfo[] {
  const seats: SeatInfo[] = [];
  const normalizedCategory = String(categoryName || '').trim().toLocaleLowerCase();
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
      if (String(cat || '').trim().toLocaleLowerCase() !== normalizedCategory) return;
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
    eventDescription: ev.ciudad || ev.direccion || ev.descripcion,
    eventStatus: mapEventStatus(resolveDisplayEventStatus({
      estatus: ev.estatus,
      fechaIni: ev.fechaIni,
      fechaFin: ev.fechaFin,
      horaIni: ev.horaIni,
      horaFin: ev.horaFin,
    })),
    ticketsSold: ev.ticketsAprobados ?? 0,
    salesRevenue: ev.amountCentsAprobados ?? 0,
    promoCodesRedeemed: ev.codigosPromoRedimidos ?? 0,
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

  const [stats, buyers, seatsResponse] = await Promise.all([
    fetchEventSalesStatistics(eventId, { forceNetwork: true }),
    fetchEventBuyers(eventId, { limit: 500, forceNetwork: true }).catch(() => [] as EventBuyerRecord[]),
    fetchAvailableSeats(eventId).catch(() => null),
  ]);
  if (!stats) return empty;

  const inventoryCats = seatsResponse?.categories || [];
  const capacity = stats.boletosDisponibles != null
    ? stats.boletosVendidos + stats.boletosDisponibles
    : stats.boletosVendidos;

  const categories: CategorySales[] = (stats.categorias || []).map((cat, i) => {
    const palette = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
    const sold = cat.vendidos || 0;
    const inventory = inventorySeatsForCategory(cat.nombre, inventoryCats);
    const inventoryTotal = inventory.length;
    const total = inventoryTotal > 0
      ? inventoryTotal
      : (cat.disponibles != null ? sold + (cat.disponibles || 0) : (capacity || sold));
    const soldSeats = mapBuyersToCategorySeats(buyers, cat.nombre);
    const seats = inventory.length
      ? mergeInventoryAndSoldSeats(inventory, soldSeats)
      : synthesizeSeatGrid(soldSeats, total || sold);
    const colorHex = resolveCategoryHex(cat.nombre, inventoryCats, palette.colorHex);
    return {
      name: cat.nombre,
      color: palette.color,
      colorHex,
      total: total || sold,
      sold,
      available: Math.max(0, (total || sold) - sold),
      occupancy: total > 0 ? Math.round((sold / total) * 100) : 0,
      revenue: cat.netoVendido || 0,
      seats,
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
    eventName: stats.eventName || event.eventName,
    venueName: stats.venueName || event.eventDescription || '',
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

    const seatObj = ticket.seat && typeof ticket.seat === 'object'
      ? (ticket.seat as Record<string, unknown>)
      : null;
    const seatLabel = seatObj
      ? String(seatObj.seatLabel || seatObj.seat || '')
      : (ticket.seat != null ? String(ticket.seat) : '');
    const rowLabel = seatObj
      ? String(seatObj.rowLabel || seatObj.row || seatLabel.slice(0, 1) || 'G')
      : seatLabel.slice(0, 1);
    const seatNumber = seatObj?.colNumber ?? (seatLabel.replace(/^[A-Za-z]+/, '') || index + 1);
    const { row, number } = parseSeatParts({ row: rowLabel, seat: seatNumber as string | number });
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
  if (s === 'USER_REQUEST' || s === 'ORDER_CANCELLED') return 'user_request';
  return 'event_cancellation';
}

function mapPolicyType(raw?: string): RefundPolicyType {
  const s = String(raw || '').toLowerCase();
  if (s === 'days_1' || s === '1') return 'days_1';
  if (s === 'days_30' || s === '30') return 'days_30';
  if (s === 'case_by_case' || s === '0') return 'case_by_case';
  if (s === 'no_refund' || s === 'n') return 'no_refund';
  return 'days_7';
}

function mapTicketInstances(
  raw: unknown,
  fallbackAmount: number,
): RefundTicket[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return fallbackAmount > 0
      ? [{ category: 'General', row: '—', seat: 1, amount: fallbackAmount }]
      : [];
  }

  return raw.map((entry, i) => {
    if (typeof entry === 'string' || typeof entry === 'number') {
      return {
        category: 'General',
        row: '—',
        seat: i + 1,
        amount: fallbackAmount,
      };
    }
    const t = (entry || {}) as Record<string, unknown>;
    const seatObj = t.seat && typeof t.seat === 'object' ? (t.seat as Record<string, unknown>) : null;
    const row = String(t.row || seatObj?.rowLabel || '—');
    const seatNum = Number(t.seatNumber ?? seatObj?.colNumber ?? (typeof t.seat === 'number' ? t.seat : i + 1)) || i + 1;
    return {
      category: String(t.category || t.categoria || 'General'),
      row,
      seat: seatNum,
      amount: Number(t.amount || t.precio || t.price || t.total_amount || fallbackAmount) || 0,
    };
  });
}

function mapRefundRecord(
  r: Record<string, unknown>,
  eventDateLabel: string,
  groupPolicy?: {
    policyType?: string;
    policyLabel?: string;
    policyLimitDays?: number;
  },
): RefundRequest {
  const status = mapRefundStatus(String(r.refundStatus || r.status || 'PENDING'));
  const createdAt = String(r.createdAt || new Date().toISOString());
  const requestDate = createdAt.slice(0, 10);
  const totalAmount = Number(r.refundAmount || r.refund_amount || r.originalTotal || 0);
  const tickets = mapTicketInstances(r.ticketInstances || r.ticket_instances, totalAmount);
  const ticketSum = tickets.reduce((s, t) => s + t.amount, 0);
  const amount = totalAmount || ticketSum;

  const buyerName = String(
    r.buyerName || r.userName || r.nombre || `Comprador ${String(r.userId || '').slice(0, 8)}`,
  );
  const buyerEmail = String(r.buyerEmail || r.email || '—');
  const buyerPhoneRaw = String(r.buyerPhone || r.phone || '').trim();
  const buyerPhone = !buyerPhoneRaw || buyerPhoneRaw.toLowerCase() === 'n/a' ? '—' : buyerPhoneRaw;

  const policyType = mapPolicyType(String(r.policyType || groupPolicy?.policyType || 'days_7'));
  const policyLimitDays = Number(
    r.policyLimitDays ?? groupPolicy?.policyLimitDays ?? (policyType === 'days_1' ? 1 : policyType === 'days_30' ? 30 : 7),
  );
  const withinPolicy = r.withinPolicy != null
    ? Boolean(r.withinPolicy)
    : status !== 'rejected';
  const paymentTiming: PaymentTiming = String(r.paymentTiming || '').toLowerCase().includes('post')
    ? 'post_event'
    : 'pre_event';
  const payerFromApi = String(r.payer || r.assumedBy || '').toLowerCase();
  const resolvedPayer = payerFromApi.includes('platform') || payerFromApi.includes('plataform')
    ? { payer: 'platform' as const, requiresOrganizerReview: Boolean(r.requiresOrganizerReview) }
    : payerFromApi.includes('org')
      ? { payer: 'organizer' as const, requiresOrganizerReview: Boolean(r.requiresOrganizerReview) }
      : resolveRefundPayer(policyType, withinPolicy, paymentTiming);

  const safeRequestDate = /^\d{4}-\d{2}-\d{2}$/.test(requestDate)
    ? requestDate
    : new Date().toISOString().slice(0, 10);
  const deadlineDate = addBusinessDays(safeRequestDate, REFUND_RESOLUTION_BUSINESS_DAYS);
  const resolutionDeadline = Number.isNaN(deadlineDate.getTime())
    ? safeRequestDate
    : deadlineDate.toISOString().slice(0, 10);
  const businessDaysRemaining = businessDaysUntil(deadlineDate);
  const isOverdue = businessDaysRemaining < 0 && (status === 'pending' || status === 'approved');

  return {
    id: String(r.id || r.refundId || `${r.orderId || 'rf'}-${safeRequestDate}`),
    orderId: String(r.orderId || '—'),
    buyerName,
    buyerEmail,
    buyerPhone,
    buyerAvatar: r.buyerAvatar ? String(r.buyerAvatar) : undefined,
    requestDate: safeRequestDate,
    eventDate: eventDateLabel,
    daysBeforeEvent: Number(r.daysBeforeEvent || 0),
    tickets: tickets.length ? tickets : [{ category: 'General', row: '—', seat: 1, amount }],
    totalAmount: amount,
    reason: (String(r.reason || 'Otro') as RefundReason),
    comment: r.comment ? String(r.comment) : undefined,
    status,
    policyLimitDays,
    policyType,
    withinPolicy,
    paymentTiming,
    payer: resolvedPayer.payer,
    requiresOrganizerReview: resolvedPayer.requiresOrganizerReview || Boolean(r.requiresOrganizerReview),
    resolutionDeadline,
    businessDaysRemaining,
    isOverdue,
    source: mapRefundSource(String(r.refundSource || '')),
  };
}

export async function resolveGuestStatsData(event: EventChatRoom) {
  const empty = emptyGuestStats();
  const eventId = event.eventId || event.id;
  if (!eventId) return empty;

  const stats = await fetchEventInvitationStatistics(eventId);
  if (!stats) return empty;

  const invitees = (stats.invitadosDetalle || []) as Array<Record<string, unknown>>;
  if (!stats.canales?.length) {
    if (invitees.length) {
      const confirmed = invitees.filter((inv) => Boolean(inv.comproBoleta)).length;
      return {
        channels: [{
          id: 'ch-all',
          name: 'Todas las invitaciones',
          icon: 'campaign' as const,
          sent: stats.totalEnviados || invitees.length,
          confirmedCount: stats.totalConfirmados ?? confirmed,
          conversionRate: parsePercent(stats.conversionRateAvg, invitees.length > 0 ? Math.round((confirmed / invitees.length) * 100) : 0),
          guests: invitees.map(mapInviteeToGuest),
          funnel: [
            { label: 'Enviados', value: stats.totalEnviados || invitees.length, percentage: 100 },
            { label: 'Entregados', value: stats.totalDelivered || 0, percentage: 0 },
            { label: 'Abiertos', value: stats.totalOpened || 0, percentage: 0 },
            { label: 'Clics', value: stats.totalClicked || 0, percentage: 0 },
            { label: 'Confirmados', value: stats.totalConfirmados ?? confirmed, percentage: 0 },
          ],
        }],
        totalConfirmations: stats.totalConfirmados ?? confirmed,
        avgDeliveryRate: parsePercent(stats.deliveryRateAvg, 0),
        avgOpenRate: parsePercent(stats.openRateAvg, 0),
        avgConversionRate: parsePercent(stats.conversionRateAvg, 0),
      };
    }
    return {
      channels: [],
      totalConfirmations: stats.totalConfirmados ?? 0,
      avgDeliveryRate: parsePercent(stats.deliveryRateAvg, 0),
      avgOpenRate: parsePercent(stats.openRateAvg, 0),
      avgConversionRate: parsePercent(stats.conversionRateAvg, 0),
    };
  }

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
    attendees: (row.asistentes || []).map((a) => {
      const estado = String(a.estado || '').toUpperCase();
      const status: 'granted' | 'denied' | 'pending' =
        estado === 'ASISTIO' || estado === 'GRANTED'
          ? 'granted'
          : estado === 'DENIED' || estado === 'DENEGADO'
            ? 'denied'
            : 'pending';
      return {
        name: a.nombre,
        avatar: a.avatar || '',
        status,
      };
    }),
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

export async function resolveRefundsData(event: EventChatRoom): Promise<EventRefundsData> {
  const empty = emptyRefundsData(event);
  const eventId = event.eventId || event.id;
  if (!eventId) return empty;

  try {
    const groups = await fetchEventRefundsForEvent(eventId);
    const group = (groups || []).find(
      (g) => String(g.eventId || g.reservationId || '') === String(eventId),
    ) || groups?.[0];

    if (!group) return empty;

    const eventDateLabel = event.eventDate || group.eventStartDate || '—';
    const groupPolicy = {
      policyType: String((group as { policyType?: string }).policyType || ''),
      policyLabel: String((group as { policyLabel?: string }).policyLabel || ''),
      policyLimitDays: Number((group as { policyLimitDays?: number }).policyLimitDays || 0),
    };
    const requests: RefundRequest[] = (group.refunds || []).map((r) =>
      mapRefundRecord(r as Record<string, unknown>, eventDateLabel, groupPolicy),
    );

    const policyType = mapPolicyType(groupPolicy.policyType || requests[0]?.policyType || 'days_7');
    const policyLimitDays = groupPolicy.policyLimitDays ||
      requests[0]?.policyLimitDays ||
      (policyType === 'days_1' ? 1 : policyType === 'days_30' ? 30 : policyType === 'case_by_case' || policyType === 'no_refund' ? 0 : 7);
    const policyLabel = groupPolicy.policyLabel
      || String((group.refunds?.[0] as { policyLabel?: string } | undefined)?.policyLabel || '')
      || 'Según política del evento';

    return {
      eventId,
      eventName: group.eventName || event.eventName,
      currency: 'COP',
      policyType,
      policyLabel,
      policyLimitDays,
      requests,
    };
  } catch (err) {
    console.warn('[resolveRefundsData] error cargando reembolsos:', err);
    return empty;
  }
}
