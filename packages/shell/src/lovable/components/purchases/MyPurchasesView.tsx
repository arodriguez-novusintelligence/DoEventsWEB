import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Building2, Briefcase, ChevronRight, Ticket } from 'lucide-react';
import {
  fetchGroupedUserTickets,
  fetchUserServiceBookings,
  fetchUserVenueBookings,
  Loader,
  RootState,
  type UserServiceBooking,
  type UserVenueBooking,
} from '@doevents/shared';
import ProfileSectionBanner from '@lovable/components/profile/ProfileSectionBanner';
import { groupedTicketsToLovable } from '../../../lovable-bridge/ticketsAdapter';
import type { Ticket } from '@lovable/data/ticketsData';

interface MyPurchasesViewProps {
  onBack: () => void;
}

function formatDateRange(start?: string, end?: string) {
  if (!start) return '—';
  const fmt = (d: string) => new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  if (!end || end === start) return fmt(start);
  return `${fmt(start)} – ${fmt(end)}`;
}

export const MyPurchasesView = ({ onBack }: MyPurchasesViewProps) => {
  const navigate = useNavigate();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [venueBookings, setVenueBookings] = useState<UserVenueBooking[]>([]);
  const [serviceBookings, setServiceBookings] = useState<UserServiceBooking[]>([]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const [grouped, venues, services] = await Promise.all([
          fetchGroupedUserTickets(userId).catch(() => null),
          fetchUserVenueBookings(userId).catch(() => []),
          fetchUserServiceBookings(userId).catch(() => []),
        ]);
        if (cancelled) return;
        setTickets(grouped ? groupedTicketsToLovable(grouped) : []);
        setVenueBookings(venues);
        setServiceBookings(services);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const ticketCount = tickets.filter((t) => t.status === 'aprobada' || t.status === 'pendiente').length;

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-secondary pb-24">
      <ProfileSectionBanner
        title="Mis compras y reservas"
        subtitle="Boletas, lugares y servicios"
        icon={Ticket}
        onBack={onBack}
      />

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <div className="py-12">
            <Loader />
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 shadow-sm text-left hover:bg-accent/40 transition-colors"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Ticket className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">Boletas</p>
                <p className="text-xs text-muted-foreground">
                  {ticketCount} boleta{ticketCount === 1 ? '' : 's'} activa{ticketCount === 1 ? '' : 's'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/purchases/venues')}
              className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 shadow-sm text-left hover:bg-accent/40 transition-colors"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">Reservas de lugares</p>
                <p className="text-xs text-muted-foreground">
                  {venueBookings.length} reserva{venueBookings.length === 1 ? '' : 's'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/purchases/services')}
              className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 shadow-sm text-left hover:bg-accent/40 transition-colors"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
                <Briefcase className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">Reservas de servicios</p>
                <p className="text-xs text-muted-foreground">
                  {serviceBookings.length} reserva{serviceBookings.length === 1 ? '' : 's'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            {!ticketCount && !venueBookings.length && !serviceBookings.length && (
              <div className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
                Aún no tienes compras ni reservas.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyPurchasesView;
