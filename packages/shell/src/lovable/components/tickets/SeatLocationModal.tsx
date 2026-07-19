import { useEffect, useMemo, useState } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@lovable/components/ui/dialog';

import { Button } from '@lovable/components/ui/button';

import { Armchair, MapPin, DoorOpen, Loader2, RefreshCw, AlertCircle, Layers, LayoutGrid } from 'lucide-react';

import type { Ticket } from '@lovable/data/ticketsData';

import MultiFloorVenueMap from '@lovable/components/venue/MultiFloorVenueMap';

import ZoomableSeatingMap from '@lovable/components/venue/ZoomableSeatingMap';

import { findFloorIndexForSeat, parseSeatLabel } from '../../../lovable-bridge/venueToFigures';

import { ticketHasSeat } from '../../../lovable-bridge/ticketsAdapter';

import { cn } from '@lovable/lib/utils';

import {

  fetchAvailableSeats,

  fetchEventDetail,

  getVenueById,

  resolveCheckoutFloors,

  resolveCheckoutVenueId,

  type TicketCategory,

  type VenueFloorDetail,

} from '@doevents/shared';



interface Props {

  open: boolean;

  onOpenChange: (v: boolean) => void;

  ticket: Ticket | null;

}



type MapViewMode = 'floor' | 'all';



