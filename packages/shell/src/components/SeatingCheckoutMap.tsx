import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AvailableSeat,
  TicketCategory,
  VenueCategoryDetail,
  VenueElementDetail,
  VenueFloorDetail,
  geometryBorderRadius,
  geometryClipPath,
  isRingGeometry,
  resolveSeatLabel,
  type FloorPlanGeometry,
} from '@doevents/shared';
import { findFloorIndexForSeat } from '../lovable-bridge/venueToFigures';

export interface SeatingCheckoutMapProps {
  floors: VenueFloorDetail[];
  ticketCategories: TicketCategory[];
  filterCategoryName: string;
  selectedIds: Set<string>;
  onToggle: (category: TicketCategory, seat: AvailableSeat, label: string) => void;
  compact?: boolean;
  interactive?: boolean;
  readOnly?: boolean;
  focusZoneId?: string | null;
  onFocusZoneChange?: (zoneId: string | null) => void;
  confirmPreview?: boolean;
  /** En vista de boleta: solo muestra la silla indicada (ej. E3) */
  soloSeatLabel?: string | null;
  /** Localidad/categoría del ticket comprado (ej. VIP, Gradas) */
  soloCategoryName?: string | null;
}

type SeatOffer = {
  category: TicketCategory;
  seat: AvailableSeat;
  label: string;
};

export type FocusedSeatInfo = {
  categoryName: string;
  label: string;
  price: number;
  status: string;
  zoneName: string;
  isSelected: boolean;
  offer?: SeatOffer;
};

function venueSeatLabel(seat: { seatCode?: string; rowLabel?: string; colNumber?: number }): string {
  if (seat.seatCode) return seat.seatCode;
  if (seat.rowLabel && seat.colNumber) return `${seat.rowLabel}${seat.colNumber}`;
  return '';
}

function offerKey(categoryName: string, label: string): string {
  return `${categoryName.trim().toLowerCase()}::${label.trim().toUpperCase()}`;
}

function normalizeCategoryName(value?: string | null): string {
  return String(value || '').trim().toLowerCase();
}

function categoriesMatch(a?: string | null, b?: string | null): boolean {
  const left = normalizeCategoryName(a);
  const right = normalizeCategoryName(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
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
    background: isElement ? '#CBD5E1' : `${color}44`,
    border: `2px solid ${isElement ? '#64748B' : color}`,
  };
}

function normalizeSeatStatus(status: string): string {
  return String(status || 'UNAVAILABLE').trim().toUpperCase();
}

function seatStatusClass(status: string, isSelected: boolean): string {
  if (isSelected) return 'de-checkout-seat--selected';
  const normalized = normalizeSeatStatus(status);
  if (normalized === 'AVAILABLE') return 'de-checkout-seat--available';
  if (normalized === 'RESERVED') return 'de-checkout-seat--reserved';
  return 'de-checkout-seat--sold';
}

