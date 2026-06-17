import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  confirmProSubscription,
  confirmTicketPayment,
  fetchOrderById,
  getWompiTransaction,
  invalidateProfilePageCache,
  invalidateEventsCache,
  Loader,
  RootState,
  useToast,
} from '@doevents/shared';

export const PaymentFinallyPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando tu pago…');

  useEffect(() => {
    const reference = params.get('reference') || params.get('id') || '';
    const wompiStatus = (params.get('status') || '').toUpperCase();
    const transactionId = params.get('transaction_id') || params.get('id_tx') || '';
    const freeCheckout = params.get('freeCheckout') === 'true';

    if (!reference) {
      setStatus('error');
      setMessage('No se recibió la referencia del pago.');
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
          if (userId) invalidateProfilePageCache(userId);

          setStatus('success');
          setMessage('¡Plan PRO activado! Ya puedes disfrutar de todos los beneficios.');
          showToast('Plan PRO activado correctamente', 'success');

          window.setTimeout(() => {
            navigate('/profile/plan/detail', { replace: true });
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

        await confirmTicketPayment(reference);
        const order = await fetchOrderById(reference);
        if (userId) {
          invalidateProfilePageCache(userId);
          invalidateEventsCache();
        }

        setStatus('success');
        setMessage('¡Pago confirmado! Tus boletas están listas.');
        showToast('Pago confirmado correctamente', 'success');

        window.setTimeout(() => {
          navigate('/tickets', {
            replace: true,
            state: { from: 'payment-success', tab: 'aprobada', orderId: order?.order_id || reference },
          });
        }, 1500);
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Error al confirmar el pago');
      }
    })();
  }, [params, navigate, showToast, userId]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      {status === 'loading' ? <Loader /> : null}
      <h1 className="mt-4 text-xl font-bold text-foreground">
        {status === 'success' ? 'Pago exitoso' : status === 'error' ? 'Pago no completado' : 'Procesando'}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      {status === 'error' && (
        <button
          type="button"
          className="mt-6 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground"
          onClick={() => navigate('/tickets')}
        >
          Ir a mis boletos
        </button>
      )}
    </div>
  );
};

export default PaymentFinallyPage;
