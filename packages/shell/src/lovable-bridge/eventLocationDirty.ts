import type { EventFormData, SeatingFigure } from '@lovable/data/eventFormData';

function roundCoord(value?: number | null): number | null {
  if (value == null || Number.isNaN(value)) return null;
  return Math.round(value * 1e5) / 1e5;
}

function seatingSignature(figures?: SeatingFigure[]) {
  return (figures || []).map((figure) => ({
    role: figure.role,
    shape: figure.shape,
    name: figure.name || '',
    priceEnabled: figure.priceEnabled !== false,
    price: figure.price ?? 0,
    rows: figure.rows ?? 0,
    seatsPerRow: figure.seatsPerRow ?? 0,
    gateId: figure.gateId || '',
  }));
}

function locationSnapshot(loc: EventFormData['location']) {
  return {
    mode: loc.mode,
    ticketingType: loc.ticketingType,
    selectedVenueId: loc.selectedVenueId || '',
    customName: (loc.customName || '').trim(),
    customAddress: (loc.customAddress || '').trim(),
    detectedCity: (loc.detectedCity || '').trim(),
    customLat: roundCoord(loc.customLat),
    customLng: roundCoord(loc.customLng),
    venueOwnership: loc.venueOwnership || '',
    gates: (loc.gates || []).map((gate) => ({
      id: gate.id,
      name: gate.name,
      number: gate.number,
    })),
    ticketCategories: (loc.ticketCategories || []).map((cat) => ({
      id: cat.id || '',
      name: cat.name,
      hasPrice: Boolean(cat.hasPrice),
      price: cat.price,
      quantity: cat.quantity,
      gateId: cat.gateId || '',
    })),
    seating: seatingSignature(loc.seatingMap?.figures),
  };
}

function normalizeAccessControl(
  accessControl?: EventFormData['accessControl'],
): Record<string, string[]> {
  const normalized: Record<string, string[]> = {};
  Object.entries(accessControl || {}).forEach(([gateId, users]) => {
    const ids = (users || []).map((id) => String(id).trim()).filter(Boolean).sort();
    if (ids.length) normalized[gateId] = ids;
  });
  return normalized;
}

/** Comparación estable: ignora ids internos del editor que cambian entre cargas. */
export function isEventLocationDirty(
  next: EventFormData['location'],
  initial: EventFormData['location'],
): boolean {
  return JSON.stringify(locationSnapshot(next)) !== JSON.stringify(locationSnapshot(initial));
}

export function isAccessControlDirty(
  next?: EventFormData['accessControl'],
  initial?: EventFormData['accessControl'],
): boolean {
  return JSON.stringify(normalizeAccessControl(next))
    !== JSON.stringify(normalizeAccessControl(initial));
}
