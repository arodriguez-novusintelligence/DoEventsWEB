import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Briefcase, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import {
  fetchUserServiceBookings,
  RootState,
  type UserServiceBooking,
} from '@doevents/shared';
import ProfileSectionBanner from '@lovable/components/profile/ProfileSectionBanner';
import { Button } from '@lovable/components/ui/button';
import { formatBookingStatus } from '@lovable/lib/bookingStatusLabels';

interface MyReservedServicesViewProps {
  onBack: () => void;
}

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

export const MyReservedServicesView = ({ onBack }: MyReservedServicesViewProps) => {
  const navigate = useNavigate();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<UserServiceBooking[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void fetchUserServiceBookings(userId)
      .then((rows) => {
        if (!cancelled) setBookings(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setBookings([]);
          setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar las reservas');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId, reloadKey]);

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-secondary pb-24">
      <ProfileSectionBanner
        title="Mis servicios reservados"
        subtitle={`${bookings.length} reserva${bookings.length === 1 ? '' : 's'}`}
        icon={Briefcase}
        onBack={onBack}
      />

      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando reservas…</p>
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-sm">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-3 text-sm font-medium text-destructive">{loadError}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 rounded-full"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              Reintentar
            </Button>
          </div>
        ) : !userId ? (
          <div className="rounded-2xl bg-card p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <Briefcase className="h-7 w-7 text-primary" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">Inicia sesión para ver tus reservas</p>
            <Button type="button" className="mt-4 rounded-full" onClick={() => navigate('/auth/login')}>
              Iniciar sesión
            </Button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl bg-card p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <Briefcase className="h-7 w-7 text-primary" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">Sin reservas de servicios</p>
            <p className="mt-1 text-xs text-muted-foreground">Tus reservas aparecerán aquí cuando contrates un servicio</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <button
                key={booking.bookingId}
                type="button"
                onClick={() => navigate(`/purchases/services/${booking.bookingId}`)}
                className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 shadow-sm text-left hover:bg-accent/40 transition-colors"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{booking.serviceName}</p>
                  <p className="text-xs text-muted-foreground">{formatDateRange(booking.startDate, booking.endDate)}</p>
                  <p className="mt-1 text-xs font-medium text-primary">{formatBookingStatus(booking.status)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-foreground">
                    {formatCurrency(booking.pricing?.total)}
                  </p>
                  <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground ml-auto" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReservedServicesView;
