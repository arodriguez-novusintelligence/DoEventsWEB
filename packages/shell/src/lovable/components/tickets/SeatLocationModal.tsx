import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@lovable/components/ui/dialog';
import { Button } from '@lovable/components/ui/button';
import { Armchair, MapPin, DoorOpen, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import type { Ticket } from '@lovable/data/ticketsData';
import MultiFloorVenueMap from '@lovable/components/venue/MultiFloorVenueMap';
import { parseSeatLabel } from '../../../lovable-bridge/venueToFigures';
import { ticketHasSeat } from '../../../lovable-bridge/ticketsAdapter';
import {
  fetchAvailableSeats,
  fetchEventDetail,
  getVenueById,
  resolveCheckoutFloors,
  type TicketCategory,
  type VenueFloorDetail,
} from '@doevents/shared';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ticket: Ticket | null;
}

const SeatLocationModal = ({ open, onOpenChange, ticket }: Props) => {
  const [loading, setLoading] = useState(false);
  const [floors, setFloors] = useState<VenueFloorDetail[]>([]);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const seatLabel = useMemo(() => {
    if (!ticket) return null;
    const raw = ticket.seatLabel || ticket.seat || '';
    return parseSeatLabel(raw);
  }, [ticket]);

  const displaySeat = ticket?.seatLabel || ticket?.seat || '—';

  useEffect(() => {
    if (!open || !ticket?.eventId || !seatLabel) {
      setFloors([]);
      setCategories([]);
      setError('');
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [seatsData, eventDetail] = await Promise.all([
          fetchAvailableSeats(ticket.eventId!).catch(() => ({ categories: [] as TicketCategory[] })),
          fetchEventDetail(ticket.eventId!).catch(() => null),
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

        const resolvedFloors = resolveCheckoutFloors(rawFloors, ticketCategories);
        if (!resolvedFloors.length) {
          setError('No hay mapa de silletería disponible para este evento.');
        }
        setCategories(ticketCategories);
        setFloors(resolvedFloors);
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
  }, [open, ticket?.eventId, seatLabel, reloadKey]);

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="bg-gradient-to-br from-primary to-accent p-5 text-primary-foreground">
          <DialogTitle className="flex items-center gap-2 font-extrabold text-primary-foreground">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 ring-2 ring-primary-foreground/20">
              <MapPin className="h-5 w-5" />
            </span>
            Ubicación de tu silla
          </DialogTitle>
          <DialogDescription className="text-primary-foreground/85">
            {ticket.eventTitle} · {ticket.eventDate}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-4">
          <div className="flex items-center justify-between text-xs mb-3 gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
              <Armchair className="h-3.5 w-3.5" /> {displaySeat}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 font-semibold text-foreground">
              <DoorOpen className="h-3.5 w-3.5 text-primary" /> {ticket.entrance || 'Entrada principal'}
            </span>
          </div>

          {!ticketHasSeat(ticket) ? (
            <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card px-4 text-center shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <Armchair className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm font-extrabold text-foreground">Sin asiento numerado</p>
              <p className="text-xs text-muted-foreground">Esta boleta no tiene asiento numerado.</p>
            </div>
          ) : loading ? (
            <div className="flex h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
              <p className="text-sm font-extrabold text-foreground">Cargando mapa…</p>
            </div>
          ) : error || !floors.length ? (
            <div className="flex h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card px-4 text-center shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
              <p className="text-sm text-muted-foreground">{error || 'Mapa de asientos no disponible'}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5"
                onClick={() => setReloadKey((k) => k + 1)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reintentar
              </Button>
            </div>
          ) : (
            <MultiFloorVenueMap
              floors={floors}
              ticketCategories={categories}
              highlightSeats={seatLabel && ticket.category
                ? [{ categoryName: ticket.category, label: seatLabel }]
                : []}
              filterCategoryName="all"
              height={320}
              autoFocusHighlight
            />
          )}

          <div className="mt-4 flex items-center gap-4 text-[11px] text-muted-foreground border-t border-border/60 pt-3">
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-primary" /> Tu silla</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-muted" /> Ocupada</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SeatLocationModal;
