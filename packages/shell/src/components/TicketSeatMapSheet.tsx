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



export interface TicketSeatMapSheetProps {

  open: boolean;

  eventId: string;

  eventName: string;

  ticketId: string;

  seatLabel?: string;

  category?: string;

  onClose: () => void;

}



export const TicketSeatMapSheet: React.FC<TicketSeatMapSheetProps> = ({

  open,

  eventId,

  eventName,

  ticketId,

  seatLabel,

  category,

  onClose,

}) => {

  const [loading, setLoading] = useState(false);

  const [floors, setFloors] = useState<VenueFloorDetail[]>([]);

  const [categories, setCategories] = useState<TicketCategory[]>([]);



  useEffect(() => {

    if (!open || !eventId) return;

    let cancelled = false;

    const load = async () => {

      setLoading(true);

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

      } finally {

        if (!cancelled) setLoading(false);

      }

    };

    load();

    return () => { cancelled = true; };

  }, [open, eventId]);



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



  if (!open) return null;



  return (

    <div className="de-sheet-overlay de-checkout-confirm-overlay" onClick={onClose} role="presentation">

      <div

        className="de-sheet de-checkout-confirm-sheet de-checkout-confirm-sheet--full-map"

        onClick={(e) => e.stopPropagation()}

        role="dialog"

        aria-modal="true"

        aria-labelledby="ticket-seat-map-title"

      >

        <header className="de-sheet__header">

          <div>

            <h2 id="ticket-seat-map-title">Mapa completo</h2>

            <p className="de-checkout-confirm-sheet__sub">{eventName}</p>

          </div>

          <button type="button" className="de-sheet__close" onClick={onClose} aria-label="Cerrar">×</button>

        </header>



        <div className="de-sheet__body de-checkout-confirm-sheet__body">

          {seatLabel && (

            <div className="de-checkout-confirm-sheet__focus-card">

              <div>

                <strong>{category || 'Localidad'}</strong>

                <span>Asiento {seatLabel}</span>

              </div>

            </div>

          )}



          {loading ? (

            <Loader />

          ) : floors.length > 0 ? (

            <FullVenueMapViewer

              floors={floors}

              ticketCategories={categories}

              selectedIds={selectedIds}

              highlightSeats={highlightSeats}

              readOnly

              height="min(65vh, 480px)"

            />

          ) : (

            <p className="de-empty-state">No hay mapa de asientos disponible para este evento.</p>

          )}

        </div>

      </div>

    </div>

  );

};



export default TicketSeatMapSheet;

