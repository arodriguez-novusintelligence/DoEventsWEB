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

export interface EventRefundsData {
  eventId: string;
  eventName: string;
  currency: string;
  policyLabel: string;
  policyLimitDays: number;
  policyType: RefundPolicyType;
  requests: RefundRequest[];
}
import type { EventChatRoom } from './chatData';

export const generateMockRefundsData = (
  event: EventChatRoom,
  policyType: RefundPolicyType = 'days_1',
): EventRefundsData => ({
  eventId: event.id,
  eventName: event.eventName,
  currency: 'COP',
  policyLabel: '',
  policyLimitDays: 0,
  policyType,
  requests: [],
});
