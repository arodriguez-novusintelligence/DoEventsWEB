import React, { useMemo, useState } from 'react';
import type { TicketCategory, VenueFloorDetail } from '@doevents/shared';
import { MultiFloorVenueMap } from '../lovable/components/venue/MultiFloorVenueMap';
import type { HighlightSeat } from '../lovable-bridge/venueToFigures';

export interface FullVenueMapViewerProps {
  floors: VenueFloorDetail[];
  ticketCategories: TicketCategory[];
  /** Sillas seleccionadas (checkout) por ticketInstanceId */
  selectedIds?: Set<string>;
  /** Sillas a resaltar por categoría + etiqueta, ej. Palco 1 / A2 */
  highlightSeats?: HighlightSeat[];
  readOnly?: boolean;
  height?: number | string;
  showCategoryTabs?: boolean;
}

export const FullVenueMapViewer: React.FC<FullVenueMapViewerProps> = ({
  floors,
  ticketCategories,
  selectedIds,
  highlightSeats = [],
  readOnly = true,
  height = 'min(70vh, 520px)',
  showCategoryTabs = true,
}) => {
  const [filterCategory, setFilterCategory] = useState('all');

  const categoryNames = useMemo(
    () => ticketCategories.map((c) => c.categoryName).filter(Boolean),
    [ticketCategories],
  );

  return (
    <div className="de-full-venue-map">
      {showCategoryTabs && categoryNames.length > 0 && (
        <div className="de-full-venue-map__tabs">
          <button
            type="button"
            className={`de-full-venue-map__tab${filterCategory === 'all' ? ' de-full-venue-map__tab--active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            Todas
          </button>
          {categoryNames.map((name) => (
            <button
              key={name}
              type="button"
              className={`de-full-venue-map__tab${filterCategory === name ? ' de-full-venue-map__tab--active' : ''}`}
              onClick={() => setFilterCategory(name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <div className="de-full-venue-map__canvas-wrap">
        <MultiFloorVenueMap
          interactive={!readOnly}
          floors={floors}
          ticketCategories={ticketCategories}
          filterCategoryName={filterCategory}
          selectedIds={selectedIds}
          highlightSeats={highlightSeats}
          height={height}
          autoFocusHighlight={highlightSeats.length > 0}
        />
      </div>

      <p className="de-full-venue-map__legend">
        Tus sillas aparecen en morado. El escenario está arriba.
      </p>
    </div>
  );
};

export default FullVenueMapViewer;
