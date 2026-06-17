import React, { useMemo } from 'react';

import {

  VenueCategoryDetail,

  VenueElementDetail,

  VenueFloorDetail,

  geometryBorderRadius,

  geometryClipPath,

  isRingGeometry,

  type FloorPlanGeometry,

} from '@doevents/shared';



export interface PreviewSeat {

  ticketInstanceId: string;

  categoryName: string;

  label: string;

  price: number;

  color?: string;

}



export interface SeatSelectionMiniMapProps {

  floors: VenueFloorDetail[];

  selected: PreviewSeat[];

  highlightSeatId?: string | null;

  expanded?: boolean;

}



function venueSeatLabel(seat: { seatCode?: string; rowLabel?: string; colNumber?: number }): string {

  if (seat.seatCode) return seat.seatCode;

  if (seat.rowLabel && seat.colNumber) return `${seat.rowLabel}${seat.colNumber}`;

  return '';

}



function normalizeName(value: string): string {

  return value.trim().toLowerCase();

}



function zoneStyle(

  geometry: FloorPlanGeometry | undefined,

  color: string,

  isElement: boolean,

  ringThickness = 55,

): React.CSSProperties {

  const clip = geometryClipPath(geometry || 'RECTANGLE');

  const radius = geometryBorderRadius(geometry || 'RECTANGLE');

  if (isRingGeometry(geometry || 'RECTANGLE')) {

    return {

      borderRadius: radius,

      clipPath: clip,

      background: `radial-gradient(circle, transparent ${ringThickness}%, ${isElement ? '#CBD5E1' : color} ${ringThickness}%, ${isElement ? '#CBD5E1' : color} 100%)`,

    };

  }

  return {

    borderRadius: radius,

    clipPath: clip,

    background: isElement ? '#E2E8F0' : `${color}55`,

    border: `2px solid ${isElement ? '#94A3B8' : color}`,

  };

}



