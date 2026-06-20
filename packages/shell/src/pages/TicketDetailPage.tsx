import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  checkRefundEligibility,
  collectTicketsFromGroup,
  enrichOrderWithQrUrls,
  enrichTicketsWithQrUrls,
  fetchOrderById,
  fetchEventDetail,
  fetchGroupedUserTickets,
  Loader,
  requestEventRefund,
  resolveEventImageUrl,
  resolveEventVideoUrl,
  isPlaceholderEventImage,
  listStoredReservationsForUser,
  RootState,
  resolveOrderExpiresAtTs,
  transferTicketsToUser,
  useToast,
} from '@doevents/shared';
import type { TicketEventGroup, TicketWithOrderRef } from '@doevents/shared';
import type { Ticket } from '@lovable/data/ticketsData';
import TicketDetailView from '@lovable/components/tickets/TicketDetailView';
import { groupedTicketsToLovable, lovableTicketsToOrderRefs } from '../lovable-bridge/ticketsAdapter';
import type { BoletaEntry } from '@lovable/components/tickets/TransferTicketFlow';
import type { TransferRecipient } from '@lovable/components/tickets/TransferTicketFlow';

interface TicketDetailLocationState {
  group?: TicketEventGroup;
  ticketId?: string;
  preloadedTickets?: Ticket[];
  eventMeta?: {
    eventId?: string;
    eventName?: string;
    eventImage?: string;
    eventVideo?: string;
    eventDate?: string;
    eventTime?: string;
  };
}

function normalizeEventVideo(video?: string): string {
  return resolveEventVideoUrl(video) || '';
}

async function loadEventTicketsForUser(
  userId: string,
  eventId: string,
  status?: Ticket['status'],
): Promise<TicketWithOrderRef[]> {
  const grouped = await fetchGroupedUserTickets(userId);
  const lovable = groupedTicketsToLovable(grouped);
  const filtered = lovable.filter((ticket) => {
    if (ticket.eventId !== eventId) return false;
    if (status && ticket.status !== status) return false;
    return true;
  });
  return lovableTicketsToOrderRefs(filtered);
}

