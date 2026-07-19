import React, { useEffect, useMemo, useState } from 'react';
import { Layers, MapPin } from 'lucide-react';
import type { VenueFloorDetail } from '@doevents/shared';
import LovableVenueMap, { type LovableVenueMapProps } from './LovableVenueMap';
import { findFloorIndexForSeat } from '../../../lovable-bridge/venueToFigures';
import { cn } from '@lovable/lib/utils';

export type FloorLayoutMode = 'tabs' | 'stacked';

export interface MultiFloorVenueMapProps extends Omit<LovableVenueMapProps, 'floors'> {
  floors: VenueFloorDetail[];
  /** Si se define, abre automáticamente el piso donde está la silla */
  autoFocusHighlight?: boolean;
  ownerPreviewMode?: boolean;
  /** tabs: un piso a la vez; stacked: todos los pisos apilados (mapa completo) */
  layoutMode?: FloorLayoutMode;
  activeFloorIndex?: number;
  onActiveFloorIndexChange?: (index: number) => void;
  /** Resalta en las pestañas el piso donde está la silla del usuario */
  seatFloorIndex?: number;
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
  ownerPreviewMode = false,
  layoutMode = 'tabs',
  activeFloorIndex: controlledIndex,
  onActiveFloorIndexChange,
  seatFloorIndex,
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

  const [internalIndex, setInternalIndex] = useState(initialIndex);
  const activeIndex = controlledIndex ?? internalIndex;

  const setActiveIndex = (index: number) => {
    if (onActiveFloorIndexChange) onActiveFloorIndexChange(index);
    else setInternalIndex(index);
  };

  useEffect(() => {
    if (controlledIndex == null) setInternalIndex(initialIndex);
  }, [initialIndex, floors, controlledIndex]);

  const activeFloor = floors[activeIndex] ?? floors[0];
  const showTabs = floors.length > 1 && layoutMode === 'tabs';
  const resolvedSeatFloor = seatFloorIndex ?? initialIndex;

  if (!activeFloor && layoutMode === 'tabs') {
    return (
      <div
        className="flex w-full items-center justify-center rounded-lg bg-secondary text-sm text-muted-foreground"
        style={{ height: mapProps.height ?? 280 }}
      >
        Sin mapa de silletería
      </div>
    );
  }

  if (layoutMode === 'stacked') {
    return (
      <div className="space-y-8">
        {floors.map((floor, index) => {
          const tab = floorTabs[index];
          const isSeatFloor = index === resolvedSeatFloor;
          return (
            <div key={tab?.id || `floor-${index}`}>
              <div className="mb-2 flex justify-center">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-1 text-xs font-bold',
                    isSeatFloor
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground',
                  )}
                >
                  {isSeatFloor ? <MapPin className="h-3.5 w-3.5" /> : null}
                  {tab?.name || `Piso ${index + 1}`}
                </span>
              </div>
              <LovableVenueMap
                {...mapProps}
                floors={[floor]}
                highlightSeats={highlightSeats}
                ownerPreviewMode={ownerPreviewMode}
                height={mapProps.height ?? 'min(42vh, 400px)'}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showTabs && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Layers className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          {floorTabs.map((tab) => {
            const isSeatFloor = tab.index === resolvedSeatFloor;
            const isActive = tab.index === activeIndex;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveIndex(tab.index)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40',
                  isSeatFloor && !isActive && 'ring-1 ring-primary/40',
                )}
              >
                {isSeatFloor ? <MapPin className="h-3 w-3 shrink-0" /> : null}
                {tab.name}
                {tab.zones > 0 ? ` (${tab.zones})` : ''}
              </button>
            );
          })}
        </div>
      )}
      <LovableVenueMap
        {...mapProps}
        floors={[activeFloor]}
        highlightSeats={highlightSeats}
        ownerPreviewMode={ownerPreviewMode}
      />
    </div>
  );
};

export default MultiFloorVenueMap;