export const SeatSelectionMiniMap: React.FC<SeatSelectionMiniMapProps> = ({

  floors,

  selected,

  highlightSeatId,

  expanded = false,

}) => {

  const floor = floors[0];

  const selectedByLabel = useMemo(() => {

    const map = new Map<string, PreviewSeat>();

    selected.forEach((item) => {

      map.set(`${normalizeName(item.categoryName)}::${item.label.trim().toUpperCase()}`, item);

    });

    return map;

  }, [selected]);



  if (!floor) return null;



  const renderElement = (el: VenueElementDetail) => {

    const isStage = /escenario|tarima|stage/i.test(el.name || '');

    const geometry = (el.geometry || 'RECTANGLE') as FloorPlanGeometry;

    return (

      <div

        key={el.elementId}

        className={`de-seat-preview__zone de-seat-preview__zone--element${isStage ? ' de-seat-preview__zone--stage' : ''}`}

        style={{

          left: `${el.relX}%`,

          top: `${el.relY}%`,

          width: `${el.width}%`,

          height: `${el.height}%`,

          transform: `rotate(${el.rotation || 0}deg)`,

        }}

      >

        <div className="de-seat-preview__zone-bg" style={zoneStyle(geometry, '#64748B', true, el.ringThickness)} aria-hidden />

        <span className="de-seat-preview__zone-label">{el.name}</span>

      </div>

    );

  };



  const renderCategory = (cat: VenueCategoryDetail) => {

    const color = cat.color || '#60A5FA';

    const geometry = (cat.geometry || 'RECTANGLE') as FloorPlanGeometry;

    const isShapedZone = ['OCTAGON', 'TRIANGLE', 'TRAPEZOID', 'CHEVRON', 'CIRCLE', 'ELLIPSE'].includes(geometry);

    const rows = cat.rows || 1;

    const cols = cat.seatsPerRow || 1;

    const seats = cat.seats?.length

      ? cat.seats

      : Array.from({ length: rows * cols }, (_, idx) => {

          const rowLabel = String.fromCharCode(65 + Math.floor(idx / cols));

          const colNumber = (idx % cols) + 1;

          return { seatCode: `${rowLabel}${colNumber}`, rowLabel, colNumber };

        });



    type SeatItem = (typeof seats)[number];

    const seatsByRow = new Map<string, SeatItem[]>();

    seats.forEach((seat, idx) => {

      const label = venueSeatLabel(seat);

      const row = seat.rowLabel || label.replace(/\d+$/, '') || String.fromCharCode(65 + Math.floor(idx / cols));

      if (!seatsByRow.has(row)) seatsByRow.set(row, []);

      seatsByRow.get(row)!.push(seat);

    });



    const rowEntries = Array.from(seatsByRow.entries()).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));

    const maxColsInCategory = rowEntries.reduce((max, [, rowSeats]) => Math.max(max, rowSeats.length), 1);

    const totalSeats = rowEntries.reduce((sum, [, rowSeats]) => sum + rowSeats.length, 0);

    const denseLayout = maxColsInCategory >= 4 || rowEntries.length >= 4 || totalSeats >= 12;

    const ultraDenseLayout = maxColsInCategory >= 8 || rowEntries.length >= 8 || totalSeats >= 24;



    const hasHighlightedInZone = seats.some((seat) => {

      const label = venueSeatLabel(seat);

      const picked = label ? selectedByLabel.get(`${normalizeName(cat.name)}::${label.trim().toUpperCase()}`) : undefined;

      return Boolean(picked);

    });



    return (

      <div

        key={cat.categoryId}

        className={[

          'de-seat-preview__zone',

          hasHighlightedInZone ? 'de-seat-preview__zone--active' : '',

          denseLayout ? 'de-seat-preview__zone--dense' : '',

          ultraDenseLayout ? 'de-seat-preview__zone--ultra-dense' : '',

          isShapedZone ? 'de-seat-preview__zone--shaped' : '',

        ].filter(Boolean).join(' ')}

        style={{

          left: `${cat.relX}%`,

          top: `${cat.relY}%`,

          width: `${cat.width}%`,

          height: `${cat.height}%`,

          transform: `rotate(${cat.rotation || 0}deg)`,

        }}

      >

        <div className="de-seat-preview__zone-bg" style={zoneStyle(geometry, color, false, cat.ringThickness)} aria-hidden />

        <span className="de-seat-preview__zone-label">{cat.name}</span>

        <div

          className={[

            'de-seat-preview__seat-layout',

            denseLayout ? 'de-seat-preview__seat-layout--dense' : '',

            ultraDenseLayout ? 'de-seat-preview__seat-layout--ultra-dense' : '',

            isShapedZone ? 'de-seat-preview__seat-layout--shaped' : '',

          ].filter(Boolean).join(' ')}

          style={{ gridTemplateRows: `repeat(${rowEntries.length}, minmax(0, 1fr))` }}

        >

          {rowEntries.map(([rowLabel, rowSeats]) => (

            <div key={`${cat.categoryId}-${rowLabel}`} className="de-seat-preview__seat-row">

              <div

                className="de-seat-preview__seats"

                style={{ gridTemplateColumns: `repeat(${rowSeats.length}, minmax(0, 1fr))` }}

              >

                {rowSeats.map((seat, idx) => {

                  const label = venueSeatLabel(seat);

                  const picked = label

                    ? selectedByLabel.get(`${normalizeName(cat.name)}::${label.trim().toUpperCase()}`)

                    : undefined;

                  const isHighlighted = picked?.ticketInstanceId === highlightSeatId;

                  const isSelected = Boolean(picked);

                  const seatKey = `${cat.categoryId}-${label || idx}`;



                  return (

                    <span

                      key={seatKey}

                      className={[

                        'de-seat-preview__seat',

                        isSelected ? 'de-seat-preview__seat--selected' : 'de-seat-preview__seat--muted',

                        isHighlighted ? 'de-seat-preview__seat--highlight' : '',

                      ].filter(Boolean).join(' ')}

                      title={label || undefined}

                    >

                      {isSelected && label ? label : ''}

                    </span>

                  );

                })}

              </div>

            </div>

          ))}

        </div>

      </div>

    );

  };



  const hasStage = (floor.elements || []).some((el) => /escenario|tarima|stage/i.test(el.name || ''));



  return (

    <div className={`de-seat-preview${expanded ? ' de-seat-preview--expanded' : ''}`}>

      {!hasStage && (

        <div className="de-seat-preview__stage-banner">

          <span>ESCENARIO</span>

        </div>

      )}

      <div className="de-seat-preview__canvas-wrap">

        <div className="de-fp-canvas de-fp-canvas--grid de-fp-canvas--preview de-seat-preview__canvas">

          <div className="de-fp-canvas__bounds" />

          {(floor.elements || []).map(renderElement)}

          {(floor.categories || []).map(renderCategory)}

        </div>

      </div>

    </div>

  );

};



export default SeatSelectionMiniMap;

