import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Building2, ChevronRight } from 'lucide-react';
import {
  fetchUserVenueBookings,
  Loader,
  RootState,
  type UserVenueBooking,
} from '@doevents/shared';
import ProfileSectionBanner from '@lovable/components/profile/ProfileSectionBanner';

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
  const [bookings, setBookings] = useState<UserVenueBooking[]>([]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchUserVenueBookings(userId)
      .then((rows) => {
        if (!cancelled) setBookings(rows);
      })
      .catch(() => {
        if (!cancelled) setBookings([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId]);

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
          <div className="py-12">
            <Loader />
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl bg-card p-10 text-center shadow-sm">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-foreground">Sin reservas de lugares</p>
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
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{booking.venueName}</p>
                  <p className="text-xs text-muted-foreground">{formatDates(booking.selectedDates)}</p>
                  <p className="mt-1 text-xs font-medium capitalize text-primary">{booking.status}</p>
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
