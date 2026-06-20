import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Briefcase, Calendar, CreditCard, Hash, AlertCircle, Loader2 } from 'lucide-react';
import {
  fetchUserServiceBookings,
  RootState,
  type UserServiceBooking,
} from '@doevents/shared';
import { Button } from '@lovable/components/ui/button';
import { formatBookingStatus } from '@lovable/lib/bookingStatusLabels';

function formatDateRange(start?: string, end?: string) {
  if (!start) return '—';
  const fmt = (d: string) => new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  if (!end || end === start) return fmt(start);
  return `${fmt(start)} – ${fmt(end)}`;
}

function formatCurrency(amount?: number, currency = 'COP') {
  if (!amount) return '—';
  return `${currency === 'USD' ? 'US$' : '$'} ${amount.toLocaleString('es-CO')}`;
}

export const ServiceReservationDetail = () => {
  const { bookingId = '' } = useParams();
  const navigate = useNavigate();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [booking, setBooking] = useState<UserServiceBooking | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!userId || !bookingId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void fetchUserServiceBookings(userId)
      .then((rows) => {
        if (!cancelled) {
          setBooking(rows.find((b) => b.bookingId === bookingId) || null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setBooking(null);
          setLoadError(err instanceof Error ? err.message : 'No se pudo cargar la reserva');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId, bookingId, reloadKey]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando reserva…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <p className="mt-3 text-sm font-semibold text-foreground">Error al cargar</p>
        <p className="mt-1 text-xs text-muted-foreground">{loadError}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 rounded-full"
          onClick={() => setReloadKey((k) => k + 1)}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
          <Briefcase className="h-7 w-7 text-primary" />
        </div>
        <p className="mt-3 text-sm font-semibold text-foreground">Reserva no encontrada</p>
        <p className="mt-1 text-xs text-muted-foreground">Verifica el enlace o consulta tus reservas activas.</p>
        <Button type="button" variant="outline" className="mt-4 rounded-full" onClick={() => navigate('/purchases/services')}>
          Volver a reservas
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-secondary pb-24">
      <div className="rounded-b-3xl bg-gradient-to-br from-primary via-primary to-accent px-4 pb-8 pt-5 text-primary-foreground">
        <button
          type="button"
          onClick={() => navigate('/purchases/services')}
          className="mb-3 text-sm font-medium text-primary-foreground/90"
        >
          ← Reservas de servicios
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/15">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold leading-tight">{booking.serviceName}</h1>
            <span className="mt-1 inline-flex rounded-full bg-primary-foreground/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
              {formatBookingStatus(booking.status)}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        <div className="rounded-2xl bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <span>{formatDateRange(booking.startDate, booking.endDate)}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Hash className="h-4 w-4 text-primary shrink-0" />
            <span className="font-mono text-xs">{booking.orderId}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CreditCard className="h-4 w-4 text-primary shrink-0" />
            <span>{formatCurrency(booking.pricing?.total)}</span>
          </div>
        </div>

        {booking.additionalServices?.length > 0 && (
          <div className="rounded-2xl bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Servicios adicionales</p>
            <ul className="space-y-1 text-sm">
              {booking.additionalServices.map((svc, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span>{svc.name || 'Servicio'}</span>
                  <span className="text-muted-foreground">{svc.quantity ?? 1}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full rounded-full"
          onClick={() => navigate(`/services/${booking.serviceId}`)}
        >
          Ver servicio
        </Button>
      </div>
    </div>
  );
};

export default ServiceReservationDetail;
