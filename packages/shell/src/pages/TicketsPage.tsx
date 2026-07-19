import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  cancelTicketOrder,
  clearStoredReservation,
  fetchEventDetail,
  fetchGroupedUserTickets,
  fetchTicketQrUrl,
  isPlaceholderEventImage,
  listStoredReservationsForUser,
  resolveEventImageUrl,
  resolveEventVideoUrl,
  RootState,
  useToast,
} from '@doevents/shared';
import MyTicketsView from '@lovable/components/tickets/MyTicketsView';
import type { Ticket, TicketStatus } from '@lovable/data/ticketsData';
import { groupedTicketsToLovable, enrichTicketsCategoryColors, recoverMissingPendingTickets } from '../lovable-bridge/ticketsAdapter';

function resolveNavigableOrderId(ticket: Ticket): string | null {
  const raw = ticket.orderId || ticket.orderRef || '';
  if (!raw || raw === '—') return null;
  return raw;
}

function normalizeEventVideo(video?: string): string | undefined {
  return resolveEventVideoUrl(video);
}

async function enrichTicketsWithEventMedia(tickets: Ticket[]): Promise<Ticket[]> {
  const eventIds = [...new Set(tickets.map((t) => t.eventId).filter(Boolean))] as string[];
  if (!eventIds.length) return tickets;

  const mediaByEvent = new Map<string, { image?: string; video?: string }>();
  await Promise.all(eventIds.map(async (eventId) => {
    const detail = await fetchEventDetail(eventId).catch(() => null);
    if (!detail) return;
    const video = normalizeEventVideo(detail.event?.video);
    const image = resolveEventImageUrl(detail.images?.[0] || detail.event?.imagen);
    mediaByEvent.set(eventId, {
      image: video && isPlaceholderEventImage(image) ? '' : image,
      video,
    });
  }));

  return tickets.map((ticket) => {
    if (!ticket.eventId) return ticket;
    const media = mediaByEvent.get(ticket.eventId);
    if (!media) return ticket;
    const resolvedVideo = media.video || ticket.eventVideo;
    const resolvedImage = media.image || ticket.eventImage;
    return {
      ...ticket,
      eventImage: resolvedVideo && isPlaceholderEventImage(resolvedImage) ? '' : resolvedImage,
      eventVideo: resolvedVideo,
    };
  });
}

async function enrichTicketsWithQr(tickets: Ticket[]): Promise<Ticket[]> {
  return Promise.all(tickets.map(async (ticket) => {
    if (ticket.isRefunded || ticket.isTransferredOut) {
      return { ...ticket, qrUrl: undefined, qrCode: '' };
    }
    if (ticket.qrUrl) return ticket;
    const ticketId = ticket.ticketInstanceId || ticket.id;
    if (!ticketId) return ticket;
    const qrUrl = await fetchTicketQrUrl(ticketId, ticket.qrCode || undefined).catch(() => null);
    return qrUrl ? { ...ticket, qrUrl } : ticket;
  }));
}

function enrichPendingWithReservations(tickets: Ticket[], userId: string): Ticket[] {
  const reservations = listStoredReservationsForUser(userId);
  const byOrder = new Map(reservations.map((r) => [r.orderId, r]));
  return tickets.map((ticket) => {
    if (ticket.status !== 'pendiente') return ticket;
    const reservation = byOrder.get(ticket.orderId || ticket.orderRef || '');
    if (!reservation) return ticket;
    return { ...ticket, paymentExpiresAtTs: reservation.expiresAtTs };
  });
}

export const TicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const locationState = (location.state as {
    from?: string;
    tab?: TicketStatus;
    orderId?: string;
  } | null) || {};
  const fromProfile = locationState.from === 'profile';
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [initialTab] = useState<TicketStatus | undefined>(() => {
    if (locationState.tab === 'pendiente') return 'pendiente';
    if (locationState.tab === 'aprobada' || locationState.from === 'payment-success') return 'aprobada';
    return undefined;
  });

  const reloadTickets = async () => {
    if (!userId) {
      setTickets([]);
      setLoading(false);
      setLoadError(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const grouped = await fetchGroupedUserTickets(userId);
      const base = await enrichTicketsCategoryColors(groupedTicketsToLovable(grouped));
      const withOrphans = await recoverMissingPendingTickets(userId, base);
      const withExpiry = enrichPendingWithReservations(withOrphans, userId);
      const withMedia = await enrichTicketsWithEventMedia(withExpiry);
      const enriched = await enrichTicketsWithQr(withMedia);
      setTickets(enriched);
    } catch (err) {
      setTickets([]);
      setLoadError(err instanceof Error ? err.message : 'Error al cargar boletas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    void reloadTickets();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const timer = window.setInterval(() => {
      const reservations = listStoredReservationsForUser(userId);
      if (!reservations.length) return;
      const expired = reservations.filter((r) => r.expiresAtTs <= Date.now());
      if (!expired.length) return;
      void Promise.all(
        expired.map(async (reservation) => {
          try {
            await cancelTicketOrder(reservation.orderId, userId);
            clearStoredReservation(reservation.eventId, userId);
          } catch {
            clearStoredReservation(reservation.eventId, userId);
          }
        }),
      ).then(() => {
        showToast('Una reserva expiró. Las sillas están disponibles nuevamente.', 'error');
        void reloadTickets();
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [userId, showToast]);

  return (
    <MyTicketsView
      tickets={tickets}
      loading={loading}
      loadError={loadError}
      onRetry={() => void reloadTickets()}
      initialTab={initialTab}
      onBack={() => (fromProfile ? navigate('/profile') : navigate('/'))}
      onViewEventDetail={(eventId) => navigate(`/events/${eventId}`)}
      onOpenTicketDetail={(ticket, action) => {
        const navigableOrderId = resolveNavigableOrderId(ticket);
        if (!navigableOrderId) {
          showToast('No se encontró la orden de esta boleta. Intenta recargar la página.', 'error');
          return;
        }
        if (ticket.status === 'pendiente' && !action) {
          navigate(`/orders/${encodeURIComponent(navigableOrderId)}/confirm`, {
            state: {
              eventId: ticket.eventId,
              eventName: ticket.eventTitle,
              hasSeating: Boolean(ticket.seatLabel && ticket.seatLabel !== '—'),
            },
          });
          return;
        }
        navigate(`/tickets/${encodeURIComponent(navigableOrderId)}`, {
          state: {
            ticketId: ticket.ticketInstanceId || ticket.id,
            preloadedTickets: tickets.filter((t) => {
              const sameOrder = (t.orderId || t.orderRef) === (ticket.orderId || ticket.orderRef);
              const sameStatus = t.status === ticket.status;
              return sameOrder && sameStatus;
            }),
            eventMeta: {
              eventId: ticket.eventId,
              eventName: ticket.eventTitle,
              eventImage: ticket.eventImage,
              eventVideo: ticket.eventVideo,
              eventDate: ticket.eventDate,
              eventTime: ticket.startTime,
            },
            openAction: action,
          },
        });
      }}
      onRefresh={() => void reloadTickets()}
      onExploreEvents={() => navigate('/events')}
    />
  );
};

export default TicketsPage;
