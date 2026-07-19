import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Button,
  Colors,
  clearSession,
  confirmTicketPayment,
  cancelTicketOrder,
  createWompiPaymentLink,
  resolveWompiPaymentError,
  enrichOrderWithQrUrls,
  fetchOrderById,
  fetchUserById,
  invalidateEventsCache,
  clearStoredReservation,
  loadStoredReservation,
  resolveImageUrl,
  resolveOrderExpiresAtTs,
  resolveUserDisplayName,
  getPersistedUserDisplayName,
  redeemEventPromoCode,
  useReservationTimer,
  useToast,
  RootState,
} from '@doevents/shared';
import type { CreateOrderResponse } from '@doevents/shared';
import WompiMockPaymentView, { type WompiBuyerDetails } from '@lovable/components/checkout/WompiMockPaymentView';
import ServiceRentalCheckoutView from '@lovable/components/services/ServiceRentalCheckoutView';
import OrderPurchaseSuccessView from '@lovable/components/purchases/OrderPurchaseSuccessView';
import SideMenu from '@lovable/components/feed/SideMenu';
import {
  OrganizerPaymentAuthView,
  authChoiceToIsReferred,
  loadOrderIsReferred,
  persistOrderIsReferred,
  type OrganizerAuthOption,
} from '@lovable/components/checkout/OrganizerPaymentAuthView';
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

const PENDING_PAYMENT_REF_KEY = 'doevents_pending_payment_ref';

function rememberPendingPayment(reference: string) {
  if (reference) {
    sessionStorage.setItem(PENDING_PAYMENT_REF_KEY, reference);
  }
}

function redirectToWompi(url: string, reference: string) {
  rememberPendingPayment(reference);
  window.location.href = url;
}

interface LocationState {
  order?: CreateOrderResponse;
  eventId?: string;
  eventName?: string;
  hasSeating?: boolean;
  venueId?: string;
  venueName?: string;
  bookingId?: string;
  serviceId?: string;
  serviceName?: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  currency?: string;
  orderType?: 'venue' | 'service' | 'ticket';
  selectedDates?: string[];
  promoCode?: string;
  promoDiscount?: number;
  discountedAmount?: number;
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
  const [organizerAuthDone, setOrganizerAuthDone] = useState(false);
  const [isReferred, setIsReferred] = useState<boolean | undefined>(() =>
    orderId ? loadOrderIsReferred(orderId) : undefined,
  );
  const [profileName, setProfileName] = useState(() => getPersistedUserDisplayName() || 'Usuario');
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
  const resolvedEventId = locationState.eventId
    || storedReservation?.eventId
    || (order as { event_id?: string } | undefined)?.event_id;
  const isVenueOrder = locationState.orderType === 'venue'
    || locationState.venueId != null
    || order?.metadata?.orderType === 'VENUE_RENTAL';
  const isServiceOrder = locationState.orderType === 'service'
    || locationState.serviceId != null
    || order?.metadata?.orderType === 'SERVICE_RENTAL';
  const isRentalOrder = isVenueOrder || isServiceOrder;
  const needsOrganizerAuth = !isRentalOrder;
  const showOrganizerAuth = needsOrganizerAuth && !organizerAuthDone && !paid;

  useEffect(() => {
    if (!orderId) return;
    const stored = loadOrderIsReferred(orderId);
    if (typeof stored === 'boolean') {
      setIsReferred(stored);
      setOrganizerAuthDone(true);
      return;
    }
    const fromOrder = (order as { isReferred?: boolean; is_referred?: boolean } | undefined)?.isReferred
      ?? (order as { is_referred?: boolean } | undefined)?.is_referred;
    if (typeof fromOrder === 'boolean') {
      setIsReferred(fromOrder);
      setOrganizerAuthDone(true);
      persistOrderIsReferred(orderId, fromOrder);
    }
  }, [orderId, order]);

  const handleOrganizerAuthContinue = (choice: OrganizerAuthOption) => {
    const referred = authChoiceToIsReferred(choice);
    setIsReferred(referred);
    persistOrderIsReferred(orderId, referred);
    setOrganizerAuthDone(true);
  };

