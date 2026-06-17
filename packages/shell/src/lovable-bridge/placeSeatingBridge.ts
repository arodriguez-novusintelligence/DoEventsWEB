import type {
  EventGate,
  SeatingCurrency,
  SeatingFigure,
  SeatingFigureShape,
  SeatingMap,
  SeatingOrder,
} from '@lovable/data/eventFormData';
import {
  buildSeatGrid,
  newWizardId,
  type FloorPlanGeometry,
  type WizardCategory,
  type WizardElement,
  type WizardFloor,
  type WizardGate,
  type WizardSeat,
} from '@doevents/shared';

const GEOMETRY_TO_SHAPE: Record<FloorPlanGeometry, SeatingFigureShape> = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  ELLIPSE: 'ellipse',
  TRIANGLE: 'triangle',
  TRAPEZOID: 'trapezoid',
  RING: 'ring',
  SEMI_RING: 'semi-ring',
  CHEVRON: 'chevron',
  OCTAGON: 'octagon',
  IMAGEN: 'image',
};

function mapGeometry(shape: SeatingFigureShape): FloorPlanGeometry {
  const table: Partial<Record<SeatingFigureShape, FloorPlanGeometry>> = {
    rectangle: 'RECTANGLE',
    circle: 'CIRCLE',
    ellipse: 'ELLIPSE',
    triangle: 'TRIANGLE',
    trapezoid: 'TRAPEZOID',
    ring: 'RING',
    'semi-ring': 'SEMI_RING',
    horseshoe: 'SEMI_RING',
    semicircle: 'SEMI_RING',
    fan: 'SEMI_RING',
    stadium: 'ELLIPSE',
    chevron: 'CHEVRON',
    octagon: 'OCTAGON',
    image: 'IMAGEN',
    rhombus: 'TRIANGLE',
    boomerang: 'TRAPEZOID',
    superellipse: 'ELLIPSE',
    text: 'RECTANGLE',
  };
  return table[shape] || 'RECTANGLE';
}

function geometryToShape(geometry: FloorPlanGeometry): SeatingFigureShape {
  return GEOMETRY_TO_SHAPE[geometry] || 'rectangle';
}

function inferElementType(name: string): WizardElement['type'] {
  const n = name.toLowerCase();
  if (n.includes('escenario') || n.includes('stage')) return 'stage';
  if (n.includes('baño') || n.includes('bathroom')) return 'bathroom';
  if (n.includes('escalera') || n.includes('stairs')) return 'stairs';
  if (n.includes('entrada') || n.includes('entrance')) return 'entrance';
  if (n.includes('salida') || n.includes('exit')) return 'exit';
  return 'other';
}

function buildSeatsForCategory(cat: SeatingFigure): WizardSeat[] {
  const rows = Math.max(1, cat.rows || 1);
  const seatsPerRow = Math.max(1, cat.seatsPerRow || 1);
  const disabled = new Set(cat.disabledSeats || []);
  return buildSeatGrid(rows, seatsPerRow).map((seat) => ({
    ...seat,
    status: disabled.has(seat.seatCode) ? 'occupied' : 'available',
  }));
}

function seatingOrderFromWizard(colOrder: WizardCategory['colOrder'], rowOrder: WizardCategory['rowOrder']): SeatingOrder {
  if (colOrder === 'asc' && rowOrder === 'asc') return 'top-left';
  if (colOrder === 'desc' && rowOrder === 'asc') return 'top-right';
  if (colOrder === 'asc' && rowOrder === 'desc') return 'bottom-left';
  return 'bottom-right';
}

function wizardOrdersFromSeating(seatingOrder?: SeatingOrder): { colOrder: WizardCategory['colOrder']; rowOrder: WizardCategory['rowOrder'] } {
  switch (seatingOrder) {
    case 'top-right':
      return { colOrder: 'desc', rowOrder: 'asc' };
    case 'bottom-left':
      return { colOrder: 'asc', rowOrder: 'desc' };
    case 'bottom-right':
      return { colOrder: 'desc', rowOrder: 'desc' };
    default:
      return { colOrder: 'asc', rowOrder: 'asc' };
  }
}

function categoryToFigure(cat: WizardCategory, floorNumber = 1): SeatingFigure {
  const disabledSeats = (cat.seats || [])
    .filter((seat) => seat.status === 'occupied')
    .map((seat) => seat.seatCode)
    .filter(Boolean);

  return {
    id: cat.categoryId,
    shape: geometryToShape(cat.geometry),
    role: 'category',
    name: cat.name,
    x: cat.relX,
    y: cat.relY,
    w: cat.width,
    h: cat.height,
    rotation: cat.rotation,
    color: cat.color || '#6366F1',
    locked: cat.locked,
    gateId: cat.gateId,
    rows: cat.rows,
    seatsPerRow: cat.seatsPerRow,
    disabledSeats,
    priceEnabled: cat.isPaid,
    price: cat.price,
    currency: (cat.currency as SeatingCurrency) || 'COP',
    description: cat.description,
    arcInner: cat.ringThickness,
    seatingOrder: seatingOrderFromWizard(cat.colOrder, cat.rowOrder),
    floor: floorNumber,
  };
}

