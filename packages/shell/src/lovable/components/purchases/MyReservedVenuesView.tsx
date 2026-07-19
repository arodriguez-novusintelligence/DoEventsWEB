import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import type { UserVenueBooking } from '@doevents/shared';
import { Button } from '@lovable/components/ui/button';
import VenueGroupOrdersView from './VenueGroupOrdersView';
import PurchaseStatusTabs from '@lovable/components/purchases/PurchaseStatusTabs';
import {
  countByPurchaseStatus,
  formatPurchaseDate,
  groupVenueBookingsByVenue,
  resolveVenueImage,
  resolveVenuePurchaseTab,
  type PurchaseTabStatus,
} from '../../../lovable-bridge/purchasesAdapter';

interface MyReservedVenuesViewProps {
  onBack: () => void;
  bookings?: UserVenueBooking[];
  loading?: boolean;
  loadError?: string | null;
  onRetry?: () => void;
  onViewVenueDetail?: (venueId: string) => void;
  initialTab?: PurchaseTabStatus;
  highlightBookingId?: string;
}

export const MyReservedVenuesView = ({
  onBack,
  bookings = [],
  loading = false,
  loadError = null,
  onRetry,
  onViewVenueDetail,
  initialTab = 'aprobada',
  highlightBookingId,
}: MyReservedVenuesViewProps) => {
  const [activeTab, setActiveTab] = useState<PurchaseTabStatus>(initialTab);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!highlightBookingId) return;
    const match = bookings.find((b) => b.bookingId === highlightBookingId);
    if (match) {
      setSelectedGroupId(match.venueId || match.venueName);
    }
  }, [highlightBookingId, bookings]);

  const counts = useMemo(() => countByPurchaseStatus(bookings, resolveVenuePurchaseTab), [bookings]);

  const filtered = useMemo(
    () => bookings.filter((b) => resolveVenuePurchaseTab(b) === activeTab),
    [bookings, activeTab],
  );

  const groupedVenues = useMemo(
    () => groupVenueBookingsByVenue(filtered),
    [filtered],
  );

  const selectedGroup = useMemo(
    () => groupedVenues.find((g) => g.id === selectedGroupId) ?? null,
    [groupedVenues, selectedGroupId],
  );

  if (selectedGroup) {
    return (
      <VenueGroupOrdersView
        group={selectedGroup}
        onBack={() => setSelectedGroupId(null)}
        onViewVenueDetail={onViewVenueDetail ? () => onViewVenueDetail(selectedGroup.venueId) : undefined}
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
          ) : groupedVenues.length === 0 ? (
            <div className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
              No hay reservas en esta categoría.
            </div>
          ) : (
            groupedVenues.map((group) => {
              const latest = group.bookings[0];
              const dates = [...(latest?.selectedDates || [])].sort();
              const dateLabel = dates.length
                ? `${formatPurchaseDate(dates[0])} → ${formatPurchaseDate(dates[dates.length - 1])}`
                : '—';
              const image = latest ? resolveVenueImage(latest) : undefined;

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroupId(group.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border/40 bg-card p-3 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.99]"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {image ? (
                      <img src={image} alt={group.venueName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary/10 text-[10px] font-bold text-primary">
                        Lugar
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-extrabold text-foreground">{group.venueName}</h3>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{group.city || latest?.venueCity || '—'}</p>
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

export default MyReservedVenuesView;
