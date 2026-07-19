import React, { useEffect, useMemo, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { useSelector } from 'react-redux';

import {

  fetchUserServiceBookings,

  RootState,

} from '@doevents/shared';

import MyReservedServicesView from '@lovable/components/purchases/MyReservedServicesView';



export const PurchasesServicesPage: React.FC = () => {

  const navigate = useNavigate();

  const location = useLocation();

  const userId = useSelector((s: RootState) => s.auth.idUser);

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<Awaited<ReturnType<typeof fetchUserServiceBookings>>>([]);

  const [reloadKey, setReloadKey] = useState(0);



  const locationState = location.state as { orderId?: string; bookingId?: string; from?: string } | null;

  const initialSelectedBookingId = useMemo(() => {

    if (locationState?.bookingId) return locationState.bookingId;

    if (locationState?.orderId) {

      const match = bookings.find((b) => b.orderId === locationState.orderId);

      return match?.bookingId ?? null;

    }

    return null;

  }, [bookings, locationState?.bookingId, locationState?.orderId]);



  useEffect(() => {

    if (!userId) {

      setLoading(false);

      return;

    }

    let cancelled = false;

    setLoading(true);

    setLoadError(null);

    void fetchUserServiceBookings(userId)

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



  return (

    <MyReservedServicesView

      onBack={() => navigate('/purchases')}

      bookings={bookings}

      loading={loading}

      loadError={loadError}

      onRetry={() => setReloadKey((k) => k + 1)}

      onViewServiceDetail={(serviceId) => navigate(`/services/${serviceId}`)}

      initialSelectedBookingId={initialSelectedBookingId}

    />

  );

};



export default PurchasesServicesPage;

