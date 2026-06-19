import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Briefcase, ChevronRight } from 'lucide-react';
import {
  fetchUserServiceBookings,
  Loader,
  RootState,
  type UserServiceBooking,
} from '@doevents/shared';
import ProfileSectionBanner from '@lovable/components/profile/ProfileSectionBanner';

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
  const [bookings, setBookings] = useState<UserServiceBooking[]>([]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchUserServiceBookings(userId)
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
        title="Mis servicios reservados"
        subtitle={`${bookings.length} reserva${bookings.length === 1 ? '' : 's'}`}
        icon={Briefcase}
        onBack={onBack}
      />

      <div className="px-4 pt-4">
        {loading ? (
          <div className="py-12">
            <Loader />
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
            No tienes reservas de servicios.
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
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
                  <Briefcase className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{booking.serviceName}</p>
                  <p className="text-xs text-muted-foreground">{formatDateRange(booking.startDate, booking.endDate)}</p>
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

export default MyReservedServicesView;
