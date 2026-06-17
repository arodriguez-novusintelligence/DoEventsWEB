import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AvailableSeat,
  categoriesHaveNamedSeats,
  countCheckoutSeatCoverage,
  createTicketOrder,
  fetchAvailableSeats,
  fetchEventDetail,
  getVenueById,
  loadStoredReservation,
  resolveCheckoutFloors,
  resolveDisplayLocation,
  resolveOrderExpiresAtTs,
  resolveSeatLabel,
  saveStoredReservation,
  useReservationTimer,
  useToast,
  computeOrderFeeBreakdown,
  type TicketCategory,
  type VenueFloorDetail,
} from '@doevents/shared';

export interface SelectedSeatItem {
  category: TicketCategory;
  seat: AvailableSeat;
  label: string;
}

export interface CheckoutEventMeta {
  name: string;
  venueName?: string;
  venueAddress?: string;
  capacity?: number;
  image?: string;
  fechaIni?: string;
  horaIni?: string;
}

export function useTicketCheckout(eventId: string, userId?: string) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [selected, setSelected] = useState<SelectedSeatItem[]>([]);
  const [venueFloors, setVenueFloors] = useState<VenueFloorDetail[]>([]);
  const [eventMeta, setEventMeta] = useState<CheckoutEventMeta>({ name: '' });
  const [filterCategory, setFilterCategory] = useState('all');
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [reservationExpiresTs, setReservationExpiresTs] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmHighlightId, setConfirmHighlightId] = useState<string | null>(null);
  const [fullMapOpen, setFullMapOpen] = useState(false);
  const [seatCoverage, setSeatCoverage] = useState<{
    venueSeats: number;
    ticketSeats: number;
    matchedOffers: number;
  } | null>(null);

  const { label: countdownLabel, isExpired } = useReservationTimer(reservationExpiresTs);
  const hasNamedSeats = useMemo(() => categoriesHaveNamedSeats(categories), [categories]);
  const showSeatingMap = venueFloors.length > 0 && hasNamedSeats;

  const selectedIds = useMemo(
    () => new Set(selected.map((item) => item.seat.ticketInstanceId)),
    [selected],
  );

  const totalAmount = useMemo(
    () => selected.reduce((sum, item) => sum + (item.seat.price || 0), 0),
    [selected],
  );

  const feeBreakdown = useMemo(
    () => computeOrderFeeBreakdown(selected.map((item) => item.seat.price || 0)),
    [selected],
  );

  useEffect(() => {
    if (!userId || !eventId) return;
    const stored = loadStoredReservation(eventId, userId);
    if (stored) {
      setPendingOrderId(stored.orderId);
      setReservationExpiresTs(stored.expiresAtTs);
    }
  }, [eventId, userId]);

  useEffect(() => {
    if (isExpired && pendingOrderId) {
      setPendingOrderId(null);
      setReservationExpiresTs(null);
      setSelected([]);
      showToast('Tu reserva expiró. Las sillas están disponibles nuevamente.', 'error');
      void fetchAvailableSeats(eventId).then((data) => setCategories(data.categories || [])).catch(() => {});
    }
  }, [isExpired, pendingOrderId, eventId, showToast]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [seatsData, eventDetail] = await Promise.all([
          fetchAvailableSeats(eventId),
          fetchEventDetail(eventId).catch(() => null),
        ]);
        if (cancelled) return;

        const ticketCategories = seatsData.categories || [];
        setCategories(ticketCategories);

        const ev = eventDetail?.event;
        let venueName: string | undefined;
        let rawFloors: VenueFloorDetail[] = [];
        const venueId = ev?.venueId;
        if (venueId) {
          try {
            const venue = await getVenueById(venueId);
            venueName = venue.name;
            rawFloors = venue.floors || [];
          } catch {
            rawFloors = [];
          }
        }

        const venueAddress = resolveDisplayLocation({
          direccion: ev?.direccion,
          ciudad: ev?.ciudad,
          departamento: ev?.departamento,
        });

        setEventMeta({
          name: ev?.nombre || '',
          venueName: venueName || ev?.direccion || ev?.ciudad,
          venueAddress: venueAddress !== '—' ? venueAddress : undefined,
          capacity: ev?.aforo ? Number(ev.aforo) : undefined,
          image: eventDetail?.images?.[0],
          fechaIni: ev?.fechaIni,
          horaIni: ev?.horaIni,
        });

        const floors = resolveCheckoutFloors(rawFloors, ticketCategories);
        if (!cancelled) {
          setVenueFloors(floors);
          setSeatCoverage(countCheckoutSeatCoverage(floors, ticketCategories));
        }
      } catch (err) {
        if (!cancelled) {
          showToast(err instanceof Error ? err.message : 'No hay boletas disponibles', 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (eventId) void load();
    return () => { cancelled = true; };
  }, [eventId, showToast]);

  const resolveSeatColor = (categoryName: string) => {
    const floorCat = venueFloors.flatMap((f) => f.categories || []).find(
      (c) => c.name.trim().toLowerCase() === categoryName.trim().toLowerCase(),
    );
    return floorCat?.color || '#5856EB';
  };

  const previewSeats = useMemo(
    () => selected.map((item) => ({
      ticketInstanceId: item.seat.ticketInstanceId,
      categoryName: item.category.categoryName,
      label: item.label,
      price: item.seat.price || 0,
      color: resolveSeatColor(item.category.categoryName),
    })),
    [selected, venueFloors],
  );

  const toggleSeat = (category: TicketCategory, seat: AvailableSeat, label?: string) => {
    if (pendingOrderId) {
      showToast('Ya tienes una reserva activa. Continúa al pago o espera a que expire.', 'error');
      return;
    }
    const resolvedLabel = label || resolveSeatLabel(seat);
    const key = seat.ticketInstanceId;
    setSelected((prev) => {
      const exists = prev.find((item) => item.seat.ticketInstanceId === key);
      if (exists) return prev.filter((item) => item.seat.ticketInstanceId !== key);
      return [...prev, { category, seat, label: resolvedLabel }];
    });
  };

  const removeSeat = (ticketInstanceId: string) => {
    setSelected((prev) => prev.filter((item) => item.seat.ticketInstanceId !== ticketInstanceId));
  };

  const handleReserveAndPay = () => {
    if (!userId) {
      showToast('Debes iniciar sesión para comprar', 'error');
      navigate('/auth/login');
      return;
    }
    if (!selected.length) {
      showToast('Selecciona al menos una silla', 'error');
      return;
    }
    setConfirmHighlightId(selected[0]?.seat.ticketInstanceId || null);
    setConfirmOpen(true);
  };

  const executeReserveAndPay = async () => {
    if (!userId || submitting) return;
    setSubmitting(true);
    const checkoutReference = `WEB-${eventId}-${userId}-${selected.map((s) => s.seat.ticketInstanceId).sort().join('-')}`;
    try {
      const order = await createTicketOrder({
        eventId,
        userId,
        totalAmount,
        reference: checkoutReference,
        tickets: selected.map(({ category, seat, label }) => ({
          ticket_id: seat.ticketInstanceId,
          ticketsDistId: category.distributionId,
          distributionCreateDate: category.createDate,
          category: category.categoryName,
          seats: [label],
        })),
      });
      const orderId = order.order_id || order.reference;
      if (!orderId) throw new Error('No se recibió el ID de la orden');

      const expiresAtTs = resolveOrderExpiresAtTs(order) || (Date.now() + 15 * 60 * 1000);
      setPendingOrderId(orderId);
      setReservationExpiresTs(expiresAtTs);
      saveStoredReservation({
        orderId,
        eventId,
        userId,
        expiresAtTs,
        expiresAtIso: order.expires_at,
        totalAmount,
        ticketCount: selected.length,
      });

      setConfirmOpen(false);
      setSelected([]);
      setFullMapOpen(false);
      showToast('Sillas reservadas por 15 minutos. Completa el pago para confirmar.', 'success');
      navigate(`/orders/${encodeURIComponent(orderId)}/confirm`, {
        state: { order: { ...order, expires_at_ts: expiresAtTs }, eventId, eventName: eventMeta.name },
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al reservar boletas', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const continuePendingPayment = () => {
    if (pendingOrderId) {
      navigate(`/orders/${encodeURIComponent(pendingOrderId)}/confirm`, {
        state: { eventId, eventName: eventMeta.name },
      });
    }
  };

  return {
    loading,
    submitting,
    categories,
    selected,
    venueFloors,
    eventMeta,
    filterCategory,
    setFilterCategory,
    pendingOrderId,
    countdownLabel,
    isExpired,
    confirmOpen,
    setConfirmOpen,
    confirmHighlightId,
    setConfirmHighlightId,
    fullMapOpen,
    setFullMapOpen,
    seatCoverage,
    showSeatingMap,
    selectedIds,
    totalAmount,
    feeBreakdown,
    previewSeats,
    toggleSeat,
    removeSeat,
    handleReserveAndPay,
    executeReserveAndPay,
    continuePendingPayment,
  };
}
