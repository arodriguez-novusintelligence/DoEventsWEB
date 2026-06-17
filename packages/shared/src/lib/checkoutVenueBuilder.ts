import { resolveSeatLabel } from '../api/ordersService';
import type { TicketCategory } from '../types/orders';
import type { VenueCategoryDetail, VenueElementDetail, VenueFloorDetail, VenueSeatDetail } from '../api/venueService';
import { CATEGORY_PASTEL_COLORS } from '../types/floorPlan';

function parseSeatLabel(label: string): { rowLabel?: string; colNumber?: number } {
  const match = label.match(/^([A-Za-z]+)(\d+)$/);
  if (!match) return {};
  return { rowLabel: match[1].toUpperCase(), colNumber: parseInt(match[2], 10) };
}

function seatGridFromTickets(seats: TicketCategory['seats']): {
  rows: number;
  seatsPerRow: number;
  seatDetails: VenueSeatDetail[];
} {
  const labels = seats.map((s) => resolveSeatLabel(s)).filter(Boolean);
  const rowSet = new Set<string>();
  const colSet = new Set<number>();

  labels.forEach((label) => {
    const parsed = parseSeatLabel(label);
    if (parsed.rowLabel) rowSet.add(parsed.rowLabel);
    if (parsed.colNumber) colSet.add(parsed.colNumber);
  });

  const seatDetails: VenueSeatDetail[] = labels.map((label) => {
    const parsed = parseSeatLabel(label);
    return {
      seatCode: label,
      rowLabel: parsed.rowLabel,
      colNumber: parsed.colNumber,
    };
  });

  const rows = rowSet.size || 1;
  const seatsPerRow = colSet.size || Math.max(labels.length, 1);

  return { rows, seatsPerRow, seatDetails };
}

export function categoriesHaveNamedSeats(categories: TicketCategory[]): boolean {
  return categories.some((cat) => cat.seats.some((seat) => Boolean(resolveSeatLabel(seat))));
}

/**
 * Construye un plano sintético cuando el venue no está disponible pero hay sillas numeradas.
 * El escenario queda arriba; las categorías se distribuyen debajo para dar contexto espacial.
 */
