import type { SeatingFigure, SeatingFigureShape, SeatingOrder } from '@lovable/data/eventFormData';
import {
  resolveSeatLabel,
  rowLabelFromIndex,
  type AvailableSeat,
  type TicketCategory,
  type VenueCategoryDetail,
  type VenueElementDetail,
  type VenueFloorDetail,
} from '@doevents/shared';

function figureGridLabels(figure: SeatingFigure): Set<string> {
  const labels = new Set<string>();
  const rows = figure.rows ?? 0;
  const cols = figure.seatsPerRow ?? 0;
  if (rows <= 0 || cols <= 0) return labels;

  const order: SeatingOrder = figure.seatingOrder ?? 'top-left';
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const rowIdx = order === 'bottom-left' || order === 'bottom-right' ? rows - 1 - r : r;
      const colIdx = order === 'top-right' || order === 'bottom-right' ? cols - 1 - c : c;
      labels.add(`${rowLabelFromIndex(rowIdx)}${colIdx + 1}`.toUpperCase());
    }
  }
  return labels;
}

export function findTicketCategoryForFigure(
  categories: TicketCategory[] | undefined,
  figure: SeatingFigure,
): TicketCategory | undefined {
  if (!categories?.length) return undefined;

  const byFigureId = categories.find(
    (c) =>
      (figure.id && c.categoryId === figure.id)
      || (figure.id && c.distributionId === figure.id),
  );
  if (byFigureId) return byFigureId;

  const figureName = figure.name.trim().toLowerCase();
  const byName = categories.filter(
    (c) => c.categoryName.trim().toLowerCase() === figureName,
  );
  if (byName.length === 1) return byName[0];
  if (byName.length > 1) {
    const gridLabels = figureGridLabels(figure);
    if (gridLabels.size > 0) {
      const scored = byName
        .map((cat) => ({
          cat,
          score: cat.seats.filter((seat) => {
            const label = seatLabelFromAvailable(seat);
            return label && gridLabels.has(label);
          }).length,
        }))
        .sort((a, b) => b.score - a.score);
      if (scored[0]?.score > 0) return scored[0].cat;
    }
    return byName[0];
  }
  return undefined;
}

function seatLabelFromAvailable(seat: AvailableSeat): string {
  return resolveSeatLabel(seat).trim().toUpperCase();
}

export function seatMatchesGridLabel(seat: AvailableSeat, gridLabelUpper: string): boolean {
  const resolved = seatLabelFromAvailable(seat);
  if (resolved && resolved === gridLabelUpper) return true;
  const row = seat.location?.rowLabel?.trim().toUpperCase()
    || (seat.location as { row?: string })?.row?.trim().toUpperCase();
  const col = seat.location?.colNumber
    ?? (seat.location as { number?: number })?.number;
  return Boolean(row && col && `${row}${col}` === gridLabelUpper);
}

function seatingOrderFromApi(colOrder?: string, rowOrder?: string): SeatingOrder {
  const col = colOrder === 'desc' ? 'desc' : 'asc';
  const row = rowOrder === 'desc' ? 'desc' : 'asc';
  if (col === 'asc' && row === 'asc') return 'top-left';
  if (col === 'desc' && row === 'asc') return 'top-right';
  if (col === 'asc' && row === 'desc') return 'bottom-left';
  return 'bottom-right';
}

export type SeatVisualState =
  | 'default'
  | 'disabled'
  | 'available'
  | 'selected'
  | 'reserved'
  | 'sold'
  | 'highlight';

export type HighlightSeat = { categoryName: string; label: string };

function normalizeCategoryName(value?: string | null): string {
  return String(value || '').trim().toLowerCase();
}

