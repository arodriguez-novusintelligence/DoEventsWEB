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
  formatDisplayOrderId,
  formatDisplayTicketId,
  computeTicketServiceFee,
  emitNotificationsUpdated,
  formatTransferredAt,
  getPersistedUserDisplayName,
  isTicketReceivedByTransfer,
  isTicketTransferredOut,
  Loader,
  requestEventRefund,
  resolveEventImageUrl,
  resolveEventVideoUrl,
  resolveOrderExpiresAtTs,
  resolveTransferredAt,
  resolveTransferredFromName,
  resolveTransferredToName,
  isPlaceholderEventImage,
  listStoredReservationsForUser,
  RootState,
  transferTicketsToUser,
  useToast,
} from '@doevents/shared';
import type { TicketEventGroup, TicketWithOrderRef } from '@doevents/shared';
import type { Ticket } from '@lovable/data/ticketsData';
import TicketDetailView from '@lovable/components/tickets/TicketDetailView';
import { groupedTicketsToLovable, enrichTicketsCategoryColors, lovableTicketsToOrderRefs, extractSeatLabel } from '../lovable-bridge/ticketsAdapter';
import type { BoletaEntry } from '@lovable/components/tickets/TransferTicketFlow';
import type { TransferRecipient } from '@lovable/components/tickets/TransferTicketFlow';

interface TicketDetailLocationState {
  group?: TicketEventGroup;
  ticketId?: string;
  from?: string;
  openAction?: 'transfer' | 'refund';
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
  const lovable = await enrichTicketsCategoryColors(groupedTicketsToLovable(grouped));
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
  const openAction = locationState?.openAction;
  const ticketsBackPath = '/tickets';
  const [displayOrderId, setDisplayOrderId] = useState<string | undefined>();

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
  const [orderUserId, setOrderUserId] = useState<string | undefined>();
  const [orderIsRefunded, setOrderIsRefunded] = useState(false);

  const decodedOrderId = decodeURIComponent(orderId);

  const applyOrderDetail = async (
    detail: NonNullable<Awaited<ReturnType<typeof fetchOrderById>>>,
    preferredId?: string,
  ) => {
    const enriched = await enrichOrderWithQrUrls(detail);
    const ownerId = (enriched as { user_id?: string }).user_id;
    const orderTransferFrom = (enriched as {
      transferred_from?: TicketWithOrderRef['transferred_from'];
    }).transferred_from;
    setOrderUserId(ownerId);
    setDisplayOrderId((enriched as { display_order_id?: string }).display_order_id);
    const refundFlag = Boolean(
      (enriched as { is_refunded?: boolean }).is_refunded
      || ['COMPLETED', 'PENDING', 'PENDING_REFUND'].includes(
        String((enriched as { refund_status?: string }).refund_status || '').toUpperCase(),
      )
      || String(enriched.payment_status || '').toUpperCase() === 'REFUNDED',
    );
    setOrderIsRefunded(refundFlag);
    const orderTickets = (enriched.tickets || []).map((ticket) => ({
      ...ticket,
      orderRef: decodedOrderId,
      paymentStatus: enriched.payment_status,
      transferred_from: ticket.transferred_from || orderTransferFrom,
    })) as TicketWithOrderRef[];
    setTickets(orderTickets);
    setPaymentStatus(enriched.payment_status);
    setOrderExpiresAtTs(resolveOrderExpiresAtTs(enriched) || undefined);
    setOrderCreatedAt(
      enriched.created_at
      || enriched.metadata?.created_at
      || (enriched as { order_date?: string }).order_date,
    );
    const preferredIdx = preferredId
      ? orderTickets.findIndex((t) => (t.ticket_id || t.ticketInstanceId) === preferredId)
      : -1;
    if (preferredIdx >= 0) setActiveIndex(preferredIdx);
  };