export const TicketDetailPage: React.FC = () => {
  const { orderId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);

  const locationState = location.state as TicketDetailLocationState | null;
  const group = locationState?.group;
  const preferredTicketId = locationState?.ticketId;
  const eventMeta = locationState?.eventMeta;
  const preloadedTickets = locationState?.preloadedTickets;

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketWithOrderRef[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>();
  const [orderExpiresAtTs, setOrderExpiresAtTs] = useState<number | undefined>();
  const [orderCreatedAt, setOrderCreatedAt] = useState<string | undefined>();
  const [refundEligible, setRefundEligible] = useState(true);
  const [refundEligibilityMessage, setRefundEligibilityMessage] = useState('');
  const [resolvedEventImage, setResolvedEventImage] = useState(eventMeta?.eventImage || '');
  const [resolvedEventVideo, setResolvedEventVideo] = useState(eventMeta?.eventVideo || '');

  const decodedOrderId = decodeURIComponent(orderId);

  const reloadTickets = async () => {
    if (!orderId) return;
    const detail = await fetchOrderById(decodedOrderId);
    if (!detail) return;
    const enriched = await enrichOrderWithQrUrls(detail);
    const orderTickets = (enriched.tickets || []).map((ticket) => ({
      ...ticket,
      orderRef: decodedOrderId,
      paymentStatus: enriched.payment_status,
    })) as TicketWithOrderRef[];
    setTickets(orderTickets);
    setPaymentStatus(enriched.payment_status);
  };

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);

    const load = async () => {
      try {
        if (group) {
          const eventTickets = collectTicketsFromGroup(group);
          const orderTickets = eventTickets.filter((t) => t.orderRef === decodedOrderId);
          if (orderTickets.length > 0) {
            const enriched = await enrichTicketsWithQrUrls(orderTickets);
            setTickets(enriched);
            setPaymentStatus(enriched[0]?.paymentStatus);
            const preferredIdx = enriched.findIndex(
              (t) => (t.ticket_id || t.ticketInstanceId) === preferredTicketId,
            );
            if (preferredIdx >= 0) setActiveIndex(preferredIdx);
            return;
          }
        }

        if (preloadedTickets?.length) {
          const scopedTickets = preloadedTickets.filter((t) => {
            if (eventMeta?.eventId && t.eventId !== eventMeta.eventId) return false;
            return true;
          });
          const orderTickets = lovableTicketsToOrderRefs(scopedTickets);
          if (orderTickets.length > 0) {
            const enriched = await enrichTicketsWithQrUrls(orderTickets);
            setTickets(enriched);
            setPaymentStatus(enriched[0]?.paymentStatus);
            const preferredIdx = enriched.findIndex(
              (t) => (t.ticket_id || t.ticketInstanceId) === preferredTicketId,
            );
            if (preferredIdx >= 0) setActiveIndex(preferredIdx);
            return;
          }
        }

        if (userId && eventMeta?.eventId) {
          const eventTickets = await loadEventTicketsForUser(userId, eventMeta.eventId);
          if (eventTickets.length > 0) {
            const enriched = await enrichTicketsWithQrUrls(eventTickets);
            setTickets(enriched);
            setPaymentStatus(enriched[0]?.paymentStatus);
            const preferredIdx = enriched.findIndex(
              (t) => (t.ticket_id || t.ticketInstanceId) === preferredTicketId,
            );
            if (preferredIdx >= 0) setActiveIndex(preferredIdx);
            return;
          }
        }

        const detail = await fetchOrderById(decodedOrderId);
        if (detail) {
          const enriched = await enrichOrderWithQrUrls(detail);
          const orderTickets = (enriched.tickets || []).map((ticket) => ({
            ...ticket,
            orderRef: decodedOrderId,
            paymentStatus: enriched.payment_status,
          })) as TicketWithOrderRef[];
          setTickets(orderTickets);
          setPaymentStatus(enriched.payment_status);
          setOrderExpiresAtTs(resolveOrderExpiresAtTs(enriched) || undefined);
          setOrderCreatedAt(
            enriched.created_at
            || enriched.metadata?.created_at
            || (enriched as { order_date?: string }).order_date,
          );
          if (preferredTicketId) {
            const preferredIdx = orderTickets.findIndex(
              (t) => (t.ticket_id || t.ticketInstanceId) === preferredTicketId,
            );
            if (preferredIdx >= 0) setActiveIndex(preferredIdx);
          }
        }
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'No se pudo cargar la boleta', 'error');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [orderId, group, preferredTicketId, preloadedTickets, showToast, userId, eventMeta?.eventId]);

  useEffect(() => {
    const baseEventId = group?.eventId || eventMeta?.eventId || '';
    if (!baseEventId) return;
    let cancelled = false;
    fetchEventDetail(baseEventId)
      .then((detail) => {
        if (cancelled || !detail) return;
        const video = normalizeEventVideo(detail.event?.video);
        const image = resolveEventImageUrl(detail.images?.[0] || detail.event?.imagen);
        if (video) setResolvedEventVideo(video);
        if (image && !(video && isPlaceholderEventImage(image))) {
          setResolvedEventImage(image);
        } else if (!video && image) {
          setResolvedEventImage(image);
        }
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [group?.eventId, eventMeta?.eventId]);

  useEffect(() => {
    if (!preferredTicketId || !tickets.length) return;
    const idx = tickets.findIndex(
      (t) => (t.ticket_id || t.ticketInstanceId) === preferredTicketId,
    );
    if (idx >= 0) setActiveIndex(idx);
  }, [tickets, preferredTicketId]);

  const eventName = group?.eventName || eventMeta?.eventName || tickets[0]?.category || 'Evento';
  const eventDate = group?.eventDate || eventMeta?.eventDate || '—';
  const eventTime = group?.eventTime || eventMeta?.eventTime || '';
  const eventIdResolved = group?.eventId || eventMeta?.eventId || '';
  const eventImage = resolvedEventImage || group?.eventImage || eventMeta?.eventImage || '';
  const eventVideo = resolvedEventVideo || eventMeta?.eventVideo || '';

  const isPaid = ['APPROVED', 'approved', 'PAID', 'paid', 'SOLD', 'sold'].includes(String(paymentStatus || ''));

  useEffect(() => {
    if (!userId || !eventIdResolved || !decodedOrderId || !isPaid) {
      setRefundEligible(false);
      return;
    }
    let cancelled = false;
    checkRefundEligibility(eventIdResolved, userId, decodedOrderId)
      .then((res) => {
        if (cancelled) return;
        setRefundEligible(Boolean(res?.canRequestRefund));
        setRefundEligibilityMessage(res?.reason || '');
      })
      .catch(() => {
        if (!cancelled) {
          setRefundEligible(false);
          setRefundEligibilityMessage('No se pudo verificar la elegibilidad de reembolso.');
        }
      });
    return () => { cancelled = true; };
  }, [userId, eventIdResolved, decodedOrderId, isPaid]);

  const ticketMeta: Ticket = useMemo(() => {
    const active = tickets[activeIndex] || tickets[0];
    const pendingReservation = !isPaid && userId
      ? listStoredReservationsForUser(userId).find((r) => r.orderId === decodedOrderId)
      : undefined;
    const purchaseDate = orderCreatedAt
      ? new Date(orderCreatedAt).toLocaleDateString('es-CO')
      : eventDate;
    return {
      id: active?.ticket_id || active?.ticketInstanceId || decodedOrderId,
      orderNumber: decodedOrderId.slice(-6).toUpperCase(),
      orderDate: purchaseDate,
      eventTitle: eventName,
      eventImage,
      eventVideo: eventVideo || undefined,
      eventDate,
      startTime: eventTime,
      category: active?.category || 'General',
      seat: active?.seatLabel || '',
      seatLabel: active?.seatLabel,
      entrance: 'Entrada principal',
      qrCode: active?.qr_code || active?.qrCodeKey || active?.ticket_id || active?.ticketInstanceId || '',
      qrUrl: active?.qr_url,
      orderRef: decodedOrderId,
      orderId: decodedOrderId,
      status: isPaid ? 'aprobada' : 'pendiente',
      eventId: eventIdResolved,
      price: typeof active?.price === 'number' ? active.price : undefined,
      paymentExpiresAtTs: orderExpiresAtTs || pendingReservation?.expiresAtTs,
      eventTicketCount: tickets.length > 1 ? tickets.length : undefined,
    };
  }, [
    tickets,
    activeIndex,
    decodedOrderId,
    orderCreatedAt,
    eventDate,
    eventName,
    eventImage,
    eventVideo,
    eventTime,
    isPaid,
    eventIdResolved,
    orderExpiresAtTs,
    userId,
  ]);

  const entries: BoletaEntry[] = useMemo(() => {
    return tickets.map((t, i) => {
      const id = t.ticket_id || t.ticketInstanceId || `${decodedOrderId}-${i}`;
      const code = (t.seatLabel || t.seat_code || `A${i + 1}`).replace(/^Silla\s*-?\s*/i, '');
      return {
        id,
        code,
        date: eventDate,
        qrData: t.qr_code || t.qrCodeKey || t.ticketInstanceId || t.ticket_id || id,
        qrUrl: t.qr_url,
        value: typeof t.price === 'number' ? t.price : 0,
        ticketInstanceId: t.ticketInstanceId || t.ticket_id || id,
      };
    });
  }, [tickets, decodedOrderId, eventDate]);

  const orderCode = `N°${decodedOrderId.slice(-6).toUpperCase()}`;

  const handleTransfer = async (ticketInstanceIds: string[], recipient: TransferRecipient) => {
    if (!userId) throw new Error('Debes iniciar sesión para compartir');
    const byOrder = new Map<string, string[]>();
    ticketInstanceIds.forEach((id) => {
      const ticket = tickets.find(
        (t) => (t.ticket_id || t.ticketInstanceId) === id,
      );
      const orderRef = ticket?.orderRef || decodedOrderId;
      if (!byOrder.has(orderRef)) byOrder.set(orderRef, []);
      byOrder.get(orderRef)!.push(id);
    });

    for (const [orderRef, ids] of byOrder) {
      await transferTicketsToUser({
        ticketIds: ids,
        currentUserId: userId,
        orderId: orderRef,
        newUserId: recipient.id,
        targetEmail: recipient.email,
        targetUsername: (recipient.username || '').replace(/^@/, '') || undefined,
      });
    }

    showToast('Boleta(s) compartida(s). Se generó un nuevo código QR para el destinatario.', 'success');
    if (userId && eventIdResolved) {
      const refreshed = await loadEventTicketsForUser(userId, eventIdResolved);
      const enriched = await enrichTicketsWithQrUrls(refreshed);
      setTickets(enriched);
      setPaymentStatus(enriched[0]?.paymentStatus);
    } else {
      await reloadTickets();
    }
    if (ticketInstanceIds.length >= tickets.length) {
      navigate('/tickets', { replace: true });
    }
  };

  const handleRefund = async (ticketInstanceIds: string[]) => {
    if (!userId) throw new Error('Debes iniciar sesión');
    const result = await requestEventRefund({
      userId,
      orderId: decodedOrderId,
      reason: 'Solicitud desde detalle de boleta',
      ticketInstanceIds,
    });
    showToast(`Reembolso radicado. ID: ${result.filingId}`, 'success');
    await reloadTickets();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <Loader />
      </div>
    );
  }

  if (!tickets.length) {
    return (
      <div className="min-h-screen bg-secondary px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">No se encontraron boletas para esta orden.</p>
        <button
          type="button"
          onClick={() => navigate('/tickets')}
          className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground"
        >
          Volver a mis boletas
        </button>
      </div>
    );
  }

  return (
    <TicketDetailView
      ticket={ticketMeta}
      entries={entries}
      orderCode={orderCode}
      activeIndex={activeIndex}
      onActiveIndexChange={setActiveIndex}
      onBack={() => navigate('/tickets')}
      onViewEventDetail={eventIdResolved ? () => navigate(`/events/${eventIdResolved}`) : undefined}
      onTransfer={userId && isPaid ? handleTransfer : undefined}
      onRefund={userId && isPaid ? handleRefund : undefined}
      canTransfer={Boolean(userId && isPaid)}
      canRefund={Boolean(userId && isPaid)}
      refundEligible={refundEligible}
      refundEligibilityMessage={refundEligibilityMessage}
      currentUserId={userId || undefined}
    />
  );
};

export default TicketDetailPage;