function categoriesMatch(a?: string | null, b?: string | null): boolean {
  const left = normalizeCategoryName(a);
  const right = normalizeCategoryName(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function isSeatHighlighted(
  figureName: string,
  labelUpper: string,
  highlightSeats?: HighlightSeat[],
): boolean {
  if (!highlightSeats?.length) return false;
  return highlightSeats.some(
    (seat) => categoriesMatch(seat.categoryName, figureName)
      && seat.label.trim().toUpperCase() === labelUpper,
  );
}

const API_TO_LOVABLE_SHAPE: Record<string, SeatingFigureShape> = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  ELLIPSE: 'ellipse',
  TRIANGLE: 'triangle',
  TRAPEZOID: 'trapezoid',
  RING: 'ring',
  SEMI_RING: 'semi-ring',
  HORSESHOE: 'horseshoe',
  CHEVRON: 'chevron',
  OCTAGON: 'octagon',
  IMAGEN: 'image',
};

function mapApiGeometry(geometry?: string): SeatingFigureShape {
  if (!geometry) return 'rectangle';
  return API_TO_LOVABLE_SHAPE[geometry.toUpperCase()] || 'rectangle';
}

function mapCategoryToFigure(cat: VenueCategoryDetail): SeatingFigure {
  const disabledSeats = (cat.seats || [])
    .filter((s) => {
      const status = String(s.status || '').toLowerCase();
      return status === 'occupied' || status === 'disabled' || status === 'blocked';
    })
    .map((s) => s.seatCode || '')
    .filter(Boolean);

  const raw = cat as VenueCategoryDetail & Record<string, unknown>;
  const labelDx = typeof cat.labelDx === 'number'
    ? cat.labelDx
    : typeof raw.label_dx === 'number'
      ? Number(raw.label_dx)
      : undefined;
  const labelDy = typeof cat.labelDy === 'number'
    ? cat.labelDy
    : typeof raw.label_dy === 'number'
      ? Number(raw.label_dy)
      : undefined;
  const labelRotation = typeof cat.labelRotation === 'number'
    ? cat.labelRotation
    : typeof raw.label_rotation === 'number'
      ? Number(raw.label_rotation)
      : undefined;

  return {
    id: cat.categoryId,
    shape: mapApiGeometry(cat.geometry),
    role: 'category',
    name: cat.name,
    x: cat.relX,
    y: cat.relY,
    w: cat.width,
    h: cat.height,
    rotation: cat.rotation,
    labelDx,
    labelDy,
    labelRotation,
    color: cat.color || '#6366F1',
    rows: cat.rows,
    seatsPerRow: cat.seatsPerRow,
    disabledSeats,
    arcInner: cat.ringThickness,
    seatingOrder: seatingOrderFromApi(cat.colOrder, cat.rowOrder),
  };
}

function mapElementToFigure(el: VenueElementDetail, floorNumber = 1): SeatingFigure {
  const name = (el.name || '').toLowerCase();
  const geometry = String(el.geometry || '').toUpperCase();
  let shape: SeatingFigureShape = mapApiGeometry(el.geometry);
  if (name.includes('escenario') || name.includes('stage')) {
    shape = 'rectangle';
  }
  const raw = el as VenueElementDetail & Record<string, unknown>;
  const notes = String(el.notes || raw.note || '').trim();
  const imageUrl = shape === 'image' || geometry === 'IMAGEN'
    ? (notes || undefined)
    : undefined;

  return {
    id: el.elementId,
    shape: imageUrl ? 'image' : shape,
    role: 'element',
    name: el.name || 'Elemento',
    x: el.relX,
    y: el.relY,
    w: el.width,
    h: el.height,
    rotation: el.rotation,
    labelDx: typeof el.labelDx === 'number'
      ? el.labelDx
      : typeof raw.label_dx === 'number'
        ? Number(raw.label_dx)
        : undefined,
    labelDy: typeof el.labelDy === 'number'
      ? el.labelDy
      : typeof raw.label_dy === 'number'
        ? Number(raw.label_dy)
        : undefined,
    labelRotation: typeof el.labelRotation === 'number'
      ? el.labelRotation
      : typeof raw.label_rotation === 'number'
        ? Number(raw.label_rotation)
        : undefined,
    color: name.includes('escenario') || name.includes('stage') ? '#1e293b' : '#94a3b8',
    textColor: '#ffffff',
    arcInner: el.ringThickness,
    notes: notes || undefined,
    imageUrl,
    floor: floorNumber,
  };
}

export function venueFloorsToFigures(floors: VenueFloorDetail[]): SeatingFigure[] {
  const figures: SeatingFigure[] = [];
  floors.forEach((floor, floorIndex) => {
    const floorNumber = floorIndex + 1;
    (floor.elements || []).forEach((el) => figures.push(mapElementToFigure(el, floorNumber)));
    (floor.categories || []).forEach((cat) => figures.push({
      ...mapCategoryToFigure(cat),
      floor: floorNumber,
    }));
  });
  return figures;
}

function isSeatSelectedForFigure(
  figureName: string,
  labelUpper: string,
  seat: AvailableSeat | undefined,
  options?: {
    selectedIds?: Set<string>;
    selectedSeats?: HighlightSeat[];
  },
): boolean {
  if (seat?.ticketInstanceId && options?.selectedIds?.has(seat.ticketInstanceId)) {
    return true;
  }
  return Boolean(
    options?.selectedSeats?.some(
      (selected) =>
        categoriesMatch(selected.categoryName, figureName)
        && selected.label.trim().toUpperCase() === labelUpper,
    ),
  );
}

export function buildSeatStatesForFigure(
  figure: SeatingFigure,
  options?: {
    categories?: TicketCategory[];
    selectedIds?: Set<string>;
    selectedSeats?: HighlightSeat[];
    highlightSeats?: HighlightSeat[];
    soldLabels?: string[];
    ownerPreviewMode?: boolean;
  },
): Record<string, SeatVisualState> {
  const states: Record<string, SeatVisualState> = {};
  const disabled = new Set(figure.disabledSeats || []);
  const sold = new Set((options?.soldLabels || []).map((l) => l.toUpperCase()));

  const category = findTicketCategoryForFigure(options?.categories, figure);

  const seatByLabel = new Map<string, AvailableSeat>();
  category?.seats.forEach((seat) => {
    const label = seatLabelFromAvailable(seat);
    if (label) seatByLabel.set(label, seat);
    const row = seat.location?.rowLabel?.toUpperCase()
      || (seat.location as { row?: string })?.row?.toUpperCase();
    const col = seat.location?.colNumber
      ?? (seat.location as { number?: number })?.number;
    if (row && col) seatByLabel.set(`${row}${col}`, seat);
  });

  const rows = figure.rows ?? 0;
  const cols = figure.seatsPerRow ?? 0;
  if (rows <= 0 || cols <= 0) return states;

  const order: SeatingOrder = figure.seatingOrder ?? 'top-left';
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const rowIdx = order === 'bottom-left' || order === 'bottom-right' ? rows - 1 - r : r;
      const colIdx = order === 'top-right' || order === 'bottom-right' ? cols - 1 - c : c;
      const label = `${rowLabelFromIndex(rowIdx)}${colIdx + 1}`;
      const upper = label.toUpperCase();

      if (options?.ownerPreviewMode) {
        if (isSeatHighlighted(figure.name, upper, options?.highlightSeats)) {
          states[label] = 'highlight';
        } else {
          states[label] = 'default';
        }
        continue;
      }

      if (isSeatHighlighted(figure.name, upper, options?.highlightSeats)) {
        states[label] = 'highlight';
      } else if (disabled.has(label)) {
        states[label] = 'disabled';
      } else if (sold.has(upper)) {
        states[label] = 'sold';
      } else {
        const seat = seatByLabel.get(upper);
        if (isSeatSelectedForFigure(figure.name, upper, seat, options)) {
          states[label] = 'selected';
        } else if (seat) {
          const status = String(seat.ticketStatus || '').trim().toUpperCase();
          if (status === 'RESERVED') {
            states[label] = 'reserved';
          } else if (status && status !== 'AVAILABLE' && status !== 'LIBRE') {
            states[label] = 'sold';
          } else {
            states[label] = 'available';
          }
        } else if (category) {
          states[label] = 'sold';
        }
      }
    }
  }

  return states;
}

