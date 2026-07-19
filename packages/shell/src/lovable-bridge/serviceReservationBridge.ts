import type { NavigateFunction } from 'react-router-dom';
import type { ServiceAdditionalBookingItem, UserServiceBooking } from '@doevents/shared';

export function buildServicePaymentNavigation(
  navigate: NavigateFunction,
  payload: {
    orderId: string;
    bookingId: string;
    totalAmount: number;
    expiredAtTs: number;
    startDate: string;
    endDate: string;
    serviceId: string;
    serviceName: string;
    additionalServices?: ServiceAdditionalBookingItem[];
    days?: number;
    currency?: string;
  },
) {
  navigate(`/orders/${encodeURIComponent(payload.orderId)}/confirm`, {
    state: {
      order: {
        order_id: payload.orderId,
        total_amount: payload.totalAmount,
        expired_at_ts: payload.expiredAtTs,
        payment_status: 'PENDING',
        metadata: {
          orderType: 'SERVICE_RENTAL',
          serviceId: payload.serviceId,
          serviceName: payload.serviceName,
          bookingId: payload.bookingId,
          startDate: payload.startDate,
          endDate: payload.endDate,
          additionalServices: payload.additionalServices,
        },
      },
      serviceId: payload.serviceId,
      serviceName: payload.serviceName,
      bookingId: payload.bookingId,
      orderType: 'service',
      startDate: payload.startDate,
      endDate: payload.endDate,
      days: payload.days,
      currency: payload.currency,
    },
  });
}

export function resumeServicePaymentNavigation(
  navigate: NavigateFunction,
  booking: UserServiceBooking,
) {
  const expiredAtTs = booking.expired_at_ts && booking.expired_at_ts > Date.now()
    ? booking.expired_at_ts
    : Date.now() + 15 * 60 * 1000;

  buildServicePaymentNavigation(navigate, {
    orderId: booking.orderId,
    bookingId: booking.bookingId,
    totalAmount: booking.pricing?.total ?? 0,
    expiredAtTs,
    startDate: booking.startDate,
    endDate: booking.endDate || booking.startDate,
    serviceId: booking.serviceId,
    serviceName: booking.serviceName,
    additionalServices: booking.additionalServices,
    days: booking.pricing?.numDays,
    currency: 'COP',
  });
}