export const SeatingCheckoutMap: React.FC<SeatingCheckoutMapProps> = ({
  floors,
  ticketCategories,
  filterCategoryName,
  selectedIds,
  onToggle,
  compact = false,
  interactive = false,
  readOnly = false,
  focusZoneId = null,
  onFocusZoneChange,
  confirmPreview = false,
  soloSeatLabel = null,
  soloCategoryName = null,
}) => {
  const normalizedSoloSeat = soloSeatLabel?.trim().toUpperCase() || null;
  const normalizedSoloCategory = soloCategoryName?.trim() || null;
  const isSoloTicketView = Boolean(confirmPreview && normalizedSoloSeat);
  const MIN_ZOOM = 0.18;
  const MAX_ZOOM = 4;
  const [zoom, setZoom] = useState(interactive ? 0.5 : 1);
  const [focusedZoneId, setFocusedZoneId] = useState<string | null>(focusZoneId);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<{
    dist: number;
    zoom: number;
    scrollLeft: number;
    scrollTop: number;
    originX: number;
    originY: number;
  } | null>(null);
  const initialZoomSet = useRef(false);
  const userAdjustedViewRef = useRef(false);

  const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

  const highlightFloorIndex = useMemo(() => {
    if (!normalizedSoloSeat || !normalizedSoloCategory) return 0;
    return findFloorIndexForSeat(floors, {
      categoryName: normalizedSoloCategory,
      label: normalizedSoloSeat,
    });
  }, [floors, normalizedSoloSeat, normalizedSoloCategory]);

  const [activeFloorIndex, setActiveFloorIndex] = useState(highlightFloorIndex);

  useEffect(() => {
    setActiveFloorIndex(highlightFloorIndex);
  }, [highlightFloorIndex, floors.length]);

  const floor = floors[activeFloorIndex] ?? floors[0];
  const visibleCategories = useMemo(() => {
    if (!floor) return [];
    return (floor.categories || []).filter((cat) => {
      if (isSoloTicketView && normalizedSoloCategory) {
        return categoriesMatch(cat.name, normalizedSoloCategory);
      }
      if (filterCategoryName === 'all') return true;
      return categoriesMatch(cat.name, filterCategoryName);
    });
  }, [floor, filterCategoryName, isSoloTicketView, normalizedSoloCategory]);

  const computeZoomForCategory = useCallback((cat: VenueCategoryDetail, boost = 1) => {
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    if (!viewport || !canvas) return interactive ? 0.5 : 1;

    const canvasWidth = canvas.offsetWidth;
    const canvasHeight = canvas.offsetHeight;
    const zoneWidth = (cat.width / 100) * canvasWidth;
    const zoneHeight = (cat.height / 100) * canvasHeight;
    const pad = confirmPreview ? 12 : 20;
    const zoomW = viewport.clientWidth / Math.max(zoneWidth + pad, 1);
    const zoomH = viewport.clientHeight / Math.max(zoneHeight + pad, 1);
    return clampZoom(Math.min(zoomW, zoomH) * 0.96 * boost);
  }, [confirmPreview, interactive]);

  const computeFitZoom = useCallback(() => {
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    if (!viewport || !canvas) return interactive ? 0.5 : 1;

    const focusCategoryOnly = filterCategoryName !== 'all';
    if (focusCategoryOnly && visibleCategories.length === 1) {
      return computeZoomForCategory(visibleCategories[0]);
    }

    if (focusedZoneId) {
      const focused = visibleCategories.find((cat) => cat.categoryId === focusedZoneId);
      if (focused) return computeZoomForCategory(focused, confirmPreview ? 1.08 : 1);
    }

    const contentWidth = Math.max(canvas.scrollWidth, canvas.offsetWidth, viewport.clientWidth);
    const contentHeight = Math.max(canvas.scrollHeight, canvas.offsetHeight, 1);
    const fitWidth = viewport.clientWidth / contentWidth;
    const fitHeight = viewport.clientHeight / contentHeight;
    return clampZoom(Math.min(fitWidth, fitHeight) * 0.96);
  }, [filterCategoryName, interactive, visibleCategories, focusedZoneId, computeZoomForCategory, confirmPreview]);

  const scrollToCategory = useCallback((cat: VenueCategoryDetail, nextZoom: number) => {
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    if (!viewport || !canvas) return;

    window.requestAnimationFrame(() => {
      const canvasWidth = canvas.offsetWidth;
      const canvasHeight = canvas.offsetHeight;
      const zoneLeft = (cat.relX / 100) * canvasWidth * nextZoom;
      const zoneTop = (cat.relY / 100) * canvasHeight * nextZoom;
      const zoneWidth = (cat.width / 100) * canvasWidth * nextZoom;
      const zoneHeight = (cat.height / 100) * canvasHeight * nextZoom;

      viewport.scrollLeft = Math.max(0, zoneLeft + zoneWidth / 2 - viewport.clientWidth / 2);
      viewport.scrollTop = Math.max(0, zoneTop + zoneHeight / 2 - viewport.clientHeight / 2);
    });
  }, []);

  const focusOnCategory = useCallback((cat: VenueCategoryDetail) => {
    const nextZoom = computeZoomForCategory(cat, confirmPreview ? 1.1 : 1.02);
    setFocusedZoneId(cat.categoryId);
    onFocusZoneChange?.(cat.categoryId);
    setZoom(nextZoom);
    scrollToCategory(cat, nextZoom);
  }, [computeZoomForCategory, confirmPreview, onFocusZoneChange, scrollToCategory]);

  const clearZoneFocus = useCallback(() => {
    setFocusedZoneId(null);
    onFocusZoneChange?.(null);
    initialZoomSet.current = true;

    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    if (!viewport || !canvas) return;

    const contentWidth = Math.max(canvas.scrollWidth, canvas.offsetWidth, viewport.clientWidth);
    const contentHeight = Math.max(canvas.scrollHeight, canvas.offsetHeight, 1);
    const fitWidth = viewport.clientWidth / contentWidth;
    const fitHeight = viewport.clientHeight / contentHeight;
    setZoom(clampZoom(Math.min(fitWidth, fitHeight) * 0.96));
    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
  }, [onFocusZoneChange]);

  const offerByKey = useMemo(() => {
    const map = new Map<string, SeatOffer>();
    ticketCategories.forEach((cat) => {
      cat.seats.forEach((seat) => {
        const label = resolveSeatLabel(seat);
        if (label) map.set(offerKey(cat.categoryName, label), { category: cat, seat, label });
      });
    });
    return map;
  }, [ticketCategories]);

  useEffect(() => {
    setFocusedZoneId(focusZoneId);
  }, [focusZoneId]);

  useEffect(() => {
    if (!interactive || !floor || userAdjustedViewRef.current) return undefined;

    const timer = window.setTimeout(() => {
      const nextZoom = computeFitZoom();
      setZoom(nextZoom);
      initialZoomSet.current = true;

      if (focusZoneId && !confirmPreview) {
        const focused = visibleCategories.find((cat) => cat.categoryId === focusZoneId);
        if (focused) scrollToCategory(focused, nextZoom);
      }
    }, 100);

    return () => window.clearTimeout(timer);
  }, [interactive, floor, filterCategoryName, visibleCategories.length, computeFitZoom, focusZoneId, scrollToCategory, visibleCategories, confirmPreview]);

  useEffect(() => {
    if (!focusZoneId || !floor || confirmPreview || userAdjustedViewRef.current) return;
    const focused = (floor.categories || []).find((cat) => cat.categoryId === focusZoneId);
    if (!focused) return;
    const nextZoom = computeZoomForCategory(focused, 1.04);
    setZoom(nextZoom);
    scrollToCategory(focused, nextZoom);
  }, [focusZoneId, floor, computeZoomForCategory, confirmPreview, scrollToCategory]);

  if (!floor) return null;

  const handleSeatTap = (
    offer: SeatOffer | undefined,
    status: string,
  ) => {
    if (readOnly) return;
    if (offer && normalizeSeatStatus(status) === 'AVAILABLE') {
      onToggle(offer.category, offer.seat, offer.label);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!interactive || e.touches.length !== 2 || !viewportRef.current) return;
    const viewport = viewportRef.current;
    const rect = viewport.getBoundingClientRect();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const originX = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
    const originY = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;
    userAdjustedViewRef.current = true;
    touchRef.current = {
      dist: Math.hypot(dx, dy),
      zoom,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
      originX,
      originY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!interactive || e.touches.length !== 2 || !touchRef.current || !viewportRef.current) return;
    e.preventDefault();
    const viewport = viewportRef.current;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    const ratio = dist / touchRef.current.dist;
    const newZoom = clampZoom(touchRef.current.zoom * ratio);
    const scale = newZoom / touchRef.current.zoom;
    const contentX = touchRef.current.scrollLeft + touchRef.current.originX;
    const contentY = touchRef.current.scrollTop + touchRef.current.originY;
    viewport.scrollLeft = Math.max(0, contentX * scale - touchRef.current.originX);
    viewport.scrollTop = Math.max(0, contentY * scale - touchRef.current.originY);
    setZoom(newZoom);
    touchRef.current = {
      ...touchRef.current,
      dist,
      zoom: newZoom,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
  };

  const handleTouchEnd = () => {
    touchRef.current = null;
  };

  const renderElement = (el: VenueElementDetail) => {
    const isStage = /escenario|tarima|stage/i.test(el.name || '');
    const elGeometry = (el.geometry || 'RECTANGLE') as FloorPlanGeometry;
    return (
      <div
        key={el.elementId}
        className={`de-checkout-seating-map__zone de-checkout-seating-map__zone--element${isStage ? ' de-checkout-seating-map__zone--stage' : ''}`}
        style={{
          left: `${el.relX}%`,
          top: `${el.relY}%`,
          width: `${el.width}%`,
          height: `${el.height}%`,
          transform: `rotate(${el.rotation || 0}deg)`,
        }}
      >
        <div
          className="de-checkout-seating-map__zone-bg"
          style={zoneStyle(elGeometry, '#94A3B8', true, el.ringThickness)}
          aria-hidden
        />
        <span className="de-checkout-seating-map__zone-label">{el.name}</span>
      </div>
    );
  };

  const renderCategory = (cat: VenueCategoryDetail) => {
    const color = cat.color || '#60A5FA';
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
    const isZoneFocused = focusedZoneId === cat.categoryId;

    const geometry = (cat.geometry || 'RECTANGLE') as FloorPlanGeometry;
    const isShapedZone = ['OCTAGON', 'TRIANGLE', 'TRAPEZOID', 'CHEVRON', 'CIRCLE', 'ELLIPSE', 'HEXAGON'].includes(geometry);

    return (
      <div
        key={cat.categoryId}
        className={[
          'de-checkout-seating-map__zone',
          isShapedZone ? 'de-checkout-seating-map__zone--shaped' : '',
          isZoneFocused ? 'de-checkout-seating-map__zone--focused' : '',
        ].filter(Boolean).join(' ')}
        style={{
          left: `${cat.relX}%`,
          top: `${cat.relY}%`,
          width: `${cat.width}%`,
          height: `${cat.height}%`,
          transform: `rotate(${cat.rotation || 0}deg)`,
        }}
        onDoubleClick={(e) => {
          if (!interactive || readOnly) return;
          e.stopPropagation();
          focusOnCategory(cat);
        }}
      >
        <div
          className="de-checkout-seating-map__zone-bg"
          style={zoneStyle(geometry, color, false, cat.ringThickness)}
          aria-hidden
        />
        <div className="de-checkout-seating-map__zone-header">
          <span className="de-checkout-seating-map__zone-label">{cat.name}</span>
          {interactive && !readOnly && filterCategoryName === 'all' && (
            <button
              type="button"
              className="de-checkout-seating-map__zone-zoom-btn"
              aria-label={`Ampliar zona ${cat.name}`}
              title="Ampliar esta zona"
              onClick={(e) => {
                e.stopPropagation();
                focusOnCategory(cat);
              }}
            >
              ⊕
            </button>
          )}
        </div>
        <div
          className={[
            'de-checkout-seating-map__seat-layout',
            interactive ? 'de-checkout-seating-map__seat-layout--interactive' : '',
            isShapedZone ? 'de-checkout-seating-map__seat-layout--shaped' : '',
          ].filter(Boolean).join(' ')}
        >
          {rowEntries.map(([rowLabel, rowSeats]) => (
            <div key={`${cat.categoryId}-${rowLabel}`} className="de-checkout-seating-map__seat-row">
              {!interactive && <span className="de-checkout-seating-map__row-label">{rowLabel}</span>}
              <div
                className="de-checkout-seating-map__seats"
                style={{
                  gridTemplateColumns: `repeat(${rowSeats.length}, minmax(0, 1fr))`,
                }}
              >
                {rowSeats.map((seat, idx) => {
                  const label = venueSeatLabel(seat);
                  if (isSoloTicketView) {
                    const seatMatches = label.toUpperCase() === normalizedSoloSeat;
                    const categoryMatches = !normalizedSoloCategory || categoriesMatch(cat.name, normalizedSoloCategory);
                    if (!seatMatches || !categoryMatches) return null;
                  }
                  const offer = label ? offerByKey.get(offerKey(cat.name, label)) : undefined;
                  const status = offer?.seat.ticketStatus || 'UNAVAILABLE';
                  const normalizedStatus = normalizeSeatStatus(status);
                  const isAvailable = normalizedStatus === 'AVAILABLE';
                  const isSelected = offer
                    ? (
                      selectedIds.has(offer.seat.ticketInstanceId)
                      || Boolean(normalizedSoloSeat && label.toUpperCase() === normalizedSoloSeat)
                      || Boolean(label && selectedIds.has(label.toUpperCase()))
                    )
                    : Boolean(normalizedSoloSeat && label.toUpperCase() === normalizedSoloSeat);
                  const seatKey = `${cat.categoryId}-${label || idx}`;
                  const statusLabel = normalizedStatus === 'RESERVED'
                    ? 'Reservada'
                    : normalizedStatus === 'AVAILABLE'
                      ? 'Disponible'
                      : 'Vendida';

                  return (
                    <button
                      key={seatKey}
                      type="button"
                      className={[
                        'de-checkout-seat',
                        interactive ? 'de-checkout-seat--interactive' : '',
                        seatStatusClass(status, isSelected),
                        readOnly && isSelected ? 'de-checkout-seat--preview-selected' : '',
                      ].filter(Boolean).join(' ')}
                      title={label ? `${label} · ${statusLabel}` : statusLabel}
                      aria-label={label ? `Asiento ${label}, ${statusLabel}` : statusLabel}
                      disabled={readOnly || !isAvailable || !offer}
                      onClick={() => handleSeatTap(offer, status)}
                      data-seat-label={label || undefined}
                    >
                      {(readOnly || !interactive) && isSelected && label ? (
                        <span className="de-checkout-seat__label">{label}</span>
                      ) : null}
                      {!interactive && !readOnly && (
                        <span className="de-checkout-seat__label">{label || '·'}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const hasStageElement = (floor.elements || []).some((el) => /escenario|tarima|stage/i.test(el.name || ''));
  const focusedCategory = focusedZoneId
    ? visibleCategories.find((cat) => cat.categoryId === focusedZoneId)
    : null;

  return (
    <div
      className={[
        'de-checkout-seating-map',
        compact ? 'de-checkout-seating-map--compact' : '',
        interactive ? 'de-checkout-seating-map--interactive' : '',
        confirmPreview ? 'de-checkout-seating-map--confirm-preview' : '',
      ].filter(Boolean).join(' ')}
      data-zoom-level={interactive && zoom < 0.85 ? 'low' : 'normal'}
    >
      {floors.length > 1 && (
        <div className="de-checkout-seating-map__floor-tabs" role="tablist" aria-label="Pisos del recinto">
          {floors.map((f, idx) => (
            <button
              key={f.floorId || `floor-${idx}`}
              type="button"
              role="tab"
              aria-selected={activeFloorIndex === idx}
              className={activeFloorIndex === idx ? 'is-active' : ''}
              onClick={() => {
                setActiveFloorIndex(idx);
                userAdjustedViewRef.current = false;
                initialZoomSet.current = false;
                setFocusedZoneId(null);
              }}
            >
              {f.name?.trim() || (idx === 0 ? 'Planta baja' : `Piso ${idx + 1}`)}
            </button>
          ))}
        </div>
      )}

      {!hasStageElement && (
        <div className="de-checkout-stage" aria-hidden="true">
          <span>Escenario</span>
          <small>Arriba en el mapa</small>
        </div>
      )}

      {interactive && (
        <p className="de-checkout-seating-map__hint">
          {confirmPreview
            ? 'Tus sillas seleccionadas aparecen en morado. El escenario está arriba.'
            : 'Usa los controles de zoom o pellizca para acercar · Desliza para moverte · Toca una silla para seleccionarla'}
          {!confirmPreview && filterCategoryName === 'all' && (
            <span className="de-checkout-seating-map__hint-zoom">
              {' '}· Toca ⊕ o haz doble clic en una zona para ampliarla y elegir con precisión
            </span>
          )}
          {!confirmPreview && zoom < 0.85 && (
            <span className="de-checkout-seating-map__hint-zoom">
              {' '}· Si las sillas se ven pequeñas, acerca el mapa con + o amplía la zona
            </span>
          )}
        </p>
      )}

      {focusedCategory && filterCategoryName === 'all' && (
        <div className="de-checkout-seating-map__focus-bar">
          <span>Viendo: <strong>{focusedCategory.name}</strong></span>
          <button type="button" onClick={clearZoneFocus}>Ver todo el recinto</button>
        </div>
      )}

      {interactive && (
        <div
          className="de-checkout-seating-map__zoom-toolbar"
          role="toolbar"
          aria-label="Controles de zoom del mapa"
        >
          <span className="de-checkout-seating-map__zoom-toolbar-label">Zoom</span>
          <button
            type="button"
            className="de-checkout-seating-map__zoom-toolbar-btn"
            aria-label="Alejar mapa"
            onClick={() => {
              userAdjustedViewRef.current = true;
              setZoom((z) => clampZoom(z - 0.25));
            }}
          >
            −
          </button>
          <span className="de-checkout-seating-map__zoom-toolbar-value" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className="de-checkout-seating-map__zoom-toolbar-btn"
            aria-label="Acercar mapa"
            onClick={() => {
              userAdjustedViewRef.current = true;
              setZoom((z) => clampZoom(z + 0.25));
            }}
          >
            +
          </button>
          <button
            type="button"
            className="de-checkout-seating-map__zoom-toolbar-reset"
            aria-label="Restablecer zoom"
            onClick={() => {
              if (focusedZoneId) {
                clearZoneFocus();
                return;
              }
              userAdjustedViewRef.current = false;
              initialZoomSet.current = true;
              setZoom(computeFitZoom());
              if (viewportRef.current) {
                viewportRef.current.scrollLeft = 0;
                viewportRef.current.scrollTop = 0;
              }
            }}
          >
            Restablecer
          </button>
        </div>
      )}

      <div
        ref={viewportRef}
        className="de-checkout-seating-map__viewport"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={(e) => {
          if (!interactive || !viewportRef.current) return;
          e.preventDefault();
          userAdjustedViewRef.current = true;
          const viewport = viewportRef.current;
          const rect = viewport.getBoundingClientRect();
          const originX = e.clientX - rect.left;
          const originY = e.clientY - rect.top;
          const delta = e.deltaY > 0 ? -0.08 : 0.08;
          const newZoom = clampZoom(zoom + delta);
          const scale = newZoom / zoom;
          const contentX = viewport.scrollLeft + originX;
          const contentY = viewport.scrollTop + originY;
          viewport.scrollLeft = Math.max(0, contentX * scale - originX);
          viewport.scrollTop = Math.max(0, contentY * scale - originY);
          setZoom(newZoom);
        }}
      >
        <div
          ref={canvasRef}
          className="de-fp-canvas de-fp-canvas--grid de-fp-canvas--preview de-checkout-seating-map__canvas"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: '0 0',
            minHeight: interactive ? (confirmPreview ? 560 : 640) : 420,
          }}
        >
          <div className="de-fp-canvas__bounds" />
          {(floor.elements || []).map(renderElement)}
          {visibleCategories.map(renderCategory)}
        </div>
      </div>

      <div className="de-checkout-seating-legend">
        <span><i className="de-checkout-seating-legend__dot de-checkout-seat--available" /> Disponible</span>
        <span><i className="de-checkout-seating-legend__dot de-checkout-seat--reserved" /> Reservada</span>
        <span><i className="de-checkout-seating-legend__dot de-checkout-seat--sold" /> Vendida</span>
        <span><i className="de-checkout-seating-legend__dot de-checkout-seat--selected" /> Tu silla</span>
      </div>
    </div>
  );
};

export default SeatingCheckoutMap;
