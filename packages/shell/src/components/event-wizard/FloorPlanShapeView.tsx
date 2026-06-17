import React, { useMemo } from 'react';
import {
  geometryBorderRadius,
  geometryClipPath,
  isRingGeometry,
  RESIZE_HANDLES,
  type FloorPlanGeometry,
  type ResizeHandle,
  type WizardSeat,
} from '@doevents/shared';

interface FloorPlanShapeViewProps {
  label: string;
  geometry: FloorPlanGeometry;
  color: string;
  relX: number;
  relY: number;
  width: number;
  height: number;
  rotation: number;
  ringThickness?: number;
  selected?: boolean;
  preview?: boolean;
  showSeats?: boolean;
  isElement?: boolean;
  seats?: WizardSeat[];
  onSelect?: () => void;
  onEdit?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  onResizeStart?: (handle: ResizeHandle, e: React.PointerEvent) => void;
  onRotateStart?: (e: React.PointerEvent) => void;
}

export const FloorPlanShapeView: React.FC<FloorPlanShapeViewProps> = ({
  label,
  geometry,
  color,
  relX,
  relY,
  width,
  height,
  rotation,
  ringThickness = 55,
  selected,
  preview,
  showSeats,
  isElement,
  seats = [],
  onSelect,
  onEdit,
  onPointerDown,
  onResizeStart,
  onRotateStart,
}) => {
  const seatRows = useMemo(() => {
    const map = new Map<string, WizardSeat[]>();
    seats.forEach((seat) => {
      const key = seat.rowLabel || 'A';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(seat);
    });
    return Array.from(map.entries()).map(([row, rowSeats]) => ({
      row,
      seats: rowSeats.sort((a, b) => a.colNumber - b.colNumber),
    }));
  }, [seats]);

  const clip = geometryClipPath(geometry);
  const radius = geometryBorderRadius(geometry);
  const ringStyle = isRingGeometry(geometry)
    ? ({
        background: `radial-gradient(circle, transparent ${ringThickness}%, ${isElement ? '#CBD5E1' : color} ${ringThickness}%, ${isElement ? '#CBD5E1' : color} 100%)`,
      } as React.CSSProperties)
    : {
        background: isElement ? '#CBD5E1' : `${color}33`,
        borderColor: isElement ? '#64748B' : color,
      };

  const startHandle = (handler: (e: React.PointerEvent) => void) => (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    handler(e);
  };

  return (
    <div
      className={`de-fp-shape${selected ? ' de-fp-shape--selected' : ''}${preview ? ' de-fp-shape--preview' : ''}${isElement ? ' de-fp-shape--element' : ''}`}
      style={{
        left: `${relX}%`,
        top: `${relY}%`,
        width: `${width}%`,
        height: `${height}%`,
        transform: `rotate(${rotation}deg)`,
        borderRadius: radius,
        clipPath: clip,
        ...ringStyle,
      }}
      onClick={onSelect}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEdit?.();
      }}
      onPointerDown={onPointerDown}
      role="button"
      tabIndex={0}
    >
      {!isElement && (showSeats || preview) && seats.length > 0 && (
        <div className="de-fp-shape__seats de-fp-shape__seats--grid" style={{ '--zone-color': color } as React.CSSProperties}>
          {seatRows.slice(0, 12).map(({ row, seats: rowSeats }) => (
            <div key={row} className="de-fp-seat-row">
              <span className="de-fp-seat-row__label">{row}</span>
              <div className="de-fp-seat-row__cells">
                {rowSeats.slice(0, 24).map((seat) => (
                  <span key={seat.seatId} className="de-fp-seat-chip" title={seat.seatCode}>
                    {seat.colNumber}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <strong className="de-fp-shape__label">{label}</strong>

      {selected && !preview && (
        <div className="de-fp-shape__handles" aria-hidden="true">
          <span className="de-fp-shape__outline" />
          {RESIZE_HANDLES.map((handle) => (
            <span
              key={handle}
              className={`de-fp-shape__handle de-fp-shape__handle--resize de-fp-shape__handle--${handle}`}
              onPointerDown={onResizeStart ? startHandle((e) => onResizeStart(handle, e)) : undefined}
            />
          ))}
          <span className="de-fp-shape__rotate-stem" />
          <span
            className="de-fp-shape__handle de-fp-shape__handle--rotate"
            onPointerDown={onRotateStart ? startHandle(onRotateStart) : undefined}
          >
            ↻
          </span>
        </div>
      )}
    </div>
  );
};

export const FloorPlanPreview: React.FC<{
  floors: Array<{ floorId: string; name: string; categories: Array<{ categoryId: string; name: string; color: string; relX: number; relY: number; width: number; height: number; geometry: FloorPlanGeometry; rotation: number; ringThickness?: number; seats: WizardSeat[]; price?: number }>; elements: Array<{ elementId: string; name: string; geometry: FloorPlanGeometry; relX: number; relY: number; width: number; height: number; rotation: number; ringThickness?: number }> }>;
  activeFloorId?: string;
}> = ({ floors, activeFloorId }) => {
  const floor = floors.find((f) => f.floorId === activeFloorId) || floors[0];
  if (!floor) return null;

  const items = [
    ...floor.elements.map((e) => ({ kind: 'element' as const, data: e })),
    ...floor.categories.map((c) => ({ kind: 'category' as const, data: c })),
  ];

  return (
    <div className="de-fp-preview">
      <small>PREVIEW</small>
      <h4>Vista completa del mapa</h4>
      <div className="de-fp-canvas de-fp-canvas--grid de-fp-canvas--preview">
        <div className="de-fp-canvas__bounds" />
        {items.map((item) => {
          if (item.kind === 'element') {
            const el = item.data;
            return (
              <FloorPlanShapeView
                key={el.elementId}
                label={el.name}
                geometry={el.geometry}
                color="#94A3B8"
                relX={el.relX}
                relY={el.relY}
                width={el.width}
                height={el.height}
                rotation={el.rotation}
                ringThickness={el.ringThickness}
                preview
                isElement
              />
            );
          }
          const cat = item.data;
          return (
            <FloorPlanShapeView
              key={cat.categoryId}
              label={cat.name}
              geometry={cat.geometry}
              color={cat.color}
              relX={cat.relX}
              relY={cat.relY}
              width={cat.width}
              height={cat.height}
              rotation={cat.rotation}
              ringThickness={cat.ringThickness}
              preview
              seats={cat.seats}
            />
          );
        })}
      </div>
      <div className="de-fp-preview-zoom">100%</div>
    </div>
  );
};
