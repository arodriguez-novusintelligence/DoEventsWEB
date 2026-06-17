import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  checkRefundEligibility,
  fetchUserTickets,
  Loader,
  requestEventRefund,
  RootState,
  UserTicketOrder,
  useToast,
} from '@doevents/shared';

interface RefundCandidate {
  eventId: string;
  eventName: string;
  orderId: string;
  canRequest: boolean;
  reason?: string;
  amount?: number;
}

export const RefundsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<UserTicketOrder[]>([]);
  const [candidates, setCandidates] = useState<RefundCandidate[]>([]);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      try {
        const tickets = await fetchUserTickets(userId);
        setOrders(tickets);
        const uniqueEvents = new Map<string, RefundCandidate>();
        for (const order of tickets) {
          const eventId = order.metadata?.eventId;
          const orderId = order.metadata?.reference || order.id;
          if (!eventId || !orderId || uniqueEvents.has(orderId)) continue;
          try {
            const eligibility = await checkRefundEligibility(eventId, userId, orderId);
            uniqueEvents.set(orderId, {
              eventId,
              eventName: order.metadata?.eventName || 'Evento',
              orderId: eligibility?.orderId || orderId,
              canRequest: Boolean(eligibility?.canRequestRefund),
              reason: eligibility?.reason,
              amount: order.amount || order.metadata?.orderTotals?.total_amount,
            });
          } catch {
            uniqueEvents.set(orderId, {
              eventId,
              eventName: order.metadata?.eventName || 'Evento',
              orderId,
              canRequest: false,
              reason: 'No elegible para reembolso',
              amount: order.amount,
            });
          }
        }
        setCandidates([...uniqueEvents.values()]);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Error al cargar órdenes', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId, showToast]);

  const eligibleCount = useMemo(
    () => candidates.filter((c) => c.canRequest).length,
    [candidates],
  );

  const requestRefund = async (candidate: RefundCandidate) => {
    if (!userId || !candidate.canRequest) return;
    setBusyOrderId(candidate.orderId);
    try {
      await requestEventRefund({ userId, orderId: candidate.orderId });
      showToast('Solicitud de reembolso enviada', 'success');
      setCandidates((prev) => prev.map((c) => (
        c.orderId === candidate.orderId
          ? { ...c, canRequest: false, reason: 'Reembolso en proceso' }
          : c
      )));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo solicitar reembolso', 'error');
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <div className="de-tickets-page">
      <div className="de-safe-top" />
      <header className="de-page-topbar">
        <button type="button" className="de-page-topbar__back" onClick={() => navigate('/profile')} aria-label="Volver">‹</button>
        <h1>Reembolsos</h1>
      </header>

      <div className="de-page-body">
        <p className="de-wall-intro">
          Gestiona solicitudes de reembolso de tus compras. Órdenes elegibles: <strong>{eligibleCount}</strong>
        </p>

        {loading ? (
          <Loader />
        ) : candidates.length === 0 ? (
          <div className="de-empty-state">
            <p>No tienes compras con reembolso disponible.</p>
            <button type="button" className="de-search-bar__btn" onClick={() => navigate('/tickets')}>
              Ver mis boletas
            </button>
          </div>
        ) : (
          <div className="de-ticket-list">
            {candidates.map((item) => (
              <article key={item.orderId} className="de-ticket-card">
                <div className="de-ticket-card__header de-ticket-card__header--static">
                  <div>
                    <h3>{item.eventName}</h3>
                    <p className="de-ticket-card__ref">Orden: {item.orderId}</p>
                  </div>
                </div>
                {item.amount != null && (
                  <p className="de-ticket-card__amount">${Number(item.amount).toLocaleString('es-CO')}</p>
                )}
                <p className="de-wall-intro">{item.reason || (item.canRequest ? 'Puedes solicitar reembolso' : 'No disponible')}</p>
                <div className="de-invite-actions">
                  <button type="button" className="de-pro-card__link-btn" onClick={() => navigate(`/events/${item.eventId}`)}>
                    Ver evento
                  </button>
                  {item.canRequest && (
                    <button
                      type="button"
                      className="de-search-bar__btn"
                      disabled={busyOrderId === item.orderId}
                      onClick={() => requestRefund(item)}
                    >
                      {busyOrderId === item.orderId ? 'Procesando…' : 'Solicitar reembolso'}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {orders.length > 0 && (
          <section className="de-pro-card">
            <h2 className="de-pro-card__title">Política</h2>
            <p className="de-wall-intro">
              Los reembolsos dependen de la política configurada por el organizador del evento.
            </p>
            <button
              type="button"
              className="de-pro-card__link-btn"
              onClick={() => window.open('https://www.doeventsapp.com/politics-and-refund', '_blank')}
            >
              Ver política de reembolsos →
            </button>
          </section>
        )}
      </div>
    </div>
  );
};

export default RefundsPage;
