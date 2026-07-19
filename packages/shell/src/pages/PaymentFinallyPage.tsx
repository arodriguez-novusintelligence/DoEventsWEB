import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  confirmProSubscription,
  confirmTicketPayment,
  fetchOrderById,
  getWompiTransaction,
  invalidateProfileHeaderCache,
  invalidateEventsCache,
  invalidateDiscoverCache,
  isAuthenticated,
  Loader,
  redeemEventPromoCode,
  RootState,
  resolveWompiPaymentError,
  useToast,
} from '@doevents/shared';
import { loadOrderIsReferred } from '@lovable/components/checkout/OrganizerPaymentAuthView';

const PENDING_PAYMENT_REF_KEY = 'doevents_pending_payment_ref';

export const PaymentFinallyPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando tu pago…');

  useEffect(() => {
    const reference = params.get('reference')
      || params.get('order_id')
      || params.get('orderId')
      || sessionStorage.getItem(PENDING_PAYMENT_REF_KEY)
      || '';
    const wompiStatus = (
      params.get('status')
      || params.get('transaction_status')
      || params.get('payment_status')
      || ''
    ).toUpperCase();
    const transactionId = params.get('transaction_id')
      || params.get('id_tx')
      || params.get('transactionId')
      || params.get('id')
      || '';
    const freeCheckout = params.get('freeCheckout') === 'true';

    if (!reference) {
      setStatus('error');
      setMessage('No se recibió la referencia del pago.');
      return;
    }

    if (!isAuthenticated()) {
      setStatus('error');
      setMessage('Inicia sesión para confirmar tu pago.');
      return;
    }

    void (async () => {
      try {
        if (transactionId) {
          await getWompiTransaction(transactionId).catch(() => undefined);
        }

        const isProSubscription = reference.startsWith('PRO-');

        if (isProSubscription) {
          const approved = freeCheckout
            || wompiStatus === 'APPROVED'
            || wompiStatus === 'PAID'
            || !wompiStatus;

          if (!approved) {
            setStatus('error');
            setMessage('El pago del plan PRO no fue aprobado. Intenta nuevamente.');
            return;
          }

          await confirmProSubscription(reference, {
            transactionId: transactionId || undefined,
            status: wompiStatus || undefined,
          });
          if (userId) invalidateProfileHeaderCache(userId);

          setStatus('success');
          setMessage('¡Plan PRO activado! Ya puedes disfrutar de todos los beneficios.');
          showToast('Plan PRO activado correctamente', 'success');
          sessionStorage.removeItem(PENDING_PAYMENT_REF_KEY);

          window.setTimeout(() => {
            navigate('/profile/plan/detail', { replace: true });
          }, 1500);
          return;
        }

        const isVenueRental = reference.startsWith('VEN-');
        const isServiceRental = reference.startsWith('SVC-');

        if (isVenueRental) {
          const approved = freeCheckout
            || wompiStatus === 'APPROVED'
            || wompiStatus === 'PAID'
            || !wompiStatus;

          if (!approved) {
            setStatus('error');
            setMessage('El pago de la reserva no fue aprobado. Intenta nuevamente.');
            return;
          }

          await confirmTicketPayment(reference, userId, {
            transactionId: transactionId || undefined,
            status: wompiStatus || undefined,
            freeCheckout,
          });
          if (userId) invalidateProfileHeaderCache(userId);

          setStatus('success');
          setMessage('¡Pago confirmado! Tu reserva del lugar está lista.');
          showToast('Reserva confirmada correctamente', 'success');
          sessionStorage.removeItem(PENDING_PAYMENT_REF_KEY);

          window.setTimeout(() => {
            navigate('/purchases/venues', {
              replace: true,
              state: { from: 'payment-success', orderId: reference },
            });
          }, 1500);
          return;
        }

        if (isServiceRental) {
          const approved = freeCheckout
            || wompiStatus === 'APPROVED'
            || wompiStatus === 'PAID'
            || !wompiStatus;

          if (!approved) {
            setStatus('error');
            setMessage('El pago de la reserva no fue aprobado. Intenta nuevamente.');
            return;
          }

          await confirmTicketPayment(reference, userId, {
            transactionId: transactionId || undefined,
            status: wompiStatus || undefined,
            freeCheckout,
          });
          if (userId) invalidateProfileHeaderCache(userId);

          setStatus('success');
          setMessage('¡Pago confirmado! Tu reserva del servicio está lista.');
          showToast('Reserva de servicio confirmada correctamente', 'success');
          sessionStorage.removeItem(PENDING_PAYMENT_REF_KEY);

          window.setTimeout(() => {
            navigate('/purchases/services', {
              replace: true,
              state: { from: 'payment-success', orderId: reference },
            });
          }, 1500);
          return;
        }

        const approved = freeCheckout
          || wompiStatus === 'APPROVED'
          || wompiStatus === 'PAID'
          || !wompiStatus;

        if (!approved) {
          setStatus('error');
          setMessage('El pago no fue aprobado. Intenta nuevamente.');
          return;
        }

        await confirmTicketPayment(reference, userId, {
          transactionId: transactionId || undefined,
          status: wompiStatus || undefined,
          freeCheckout,
          isReferred: loadOrderIsReferred(reference),
        });
        const order = await fetchOrderById(reference);
        const meta = order?.metadata as {
          eventId?: string;
          promoCode?: string;
          promoDiscount?: number;
        } | undefined;
        const eventId = meta?.eventId || (order as { event_id?: string } | undefined)?.event_id;
        if (eventId && meta?.promoCode) {
          await redeemEventPromoCode(eventId, meta.promoCode, {
            orderId: reference,
            discount: meta.promoDiscount,
            total: order?.total_amount,
          }).catch(() => undefined);
        }
        if (userId) {
          invalidateEventsCache();
          invalidateDiscoverCache();
          invalidateProfileHeaderCache(userId);
        }

        setStatus('success');
        setMessage('¡Pago confirmado! Tus boletas están listas.');
        showToast('Pago confirmado correctamente', 'success');
        sessionStorage.removeItem(PENDING_PAYMENT_REF_KEY);

        window.setTimeout(() => {
          navigate('/tickets', {
            replace: true,
            state: { from: 'payment-success', tab: 'aprobada', orderId: order?.order_id || reference },
          });
        }, 1500);
      } catch (err) {
        setStatus('error');
        setMessage(resolveWompiPaymentError(err));
      }
    })();
  }, [params, navigate, showToast, userId]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#EEF0FB] px-6 text-center">
      {status === 'loading' ? <Loader /> : null}
      <h1 className="mt-4 text-xl font-bold text-foreground">
        {status === 'success' ? 'Pago exitoso' : status === 'error' ? 'Pago no completado' : 'Procesando'}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      {status === 'error' && (
        <button
          type="button"
          className="mt-6 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground"
          onClick={() => {
            const reference = params.get('reference')
              || params.get('order_id')
              || sessionStorage.getItem(PENDING_PAYMENT_REF_KEY)
              || '';
            if (!isAuthenticated()) {
              const returnUrl = `${window.location.pathname}${window.location.search}`;
              navigate(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`, { replace: true });
              return;
            }
            if (reference.startsWith('VEN-')) navigate('/purchases/venues');
            else if (reference.startsWith('SVC-')) navigate('/purchases/services');
            else navigate('/tickets');
          }}
        >
          {!isAuthenticated()
            ? 'Iniciar sesión'
            : params.get('reference')?.startsWith('VEN-')
              ? 'Ir a mis reservas de lugares'
              : params.get('reference')?.startsWith('SVC-')
                ? 'Ir a mis reservas de servicios'
                : 'Ir a mis boletos'}
        </button>
      )}
    </div>
  );
};

export default PaymentFinallyPage;
