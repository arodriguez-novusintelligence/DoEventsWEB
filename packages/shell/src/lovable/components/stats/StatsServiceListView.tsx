import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, Briefcase, ChevronRight, Loader2, AlertCircle, Ticket, DollarSign } from 'lucide-react';
import ProfileSectionBanner from '@lovable/components/profile/ProfileSectionBanner';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';
import PromoCodesStatsView from './PromoCodesStatsView';
import RentalStatsView from './RentalStatsView';
import { serviceActivityLabel, serviceCoverUrl } from '../../../lovable-bridge/serviceFormMapper';
import {
  exportServiceStatisticsExcel,
  fetchServiceStatistics,
  type NearbyServiceProvider,
} from '@doevents/shared';
import type { User } from '@lovable/data/';

export interface ServiceStatsItem {
  serviceId: string;
  name: string;
  imageUrl?: string;
  city?: string;
}

interface StatsServiceListViewProps {
  services: NearbyServiceProvider[];
  loading?: boolean;
  loadError?: string | null;
  onBack: () => void;
  onViewProfile?: (user: User | { name: string; initials: string; id?: string }) => void;
}

function toStatsItem(service: NearbyServiceProvider): ServiceStatsItem {
  return {
    serviceId: service.serviceId,
    name: serviceActivityLabel(service),
    imageUrl: serviceCoverUrl(service),
    city: service.city,
  };
}

const StatsServiceListView = ({
  services,
  onBack,
  loading = false,
  loadError = null,
  onViewProfile,
}: StatsServiceListViewProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedServiceId = searchParams.get('service');
  const activeStatsOption = searchParams.get('view');

  const selectedService = useMemo(() => {
    if (!selectedServiceId) return null;
    const match = services.find((service) => service.serviceId === selectedServiceId);
    return match ? toStatsItem(match) : null;
  }, [services, selectedServiceId]);

  const openService = (service: NearbyServiceProvider) => {
    setSearchParams({ tab: 'services', service: service.serviceId });
  };

  const closeService = () => {
    setSearchParams({ tab: 'services' });
  };

  const openStatsSection = (optionId: string) => {
    if (!selectedServiceId) return;
    setSearchParams({ tab: 'services', service: selectedServiceId, view: optionId });
  };

  const backToServiceMenu = () => {
    if (selectedServiceId) {
      setSearchParams({ tab: 'services', service: selectedServiceId });
    }
  };

  if (selectedService && activeStatsOption === 'promocionales') {
    return (
      <PromoCodesStatsView
        service={selectedService}
        onBack={backToServiceMenu}
        onViewProfile={onViewProfile}
      />
    );
  }

  if (selectedService && activeStatsOption === 'reservas') {
    return (
      <RentalStatsView
        entity={{
          id: selectedService.serviceId,
          name: selectedService.name,
          subtitle: selectedService.city || 'Servicio',
          imageUrl: selectedService.imageUrl,
        }}
        entityType="service"
        nightsLabel="Días"
        onBack={backToServiceMenu}
        onViewProfile={onViewProfile}
        loadStats={(id, year, month) => fetchServiceStatistics(id, { year, month })}
        exportStats={(id, name) => exportServiceStatisticsExcel(id, name)}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary pb-24">
        <ProfileSectionBanner title="Estadísticas" subtitle="Cargando servicios…" icon={BarChart3} onBack={onBack} />
        <div className="mx-auto max-w-lg px-4 -mt-6">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-10 text-center shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Obteniendo tus servicios…</p>
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

  if (selectedService) {
    return (
      <div className="min-h-screen bg-secondary pb-24">
        <ProfileSectionBanner
          title={selectedService.name}
          subtitle={selectedService.city || 'Servicio'}
          icon={Briefcase}
          onBack={closeService}
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
              <p className="text-xs text-muted-foreground">Ocupación, cobros recibidos y calendario de reservas</p>
            </div>
            <ChevronRight className="h-5 w-5 text-primary/30" />
          </button>
          <button
            type="button"
            onClick={() => openStatsSection('promocionales')}
            className="w-full flex items-center gap-3 rounded-2xl border border-primary/15 bg-card p-4 text-left shadow-sm"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5">
              <Ticket className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Códigos promocionales</p>
              <p className="text-xs text-muted-foreground">Generados, redimidos y descuentos aplicados</p>
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
        subtitle={`${services.length} servicio${services.length === 1 ? '' : 's'}`}
        icon={BarChart3}
        onBack={onBack}
      />
      <div className="mx-auto max-w-lg px-4 -mt-6 space-y-3">
        {services.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center shadow-sm">
            <Briefcase className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-semibold text-foreground">Sin servicios publicados</p>
            <p className="mt-1 text-xs text-muted-foreground">Publica un servicio para ver estadísticas de códigos promocionales.</p>
          </div>
        ) : (
          services.map((service) => {
            const item = toStatsItem(service);
            return (
              <button
                key={service.serviceId}
                type="button"
                onClick={() => openService(service)}
                className="w-full flex items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-sm"
              >
                <Avatar className="h-12 w-12 rounded-xl">
                  {item.imageUrl && <AvatarImage src={item.imageUrl} className="object-cover" />}
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                    <Briefcase className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.city || 'Sin ciudad'}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-primary/30" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StatsServiceListView;