function elementToFigure(el: WizardElement, floorNumber = 1): SeatingFigure {
  const name = (el.name || '').toLowerCase();
  return {
    id: el.elementId,
    shape: geometryToShape(el.geometry),
    role: 'element',
    name: el.name || 'Elemento',
    x: el.relX,
    y: el.relY,
    w: el.width,
    h: el.height,
    rotation: el.rotation,
    color: name.includes('escenario') || name.includes('stage') ? '#1e293b' : '#94a3b8',
    textColor: '#ffffff',
    locked: el.locked,
    arcInner: el.ringThickness,
    notes: el.notes,
    imageUrl: el.geometry === 'IMAGEN' ? el.notes || undefined : undefined,
    floor: floorNumber,
  };
}

function figureToCategory(cat: SeatingFigure, defaultGateId: string): WizardCategory {
  const rows = Math.max(1, cat.rows || 1);
  const seatsPerRow = Math.max(1, cat.seatsPerRow || 1);
  const orders = wizardOrdersFromSeating(cat.seatingOrder);
  return {
    categoryId: cat.id || newWizardId(),
    name: cat.name || 'Zona',
    color: cat.color || '#6366F1',
    relX: cat.x,
    relY: cat.y,
    width: cat.w,
    height: cat.h,
    geometry: mapGeometry(cat.shape),
    rotation: cat.rotation || 0,
    zIndex: 0,
    ringThickness: cat.arcInner ?? 55,
    locked: Boolean(cat.locked),
    gateId: cat.gateId || defaultGateId,
    rows,
    seatsPerRow,
    seats: buildSeatsForCategory(cat),
    price: Number(cat.price || 0),
    isPaid: Boolean(cat.priceEnabled && cat.price),
    currency: cat.currency || 'COP',
    description: cat.description || '',
    colOrder: orders.colOrder,
    rowOrder: orders.rowOrder,
    disableSeatsEnabled: Boolean(cat.disabledSeats?.length),
  };
}

function figureToElement(fig: SeatingFigure): WizardElement {
  return {
    id: fig.id || newWizardId(),
    elementId: fig.id || newWizardId(),
    kind: 'element',
    type: inferElementType(fig.name),
    name: fig.name || 'Elemento',
    geometry: mapGeometry(fig.shape),
    relX: fig.x,
    relY: fig.y,
    width: fig.w,
    height: fig.h,
    rotation: fig.rotation || 0,
    zIndex: 0,
    locked: Boolean(fig.locked),
    ringThickness: fig.arcInner ?? 55,
    notes: fig.imageUrl || fig.notes || '',
  };
}

export function wizardGatesToEventGates(gates: WizardGate[]): EventGate[] {
  return gates.map((gate) => ({
    id: gate.gateId,
    number: gate.gateNumber,
    name: gate.name,
  }));
}

export function wizardFloorsToSeatingMap(floors: WizardFloor[]): SeatingMap {
  const figures: SeatingFigure[] = [];
  floors.forEach((floor, floorIndex) => {
    const floorNumber = floorIndex + 1;
    (floor.categories || []).forEach((cat) => figures.push(categoryToFigure(cat, floorNumber)));
    (floor.elements || []).forEach((el) => figures.push(elementToFigure(el, floorNumber)));
  });
  return { figures };
}

export function seatingMapToWizardFloors(
  map: SeatingMap,
  gates: WizardGate[],
  existingFloors?: WizardFloor[],
): WizardFloor[] {
  const defaultGateId = gates[0]?.gateId || newWizardId();
  const floorNumbers = Array.from(
    new Set(map.figures.map((figure) => figure.floor ?? 1)),
  ).sort((a, b) => a - b);

  if (!floorNumbers.length) floorNumbers.push(1);

  return floorNumbers.map((floorNumber) => {
    const existing = existingFloors?.[floorNumber - 1];
    const floorFigures = map.figures.filter((figure) => (figure.floor ?? 1) === floorNumber);
    const categories = floorFigures
      .filter((figure) => figure.role === 'category')
      .map((cat) => figureToCategory(cat, defaultGateId));
    const elements = floorFigures
      .filter((figure) => figure.role === 'element')
      .map(figureToElement);

    return {
      floorId: existing?.floorId || newWizardId(),
      name: existing?.name || `Piso ${floorNumber}`,
      description: existing?.description || '',
      categories,
      elements,
      editorSettings: existing?.editorSettings,
    };
  });
}
