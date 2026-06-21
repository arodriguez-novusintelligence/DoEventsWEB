import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Building2, ChevronRight, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import {
  fetchUserVenueBookings,
  RootState,
  type UserVenueBooking,
} from '@doevents/shared';
import ProfileSectionBanner from '@lovable/components/profile/ProfileSectionBanner';
import { Button } from '@lovable/components/ui/button';
import { formatBookingStatus } from '@lovable/lib/bookingStatusLabels';

interface MyReservedVenuesViewProps {
  onBack: () => void;
}

function formatDates(dates?: string[]) {
  if (!dates?.length) return '—';
  const sorted = [...dates].sort();
  const fmt = (d: string) => new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  if (sorted.length === 1) return fmt(sorted[0]);
  return `${fmt(sorted[0])} – ${fmt(sorted[sorted.length - 1])} (${sorted.length} días)`;
}

function formatCurrency(amount?: number, currency = 'COP') {
  if (!amount) return '—';
  return `${currency === 'USD' ? 'US$' : '$'} ${amount.toLocaleString('es-CO')}`;
}

export const MyReservedVenuesView = ({ onBack }: MyReservedVenuesViewProps) => {
  const navigate = useNavigate();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<UserVenueBooking[]>([]);
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
        title="Mis lugares reservados"
        subtitle={`${bookings.length} reserva${bookings.length === 1 ? '' : 's'}`}
        icon={Building2}
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
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <p className="mt-3 text-sm font-medium text-destructive">{loadError}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 rounded-full"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </div>
        ) : !userId ? (
          <div className="rounded-2xl bg-card p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">Inicia sesión para ver tus reservas</p>
            <Button type="button" className="mt-4 rounded-full" onClick={() => navigate('/auth/login')}>
              Iniciar sesión
            </Button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl bg-card p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">Sin reservas de lugares</p>
            <p className="mt-1 text-xs text-muted-foreground">Tus reservas de venues aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <button
                key={booking.bookingId}
                type="button"
                onClick={() => navigate(`/purchases/venues/${booking.bookingId}`)}
                className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 shadow-sm text-left hover:bg-accent/40 transition-colors"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{booking.venueName}</p>
                  <p className="text-xs text-muted-foreground">{formatDates(booking.selectedDates)}</p>
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

export default MyReservedVenuesView;