const SeatLocationModal = ({ open, onOpenChange, ticket }: Props) => {

  const [loading, setLoading] = useState(false);

  const [floors, setFloors] = useState<VenueFloorDetail[]>([]);

  const [categories, setCategories] = useState<TicketCategory[]>([]);

  const [error, setError] = useState('');

  const [reloadKey, setReloadKey] = useState(0);

  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('floor');

  const [activeFloorIndex, setActiveFloorIndex] = useState(0);



  const seatLabel = useMemo(() => {

    if (!ticket) return null;

    const raw = ticket.seatLabel || ticket.seat || '';

    return parseSeatLabel(raw);

  }, [ticket]);



  const highlightSeats = useMemo(() => {

    if (!seatLabel || !ticket?.category) return [];

    return [{ categoryName: ticket.category, label: seatLabel }];

  }, [seatLabel, ticket?.category]);



  const seatFloorIndex = useMemo(

    () => findFloorIndexForSeat(floors, highlightSeats[0]),

    [floors, highlightSeats],

  );



  const displaySeat = ticket?.seatLabel || ticket?.seat || '—';

  const hasMultipleFloors = floors.length > 1;



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

        const checkoutVenueId = resolveCheckoutVenueId(eventDetail?.event?.venueId, ticketCategories);

        if (checkoutVenueId) {

          try {

            const venue = await getVenueById(checkoutVenueId, { forceNetwork: true });

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



  useEffect(() => {

    if (!open) return;

    setMapViewMode('floor');

    setActiveFloorIndex(seatFloorIndex);

  }, [open, seatFloorIndex, floors.length]);



  if (!ticket) return null;



  const mapHeight = mapViewMode === 'all' ? 'min(62vh, 560px)' : 'min(52vh, 480px)';

  const mapDefaultZoom = mapViewMode === 'all' ? 100 : 140;



  return (

    <Dialog open={open} onOpenChange={onOpenChange}>

      <DialogContent className="fixed left-[50%] top-[50%] z-50 grid max-h-[96dvh] w-[calc(100%-1.5rem)] max-w-xl translate-x-[-50%] translate-y-[-50%] gap-0 overflow-hidden rounded-2xl border border-border/60 p-0 shadow-lg sm:max-w-2xl">

        <DialogHeader className="bg-gradient-to-br from-primary to-accent p-5 pr-12 text-primary-foreground">

          <DialogTitle className="flex items-center gap-2 font-extrabold text-primary-foreground">

            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 ring-2 ring-primary-foreground/20">

              <MapPin className="h-5 w-5" />

            </span>

            Ubicación de tu silla

          </DialogTitle>

          <DialogDescription className="text-sm font-extrabold text-primary-foreground/85">

            {ticket.eventTitle} · {ticket.eventDate}

          </DialogDescription>

        </DialogHeader>



        <div className="overflow-y-auto px-4 py-4 sm:px-5">

          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-primary/10 px-2.5 py-1 font-extrabold text-primary shadow-sm">

              <Armchair className="h-3.5 w-3.5" /> {displaySeat}

            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary px-2.5 py-1 font-extrabold text-foreground shadow-sm">

              <DoorOpen className="h-3.5 w-3.5 text-primary" /> {ticket.entrance || 'Entrada principal'}

            </span>

            {hasMultipleFloors && mapViewMode === 'floor' && (

              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-semibold text-muted-foreground">

                <MapPin className="h-3 w-3 text-primary" />

                Tu piso: {floors[seatFloorIndex]?.name?.trim() || `Piso ${seatFloorIndex + 1}`}

              </span>

            )}

          </div>



          {!ticketHasSeat(ticket) ? (

            <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/25 border-border/60 bg-card px-4 text-center shadow-sm">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">

                <Armchair className="h-7 w-7 text-primary" />

              </div>

              <p className="text-sm font-extrabold text-foreground">Sin asiento numerado</p>

              <p className="text-xs font-extrabold text-muted-foreground">Esta boleta no tiene asiento numerado.</p>

            </div>

          ) : loading ? (

            <div className="flex h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card shadow-sm">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">

                <Loader2 className="h-7 w-7 animate-spin text-primary" />

              </div>

              <p className="text-sm font-extrabold text-foreground">Cargando mapa…</p>

            </div>

          ) : error || !floors.length ? (

            <div className="flex h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-primary/25 border-border/60 bg-card px-4 text-center shadow-sm">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">

                <AlertCircle className="h-7 w-7 text-destructive" />

              </div>

              <p className="text-sm font-extrabold text-foreground">{error || 'Mapa de asientos no disponible'}</p>

              <Button

                type="button"

                variant="outline"

                size="sm"

                className="gap-1.5 rounded-full font-extrabold shadow-sm"

                onClick={() => setReloadKey((k) => k + 1)}

              >

                <RefreshCw className="h-3.5 w-3.5" />

                Reintentar

              </Button>

            </div>

          ) : (

            <>

              <div className="mb-3 flex flex-wrap items-center gap-2">

                <div className="inline-flex rounded-full border border-border bg-muted/50 p-0.5">

                  <button

                    type="button"

                    onClick={() => {

                      setMapViewMode('floor');

                      setActiveFloorIndex(seatFloorIndex);

                    }}

                    className={cn(

                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors',

                      mapViewMode === 'floor'

                        ? 'bg-primary text-primary-foreground shadow-sm'

                        : 'text-muted-foreground hover:text-foreground',

                    )}

                  >

                    <Layers className="h-3.5 w-3.5" />

                    Mi piso

                  </button>

                  <button

                    type="button"

                    onClick={() => setMapViewMode('all')}

                    className={cn(

                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors',

                      mapViewMode === 'all'

                        ? 'bg-primary text-primary-foreground shadow-sm'

                        : 'text-muted-foreground hover:text-foreground',

                    )}

                  >

                    <LayoutGrid className="h-3.5 w-3.5" />

                    Mapa completo

                  </button>

                </div>

                <p className="text-[11px] font-medium text-muted-foreground">

                  {mapViewMode === 'floor'

                    ? 'Un piso a la vez · selecciona otro piso arriba del mapa'

                    : 'Todos los pisos · desplázate verticalmente'}

                </p>

              </div>



              <ZoomableSeatingMap

                key={`${mapViewMode}-${reloadKey}`}

                defaultZoom={mapDefaultZoom}

                viewportHeight={mapHeight}

              >

                <MultiFloorVenueMap

                  floors={floors}

                  ticketCategories={categories}

                  highlightSeats={highlightSeats}

                  filterCategoryName="all"

                  layoutMode={mapViewMode === 'all' ? 'stacked' : 'tabs'}

                  activeFloorIndex={activeFloorIndex}

                  onActiveFloorIndexChange={setActiveFloorIndex}

                  seatFloorIndex={seatFloorIndex}

                  autoFocusHighlight={false}

                  ownerPreviewMode

                  height={mapViewMode === 'all' ? 'min(38vh, 360px)' : 'min(46vh, 420px)'}

                />

              </ZoomableSeatingMap>

            </>

          )}



          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border/60 pt-3 text-[11px] font-extrabold text-muted-foreground">

            <span className="inline-flex items-center gap-1.5">

              <span className="h-3 w-3 rounded-sm bg-primary" /> Tu silla

            </span>

            <span className="inline-flex items-center gap-1.5">

              <span className="h-3 w-3 rounded-sm bg-muted" /> Ocupada

            </span>

          </div>

        </div>

      </DialogContent>

    </Dialog>

  );

};



export default SeatLocationModal;

