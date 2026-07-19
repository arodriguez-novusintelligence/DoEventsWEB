import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  cancelTicketOrder,
  clearStoredReservation,
  fetchAndCachePurchaseCounts,
  fetchEventDetail,
  fetchGroupedUserTickets,
  fetchTicketQrUrl,
  fetchUserServiceBookings,
  fetchUserVenueBookings,
  hydratePurchaseCounts,
  isPlaceholderEventImage,
  listStoredReservationsForUser,
  resolveEventImageUrl,
  resolveEventVideoUrl,
  RootState,
  setCachedPurchaseCounts,
  useToast,
  type UserServiceBooking,
  type UserVenueBooking,
} from '@doevents/shared';
import MyPurchasesView from '@lovable/components/purchases/MyPurchasesView';
import type { Ticket } from '@lovable/data/ticketsData';
import { groupedTicketsToLovable, enrichTicketsCategoryColors, recoverMissingPendingTickets } from '../lovable-bridge/ticketsAdapter';

type PurchaseSection = 'boletos' | 'lugares' | 'servicios';

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
    // Nunca regenerar QR de boletas reembolsadas o transferidas salientes
    if (ticket.isRefunded || ticket.isTransferredOut) {
      return { ...ticket, qrUrl: undefined, qrCode: ticket.isRefunded || ticket.isTransferredOut ? '' : ticket.qrCode };
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

function buildHubState(userId: string | undefined) {
  const hydrated = hydratePurchaseCounts(userId || '');
  return {
    ticketCount: hydrated.counts.ticketCount,
    venueCount: hydrated.counts.venueCount,
    serviceCount: hydrated.counts.serviceCount,
    countsLoading: !hydrated.hasSnapshot,
    hasCountsSnapshot: hydrated.hasSnapshot,
    cacheIsFresh: hydrated.isFresh,
  };
}

export const PurchasesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);

  const initialSection = (location.state as { section?: PurchaseSection } | null)?.section ?? null;

  const initialHub = useMemo(() => buildHubState(userId), [userId]);

  const [ticketCount, setTicketCount] = useState(initialHub.ticketCount);
  const [venueCount, setVenueCount] = useState(initialHub.venueCount);
  const [serviceCount, setServiceCount] = useState(initialHub.serviceCount);
  const [countsLoading, setCountsLoading] = useState(initialHub.countsLoading);
  const [hasCountsSnapshot, setHasCountsSnapshot] = useState(initialHub.hasCountsSnapshot);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [venueBookings, setVenueBookings] = useState<UserVenueBooking[]>([]);
  const [serviceBookings, setServiceBookings] = useState<UserServiceBooking[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [ticketsLoadError, setTicketsLoadError] = useState<string | null>(null);
  const [venuesLoadError, setVenuesLoadError] = useState<string | null>(null);
  const [servicesLoadError, setServicesLoadError] = useState<string | null>(null);

  const dataLoadedRef = useRef({ tickets: false, venues: false, services: false });
  const revalidateInFlightRef = useRef(false);

  const applyCounts = useCallback((ticket: number, venue: number, service: number) => {
    setTicketCount(ticket);
    setVenueCount(venue);
    setServiceCount(service);
    setHasCountsSnapshot(true);
  }, []);

  const syncCountsToCache = useCallback((ticket: number, venue: number, service: number) => {
    if (!userId) return;
    setCachedPurchaseCounts(userId, {
      ticketCount: ticket,
      venueCount: venue,
      serviceCount: service,
    });
  }, [userId]);

  const revalidateCountsInBackground = useCallback(async () => {
    if (!userId || revalidateInFlightRef.current) return;
    revalidateInFlightRef.current = true;
    try {
      const counts = await fetchAndCachePurchaseCounts(userId);
      applyCounts(counts.ticketCount, counts.venueCount, counts.serviceCount);
    } catch {
      // conservar snapshot visible
    } finally {
      setCountsLoading(false);
      revalidateInFlightRef.current = false;
    }
  }, [userId, applyCounts]);

  const refreshCounts = useCallback(async (force = false) => {
    if (!userId) {
      applyCounts(0, 0, 0);
      setCountsLoading(false);
      setHasCountsSnapshot(false);
      return;
    }

    const hydrated = hydratePurchaseCounts(userId);
    if (hydrated.hasSnapshot) {
      applyCounts(
        hydrated.counts.ticketCount,
        hydrated.counts.venueCount,
        hydrated.counts.serviceCount,
      );
    }

    if (!force && hydrated.isFresh) {
      setCountsLoading(false);
      return;
    }

    if (hydrated.hasSnapshot) {
      setCountsLoading(false);
      await revalidateCountsInBackground();
      return;
    }

    setCountsLoading(true);
    await revalidateCountsInBackground();
  }, [userId, applyCounts, revalidateCountsInBackground]);

  const reloadTickets = useCallback(async () => {
    if (!userId) {
      setTickets([]);
      setTicketsLoading(false);
      setTicketsLoadError(null);
      dataLoadedRef.current.tickets = true;
      return;
    }
    setTicketsLoading(true);
    setTicketsLoadError(null);
    try {
      const grouped = await fetchGroupedUserTickets(userId);
      const base = await enrichTicketsCategoryColors(groupedTicketsToLovable(grouped));
      const withOrphans = await recoverMissingPendingTickets(userId, base);
      const withExpiry = enrichPendingWithReservations(withOrphans, userId);
      const withMedia = await enrichTicketsWithEventMedia(withExpiry);
      const enriched = await enrichTicketsWithQr(withMedia);
      setTickets(enriched);
      const nextTicketCount = enriched.filter(
        (t) => t.status === 'aprobada' || t.status === 'pendiente',
      ).length;
      setTicketCount(nextTicketCount);
      setVenueCount((venue) => {
        setServiceCount((service) => {
          syncCountsToCache(nextTicketCount, venue, service);
          return service;
        });
        return venue;
      });
      setHasCountsSnapshot(true);
      dataLoadedRef.current.tickets = true;
    } catch (err) {
      setTickets([]);
      setTicketsLoadError(err instanceof Error ? err.message : 'Error al cargar boletas');
    } finally {
      setTicketsLoading(false);
    }
  }, [userId, syncCountsToCache]);

  const reloadVenues = useCallback(async () => {
    if (!userId) {
      setVenueBookings([]);
      setVenuesLoading(false);
      setVenuesLoadError(null);
      dataLoadedRef.current.venues = true;
      return;
    }
    setVenuesLoading(true);
    setVenuesLoadError(null);
    try {
      const rows = await fetchUserVenueBookings(userId);
      setVenueBookings(rows);
      setVenueCount(rows.length);
      setTicketCount((ticket) => {
        setServiceCount((service) => {
          syncCountsToCache(ticket, rows.length, service);
          return service;
        });
        return ticket;
      });
      setHasCountsSnapshot(true);
      dataLoadedRef.current.venues = true;
    } catch (err) {
      setVenueBookings([]);
      setVenuesLoadError(err instanceof Error ? err.message : 'No se pudieron cargar las reservas de lugares');
    } finally {
      setVenuesLoading(false);
    }
  }, [userId, syncCountsToCache]);

  const reloadServices = useCallback(async () => {
    if (!userId) {
      setServiceBookings([]);
      setServicesLoading(false);
      setServicesLoadError(null);
      dataLoadedRef.current.services = true;
      return;
    }
    setServicesLoading(true);
    setServicesLoadError(null);
    try {
      const rows = await fetchUserServiceBookings(userId);
      setServiceBookings(rows);
      setServiceCount(rows.length);
      setTicketCount((ticket) => {
        setVenueCount((venue) => {
          syncCountsToCache(ticket, venue, rows.length);
          return venue;
        });
        return ticket;
      });
      setHasCountsSnapshot(true);
      dataLoadedRef.current.services = true;
    } catch (err) {
      setServiceBookings([]);
      setServicesLoadError(err instanceof Error ? err.message : 'No se pudieron cargar las reservas de servicios');
    } finally {
      setServicesLoading(false);
    }
  }, [userId, syncCountsToCache]);

  const handleSectionOpen = useCallback((section: PurchaseSection) => {
    if (section === 'boletos' && !dataLoadedRef.current.tickets) void reloadTickets();
    if (section === 'lugares' && !dataLoadedRef.current.venues) void reloadVenues();
    if (section === 'servicios' && !dataLoadedRef.current.services) void reloadServices();
  }, [reloadTickets, reloadVenues, reloadServices]);

  useEffect(() => {
    const hub = buildHubState(userId);
    setTicketCount(hub.ticketCount);
    setVenueCount(hub.venueCount);
    setServiceCount(hub.serviceCount);
    setHasCountsSnapshot(hub.hasCountsSnapshot);
    setCountsLoading(!hub.hasCountsSnapshot);
    dataLoadedRef.current = { tickets: false, venues: false, services: false };
    void refreshCounts();
  }, [userId, refreshCounts]);

  useEffect(() => {
    if (!userId || !initialSection) return;
    handleSectionOpen(initialSection);
  }, [userId, initialSection, handleSectionOpen]);

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
        void refreshCounts(true);
        if (dataLoadedRef.current.tickets) void reloadTickets();
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [userId, showToast, reloadTickets, refreshCounts]);

  const openTicketDetail = (ticket: Ticket, action?: 'transfer' | 'refund') => {
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
        from: 'purchases',
        openAction: action,
      },
    });
  };

  return (
    <MyPurchasesView
      onBack={() => navigate('/profile')}
      initialSection={initialSection}
      ticketCount={ticketCount}
      venueCount={venueCount}
      serviceCount={serviceCount}
      countsLoading={countsLoading}
      hasCountsSnapshot={hasCountsSnapshot}
      tickets={tickets}
      ticketsLoading={ticketsLoading}
      ticketsLoadError={ticketsLoadError}
      onTicketsRetry={() => void reloadTickets()}
      onOpenTicketDetail={openTicketDetail}
      onViewEventDetail={(eventId) => navigate(`/events/${eventId}`)}
      onSectionOpen={handleSectionOpen}
      venueBookings={venueBookings}
      venuesLoading={venuesLoading}
      venuesLoadError={venuesLoadError}
      onVenuesRetry={() => void reloadVenues()}
      onViewVenueDetail={(venueId) => navigate(`/places/${venueId}`)}
      serviceBookings={serviceBookings}
      servicesLoading={servicesLoading}
      servicesLoadError={servicesLoadError}
      onServicesRetry={() => void reloadServices()}
      onViewServiceDetail={(serviceId) => navigate(`/services/${serviceId}`)}
    />
  );
};

export default PurchasesPage;
