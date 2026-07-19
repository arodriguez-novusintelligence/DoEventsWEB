import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Music,
  Camera,
  Utensils,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { UserServiceBooking } from '@doevents/shared';
import { Button } from '@lovable/components/ui/button';
import ServiceGroupOrdersView from './ServiceGroupOrdersView';
import PurchaseStatusTabs from '@lovable/components/purchases/PurchaseStatusTabs';
import {
  countByPurchaseStatus,
  groupServiceBookingsByService,
  mapBookingStatus,
  serviceDateRange,
  type PurchaseTabStatus,
} from '../../../lovable-bridge/purchasesAdapter';
import { resumeServicePaymentNavigation } from '../../../lovable-bridge/serviceReservationBridge';

interface MyReservedServicesViewProps {
  onBack: () => void;
  bookings?: UserServiceBooking[];
  loading?: boolean;
  loadError?: string | null;
  onRetry?: () => void;
  onViewServiceDetail?: (serviceId: string) => void;
  initialSelectedBookingId?: string | null;
}

function resolveServiceIcon(sector?: string, name?: string): LucideIcon {
  const raw = `${sector || ''} ${name || ''}`.toLowerCase();
  if (raw.includes('dj') || raw.includes('música') || raw.includes('musica')) return Music;
  if (raw.includes('foto') || raw.includes('video')) return Camera;
  if (raw.includes('cater') || raw.includes('comida') || raw.includes('banqu')) return Utensils;
  return Sparkles;
}

export const MyReservedServicesView = ({
  onBack,
  bookings = [],
  loading = false,
  loadError = null,
  onRetry,
  onViewServiceDetail,
  initialSelectedBookingId = null,
}: MyReservedServicesViewProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PurchaseTabStatus>('aprobada');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!initialSelectedBookingId) return;
    const match = bookings.find((b) => b.bookingId === initialSelectedBookingId);
    if (match) {
      setSelectedGroupId(match.serviceId || match.serviceName);
    }
  }, [initialSelectedBookingId, bookings]);

  const counts = useMemo(() => countByPurchaseStatus(bookings), [bookings]);

  const filtered = useMemo(
    () => bookings.filter((b) => mapBookingStatus(b.status) === activeTab),
    [bookings, activeTab],
  );

  const groupedServices = useMemo(
    () => groupServiceBookingsByService(filtered),
    [filtered],
  );

  const selectedGroup = useMemo(
    () => groupedServices.find((g) => g.id === selectedGroupId) ?? null,
    [groupedServices, selectedGroupId],
  );

  if (selectedGroup) {
    return (
      <ServiceGroupOrdersView
        group={selectedGroup}
        onBack={() => setSelectedGroupId(null)}
        onViewServiceDetail={onViewServiceDetail ? () => onViewServiceDetail(selectedGroup.serviceId) : undefined}
        onCompletePayment={(booking) => resumeServicePaymentNavigation(navigate, booking)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-secondary pb-36">
      <div className="mx-auto max-w-lg px-4 pt-4">
        <button type="button" onClick={onBack} className="mb-4 flex items-center gap-1 text-sm font-semibold text-primary">
          <ChevronLeft className="h-5 w-5" /> Atrás
        </button>

        <PurchaseStatusTabs
          activeTab={activeTab}
          counts={counts}
          onChange={(tab) => {
            setSelectedGroupId(null);
            setActiveTab(tab);
          }}
        />

        <div className="mt-4 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-card py-12 shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Cargando reservas…</p>
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-sm">
              <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
              <p className="mt-3 text-sm font-medium text-destructive">{loadError}</p>
              {onRetry && (
                <Button type="button" variant="outline" className="mt-4 rounded-full" onClick={onRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reintentar
                </Button>
              )}
            </div>
          ) : groupedServices.length === 0 ? (
            <div className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
              No hay servicios en esta categoría.
            </div>
          ) : (
            groupedServices.map((group) => {
              const Icon = resolveServiceIcon(group.serviceSector, group.serviceName);
              const latest = group.bookings[0];
              const range = latest ? serviceDateRange(latest) : { start: '—', end: '—' };
              const dateLabel = range.start === range.end ? range.start : `${range.start} → ${range.end}`;

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroupId(group.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border/40 bg-card p-3 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.99]"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-extrabold text-foreground">{group.serviceName}</h3>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {group.serviceProvider || group.serviceSector || 'Proveedor'}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span>{dateLabel}</span>
                      {group.bookings.length > 1 && (
                        <span className="ml-1 text-[10px] font-semibold text-primary">
                          · {group.bookings.length} órdenes
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-primary" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MyReservedServicesView;