export function buildSyntheticCheckoutFloors(categories: TicketCategory[]): VenueFloorDetail[] {
  if (!categories.length) return [];

  const cols = Math.min(categories.length, 2);
  const rowCount = Math.ceil(categories.length / cols);

  const stage: VenueElementDetail = {
    elementId: 'checkout-stage',
    name: 'ESCENARIO',
    geometry: 'RECTANGLE',
    relX: 10,
    relY: 1,
    width: 80,
    height: 8,
    rotation: 0,
  };

  const venueCategories: VenueCategoryDetail[] = categories.map((cat, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const zoneWidth = (90 / cols) - 3;
    const zoneHeight = Math.min(42, 78 / rowCount);
    const { rows, seatsPerRow, seatDetails } = seatGridFromTickets(cat.seats);

    return {
      categoryId: cat.categoryId || cat.distributionId,
      name: cat.categoryName,
      color: CATEGORY_PASTEL_COLORS[index % CATEGORY_PASTEL_COLORS.length],
      geometry: 'RECTANGLE',
      relX: 5 + col * (zoneWidth + 3),
      relY: 12 + row * (zoneHeight + 3),
      width: zoneWidth,
      height: zoneHeight,
      rotation: 0,
      rows,
      seatsPerRow,
      seats: seatDetails,
    };
  });

  return [{
    floorId: 'checkout-synthetic',
    name: 'Planta',
    elements: [stage],
    categories: venueCategories,
  }];
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function venueSeatLabel(seat: VenueSeatDetail): string {
  if (seat.seatCode) return seat.seatCode.trim().toUpperCase();
  if (seat.rowLabel && seat.colNumber) return `${seat.rowLabel}${seat.colNumber}`.trim().toUpperCase();
  return '';
}

function mergeCategorySeatsFromTickets(
  cat: VenueCategoryDetail,
  ticketCat: TicketCategory,
): VenueCategoryDetail {
  const labelSet = new Set<string>();
  const merged: VenueSeatDetail[] = [];

  (cat.seats || []).forEach((seat) => {
    const label = venueSeatLabel(seat);
    if (!label || labelSet.has(label)) return;
    labelSet.add(label);
    merged.push(seat);
  });

  ticketCat.seats.forEach((ticketSeat) => {
    const label = resolveSeatLabel(ticketSeat).trim().toUpperCase();
    if (!label || labelSet.has(label)) return;
    const parsed = parseSeatLabel(label);
    labelSet.add(label);
    merged.push({
      seatCode: label,
      rowLabel: parsed.rowLabel,
      colNumber: parsed.colNumber,
    });
  });

  const { rows, seatsPerRow } = seatGridFromTickets(ticketCat.seats);
  return {
    ...cat,
    rows: Math.max(cat.rows || 0, rows),
    seatsPerRow: Math.max(cat.seatsPerRow || 0, seatsPerRow),
    seats: merged,
  };
}

/**
 * Une todas las sillas de la API de boletas con la geometría del venue.
 * La API de tickets es la fuente de verdad de qué asientos existen.
 */
export function enrichVenueFloorsFromTickets(
  floors: VenueFloorDetail[],
  categories: TicketCategory[],
): VenueFloorDetail[] {
  const ticketByName = new Map(
    categories.map((cat) => [normalizeName(cat.categoryName), cat]),
  );

  const enrichedFloors = floors.map((floor) => ({
    ...floor,
    categories: (floor.categories || []).map((cat) => {
      const ticketCat = ticketByName.get(normalizeName(cat.name));
      if (!ticketCat) return cat;
      return mergeCategorySeatsFromTickets(cat, ticketCat);
    }),
  }));

  const knownCategoryNames = new Set(
    enrichedFloors.flatMap((f) => (f.categories || []).map((c) => normalizeName(c.name))),
  );

  const offeredNames = new Set(categories.map((c) => normalizeName(c.categoryName)));
  return enrichedFloors
    .map((floor) => ({
      ...floor,
      categories: (floor.categories || []).filter((cat) => offeredNames.has(normalizeName(cat.name))),
    }))
    .filter((floor) => (floor.categories || []).length > 0);
}

/** Cuenta sillas del venue vs tickets para validar coherencia del mapa. */
export function countCheckoutSeatCoverage(
  floors: VenueFloorDetail[],
  categories: TicketCategory[],
): { venueSeats: number; ticketSeats: number; matchedOffers: number } {
  const offerKeys = new Set<string>();
  categories.forEach((cat) => {
    cat.seats.forEach((seat) => {
      const label = resolveSeatLabel(seat).trim().toUpperCase();
      if (label) offerKeys.add(`${normalizeName(cat.categoryName)}::${label}`);
    });
  });

  let venueSeats = 0;
  let matchedOffers = 0;
  floors.forEach((floor) => {
    (floor.categories || []).forEach((cat) => {
      (cat.seats || []).forEach((seat) => {
        const label = venueSeatLabel(seat);
        if (!label) return;
        venueSeats += 1;
        if (offerKeys.has(`${normalizeName(cat.name)}::${label}`)) matchedOffers += 1;
      });
    });
  });

  const ticketSeats = categories.reduce(
    (sum, cat) => sum + cat.seats.filter((s) => resolveSeatLabel(s)).length,
    0,
  );

  return { venueSeats, ticketSeats, matchedOffers };
}

export function resolveCheckoutFloors(
  venueFloors: VenueFloorDetail[] | undefined,
  ticketCategories: TicketCategory[],
): VenueFloorDetail[] {
  const hasNamed = categoriesHaveNamedSeats(ticketCategories);
  if (!hasNamed) return venueFloors?.length ? venueFloors : [];

  if (!venueFloors?.length) {
    return buildSyntheticCheckoutFloors(ticketCategories);
  }

  const enriched = enrichVenueFloorsFromTickets(venueFloors, ticketCategories);
  const hasAnySeats = enriched.some((f) =>
    (f.categories || []).some((c) => (c.seats?.length || 0) > 0 || (c.rows || 0) * (c.seatsPerRow || 0) > 0),
  );

  return hasAnySeats ? enriched : buildSyntheticCheckoutFloors(ticketCategories);
}