  const eventName = isVenueOrder
    ? (locationState.venueName || (order?.metadata as { venueName?: string } | undefined)?.venueName || 'Reserva de lugar')
    : isServiceOrder
      ? (locationState.serviceName || (order?.metadata as { serviceName?: string } | undefined)?.serviceName || 'Reserva de servicio')
      : (locationState.eventName || 'Evento');

  const tickets = order?.tickets || [];
  const orderTotal = order?.total_amount || storedReservation?.totalAmount || 0;
  const promoDiscount = Number(locationState.promoDiscount || 0);
  const totalAmount = locationState.discountedAmount != null
    ? Number(locationState.discountedAmount)
    : Math.max(0, orderTotal - promoDiscount);
  const hasSeating = locationState.hasSeating ?? tickets.some((t) => Boolean(t.seatLabel));
  const appliedPromoCode = locationState.promoCode
    || (order?.metadata as { promoCode?: string } | undefined)?.promoCode;

  const buildWompiTickets = () => {
    if (hasSeating) {
      return tickets.map((ticket) => {
        const raw = ticket as Record<string, unknown>;
        const seatObj = (raw.seat || {}) as {
          seatLabel?: string;
          rowLabel?: string;
          colNumber?: number;
          row?: string;
          number?: number;
        };
        const seatsArr = Array.isArray(raw.seats) ? raw.seats as string[] : [];
        const seatLabel = String(
          ticket.seatLabel
          || seatObj?.seatLabel
          || seatsArr[0]
          || '',
        );
        const labelMatch = seatLabel.match(/^([A-Za-z]+)\s*0?(\d+)$/i);
        const row = raw.rowLabel
          || seatObj?.rowLabel
          || seatObj?.row
          || (labelMatch ? labelMatch[1].toUpperCase() : undefined);
        const number = raw.colNumber
          ?? seatObj?.colNumber
          ?? seatObj?.number
          ?? (labelMatch ? Number(labelMatch[2]) : undefined);

        return {
          ticketsDistId: ticket.ticketsDistId
            || (raw.distributionId as string)
            || ticket.categoryId
            || (raw.distributionId as string)
            || ticket.category,
          category: ticket.category,
          quantity: 1,
          location: {
            seatLabel,
            row,
            number,
          },
        };
      });
    }
    const grouped = new Map<string, { ticketsDistId: string; category: string; quantity: number }>();
    for (const ticket of tickets) {
      const distId = String(ticket.ticketsDistId || ticket.categoryId || ticket.category || '');
      if (!distId) continue;
      const existing = grouped.get(distId);
      if (existing) {
        existing.quantity += 1;
      } else {
        grouped.set(distId, {
          ticketsDistId: distId,
          category: ticket.category || '',
          quantity: 1,
        });
      }
    }
    return Array.from(grouped.values());
  };

