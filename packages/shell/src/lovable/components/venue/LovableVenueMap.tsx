import React, { useMemo } from 'react';
import type { SeatingFigure } from '@lovable/data/eventFormData';
import { SeatingPreview } from '@lovable/components/events/StepEventLocation';
import {
  buildSeatStatesForFigure,
  findSeatByLabel,
  venueFloorsToFigures,
  type HighlightSeat,
  type SeatVisualState,
} from '../../../lovable-bridge/venueToFigures';
import type { AvailableSeat, TicketCategory, VenueFloorDetail } from '@doevents/shared';

export interface LovableVenueMapProps {
  floors: VenueFloorDetail[];
  ticketCategories?: TicketCategory[];
  selectedIds?: Set<string>;
  highlightSeats?: HighlightSeat[];
  filterCategoryName?: string;
  onToggle?: (category: TicketCategory, seat: AvailableSeat, label: string) => void;
  interactive?: boolean;
  height?: number | string;
}

export const LovableVenueMap: React.FC<LovableVenueMapProps> = ({
  floors,
  ticketCategories = [],
  selectedIds,
  highlightSeats = [],
  filterCategoryName = 'all',
  onToggle,
  interactive = false,
  height = 280,
}) => {
  const figures = useMemo(() => venueFloorsToFigures(floors), [floors]);

  const visibleFigures = useMemo(() => {
    if (filterCategoryName === 'all') return figures;
    const target = filterCategoryName.trim().toLowerCase();
    return figures.filter(
      (f) => f.role !== 'category' || f.name.trim().toLowerCase() === target,
    );
  }, [figures, filterCategoryName]);

  const seatStatesByFigure = useMemo(() => {
    const map = new Map<string, Record<string, SeatVisualState>>();
    visibleFigures.forEach((figure) => {
      if (figure.role !== 'category') return;
      map.set(
        figure.id,
        buildSeatStatesForFigure(figure, {
          categories: ticketCategories,
          selectedIds,
          highlightSeats,
        }),
      );
    });
    return map;
  }, [visibleFigures, ticketCategories, selectedIds, highlightSeats]);

  const handleSeatClick = (figure: SeatingFigure, label: string) => {
    if (!interactive || !onToggle) return;
    const match = findSeatByLabel(label, ticketCategories, figure);
    if (!match) return;
    onToggle(match.category, match.seat, match.label);
  };

  if (!visibleFigures.length) {
    return (
      <div
        className="flex w-full items-center justify-center rounded-lg bg-secondary text-sm text-muted-foreground"
        style={{ height }}
      >
        Sin mapa de silletería
      </div>
    );
  }

  return (
    <SeatingPreview
      figures={visibleFigures}
      height={height}
      seatStatesByFigure={seatStatesByFigure}
      interactive={interactive}
      onSeatClick={handleSeatClick}
    />
  );
};

export default LovableVenueMap;
