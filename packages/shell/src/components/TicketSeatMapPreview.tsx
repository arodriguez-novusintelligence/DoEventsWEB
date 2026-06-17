import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchAvailableSeats,
  fetchEventDetail,
  getVenueById,
  Loader,
  resolveCheckoutFloors,
  type TicketCategory,
  type VenueFloorDetail,
} from '@doevents/shared';
import { FullVenueMapViewer } from './FullVenueMapViewer';

export interface TicketSeatMapPreviewProps {
  eventId: string;
  seatLabel?: string;
  category?: string;
  ticketId?: string;
  compact?: boolean;
}

export const TicketSeatMapPreview: React.FC<TicketSeatMapPreviewProps> = ({
  eventId,
  seatLabel,
  category,
  ticketId,
  compact = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [floors, setFloors] = useState<VenueFloorDetail[]>([]);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventId || !seatLabel) {
      setFloors([]);
      setCategories([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [seatsData, eventDetail] = await Promise.all([
          fetchAvailableSeats(eventId).catch(() => ({ categories: [] as TicketCategory[] })),
          fetchEventDetail(eventId).catch(() => null),
        ]);
        if (cancelled) return;

        const ticketCategories = seatsData.categories || [];
        let rawFloors: VenueFloorDetail[] = [];
        const venueId = eventDetail?.event?.venueId;
        if (venueId) {
          try {
            const venue = await getVenueById(venueId);
            rawFloors = venue.floors || [];
          } catch {
            rawFloors = [];
          }
        }

        setCategories(ticketCategories);
        setFloors(resolveCheckoutFloors(rawFloors, ticketCategories));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el mapa');
          setFloors([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [eventId, seatLabel, category]);

  const selectedIds = useMemo(() => {
    const ids = new Set<string>();
    if (ticketId) ids.add(ticketId);
    return ids;
  }, [ticketId]);

  const highlightSeats = useMemo(
    () => (seatLabel && category
      ? [{ categoryName: category, label: seatLabel.trim() }]
      : []),
    [seatLabel, category],
  );

  if (!seatLabel) {
    return (
      <p className="rounded-xl bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
        Entrada sin asiento numerado
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-muted/30">
        <Loader />
      </div>
    );
  }

  if (error || !floors.length) {
    return (
      <p className="rounded-xl bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
        {error || 'Mapa de asientos no disponible'}
      </p>
    );
  }

  return (
    <div className={compact ? 'rounded-xl border border-border bg-card overflow-hidden p-3' : ''}>
      <FullVenueMapViewer
        floors={floors}
        ticketCategories={categories}
        selectedIds={selectedIds}
        highlightSeats={highlightSeats}
        readOnly
        height={compact ? 320 : 'min(65vh, 480px)'}
      />
    </div>
  );
};

export default TicketSeatMapPreview;