export function findSeatByLabel(
  label: string,
  categories: TicketCategory[],
  figure: SeatingFigure,
): { category: TicketCategory; seat: AvailableSeat; label: string } | null {
  const normalized = label.trim().toUpperCase();
  if (!normalized) return null;

  const category = findTicketCategoryForFigure(categories, figure);
  if (!category) return null;

  const seat = category.seats.find((s) => seatMatchesGridLabel(s, normalized));
  if (!seat) return null;

  const status = String(seat.ticketStatus || '').toUpperCase();
  if (status && status !== 'AVAILABLE' && status !== 'LIBRE') return null;

  return { category, seat, label: resolveSeatLabel(seat) || label };
}

export function parseSeatLabel(seat: string): string | null {
  const cleaned = seat.replace(/^Silla\s*-?\s*/i, '').trim();
  const match = cleaned.match(/^([A-Za-z]+)\s*0?(\d+)$/);
  if (!match) return cleaned || null;
  return `${match[1].toUpperCase()}${match[2]}`;
}

function seatLabelExistsInCategory(cat: VenueCategoryDetail, labelUpper: string): boolean {
  const direct = (cat.seats || []).some((seat) => resolveSeatLabel(seat).toUpperCase() === labelUpper);
  if (direct) return true;
  const rows = cat.rows || 0;
  const cols = cat.seatsPerRow || 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const generated = `${rowLabelFromIndex(r)}${c + 1}`;
      if (generated === labelUpper) return true;
    }
  }
  return false;
}

/** Encuentra el índice del piso que contiene la silla resaltada. */
export function findFloorIndexForSeat(
  floors: VenueFloorDetail[],
  highlight?: HighlightSeat,
): number {
  if (!highlight || !floors.length) return 0;
  const labelUpper = highlight.label.trim().toUpperCase();
  for (let i = 0; i < floors.length; i += 1) {
    const floor = floors[i];
    const found = (floor.categories || []).some(
      (cat) => categoriesMatch(cat.name, highlight.categoryName)
        && seatLabelExistsInCategory(cat, labelUpper),
    );
    if (found) return i;
  }
  return 0;
}
