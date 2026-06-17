import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Button,
  Colors,
  clearSession,
  confirmTicketPayment,
  cancelTicketOrder,
  createWompiPaymentLink,
  enrichOrderWithQrUrls,
  fetchOrderById,
  fetchUserById,
  invalidateProfilePageCache,
  invalidateEventsCache,
  clearStoredReservation,
  loadStoredReservation,
  resolveImageUrl,
  resolveOrderExpiresAtTs,
  useReservationTimer,
  useToast,
  RootState,
} from '@doevents/shared';
import type { CreateOrderResponse } from '@doevents/shared';
import WompiMockPaymentView from '@lovable/components/checkout/WompiMockPaymentView';
import SideMenu from '@lovable/components/feed/SideMenu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@lovable/components/ui/alert-dialog';

interface LocationState {
  order?: CreateOrderResponse;
  eventId?: string;
  eventName?: string;
  venueId?: string;
  venueName?: string;
  bookingId?: string;
  orderType?: 'venue' | 'ticket';
  selectedDates?: string[];
}

export const OrderConfirmationPage: React.FC = () => {
  const { orderId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [payLaterOpen, setPayLaterOpen] = useState(false);
  const [profileName, setProfileName] = useState('Eventer');
  const [profileUsername, setProfileUsername] = useState('@eventer');
  const [profileAvatar, setProfileAvatar] = useState<string | undefined>();
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const locationState = (location.state as LocationState | null) || {};
  const initialOrder = locationState.order;
  const [order, setOrder] = useState<CreateOrderResponse | undefined>(initialOrder);
  const storedReservation = userId && locationState.eventId
    ? loadStoredReservation(locationState.eventId, userId)
    : null;
  const [expiresAtTs, setExpiresAtTs] = useState<number | null>(
    resolveOrderExpiresAtTs(initialOrder)
      || storedReservation?.expiresAtTs
      || null,
  );
  const [cancelling, setCancelling] = useState(false);

  const { remainingMs, isExpired } = useReservationTimer(paid ? null : expiresAtTs);
  const resolvedEventId = locationState.eventId || storedReservation?.eventId;
  const isVenueOrder = locationState.orderType === 'venue'
    || locationState.venueId != null
    || order?.metadata?.orderType === 'VENUE_RENTAL';
  const eventName = isVenueOrder
    ? (locationState.venueName || order?.metadata?.venueName || 'Reserva de lugar')
    : (locationState.eventName || 'Evento');

  useEffect(() => {
    if (!userId) return;
    fetchUserById(userId)
      .then((profile) => {
        if (!profile) return;
        const name = [profile.nombre, profile.apellido].filter(Boolean).join(' ')
          || profile.username
          || 'Eventer';
        setProfileName(name);
        setProfileUsername(profile.username ? `@${profile.username}` : '@eventer');
        setProfileAvatar(resolveImageUrl(profile.imagen) || undefined);
        setProfileEmail(profile.email || '');
        setProfilePhone(profile.phone || '');
      })
      .catch(() => undefined);
  }, [userId]);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    fetchOrderById(decodeURIComponent(orderId))
      .then(async (detail) => {
        if (cancelled || !detail) return;
        const enriched = await enrichOrderWithQrUrls(detail);
        setOrder(enriched);
        if (enriched.payment_status === 'APPROVED' || enriched.payment_status === 'PAID') {
          setPaid(true);
        }
        if (!expiresAtTs) {
          const ts = resolveOrderExpiresAtTs(enriched);
          if (ts) setExpiresAtTs(ts);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [orderId, expiresAtTs]);

  useEffect(() => {
    if (!userId || paid || !resolvedEventId || isVenueOrder) return;
    if (isExpired) {
      void cancelTicketOrder(orderId, userId).catch(() => undefined);
      clearStoredReservation(resolvedEventId, userId);
      showToast('La reserva expiró. Las sillas están disponibles nuevamente.', 'error');
      navigate(`/events/${resolvedEventId}/checkout`, { replace: true });
    }
  }, [isExpired, paid, userId, resolvedEventId, isVenueOrder, navigate, showToast, orderId]);

  useEffect(() => {
    if (!userId || paid || !isVenueOrder) return;
    if (isExpired) {
      void cancelTicketOrder(orderId, userId).catch(() => undefined);
      showToast('La reserva expiró. Las fechas están disponibles nuevamente.', 'error');
      const venueId = locationState.venueId
        || (order?.metadata as { venueId?: string } | undefined)?.venueId;
      navigate(venueId ? `/places/${venueId}/reserve` : '/', { replace: true });
    }
  }, [isExpired, paid, userId, isVenueOrder, navigate, showToast, orderId, locationState.venueId, order?.metadata]);

  const handleCancelReservation = async () => {
    if (!userId || cancelling) return;
    const confirmMsg = isVenueOrder
      ? '¿Cancelar la reserva? Las fechas quedarán disponibles para otros.'
      : '¿Cancelar la reserva? Las sillas quedarán disponibles para otros compradores.';
    if (!window.confirm(confirmMsg)) return;
    setCancelling(true);
    try {
      await cancelTicketOrder(orderId, userId);
      if (resolvedEventId) clearStoredReservation(resolvedEventId, userId);
      showToast(
        isVenueOrder
          ? 'Reserva cancelada. Las fechas están disponibles nuevamente.'
          : 'Reserva cancelada. Las sillas están disponibles nuevamente.',
        'success',
      );
      if (isVenueOrder) {
        const venueId = locationState.venueId
          || (order?.metadata as { venueId?: string } | undefined)?.venueId;
        navigate(venueId ? `/places/${venueId}` : '/', { replace: true });
      } else {
        navigate(resolvedEventId ? `/events/${resolvedEventId}/checkout` : '/', { replace: true });
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo cancelar la reserva', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handlePay = async () => {
    if (isExpired) {
      showToast(
        isVenueOrder
          ? 'La reserva expiró. Selecciona las fechas nuevamente.'
          : 'La reserva expiró. Selecciona las sillas nuevamente.',
        'error',
      );
      return;
    }
    if (!profileEmail) {
      showToast('Completa tu correo en el perfil para continuar con el pago.', 'error');
      return;
    }
    if (paying) return;
    setPaying(true);
    try {
      const orderReference = order?.reference || orderId;

      if (!isVenueOrder && resolvedEventId) {
        const wompiTickets = tickets.map((ticket) => ({
          ticketsDistId: ticket.ticketsDistId || ticket.categoryId || ticket.category,
          category: ticket.category,
          quantity: 1,
          location: ticket.seatLabel
            ? { seatLabel: ticket.seatLabel, row: ticket.rowLabel, number: ticket.colNumber }
            : undefined,
        }));

        const link = await createWompiPaymentLink({
          eventId: resolvedEventId,
          reference: orderReference,
          customerEmail: profileEmail,
          amount: totalAmount,
          hasSeating: tickets.some((t) => Boolean(t.seatLabel)),
          eventName,
          tickets: wompiTickets,
          metadata: { orderId, eventId: resolvedEventId },
        });

        if (link.freeCheckout || link.paymentRequired === false) {
          await confirmTicketPayment(orderReference);
        } else if (link.urlPaymentLink) {
          window.location.href = link.urlPaymentLink;
          return;
        } else if (link.redirectUrl) {
          window.location.href = link.redirectUrl;
          return;
        } else {
          throw new Error('No se recibió URL de pago WOMPI');
        }
      } else {
        await confirmTicketPayment(orderReference);
      }

      setPaid(true);
      const refreshed = await fetchOrderById(orderId);
      if (refreshed) {
        const enriched = await enrichOrderWithQrUrls(refreshed);
        setOrder(enriched);
      }
      if (resolvedEventId && userId) clearStoredReservation(resolvedEventId, userId);
      if (userId) {
        invalidateProfilePageCache(userId);
        invalidateEventsCache();
      }
      showToast(
        isVenueOrder ? 'Pago confirmado. Tu reserva está lista.' : 'Pago confirmado. Boletas listas.',
        'success',
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al confirmar pago', 'error');
      throw err;
    } finally {
      setPaying(false);
    }
  };

  const handlePayLaterConfirm = () => {
    setPayLaterOpen(false);
    if (isVenueOrder) {
      showToast('Tu reserva está pendiente. Tienes 15 minutos para pagar.', 'success');
      const venueId = locationState.venueId
        || (order?.metadata as { venueId?: string } | undefined)?.venueId;
      navigate(venueId ? `/places/${venueId}` : '/profile', { replace: true });
      return;
    }
    showToast('Tus boletas están reservadas. Tienes 15 minutos para pagar.', 'success');
    navigate('/tickets', { state: { from: 'payment', tab: 'pendiente', orderId } });
  };

  const tickets = order?.tickets || [];
  const totalAmount = order?.total_amount || storedReservation?.totalAmount || 0;

  const handleNavigate = (section: string) => {
    const routes: Record<string, string> = {
      wall: '/',
      feed: '/',
      mensajes: '/chat',
      'control-accesos': '/access',
      mapa: '/map',
      invitados: '/guests',
      perfil: '/profile',
    };
    const target = routes[section];
    if (target) navigate(target);
  };

  if (!paid) {
    return (
      <div className="min-h-screen bg-[#EEF0FB] lg:flex">
        <aside className="hidden lg:flex w-[320px] shrink-0 flex-col border-r border-border/40 bg-[hsl(var(--primary-deep))] text-primary-foreground p-6">
          <p className="text-xs uppercase tracking-wider opacity-70">Resumen de compra</p>
          <h2 className="mt-2 text-xl font-bold leading-tight">{eventName}</h2>
          <p className="mt-4 text-sm opacity-90">Orden: {orderId}</p>
          <p className="mt-1 text-2xl font-extrabold">
            ${totalAmount.toLocaleString('es-CO')} COP
          </p>
          <p className="mt-4 text-sm opacity-80">
            {isVenueOrder
              ? 'Completa el pago antes de que expire el temporizador para confirmar tu reserva.'
              : `${tickets.length} boleto${tickets.length === 1 ? '' : 's'} generado${tickets.length === 1 ? '' : 's'}. Completa el pago antes de que expire el temporizador.`}
          </p>
          {!isVenueOrder && tickets.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm">
              {tickets.map((ticket) => (
                <li key={ticket.ticket_id} className="rounded-lg bg-primary-foreground/10 px-3 py-2">
                  <strong>{ticket.category}</strong>
                  {ticket.seatLabel ? ` · ${ticket.seatLabel}` : ''}
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="relative flex-1 min-w-0">
          <div className="sticky top-0 z-20 flex items-center gap-3 bg-[#EEF0FB]/95 px-4 py-3 backdrop-blur lg:hidden">
            <button
              type="button"
              onClick={() => setSideMenuOpen(true)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold"
              aria-label="Abrir menú"
            >
              ☰ Menú
            </button>
            <span className="text-sm font-semibold text-foreground truncate">{eventName}</span>
          </div>

          {tickets.some((t) => t.qr_url) && (
            <div className="mx-auto max-w-lg px-4 pt-4 lg:pt-6">
              <div className="rounded-2xl bg-card p-4 shadow-sm">
                <h2 className="text-sm font-bold text-foreground">Tu reserva (QR provisional)</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Válido mientras completes el pago en los próximos 15 minutos.
                </p>
                {tickets.map((ticket) => (
                  <div key={ticket.ticket_id} className="mt-3 text-center opacity-80">
                    <p className="text-sm">
                      <strong>{ticket.category}</strong>
                      {ticket.seatLabel ? ` · ${ticket.seatLabel}` : ''}
                    </p>
                    {ticket.qr_url ? (
                      <img
                        src={ticket.qr_url}
                        alt={`QR reserva ${ticket.seatLabel}`}
                        className="mx-auto mt-2 h-32 w-32"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          <WompiMockPaymentView
            orderId={orderId}
            totalAmount={totalAmount}
            remainingMs={remainingMs}
            disabled={paying || isExpired}
            onConfirmPayment={() => handlePay()}
            defaultBuyer={{
              name: profileName,
              email: profileEmail,
              phone: profilePhone,
            }}
            onAbort={() => void handleCancelReservation()}
            onPayLater={() => setPayLaterOpen(true)}
            onOpenMenu={() => setSideMenuOpen(true)}
          />
        </div>

        <SideMenu
          open={sideMenuOpen}
          onOpenChange={setSideMenuOpen}
          onNavigate={handleNavigate}
          onGoToTickets={() => navigate('/tickets')}
          onLogout={() => {
            clearSession();
            navigate('/auth/login');
          }}
          profileName={profileName}
          profileUsername={profileUsername}
          profileAvatar={profileAvatar}
          profileUserId={userId || undefined}
        />

        <AlertDialog open={payLaterOpen} onOpenChange={setPayLaterOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Pagar más tarde</AlertDialogTitle>
              <AlertDialogDescription>
                {isVenueOrder
                  ? 'Tu reserva quedará pendiente hasta que completes el pago. Tienes 15 minutos antes de que las fechas vuelvan a estar disponibles.'
                  : 'Tus boletas ya fueron generadas, pero quedarán inactivas hasta que completes el pago. Tienes 15 minutos para pagar o perderás la reserva y las sillas volverán al mapa.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Seguir pagando</AlertDialogCancel>
              <AlertDialogAction onClick={handlePayLaterConfirm}>
                {isVenueOrder ? 'Entendido' : 'Ir a Mis boletas'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  const venueBookingId = locationState.bookingId
    || (order?.metadata as { bookingId?: string } | undefined)?.bookingId;
  const venueSelectedDates = locationState.selectedDates
    || (order?.metadata as { selectedDates?: string[] } | undefined)?.selectedDates
    || [];

  return (
    <div className="de-page-content de-order-confirm">
      <div className="de-safe-top" />
      <header className="de-page-topbar">
        <h1>{isVenueOrder ? 'Reserva confirmada' : 'Compra exitosa'}</h1>
      </header>

      <div className="de-card de-card--lovable de-card--compact">
        <p>Orden: <strong>{orderId}</strong></p>
        {isVenueOrder ? (
          <>
            <p>Lugar: <strong>{eventName}</strong></p>
            {venueBookingId && <p>Reserva: <strong>{venueBookingId}</strong></p>}
            {venueSelectedDates.length > 0 && (
              <p>Fechas: <strong>{venueSelectedDates.join(', ')}</strong></p>
            )}
          </>
        ) : (
          <p>Evento: <strong>{eventName}</strong></p>
        )}
        <p>Total: <strong>${totalAmount.toLocaleString('es-CO')} COP</strong></p>
        <p className="de-wall-intro">Estado: APROBADO</p>
      </div>

      {tickets.length > 0 && (
        <div className="de-card de-card--lovable de-card--compact">
          <h2>Boletas confirmadas</h2>
          {tickets.map((ticket) => (
            <div key={ticket.ticket_id} className="de-ticket-preview">
              <p><strong>{ticket.category}</strong> — Asiento {ticket.seatLabel || 'General'}</p>
              <p>${(ticket.price || 0).toLocaleString('es-CO')}</p>
              {ticket.qr_url ? (
                <img src={ticket.qr_url} alt={`QR ${ticket.seatLabel}`} className="de-ticket-preview__qr" />
              ) : (
                <p className="de-wall-intro">QR disponible en Mis Boletas</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="de-checkout-summary">
        {isVenueOrder ? (
          <>
            <Button
              label="Ver el lugar reservado"
              tone="lovable"
              onClick={() => {
                const venueId = locationState.venueId
                  || (order?.metadata as { venueId?: string } | undefined)?.venueId;
                navigate(venueId ? `/places/${venueId}` : '/events');
              }}
            />
            <button
              type="button"
              className="de-event-detail__cta de-event-detail__cta--secondary"
              style={{ borderColor: Colors.LovablePrimary, color: Colors.LovablePrimary }}
              onClick={() => navigate('/events')}
            >
              Volver a Descubre
            </button>
          </>
        ) : (
          <>
            <Button
              label="Ver mis boletas"
              tone="lovable"
              onClick={() => navigate('/tickets', { state: { from: 'payment-success', tab: 'aprobada' } })}
            />
            <button
              type="button"
              className="de-event-detail__cta de-event-detail__cta--secondary"
              style={{ borderColor: Colors.LovablePrimary, color: Colors.LovablePrimary }}
              onClick={() => navigate('/')}
            >
              Volver al Wall
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
