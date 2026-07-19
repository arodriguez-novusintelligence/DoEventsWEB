import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart3, BedDouble, ChevronRight, Loader2, AlertCircle, DollarSign,
} from 'lucide-react';
import ProfileSectionBanner from '@lovable/components/profile/ProfileSectionBanner';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';
import RentalStatsView from './RentalStatsView';
import {
  exportVenueStatisticsExcel,
  fetchVenueStatistics,
  formatRentalMoney,
  type VenueStatsListItem,
} from '@doevents/shared';
import type { User } from '@lovable/data/';

interface StatsVenueListViewProps {
  venues: VenueStatsListItem[];
  loading?: boolean;
  loadError?: string | null;
  onBack: () => void;
  onViewProfile?: (user: User | { name: string; initials: string; id?: string }) => void;
}

const StatsVenueListView = ({
  venues,
  onBack,
  loading = false,
  loadError = null,
  onViewProfile,
}: StatsVenueListViewProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedVenueId = searchParams.get('venue');
  const activeStatsOption = searchParams.get('view');

  const selectedVenue = useMemo(() => {
    if (!selectedVenueId) return null;
    return venues.find((venue) => venue.venueId === selectedVenueId) || null;
  }, [venues, selectedVenueId]);

  const openVenue = (venue: VenueStatsListItem) => {
    setSearchParams({ tab: 'venues', venue: venue.venueId });
  };

  const closeVenue = () => {
    setSearchParams({ tab: 'venues' });
  };

  const openStatsSection = (optionId: string) => {
    if (!selectedVenueId) return;
    setSearchParams({ tab: 'venues', venue: selectedVenueId, view: optionId });
  };

  const backToVenueMenu = () => {
    if (selectedVenueId) {
      setSearchParams({ tab: 'venues', venue: selectedVenueId });
    }
  };

  if (selectedVenue && activeStatsOption === 'reservas') {
    return (
      <RentalStatsView
        entity={{
          id: selectedVenue.venueId,
          name: selectedVenue.name,
          subtitle: selectedVenue.city || selectedVenue.address || 'Lugar',
          imageUrl: selectedVenue.imageUrl || undefined,
        }}
        entityType="venue"
        nightsLabel="Noches"
        onBack={backToVenueMenu}
        onViewProfile={onViewProfile}
        loadStats={(id, year, month) => fetchVenueStatistics(id, { year, month })}
        exportStats={(id, name) => exportVenueStatisticsExcel(id, name)}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary pb-24">
        <ProfileSectionBanner title="Estadísticas" subtitle="Cargando lugares…" icon={BarChart3} onBack={onBack} />
        <div className="mx-auto max-w-lg px-4 -mt-6">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-10 text-center shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Obteniendo tus lugares…</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-secondary pb-24">
        <ProfileSectionBanner title="Estadísticas" subtitle="Error al cargar" icon={BarChart3} onBack={onBack} />
        <div className="mx-auto max-w-lg px-4 -mt-6">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-10 text-center shadow-sm">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-semibold text-destructive">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedVenue) {
    return (
      <div className="min-h-screen bg-secondary pb-24">
        <ProfileSectionBanner
          title={selectedVenue.name}
          subtitle={selectedVenue.city || selectedVenue.address || 'Lugar'}
          icon={BedDouble}
          onBack={closeVenue}
        />
        <div className="mx-auto max-w-lg px-4 -mt-6 space-y-3">
          <button
            type="button"
            onClick={() => openStatsSection('reservas')}
            className="w-full flex items-center gap-3 rounded-2xl border border-primary/15 bg-card p-4 text-left shadow-sm"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Reservas e ingresos</p>
              <p className="text-xs text-muted-foreground">
                Ocupación, cobros recibidos y calendario de reservas
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-primary/30" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary pb-24">
      <ProfileSectionBanner
        title="Estadísticas"
        subtitle={`${venues.length} lugar${venues.length === 1 ? '' : 'es'}`}
        icon={BarChart3}
        onBack={onBack}
      />
      <div className="mx-auto max-w-lg px-4 -mt-6 space-y-3">
        {venues.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center shadow-sm">
            <BedDouble className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-semibold text-foreground">Sin lugares publicados</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Publica un lugar para ver estadísticas de reservas e ingresos.
            </p>
          </div>
        ) : (
          venues.map((venue) => (
            <button
              key={venue.venueId}
              type="button"
              onClick={() => openVenue(venue)}
              className="w-full flex items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-sm"
            >
              <Avatar className="h-12 w-12 rounded-xl">
                {venue.imageUrl && <AvatarImage src={venue.imageUrl} className="object-cover" />}
                <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                  <BedDouble className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{venue.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {venue.city || venue.address || 'Sin ubicación'}
                  {venue.reservationsCount > 0 && ` · ${formatRentalMoney(venue.receivedRevenue)} recibidos`}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-primary/30" />
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default StatsVenueListView;
