import type { EventChatRoom } from './chatData';

export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processed';
export type RefundPolicyType = 'days_1' | 'days_7' | 'days_30' | 'case_by_case' | 'no_refund';
export type RefundPayer = 'platform' | 'organizer';
export type PaymentTiming = 'pre_event' | 'post_event';
export type RefundSource = 'user_request' | 'event_cancellation';
/** Motivo libre proveniente del backend (no mock). */
export type RefundReason = string;

export interface RefundTicket {
  category: string;
  row: string;
  seat: number;
  amount: number;
}

export interface RefundRequest {
  id: string;
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAvatar?: string;
  requestDate: string;
  eventDate: string;
  daysBeforeEvent: number;
  tickets: RefundTicket[];
  totalAmount: number;
  reason: RefundReason;
  comment?: string;
  status: RefundStatus;
  policyLimitDays: number;
  policyType: RefundPolicyType;
  withinPolicy: boolean;
  paymentTiming: PaymentTiming;
  payer: RefundPayer;
  requiresOrganizerReview: boolean;
  resolutionDeadline: string;
  businessDaysRemaining: number;
  isOverdue: boolean;
  source: RefundSource;
}

/** Normaliza a Date local a medianoche; null si la entrada es inválida. */
function toLocalMidnight(input: string | Date): Date | null {
  const d = typeof input === 'string'
    ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(input) ? `${input}T00:00:00` : input)
    : new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Suma N días hábiles (lunes a viernes) a una fecha ISO */
export const addBusinessDays = (isoDate: string, days: number): Date => {
  const d = toLocalMidnight(isoDate) ?? new Date();
  d.setHours(0, 0, 0, 0);
  let added = 0;
  let guard = 0;
  const target = Math.max(0, Math.floor(days));
  while (added < target && guard < 400) {
    d.setDate(d.getDate() + 1);
    guard += 1;
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d;
};

/** Días hábiles entre hoy y la fecha límite (negativo si vencida) */
export const businessDaysUntil = (deadline: Date): number => {
  const today = toLocalMidnight(new Date());
  const target = toLocalMidnight(deadline);
  if (!today || !target) return 0;
  if (target.getTime() === today.getTime()) return 0;
  const dir = target > today ? 1 : -1;
  let count = 0;
  const cur = new Date(today);
  let guard = 0;
  while (cur.getTime() !== target.getTime() && guard < 4000) {
    cur.setDate(cur.getDate() + dir);
    guard += 1;
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count += dir;
  }
  return count;
};

export const REFUND_RESOLUTION_BUSINESS_DAYS = 5;

export interface EventRefundsData {
  eventId: string;
  eventName: string;
  currency: string;
  policyLabel: string;
  policyLimitDays: number;
  policyType: RefundPolicyType;
  requests: RefundRequest[];
}

/**
 * Determina quién asume el reembolso según las reglas de negocio:
 * - Si la política es "caso a caso": siempre lo gestiona el organizador.
 * - Si la solicitud está dentro de los tiempos (1/7/30 días) Y el pago fue post-evento: lo asume la plataforma.
 * - En cualquier otro caso (dentro de tiempo pero pago pre-evento, o fuera de tiempo): lo asume el organizador.
 */
export const resolveRefundPayer = (
  policyType: RefundPolicyType,
  withinPolicy: boolean,
  paymentTiming: PaymentTiming,
): { payer: RefundPayer; requiresOrganizerReview: boolean } => {
  if (policyType === 'case_by_case') {
    return { payer: 'organizer', requiresOrganizerReview: true };
  }
  if (policyType === 'no_refund') {
    return { payer: 'organizer', requiresOrganizerReview: true };
  }
  if (withinPolicy && paymentTiming === 'post_event') {
    return { payer: 'platform', requiresOrganizerReview: false };
  }
  return { payer: 'organizer', requiresOrganizerReview: false };
};

/** Placeholder vacío — sin datos mock. Usado solo como estado inicial de carga. */
export const getEmptyEventRefundsData = (event: EventChatRoom): EventRefundsData => ({
  eventId: event.eventId || event.id || '',
  eventName: event.eventName || '',
  currency: 'COP',
  policyLabel: 'Según política del evento',
  policyLimitDays: 0,
  policyType: 'days_7',
  requests: [],
});
