import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Building2, Briefcase, ChevronRight, Ticket, AlertCircle } from 'lucide-react';
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
import { Button } from '@lovable/components/ui/button';
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
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
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
        setLoadError(false);
        setTickets(grouped ? groupedTicketsToLovable(grouped) : []);
        setVenueBookings(venues);
        setServiceBookings(services);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, reloadKey]);

  const retryLoad = () => setReloadKey((k) => k + 1);

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
        ) : loadError ? (
          <div className="rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-sm">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-3 text-sm font-medium text-destructive">No pudimos cargar tus compras.</p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 rounded-full"
              onClick={retryLoad}
            >
              Reintentar
            </Button>
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
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
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
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Briefcase className="h-5 w-5 text-primary" />
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
              <div className="rounded-2xl bg-card p-10 text-center shadow-sm">
                <Ticket className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium text-foreground">Sin compras ni reservas</p>
                <p className="mt-1 text-xs text-muted-foreground">Tus boletas y reservas aparecerán aquí</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyPurchasesView;
