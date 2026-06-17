import type { EventChatRoom } from '@lovable/data/chatData';

export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processed';
export type RefundPolicyType = 'days_1' | 'days_7' | 'days_30' | 'case_by_case' | 'no_refund';
export type RefundPayer = 'platform' | 'organizer';
export type PaymentTiming = 'pre_event' | 'post_event';
export type RefundSource = 'user_request' | 'event_cancellation';
export type RefundReason =
  | 'No puedo asistir'
  | 'Cambio de planes'
  | 'Problema de salud'
  | 'Evento no cumplió expectativas'
  | 'Compra duplicada'
  | 'Otro';

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
  requestDate: string;        // ISO date
  eventDate: string;          // display date
  daysBeforeEvent: number;    // computed
  tickets: RefundTicket[];
  totalAmount: number;
  reason: RefundReason;
  comment?: string;
  status: RefundStatus;
  policyLimitDays: number;    // política del evento (1, 7, 30...)
  policyType: RefundPolicyType;
  withinPolicy: boolean;
  paymentTiming: PaymentTiming; // pago pre o post evento
  payer: RefundPayer;           // quién asume el reembolso
  requiresOrganizerReview: boolean; // true en caso a caso
  resolutionDeadline: string;   // fecha límite (5 días hábiles desde requestDate)
  businessDaysRemaining: number; // negativo si está vencida
  isOverdue: boolean;
  source: RefundSource;          // 'user_request' o 'event_cancellation'
}

/** Suma N días hábiles (lunes a viernes) a una fecha ISO */
export const addBusinessDays = (isoDate: string, days: number): Date => {
  const d = new Date(isoDate + 'T00:00:00');
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d;
};

