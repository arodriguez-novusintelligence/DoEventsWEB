import React, { useEffect, useMemo, useState } from 'react';
import { Layers } from 'lucide-react';
import type { VenueFloorDetail } from '@doevents/shared';
import LovableVenueMap, { type LovableVenueMapProps } from './LovableVenueMap';
import { findFloorIndexForSeat } from '../../../lovable-bridge/venueToFigures';
import { cn } from '@lovable/lib/utils';

export interface MultiFloorVenueMapProps extends Omit<LovableVenueMapProps, 'floors'> {
  floors: VenueFloorDetail[];
  /** Si se define, abre automáticamente el piso donde está la silla */
  autoFocusHighlight?: boolean;
}

/**
 * Estrategia multi-piso para visualización de silletería:
 * - Un piso activo a la vez (evita superponer layouts)
 * - Tabs con nombre del piso + contador de zonas
 * - Auto-enfoque al piso de la silla del usuario (boleta/checkout)
 */
export const MultiFloorVenueMap: React.FC<MultiFloorVenueMapProps> = ({
  floors,
  highlightSeats = [],
  autoFocusHighlight = true,
  ...mapProps
}) => {
  const floorTabs = useMemo(
    () => floors.map((floor, index) => ({
      index,
      id: floor.floorId || `floor-${index}`,
      name: floor.name?.trim() || (index === 0 ? 'Planta baja' : `Piso ${index + 1}`),
      zones: (floor.categories || []).length,
    })),
    [floors],
  );

  const initialIndex = useMemo(() => {
    if (!autoFocusHighlight || !highlightSeats.length) return 0;
    return findFloorIndexForSeat(floors, highlightSeats[0]);
  }, [autoFocusHighlight, floors, highlightSeats]);

  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex, floors]);

  const activeFloor = floors[activeIndex] ?? floors[0];
  const showTabs = floors.length > 1;

  if (!activeFloor) {
    return (
      <div
        className="flex w-full items-center justify-center rounded-lg bg-secondary text-sm text-muted-foreground"
        style={{ height: mapProps.height ?? 280 }}
      >
        Sin mapa de silletería
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showTabs && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
          {floorTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveIndex(tab.index)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                tab.index === activeIndex
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40',
              )}
            >
              {tab.name}
              {tab.zones > 0 ? ` (${tab.zones})` : ''}
            </button>
          ))}
        </div>
      )}
      <LovableVenueMap
        {...mapProps}
        floors={[activeFloor]}
        highlightSeats={highlightSeats}
      />
    </div>
  );
};

export default MultiFloorVenueMap;
