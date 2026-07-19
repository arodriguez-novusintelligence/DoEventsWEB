import React, { useMemo, useRef } from 'react';
import type { SeatingFigure } from '@lovable/data/eventFormData';
import { SeatingPreview } from '@lovable/components/events/StepEventLocation';
import {
  buildSeatStatesForFigure,
  findSeatByLabel,
  findTicketCategoryForFigure,
  seatMatchesGridLabel,
  venueFloorsToFigures,
  type HighlightSeat,
  type SeatVisualState,
} from '../../../lovable-bridge/venueToFigures';
import type { AvailableSeat, TicketCategory, VenueFloorDetail } from '@doevents/shared';

export interface LovableVenueMapProps {
  floors: VenueFloorDetail[];
  ticketCategories?: TicketCategory[];
  /** Categorías con todas las boletas (incl. no disponibles) solo para colorear el mapa */
  displayCategories?: TicketCategory[];
  selectedIds?: Set<string>;
  /** Sillas elegidas por categoría+etiqueta (respaldo visual cuando el id no coincide) */
  selectedSeats?: HighlightSeat[];
  highlightSeats?: HighlightSeat[];
  filterCategoryName?: string;
  onToggle?: (category: TicketCategory, seat: AvailableSeat, label: string) => void;
  interactive?: boolean;
  ownerPreviewMode?: boolean;
  height?: number | string;
  /** Vista general: zonas y etiquetas sin grilla de sillas (evita solapamiento) */
  overviewMode?: boolean;
}

export const LovableVenueMap: React.FC<LovableVenueMapProps> = ({
  floors,
  ticketCategories = [],
  displayCategories,
  selectedIds,
  selectedSeats = [],
  highlightSeats = [],
  filterCategoryName = 'all',
  onToggle,
  interactive = false,
  ownerPreviewMode = false,
  height = 280,
  overviewMode = false,
}) => {
  const lastToggleRef = useRef<{ key: string; ts: number } | null>(null);
  /** En checkout interactivo nunca ocultar la grilla de sillas (vista Todo / mapa completo). */
  const effectiveOverviewMode = overviewMode && !interactive;
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
          categories: displayCategories || ticketCategories,
          selectedIds,
          selectedSeats,
          highlightSeats,
          ownerPreviewMode,
        }),
      );
    });
    return map;
  }, [visibleFigures, displayCategories, ticketCategories, selectedIds, selectedSeats, highlightSeats, ownerPreviewMode]);

  const handleSeatClick = (figure: SeatingFigure, label: string) => {
    if (!interactive || !onToggle || effectiveOverviewMode) return;

    const lookupCategories = displayCategories?.length ? displayCategories : ticketCategories;
    const match = findSeatByLabel(label, lookupCategories, figure);
    if (!match) return;

    const purchaseCategory = findTicketCategoryForFigure(ticketCategories, figure) || match.category;
    const purchaseSeat = purchaseCategory.seats.find(
      (seat) => seat.ticketInstanceId === match.seat.ticketInstanceId
        || seatMatchesGridLabel(seat, label.trim().toUpperCase()),
    ) || match.seat;

    const toggleKey = `${figure.id}::${purchaseSeat.ticketInstanceId || label}`;
    const now = Date.now();
    if (
      lastToggleRef.current?.key === toggleKey
      && now - lastToggleRef.current.ts < 450
    ) {
      return;
    }
    lastToggleRef.current = { key: toggleKey, ts: now };

    onToggle(purchaseCategory, purchaseSeat, match.label);
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
      interactive={interactive && !effectiveOverviewMode}
      overviewMode={effectiveOverviewMode}
      onSeatClick={handleSeatClick}
    />
  );
};

export default LovableVenueMap;