  const reloadTickets = async () => {
    if (!orderId) return;
    const detail = await fetchOrderById(decodedOrderId);
    if (!detail) return;
    await applyOrderDetail(detail);
  };

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);

    const load = async () => {
      try {
        const detail = await fetchOrderById(decodedOrderId);
        if (detail?.tickets?.length) {
          await applyOrderDetail(detail, preferredTicketId);
          return;
        }

        if (group) {
          const eventTickets = collectTicketsFromGroup(group);
          const orderTickets = eventTickets.filter((t) => t.orderRef === decodedOrderId);
          if (orderTickets.length > 0) {
            const enriched = await enrichTicketsWithQrUrls(orderTickets, orderUserId);
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
            const sameOrder = (t.orderId || t.orderRef) === decodedOrderId;
            if (!sameOrder) return false;
            if (eventMeta?.eventId && t.eventId !== eventMeta.eventId) return false;
            return true;
          });
          const orderTickets = lovableTicketsToOrderRefs(scopedTickets);
          if (orderTickets.length > 0) {
            const enriched = await enrichTicketsWithQrUrls(orderTickets, orderUserId);
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
          const orderTickets = eventTickets.filter((t) => t.orderRef === decodedOrderId);
          if (orderTickets.length > 0) {
            const enriched = await enrichTicketsWithQrUrls(orderTickets, orderUserId);
            setTickets(enriched);
            setPaymentStatus(enriched[0]?.paymentStatus);
            const preferredIdx = enriched.findIndex(
              (t) => (t.ticket_id || t.ticketInstanceId) === preferredTicketId,
            );
            if (preferredIdx >= 0) setActiveIndex(preferredIdx);
            return;
          }
        }

        if (detail) {
          await applyOrderDetail(detail, preferredTicketId);
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
    const seatLabel = active ? extractSeatLabel(active) : '';
    const pendingReservation = !isPaid && userId
      ? listStoredReservationsForUser(userId).find((r) => r.orderId === decodedOrderId)
      : undefined;
    const purchaseDate = orderCreatedAt
      ? new Date(orderCreatedAt).toLocaleDateString('es-CO')
      : eventDate;
    return {
      id: active?.ticket_id || active?.ticketInstanceId || decodedOrderId,
      orderNumber: formatDisplayOrderId(decodedOrderId, displayOrderId),
      orderDate: purchaseDate,
      eventTitle: eventName,
      eventImage,
      eventVideo: eventVideo || undefined,
      eventDate,
      startTime: eventTime,
      category: active?.category || 'General',
      seat: seatLabel || '—',
      seatLabel: seatLabel || undefined,
      entrance: 'Entrada principal',
      qrCode: active ? formatDisplayTicketId(active) : '',
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
    displayOrderId,
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
      const id =
        t.ticketInstanceId ||
        t.ticket_id ||
        t.display_ticket_id ||
        `${decodedOrderId}-${i}`;
      const seatLabel = extractSeatLabel(t);
      const code = seatLabel || `General ${i + 1}`;
      const transferredOut = isTicketTransferredOut(t, orderUserId);
      const receivedByTransfer = isTicketReceivedByTransfer(t);
      const transferredAtRaw = resolveTransferredAt(t);
      const faceValue = Number(
        t.price ?? t.purchasePrice ?? t.ticket_amount ?? 0,
      ) || 0;
      const explicitFee = Number(t.additional_charges_amount);
      const feeFromCharges = Array.isArray(t.additional_charges)
        ? t.additional_charges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
        : 0;
      const platformFee = Number.isFinite(explicitFee) && explicitFee > 0
        ? explicitFee
        : feeFromCharges > 0
          ? feeFromCharges
          : computeTicketServiceFee(faceValue);
      const refundStatus = String(t.refund_status || '').toUpperCase();
      const ticketStatus = String(t.ticket_status || '').toUpperCase();
      const isRefunded = Boolean(
        orderIsRefunded
        || (t as { is_refunded?: boolean }).is_refunded === true
        || refundStatus === 'REFUNDED'
        || refundStatus === 'PENDING_REFUND'
        || refundStatus === 'PENDING'
        || refundStatus === 'COMPLETED'
        || ticketStatus === 'REFUNDED'
        || ticketStatus === 'PENDING_REFUND',
      );
      return {
        id,
        code,
        date: eventDate,
        qrData: transferredOut || isRefunded ? '' : formatDisplayTicketId(t),
        qrUrl: transferredOut || isRefunded ? undefined : t.qr_url,
        value: faceValue,
        platformFee,
        ticketInstanceId: t.ticketInstanceId || t.ticket_id || id,
        seatLabel: seatLabel || undefined,
        category: t.category,
        isTransferredOut: transferredOut,
        isReceivedByTransfer: receivedByTransfer,
        isTransferred: transferredOut || receivedByTransfer,
        isRefunded,
        transferredAt: transferredAtRaw ? formatTransferredAt(transferredAtRaw) : undefined,
        transferredToName: resolveTransferredToName(t)
          || (receivedByTransfer ? getPersistedUserDisplayName() || undefined : undefined),
        transferredFromName: resolveTransferredFromName(t),
      };
    });
  }, [tickets, decodedOrderId, eventDate, orderUserId, orderIsRefunded]);

  const activeTicketsCount = useMemo(
    () => tickets.filter((t) => !isTicketTransferredOut(t, orderUserId)).length,
    [tickets, orderUserId],
  );

  const orderCode = `N°${formatDisplayOrderId(decodedOrderId, displayOrderId)}`;

  const handleTransfer = async (ticketInstanceIds: string[], recipient: TransferRecipient) => {
    if (!userId) throw new Error('Debes iniciar sesión para compartir');
    const resolveTicketInstanceId = (selectedId: string) => {
      const entry = entries.find(
        (e) => e.id === selectedId || e.ticketInstanceId === selectedId,
      );
      if (entry?.ticketInstanceId) return entry.ticketInstanceId;
      const ticket = tickets.find(
        (t) =>
          t.ticketInstanceId === selectedId ||
          t.ticket_id === selectedId ||
          t.display_ticket_id === selectedId,
      );
      return ticket?.ticketInstanceId || ticket?.ticket_id || selectedId;
    };

    const byOrder = new Map<string, string[]>();
    ticketInstanceIds.forEach((id) => {
      const resolvedId = resolveTicketInstanceId(id);
      const ticket = tickets.find(
        (t) =>
          t.ticketInstanceId === resolvedId ||
          t.ticket_id === resolvedId ||
          t.display_ticket_id === resolvedId,
      );
      const orderRef = ticket?.orderRef || decodedOrderId;
      if (!byOrder.has(orderRef)) byOrder.set(orderRef, []);
      byOrder.get(orderRef)!.push(resolvedId);
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
    emitNotificationsUpdated();
    await reloadTickets();
    const detail = await fetchOrderById(decodedOrderId);
    const ownerId = detail ? (detail as { user_id?: string }).user_id : orderUserId;
    const remaining = (detail?.tickets || []).filter(
      (t) => !isTicketTransferredOut(t, ownerId),
    ).length;
    if (remaining === 0) {
      navigate(ticketsBackPath, { replace: true });
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
    showToast(
      `Reembolso radicado por $${result.refundAmount.toLocaleString('es-CO')}. ID: ${result.filingId}`,
      'success',
    );
    emitNotificationsUpdated();
    await reloadTickets();
  };

  const refundableCount = useMemo(
    () => entries.filter((e) => !e.isTransferredOut && !e.isRefunded).length,
    [entries],
  );

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
          onClick={() => navigate(ticketsBackPath)}
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
      orderDate={ticketMeta.orderDate}
      activeIndex={activeIndex}
      onActiveIndexChange={setActiveIndex}
      onBack={() => navigate(ticketsBackPath)}
      onViewEventDetail={eventIdResolved ? () => navigate(`/events/${eventIdResolved}`) : undefined}
      onTransfer={userId && isPaid ? handleTransfer : undefined}
      onRefund={userId && isPaid && refundableCount > 0 ? handleRefund : undefined}
      canTransfer={Boolean(userId && isPaid && activeTicketsCount > 0)}
      canRefund={Boolean(userId && isPaid && refundableCount > 0)}
      refundEligible={refundEligible}
      refundEligibilityMessage={refundEligibilityMessage}
      currentUserId={userId || undefined}
      initialAction={openAction}
    />
  );
};

export default TicketDetailPage;