/** Días hábiles entre hoy y la fecha límite (negativo si vencida) */
export const businessDaysUntil = (deadline: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(deadline);
  target.setHours(0, 0, 0, 0);
  if (target.getTime() === today.getTime()) return 0;
  const dir = target > today ? 1 : -1;
  let count = 0;
  const cur = new Date(today);
  while (cur.getTime() !== target.getTime()) {
    cur.setDate(cur.getDate() + dir);
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

const BUYERS = [
  { name: 'María López',    email: 'maria.lopez@mail.com',    phone: '+57 300 123 4567' },
  { name: 'Carlos Gómez',   email: 'carlos.gomez@mail.com',   phone: '+57 310 234 5678' },
  { name: 'Ana Martínez',   email: 'ana.martinez@mail.com',   phone: '+57 320 345 6789' },
  { name: 'Juan Pérez',     email: 'juan.perez@mail.com',     phone: '+57 315 456 7890' },
  { name: 'Laura Díaz',     email: 'laura.diaz@mail.com',     phone: '+57 301 567 8901' },
  { name: 'Pedro Ruiz',     email: 'pedro.ruiz@mail.com',     phone: '+57 311 678 9012' },
  { name: 'Sofía Torres',   email: 'sofia.torres@mail.com',   phone: '+57 321 789 0123' },
  { name: 'Diego Castro',   email: 'diego.castro@mail.com',   phone: '+57 316 890 1234' },
];

const REASONS: RefundReason[] = [
  'No puedo asistir',
  'Cambio de planes',
  'Problema de salud',
  'Evento no cumplió expectativas',
  'Compra duplicada',
  'Otro',
];

const CATEGORIES = [
  { name: 'VIP',       price: 150000 },
  { name: 'Palco',     price: 700000 },
  { name: 'Terraza',   price: 450000 },
  { name: 'General',   price: 80000  },
];

const STATUSES: RefundStatus[] = ['pending', 'approved', 'rejected', 'processed'];

const ROWS = ['A', 'B', 'C', 'D'];

const POLICY_LABELS: Record<RefundPolicyType, { label: string; days: number }> = {
  days_1:       { label: 'Hasta 1 día antes del inicio del evento',   days: 1 },
  days_7:       { label: 'Hasta 7 días antes del inicio del evento',  days: 7 },
  days_30:      { label: 'Hasta 30 días antes del inicio del evento', days: 30 },
  case_by_case: { label: 'Se evalúa caso a caso por el organizador',  days: 0 },
  no_refund:    { label: 'Sin reembolsos',                            days: 0 },
};

export const generateMockRefundsData = (
  event: EventChatRoom,
  policyType: RefundPolicyType = 'days_1',
): EventRefundsData => {
  const { label: policyLabel, days: policyLimitDays } = POLICY_LABELS[policyType];
  const requests: RefundRequest[] = [];
  const count = 9;

  for (let i = 0; i < count; i++) {
    const buyer = BUYERS[i % BUYERS.length];
    const ticketCount = (i % 3) + 1;
    const cat = CATEGORIES[i % CATEGORIES.length];
    const tickets: RefundTicket[] = Array.from({ length: ticketCount }).map((_, k) => ({
      category: cat.name,
      row: ROWS[k % ROWS.length],
      seat: ((i + k) % 12) + 1,
      amount: cat.price,
    }));
    const totalAmount = tickets.reduce((s, t) => s + t.amount, 0);
    const daysBeforeEvent = [0, 1, 2, 5, 8, 14, 22, 1, 3][i] ?? (i + 1);
    const requestDate = new Date(Date.now() - (i + 1) * 86400000).toISOString().slice(0, 10);
    const withinPolicy = policyType === 'case_by_case'
      ? true
      : policyType === 'no_refund'
        ? false
        : daysBeforeEvent >= policyLimitDays;
    // Selección de status: garantizamos al menos un caso "rejected" fuera de
    // política. Con política por defecto (1 día), i === 0 (daysBeforeEvent = 0)
    // queda fuera de política y por tanto puede ser rechazado válidamente.
    let status: RefundStatus = STATUSES[i % STATUSES.length];
    if (!withinPolicy && i === 0) status = 'rejected';
    // Garantiza al menos una solicitud pendiente dentro de política visible
    if (i === 5 && withinPolicy) status = 'pending';
    // Alterna pago pre/post evento para simulación
    const paymentTiming: PaymentTiming = i % 2 === 0 ? 'post_event' : 'pre_event';
    const { payer, requiresOrganizerReview } = resolveRefundPayer(policyType, withinPolicy, paymentTiming);
    const deadlineDate = addBusinessDays(requestDate, REFUND_RESOLUTION_BUSINESS_DAYS);
    const resolutionDeadline = deadlineDate.toISOString().slice(0, 10);
    const businessDaysRemaining = businessDaysUntil(deadlineDate);
    const isOverdue = businessDaysRemaining < 0 && (status === 'pending' || status === 'approved');
    // Las primeras 3 solicitudes son por cancelación de evento, el resto por solicitud de usuario
    const source: RefundSource = i < 3 ? 'event_cancellation' : 'user_request';

    requests.push({
      id: `RF-${1000 + i}`,
      orderId: `ORD-${5000 + i}`,
      buyerName: buyer.name,
      buyerEmail: buyer.email,
      buyerPhone: buyer.phone,
      requestDate,
      eventDate: event.eventDate,
      daysBeforeEvent,
      tickets,
      totalAmount,
      reason: REASONS[i % REASONS.length],
      comment: i % 2 === 0 ? 'Solicito reembolso por motivos personales.' : undefined,
      status,
      policyLimitDays,
      policyType,
      withinPolicy,
      paymentTiming,
      payer,
      requiresOrganizerReview,
      resolutionDeadline,
      businessDaysRemaining,
      isOverdue,
      source,
    });
  }

  return {
    eventId: event.id,
    eventName: event.eventName,
    currency: 'COP',
    policyLabel,
    policyLimitDays,
    policyType,
    requests,
  };
};
