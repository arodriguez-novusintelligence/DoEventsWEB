import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  fetchUserVenueBookings,
  RootState,
} from '@doevents/shared';
import MyReservedVenuesView from '@lovable/components/purchases/MyReservedVenuesView';
import type { PurchaseTabStatus } from '../lovable-bridge/purchasesAdapter';
import { useEffect, useMemo, useState } from 'react';

type VenuesLocationState = {
  from?: 'payment' | 'payment-success';
  orderId?: string;
  bookingId?: string;
  tab?: PurchaseTabStatus;
};

export const PurchasesVenuesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state as VenuesLocationState | null) || {};
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Awaited<ReturnType<typeof fetchUserVenueBookings>>>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void fetchUserVenueBookings(userId)
      .then((rows) => { if (!cancelled) setBookings(rows); })
      .catch((err) => {
        if (!cancelled) {
          setBookings([]);
          setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar las reservas');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, reloadKey]);

  const initialTab = useMemo<PurchaseTabStatus>(() => {
    if (navState.tab) return navState.tab;
    if (navState.from === 'payment') return 'pendiente';
    if (navState.from === 'payment-success') return 'aprobada';
    return 'aprobada';
  }, [navState.from, navState.tab]);

  const highlightBookingId = useMemo(() => {
    if (navState.bookingId) return navState.bookingId;
    if (navState.orderId) {
      return bookings.find((b) => b.orderId === navState.orderId)?.bookingId;
    }
    return undefined;
  }, [bookings, navState.bookingId, navState.orderId]);

  return (
    <MyReservedVenuesView
      onBack={() => navigate('/purchases')}
      bookings={bookings}
      loading={loading}
      loadError={loadError}
      onRetry={() => setReloadKey((k) => k + 1)}
      onViewVenueDetail={(venueId) => navigate(`/places/${venueId}`)}
      initialTab={initialTab}
      highlightBookingId={highlightBookingId}
    />
  );
};

export default PurchasesVenuesPage;
