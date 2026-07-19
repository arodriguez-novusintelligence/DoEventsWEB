import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AvailableSeat,
  categoriesHaveNamedSeats,
  countCheckoutSeatCoverage,
  cancelTicketOrder,
  createTicketOrder,
  fetchAvailableSeats,
  fetchEventDetail,
  fetchOrderById,
  ensureEventTicketDistributions,
  getVenueById,
  invalidateEventsCache,
  extractVenueImageUrls,
  loadStoredReservation,
  clearStoredReservation,
  resolveCheckoutFloors,
  resolveCheckoutVenueId,
  resolveDisplayLocation,
  resolveOrderExpiresAtTs,
  resolveSeatLabel,
  saveStoredReservation,
  useReservationTimer,
  useToast,
  computeOrderFeeBreakdown,
  attachRawSeatsForUser,
  buildSeatLookup,
  categoriesForMapDisplay,
  isSeatAvailableForPurchase,
  isSeatReservedByUser,
  isSeatStatusAvailable,
  recoverPendingOrderIdFromCategories,
  validateEventPromoCode,
  type TicketCategoryWithRawSeats,
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
  venueImages?: string[];
  fechaIni?: string;
  horaIni?: string;
}

export function useTicketCheckout(eventId: string, userId?: string) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<TicketCategoryWithRawSeats[]>([]);
  const [selected, setSelected] = useState<SelectedSeatItem[]>([]);
  const [venueFloors, setVenueFloors] = useState<VenueFloorDetail[]>([]);
  const [eventMeta, setEventMeta] = useState<CheckoutEventMeta>({ name: '' });
  const [filterCategory, setFilterCategory] = useState('all');
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [reservationExpiresTs, setReservationExpiresTs] = useState<number | null>(null);
  const [venueHasSeating, setVenueHasSeating] = useState(false);
  const [eventHasSeating, setEventHasSeating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmHighlightId, setConfirmHighlightId] = useState<string | null>(null);
  const [fullMapOpen, setFullMapOpen] = useState(false);
  const [seatingStep, setSeatingStep] = useState<'seatmap' | 'fullmap' | 'confirm'>('seatmap');
  const [mapZoom, setMapZoom] = useState(150);
  const [activeCategoryTab, setActiveCategoryTab] = useState('');
  const [seatCoverage, setSeatCoverage] = useState<{
    venueSeats: number;
    ticketSeats: number;
    matchedOffers: number;
  } | null>(null);
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ code: string; value: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoApplying, setPromoApplying] = useState(false);

  const { label: countdownLabel, isExpired, remainingMs } = useReservationTimer(reservationExpiresTs);
  const hasNamedSeats = useMemo(() => categoriesHaveNamedSeats(categories), [categories]);
  const mapCategories = useMemo(() => categoriesForMapDisplay(categories), [categories]);
  const venueHasLayout = useMemo(
    () => venueFloors.some((f) => (f.categories?.length ?? 0) > 0 || (f.elements?.length ?? 0) > 0),
    [venueFloors],
  );
  const showSeatingMap = Boolean(
    (eventHasSeating || venueHasSeating)
    && venueFloors.length > 0
    && (hasNamedSeats || venueHasLayout),
  );
  const [categoryQuantities, setCategoryQuantities] = useState<Record<string, number>>({});

  const onlyTicketsSelected = useMemo(() => {
    if (showSeatingMap) return selected;
    const items: SelectedSeatItem[] = [];
    for (const cat of categories) {
      const qty = categoryQuantities[cat.distributionId] || 0;
      const availableSeats = cat.seats || [];
      for (let i = 0; i < qty && i < availableSeats.length; i += 1) {
        const seat = availableSeats[i];
        items.push({
          category: cat,
          seat,
          label: resolveSeatLabel(seat) || cat.categoryName,
        });
      }
    }
    return items;
  }, [showSeatingMap, selected, categories, categoryQuantities]);

  const effectiveSelected = showSeatingMap ? selected : onlyTicketsSelected;

  const selectedIds = useMemo(
    () => new Set(effectiveSelected.map((item) => item.seat.ticketInstanceId)),
    [effectiveSelected],
  );

  const totalOnlyTicketQty = useMemo(
    () => Object.values(categoryQuantities).reduce((sum, qty) => sum + qty, 0),
    [categoryQuantities],
  );

  const totalAmount = useMemo(
    () => effectiveSelected.reduce((sum, item) => sum + (item.seat.price || 0), 0),
    [effectiveSelected],
  );

  const feeBreakdown = useMemo(
    () => computeOrderFeeBreakdown(effectiveSelected.map((item) => item.seat.price || 0)),
    [effectiveSelected],
  );

  const promoDiscount = promoApplied?.value ?? 0;
  const payableTotal = Math.max(0, feeBreakdown.total - promoDiscount);

  const applyPromoCode = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoError('Ingresa un código.');
      return;
    }
    if (!eventId) {
      setPromoError('Evento no disponible.');
      return;
    }
    setPromoApplying(true);
    try {
      const res = await validateEventPromoCode(eventId, code);
      if (!res.ok || res.value == null) {
        setPromoError(
          res.reason === 'already_used'
            ? 'Este código ya fue utilizado.'
            : res.reason === 'cancelled'
              ? 'Este código fue cancelado.'
              : 'Código no válido.',
        );
        setPromoApplied(null);
        return;
      }
      setPromoApplied({ code, value: Number(res.value) || 0 });
      setPromoError(null);
      showToast(`Código aplicado: -${Number(res.value || 0).toLocaleString('es-CO')}`, 'success');
    } catch {
      setPromoError('No se pudo validar el código. Intenta de nuevo.');
      setPromoApplied(null);
    } finally {
      setPromoApplying(false);
    }
  };

  const removePromoCode = () => {
    setPromoApplied(null);
    setPromoInput('');
    setPromoError(null);
  };

  const handlePromoEnabledChange = (enabled: boolean) => {
    setPromoEnabled(enabled);
    if (!enabled) removePromoCode();
  };

  useEffect(() => {
    if (!userId || !eventId) return;
    const stored = loadStoredReservation(eventId, userId);
    if (stored) {
      setPendingOrderId(stored.orderId);
      setReservationExpiresTs(stored.expiresAtTs);
    }
  }, [eventId, userId]);

  const restorePendingReservation = async (orderId: string) => {
    const order = await fetchOrderById(orderId);
    const paymentStatus = String(order?.payment_status || '').toUpperCase();
    if (!order || (paymentStatus && paymentStatus !== 'PENDING')) return false;

    const expiresAtTs = resolveOrderExpiresAtTs(order) || (Date.now() + 15 * 60 * 1000);
    if (expiresAtTs <= Date.now()) return false;

    setPendingOrderId(orderId);
    setReservationExpiresTs(expiresAtTs);
    if (userId) {
      saveStoredReservation({
        orderId,
        eventId,
        userId,
        expiresAtTs,
        expiresAtIso: order.expires_at,
        totalAmount: order.total_amount,
        ticketCount: order.summary?.totalTickets || order.tickets?.length,
      });
    }
    setSelected([]);
    setCategoryQuantities({});
    return true;
  };

  useEffect(() => {
    if (isExpired && pendingOrderId) {
      setPendingOrderId(null);
      setReservationExpiresTs(null);
      setSelected([]);
      setCategoryQuantities({});
      showToast(
        showSeatingMap
          ? 'Tu reserva expiró. Las sillas están disponibles nuevamente.'
          : 'Tu reserva expiró. Las boletas están disponibles nuevamente.',
        'error',
      );
      void fetchAvailableSeats(eventId).then((data) => setCategories(data.categories || [])).catch(() => {});
    }
  }, [isExpired, pendingOrderId, eventId, showToast]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        let seatsData;
        try {
          seatsData = await fetchAvailableSeats(eventId);
        } catch (seatErr) {
          try {
            await ensureEventTicketDistributions(eventId);
            seatsData = await fetchAvailableSeats(eventId);
          } catch (repairErr) {
            throw repairErr instanceof Error ? repairErr : seatErr;
          }
        }
        const [eventDetail] = await Promise.all([
          fetchEventDetail(eventId).catch(() => null),
        ]);
        if (cancelled) return;

        const ticketCategories = attachRawSeatsForUser(seatsData.categories || [], userId || undefined);
        setCategories(ticketCategories);

        if (userId && !loadStoredReservation(eventId, userId)) {
          const recoveredOrderId = recoverPendingOrderIdFromCategories(ticketCategories, userId);
          if (recoveredOrderId) {
            await restorePendingReservation(recoveredOrderId);
          }
        }

        const ev = eventDetail?.event;
        setEventHasSeating(Boolean(ev?.hasSeating));
        let venueName: string | undefined;
        let rawFloors: VenueFloorDetail[] = [];
        let venueImages: string[] = [];
        const checkoutVenueId = resolveCheckoutVenueId(ev?.venueId, ticketCategories);
        if (checkoutVenueId) {
          try {
            const venue = await getVenueById(checkoutVenueId, { forceNetwork: true });
            venueName = venue.name;
            rawFloors = venue.floors || [];
            venueImages = extractVenueImageUrls(venue as Record<string, unknown>).slice(0, 3);
            setVenueHasSeating(Boolean(venue.hasSeating) || (venue.floors?.length ?? 0) > 0);
          } catch {
            rawFloors = [];
            setVenueHasSeating(false);
          }
        } else {
          setVenueHasSeating(false);
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
          venueImages: venueImages.length ? venueImages : undefined,
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
    () => effectiveSelected.map((item) => ({
      ticketInstanceId: item.seat.ticketInstanceId,
      categoryName: item.category.categoryName,
      label: item.label,
      price: item.seat.price || 0,
      color: resolveSeatColor(item.category.categoryName),
    })),
    [effectiveSelected, venueFloors],
  );

  const adjustCategoryQuantity = (category: TicketCategory, delta: number) => {
    if (pendingOrderId) {
      showToast('Ya tienes una reserva activa. Continúa al pago o espera a que expire.', 'error');
      return;
    }
    const key = category.distributionId;
    const max = (category.seats || []).filter((seat) => isSeatStatusAvailable(seat.ticketStatus)).length;
    setCategoryQuantities((prev) => {
      const current = prev[key] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      if (next === current) return prev;
      if (next === 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: next };
    });
  };

  const getCategoryQuantity = (distributionId: string) => categoryQuantities[distributionId] || 0;

  const getCategoryUnitPrice = (category: TicketCategory) => {
    const prices = (category.seats || []).map((s) => s.price || 0).filter((p) => p > 0);
    return prices.length ? prices[0] : 0;
  };

  const toggleSeat = (category: TicketCategory, seat: AvailableSeat, label?: string) => {
    if (pendingOrderId) {
      showToast('Ya tienes una reserva activa. Continúa al pago o espera a que expire.', 'error');
      return;
    }
    const status = String(seat.ticketStatus || '').toUpperCase();
    if (!isSeatAvailableForPurchase(seat, userId)) {
      if (isSeatReservedByUser(seat, userId)) {
        showToast('Esta silla ya está en tu reserva activa. Usa "Ir al pago" para continuar.', 'error');
      } else {
        showToast('Esta silla no está disponible', 'error');
      }
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

  const selectedByCategory = useMemo(() => {
    const map = new Map<string, SelectedSeatItem[]>();
    selected.forEach((item) => {
      const key = item.category.distributionId;
      const arr = map.get(key) || [];
      arr.push(item);
      map.set(key, arr);
    });
    return map;
  }, [selected]);

  const getCategoryColor = (categoryName: string) => resolveSeatColor(categoryName);

  const openFullMap = () => {
    setSeatingStep('fullmap');
    setFullMapOpen(true);
    setFilterCategory('all');
    setMapZoom(125);
  };

  const closeFullMap = () => {
    setSeatingStep('seatmap');
    setFullMapOpen(false);
  };

  const goToSeatingConfirm = () => {
    if (!selected.length) {
      showToast('Selecciona al menos una silla', 'error');
      return;
    }
    setSeatingStep('confirm');
    setFullMapOpen(false);
  };

  const handleSeatingContinueToPay = () => {
    if (!userId) {
      showToast('Debes iniciar sesión para comprar', 'error');
      navigate('/auth/login');
      return;
    }
    if (!selected.length) {
      showToast('Selecciona al menos una silla', 'error');
      return;
    }
    void executeReserveAndPay();
  };

  const handleReserveAndPay = () => {
    if (!userId) {
      showToast('Debes iniciar sesión para comprar', 'error');
      navigate('/auth/login');
      return;
    }
    if (!showSeatingMap) {
      if (totalOnlyTicketQty === 0) {
        showToast('Selecciona al menos una boleta', 'error');
        return;
      }
      void executeReserveAndPay();
      return;
    }
    goToSeatingConfirm();
  };

  const executeReserveAndPay = async () => {
    if (!userId || submitting) return;
    const seatsToReserve = showSeatingMap ? selected : onlyTicketsSelected;
    if (!seatsToReserve.length) {
      showToast(showSeatingMap ? 'Selecciona al menos una silla' : 'Selecciona al menos una boleta', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const stored = loadStoredReservation(eventId, userId);
      if (stored?.orderId) {
        await cancelTicketOrder(stored.orderId, userId);
        clearStoredReservation(eventId, userId);
        setPendingOrderId(null);
        setReservationExpiresTs(null);
      }

      const freshSeats = await fetchAvailableSeats(eventId);
      const freshCategories = attachRawSeatsForUser(freshSeats.categories || [], userId);
      setCategories(freshCategories);
      const seatLookup = buildSeatLookup(freshCategories);

      const validatedSeats: SelectedSeatItem[] = [];
      for (const item of seatsToReserve) {
        const freshSeat = seatLookup.get(item.seat.ticketInstanceId);
        if (!freshSeat || !isSeatStatusAvailable(freshSeat.ticketStatus)) {
          if (freshSeat && isSeatReservedByUser(freshSeat, userId)) {
            const recovered = freshSeat.orderId
              ? await restorePendingReservation(freshSeat.orderId)
              : false;
            if (recovered) {
              showToast('Ya tienes una reserva activa para este evento. Continúa con el pago.', 'error');
              return;
            }
          }
          throw new Error(`La boleta ${item.label} ya no está disponible. Actualiza tu selección.`);
        }
        validatedSeats.push({
          ...item,
          seat: freshSeat,
        });
      }

      const ticketSubtotal = validatedSeats.reduce((sum, item) => sum + (item.seat.price || 0), 0);
      const isFreeCheckout = validatedSeats.length > 0
        && validatedSeats.every((item) => (item.seat.price || 0) <= 0);

      const orderTickets = validatedSeats.map(({ category, seat, label }) => ({
        ticket_id: seat.ticketInstanceId,
        // TicketsDistribution.id — nunca categoryId/boletaId (puede ser fig-* del mapa)
        ticketsDistId: seat.distributionId || category.distributionId,
        distributionCreateDate: seat.distributionCreateDate || category.createDate,
        category: category.categoryName,
        seats: showSeatingMap ? [label] : [],
        purchasePrice: seat.price || 0,
        price: seat.price || 0,
        categoryColor:
          category.categoryColor
          || resolveSeatColor(category.categoryName),
      }));
      if (orderTickets.some((t) => !t.ticketsDistId || !t.distributionCreateDate)) {
        throw new Error('Falta el identificador de distribución de boletas. Recarga el checkout e inténtalo de nuevo.');
      }

      const order = await createTicketOrder({
        eventId,
        userId,
        totalAmount: ticketSubtotal,
        promoCode: promoApplied?.code,
        promoDiscount: promoDiscount || undefined,
        tickets: orderTickets,
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
        totalAmount: ticketSubtotal,
        ticketCount: validatedSeats.length,
      });

      if (isFreeCheckout || payableTotal <= 0) {
        setConfirmOpen(false);
        setSelected([]);
        setCategoryQuantities({});
        setFullMapOpen(false);
        setSeatingStep('seatmap');
        showToast(
          'Boletas reservadas. Confirma la autorización para obtenerlas.',
          'success',
        );
        navigate(`/orders/${encodeURIComponent(orderId)}/confirm`, {
          state: {
            order: { ...order, expires_at_ts: expiresAtTs },
            eventId,
            eventName: eventMeta.name,
            hasSeating: showSeatingMap,
            promoCode: promoApplied?.code,
            promoDiscount: promoDiscount || undefined,
            discountedAmount: 0,
          },
        });
        return;
      }

      setConfirmOpen(false);
      setSelected([]);
      setCategoryQuantities({});
      setFullMapOpen(false);
      setSeatingStep('seatmap');
      showToast(
        showSeatingMap
          ? 'Sillas reservadas por 15 minutos. Completa el pago para confirmar.'
          : 'Boletas reservadas por 15 minutos. Completa el pago para confirmar.',
        'success',
      );
      navigate(`/orders/${encodeURIComponent(orderId)}/confirm`, {
        state: {
          order: { ...order, expires_at_ts: expiresAtTs },
          eventId,
          eventName: eventMeta.name,
          hasSeating: showSeatingMap,
          promoCode: promoApplied?.code,
          promoDiscount: promoDiscount || undefined,
          discountedAmount: payableTotal,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al reservar boletas';
      if (/status=RESERVED|no está disponible/i.test(message)) {
        showToast(
          'Algunas boletas ya están reservadas. Recargamos la disponibilidad; revisa tu selección o usa "Ir al pago" si ya reservaste.',
          'error',
        );
        try {
          const freshSeats = await fetchAvailableSeats(eventId);
          setCategories(attachRawSeatsForUser(freshSeats.categories || [], userId));
        } catch {
          // ignore refresh failure
        }
        return;
      }
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const continuePendingPayment = () => {
    if (pendingOrderId) {
      navigate(`/orders/${encodeURIComponent(pendingOrderId)}/confirm`, {
        state: {
          eventId,
          eventName: eventMeta.name,
          hasSeating: showSeatingMap,
          promoCode: promoApplied?.code,
          promoDiscount: promoDiscount || undefined,
          discountedAmount: payableTotal,
        },
      });
    }
  };

  return {
    loading,
    submitting,
    categories,
    mapCategories,
    selected,
    venueFloors,
    eventMeta,
    filterCategory,
    setFilterCategory,
    pendingOrderId,
    countdownLabel,
    remainingMs,
    isExpired,
    categoryQuantities,
    totalOnlyTicketQty,
    adjustCategoryQuantity,
    getCategoryQuantity,
    getCategoryUnitPrice,
    confirmOpen,
    setConfirmOpen,
    confirmHighlightId,
    setConfirmHighlightId,
    fullMapOpen,
    setFullMapOpen,
    seatingStep,
    setSeatingStep,
    mapZoom,
    setMapZoom,
    activeCategoryTab,
    setActiveCategoryTab,
    selectedByCategory,
    getCategoryColor,
    openFullMap,
    closeFullMap,
    goToSeatingConfirm,
    handleSeatingContinueToPay,
    seatCoverage,
    showSeatingMap,
    selectedIds,
    totalAmount,
    feeBreakdown,
    promoEnabled,
    setPromoEnabled: handlePromoEnabledChange,
    promoInput,
    setPromoInput,
    promoApplied,
    promoError,
    promoApplying,
    promoDiscount,
    payableTotal,
    applyPromoCode,
    removePromoCode,
    previewSeats,
    toggleSeat,
    removeSeat,
    handleReserveAndPay,
    executeReserveAndPay,
    continuePendingPayment,
  };
}