  useEffect(() => {
    if (!userId) return;
    fetchUserById(userId)
      .then((profile) => {
        if (!profile) return;
        const name = resolveUserDisplayName(profile) || getPersistedUserDisplayName() || 'Usuario';
        setProfileName(name);
        setProfileUsername(profile.username ? `@${profile.username}` : '@usuario');
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
    if (!userId || paid || !resolvedEventId || isRentalOrder) return;
    if (isExpired) {
      void cancelTicketOrder(orderId, userId).catch(() => undefined);
      clearStoredReservation(resolvedEventId, userId);
      showToast(
        hasSeating
          ? 'La reserva expiró. Las sillas están disponibles nuevamente.'
          : 'La reserva expiró. Las boletas están disponibles nuevamente.',
        'error',
      );
      navigate(`/events/${resolvedEventId}/checkout`, { replace: true });
    }
  }, [isExpired, paid, userId, resolvedEventId, isRentalOrder, navigate, showToast, orderId, hasSeating]);

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

  useEffect(() => {
    if (!userId || paid || !isServiceOrder) return;
    if (isExpired) {
      void cancelTicketOrder(orderId, userId).catch(() => undefined);
      showToast('La reserva expiró. Las fechas están disponibles nuevamente.', 'error');
      const serviceId = locationState.serviceId
        || (order?.metadata as { serviceId?: string } | undefined)?.serviceId;
      navigate(serviceId ? `/services/${serviceId}` : '/', { replace: true });
    }
  }, [isExpired, paid, userId, isServiceOrder, navigate, showToast, orderId, locationState.serviceId, order?.metadata]);

  const freeCheckoutStartedRef = useRef(false);
  useEffect(() => {
    if (freeCheckoutStartedRef.current || paid || paying || isRentalOrder || !userId || !orderId) return;
    if (totalAmount > 0) return;
    if (!organizerAuthDone) return;

    freeCheckoutStartedRef.current = true;
    let cancelled = false;

    void (async () => {
      setPaying(true);
      try {
        const orderReference = order?.reference || orderId;
        await confirmTicketPayment(orderReference, userId, {
          isReferred,
          freeCheckout: true,
        });
        if (cancelled) return;
        if (appliedPromoCode && resolvedEventId) {
          await redeemEventPromoCode(resolvedEventId, appliedPromoCode, {
            orderId,
            discount: promoDiscount,
          }).catch(() => undefined);
        }
        setPaid(true);
        const refreshed = await fetchOrderById(orderId);
        if (refreshed) {
          const enriched = await enrichOrderWithQrUrls(refreshed);
          setOrder(enriched);
        }
        if (resolvedEventId) clearStoredReservation(resolvedEventId, userId);
        invalidateEventsCache();
        showToast('Boletas confirmadas.', 'success');
      } catch (err) {
        freeCheckoutStartedRef.current = false;
        showToast(resolveWompiPaymentError(err), 'error');
      } finally {
        if (!cancelled) setPaying(false);
      }
    })();

    return () => { cancelled = true; };
  }, [
    paid,
    paying,
    isRentalOrder,
    organizerAuthDone,
    isReferred,
    userId,
    orderId,
    totalAmount,
    order?.reference,
    resolvedEventId,
    showToast,
  ]);

  const handleCancelReservation = async () => {
    if (!userId || cancelling) return;
    const confirmMsg = isVenueOrder
      ? '¿Cancelar la reserva? Las fechas quedarán disponibles para otros.'
      : isServiceOrder
        ? '¿Cancelar la reserva? Las fechas del servicio quedarán disponibles para otros.'
      : hasSeating
        ? '¿Cancelar la reserva? Las sillas quedarán disponibles para otros compradores.'
        : '¿Cancelar la reserva? Las boletas quedarán disponibles para otros compradores.';
    if (!window.confirm(confirmMsg)) return;
    setCancelling(true);
    try {
      await cancelTicketOrder(orderId, userId);
      if (resolvedEventId) clearStoredReservation(resolvedEventId, userId);
      showToast(
        isVenueOrder
          ? 'Reserva cancelada. Las fechas están disponibles nuevamente.'
          : isServiceOrder
            ? 'Reserva cancelada. Las fechas del servicio están disponibles nuevamente.'
          : hasSeating
            ? 'Reserva cancelada. Las sillas están disponibles nuevamente.'
            : 'Reserva cancelada. Las boletas están disponibles nuevamente.',
        'success',
      );
      if (isVenueOrder) {
        const venueId = locationState.venueId
          || (order?.metadata as { venueId?: string } | undefined)?.venueId;
        navigate(venueId ? `/places/${venueId}` : '/', { replace: true });
      } else if (isServiceOrder) {
        const serviceId = locationState.serviceId
          || (order?.metadata as { serviceId?: string } | undefined)?.serviceId;
        navigate(serviceId ? `/services/${serviceId}` : '/', { replace: true });
      } else {
        navigate(resolvedEventId ? `/events/${resolvedEventId}/checkout` : '/', { replace: true });
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo cancelar la reserva', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handlePay = async (buyer?: WompiBuyerDetails, paymentAmount?: number) => {
    if (isExpired) {
      showToast(
        isVenueOrder || isServiceOrder
          ? 'La reserva expiró. Selecciona las fechas nuevamente.'
          : hasSeating
            ? 'La reserva expiró. Selecciona las sillas nuevamente.'
            : 'La reserva expiró. Selecciona las boletas nuevamente.',
        'error',
      );
      return;
    }
    const customerEmail = buyer?.email?.trim() || profileEmail.trim();
    if (!customerEmail) {
      showToast('Ingresa tu correo electrónico para continuar con el pago.', 'error');
      return;
    }
    const chargeAmount = paymentAmount ?? totalAmount;
    if (paying) return;
    setPaying(true);
    try {
      const orderReference = order?.reference || orderId;

      if (isVenueOrder) {
        const venueId = locationState.venueId
          || (order?.metadata as { venueId?: string } | undefined)?.venueId;
        const venueName = locationState.venueName
          || (order?.metadata as { venueName?: string } | undefined)?.venueName
          || eventName;
        const bookingId = locationState.bookingId
          || (order?.metadata as { bookingId?: string } | undefined)?.bookingId;

        const link = await createWompiPaymentLink({
          reference: orderReference,
          customerEmail,
          amount: chargeAmount,
          eventName: venueName,
          metadata: {
            orderId,
            orderType: 'VENUE_RENTAL',
            venueId,
            venueName,
            bookingId,
          },
        });

        if (link.freeCheckout || link.paymentRequired === false) {
          await confirmTicketPayment(orderReference, userId);
        } else if (link.urlPaymentLink) {
          redirectToWompi(link.urlPaymentLink, orderReference);
          return;
        } else if (link.redirectUrl) {
          redirectToWompi(link.redirectUrl, orderReference);
          return;
        } else {
          throw new Error('No se recibió URL de pago WOMPI');
        }
      } else if (isServiceOrder) {
        const serviceId = locationState.serviceId
          || (order?.metadata as { serviceId?: string } | undefined)?.serviceId;
        const serviceName = locationState.serviceName
          || (order?.metadata as { serviceName?: string } | undefined)?.serviceName
          || eventName;
        const bookingId = locationState.bookingId
          || (order?.metadata as { bookingId?: string } | undefined)?.bookingId;

        const link = await createWompiPaymentLink({
          reference: orderReference,
          customerEmail,
          amount: chargeAmount,
          eventName: serviceName,
          metadata: {
            orderId,
            orderType: 'SERVICE_RENTAL',
            serviceId,
            serviceName,
            bookingId,
          },
        });

        if (link.freeCheckout || link.paymentRequired === false) {
          await confirmTicketPayment(orderReference, userId);
        } else if (link.urlPaymentLink) {
          redirectToWompi(link.urlPaymentLink, orderReference);
          return;
        } else if (link.redirectUrl) {
          redirectToWompi(link.redirectUrl, orderReference);
          return;
        } else {
          throw new Error('No se recibió URL de pago WOMPI');
        }
      } else if (resolvedEventId) {
        const wompiTickets = buildWompiTickets();

        const link = await createWompiPaymentLink({
          eventId: resolvedEventId,
          reference: orderReference,
          customerEmail,
          amount: chargeAmount,
          hasSeating,
          eventName,
          tickets: wompiTickets,
          metadata: {
            orderId,
            eventId: resolvedEventId,
            hasSeating,
            ...(appliedPromoCode ? { promoCode: appliedPromoCode, promoDiscount } : {}),
          },
        });

        if (link.freeCheckout || link.paymentRequired === false) {
          await confirmTicketPayment(orderReference, userId, {
            isReferred,
            freeCheckout: true,
          });
          if (appliedPromoCode && resolvedEventId) {
            await redeemEventPromoCode(resolvedEventId, appliedPromoCode, {
              orderId,
              discount: promoDiscount,
            }).catch(() => undefined);
          }
        } else if (link.urlPaymentLink) {
          redirectToWompi(link.urlPaymentLink, orderReference);
          return;
        } else if (link.redirectUrl) {
          redirectToWompi(link.redirectUrl, orderReference);
          return;
        } else {
          throw new Error('No se recibió URL de pago WOMPI');
        }
      } else {
        await confirmTicketPayment(orderReference, userId, { isReferred });
        if (appliedPromoCode && resolvedEventId) {
          await redeemEventPromoCode(resolvedEventId, appliedPromoCode, {
            orderId,
            discount: promoDiscount,
          }).catch(() => undefined);
        }
      }

      setPaid(true);
      const refreshed = await fetchOrderById(orderId);
      if (refreshed) {
        const enriched = isRentalOrder ? refreshed : await enrichOrderWithQrUrls(refreshed);
        setOrder(enriched);
      }
      if (resolvedEventId && userId) clearStoredReservation(resolvedEventId, userId);
      if (userId) {
        invalidateEventsCache();
      }
      if (isVenueOrder) {
        showToast('Pago confirmado. Tu reserva está lista.', 'success');
        navigate('/purchases/venues', {
          replace: true,
          state: { from: 'payment-success', orderId },
        });
        return;
      }
      if (isServiceOrder) {
        showToast('Pago confirmado. Tu reserva está lista.', 'success');
        navigate('/purchases/services', {
          replace: true,
          state: { from: 'payment-success', orderId },
        });
        return;
      }
      showToast('Pago confirmado. Boletas listas.', 'success');
    } catch (err) {
      showToast(resolveWompiPaymentError(err), 'error');
    } finally {
      setPaying(false);
    }
  };

  const handlePayLaterConfirm = () => {
    setPayLaterOpen(false);
    if (isVenueOrder) {
      showToast('Tu reserva está pendiente. Tienes 15 minutos para pagar.', 'success');
      navigate('/purchases/venues', { replace: true, state: { from: 'payment', orderId } });
      return;
    }
    if (isServiceOrder) {
      showToast('Tu reserva está pendiente. Tienes 15 minutos para pagar.', 'success');
      navigate('/purchases/services', { replace: true, state: { from: 'payment', orderId } });
      return;
    }
    showToast('Tus boletas están reservadas. Tienes 15 minutos para pagar.', 'success');
    navigate('/tickets', { state: { from: 'payment', tab: 'pendiente', orderId, hasSeating } });
  };

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

  const serviceCheckoutMeta = useMemo(() => {
    if (!isServiceOrder) return null;
    const meta = order?.metadata as {
      serviceId?: string;
      serviceName?: string;
      startDate?: string;
      endDate?: string;
      pricing?: { numDays?: number };
    } | undefined;
    const startDate = locationState.startDate || meta?.startDate || '';
    const endDate = locationState.endDate || meta?.endDate || startDate;
    const start = startDate ? new Date(`${startDate}T12:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T12:00:00`) : null;
    const computedDays = start && end
      ? Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 0;
    return {
      serviceId: locationState.serviceId || meta?.serviceId || '',
      serviceName: locationState.serviceName || meta?.serviceName || eventName,
      startDate,
      endDate,
      days: locationState.days || meta?.pricing?.numDays || computedDays || 1,
      currency: locationState.currency || 'COP',
    };
  }, [isServiceOrder, order?.metadata, locationState, eventName]);

  if (!paid) {
    if (!isRentalOrder && totalAmount <= 0 && paying) {
      return (
        <div className="min-h-screen bg-[#EEF0FB] flex items-center justify-center px-6">
          <p className="text-sm text-muted-foreground">Generando tus boletas gratuitas…</p>
        </div>
      );
    }

    if (showOrganizerAuth) {
      return (
        <div className="min-h-screen bg-[#EEF0FB]">
          <OrganizerPaymentAuthView
            remainingMs={remainingMs}
            disabled={isExpired}
            onBack={() => void handleCancelReservation()}
            onContinue={handleOrganizerAuthContinue}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#EEF0FB]">
        {isServiceOrder && serviceCheckoutMeta?.serviceId ? (
          <ServiceRentalCheckoutView
            orderId={orderId}
            serviceId={serviceCheckoutMeta.serviceId}
            serviceName={serviceCheckoutMeta.serviceName}
            startDate={serviceCheckoutMeta.startDate}
            endDate={serviceCheckoutMeta.endDate}
            days={serviceCheckoutMeta.days}
            totalAmount={totalAmount}
            currency={serviceCheckoutMeta.currency}
            remainingMs={remainingMs}
            disabled={paying || isExpired}
            defaultEmail={profileEmail}
            onConfirmPayment={({ email, discountedAmount }) =>
              handlePay({ name: profileName, email, phone: profilePhone }, discountedAmount)
            }
            onAbort={() => void handleCancelReservation()}
            onPayLater={() => setPayLaterOpen(true)}
          />
        ) : (
          <WompiMockPaymentView
            orderId={orderId}
            totalAmount={totalAmount}
            remainingMs={remainingMs}
            disabled={paying || isExpired}
            onConfirmPayment={(buyer) => handlePay(buyer)}
            defaultBuyer={{
              name: profileName,
              email: profileEmail,
              phone: profilePhone,
            }}
            onAbort={() => void handleCancelReservation()}
            onPayLater={() => setPayLaterOpen(true)}
          />
        )}

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
                  : isServiceOrder
                    ? 'Tu reserva del servicio quedará pendiente hasta que completes el pago. Tienes 15 minutos antes de que las fechas vuelvan a estar disponibles.'
                  : hasSeating
                    ? 'Tus boletas ya fueron generadas, pero quedarán inactivas hasta que completes el pago. Tienes 15 minutos para pagar o perderás la reserva y las sillas volverán al mapa.'
                    : 'Tus boletas ya fueron generadas, pero quedarán inactivas hasta que completes el pago. Tienes 15 minutos para pagar o perderás la reserva.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Seguir pagando</AlertDialogCancel>
              <AlertDialogAction onClick={handlePayLaterConfirm}>
                {isRentalOrder ? 'Entendido' : 'Ir a Mis boletas'}
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

  if (!isRentalOrder && tickets.length > 0) {
    const eventImage = resolveImageUrl(
      (order?.metadata as { eventImage?: string } | undefined)?.eventImage,
    );
    return (
      <OrderPurchaseSuccessView
        eventName={eventName}
        orderId={orderId}
        eventDate={locationState.startDate || undefined}
        startTime={(order?.metadata as { eventTime?: string } | undefined)?.eventTime}
        venueLabel={eventName}
        venueCapacity={locationState.hasSeating ? 'Evento con sillas numeradas' : undefined}
        eventImage={eventImage || undefined}
        tickets={tickets}
        onFinish={() => navigate('/purchases', { state: { section: 'boletos' }, replace: true })}
      />
    );
  }

  return (
    <div className="de-page-content de-order-confirm">
      <div className="de-safe-top" />
      <header className="de-page-topbar">
        <h1>{isRentalOrder ? 'Reserva confirmada' : 'Compra exitosa'}</h1>
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
        ) : isServiceOrder ? (
          <>
            <p>Servicio: <strong>{eventName}</strong></p>
            {venueBookingId && <p>Reserva: <strong>{venueBookingId}</strong></p>}
            {(locationState.startDate || locationState.endDate) && (
              <p>Fechas: <strong>{locationState.startDate} — {locationState.endDate}</strong></p>
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
              label="Ver mis lugares reservados"
              tone="lovable"
              onClick={() => navigate('/purchases/venues', {
                state: { from: 'payment-success', orderId },
              })}
            />
            <button
              type="button"
              className="de-event-detail__cta de-event-detail__cta--secondary"
              style={{ borderColor: Colors.LovablePrimary, color: Colors.LovablePrimary }}
              onClick={() => {
                const venueId = locationState.venueId
                  || (order?.metadata as { venueId?: string } | undefined)?.venueId;
                navigate(venueId ? `/places/${venueId}` : '/events');
              }}
            >
              Ver el lugar reservado
            </button>
          </>
        ) : isServiceOrder ? (
          <>
            <Button
              label="Ver mis reservas de servicios"
              tone="lovable"
              onClick={() => navigate('/purchases/services')}
            />
            <button
              type="button"
              className="de-event-detail__cta de-event-detail__cta--secondary"
              style={{ borderColor: Colors.LovablePrimary, color: Colors.LovablePrimary }}
              onClick={() => {
                const serviceId = locationState.serviceId
                  || (order?.metadata as { serviceId?: string } | undefined)?.serviceId;
                navigate(serviceId ? `/services/${serviceId}` : '/events');
              }}
            >
              Volver al servicio
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
