import type { EventFormData, EventGate, EventLocation } from '@lovable/data/eventFormData';
import type { TicketCategory as FormTicketCategory } from '@lovable/data/eventFormData';
import {
  extractVenueImageUrls,
  getVenueById,
  resolveImageUrl,
  resolveVenueTypeDisplayLabel,
  updateRentalVenue,
  updateVenueLayout,
  venueDetailToWizardState,
  type WizardFloor,
  type WizardGate,
} from '@doevents/shared';
import {
  seatingMapToWizardFloors,
  wizardFloorsToSeatingMap,
  wizardGatesToEventGates,
} from './placeSeatingBridge';

export function wizardCategoriesToFormTicketCategories(
  floors: WizardFloor[],
  gates: WizardGate[],
): FormTicketCategory[] {
  const defaultGateId = gates[0]?.gateId;
  return floors.flatMap((floor) =>
    (floor.categories || []).map((cat) => ({
      id: cat.categoryId,
      name: cat.name,
      quantity: Math.max(1, (cat.rows || 1) * (cat.seatsPerRow || 1) || cat.seats?.length || 1),
      hasPrice: Boolean(cat.isPaid || (cat.price && cat.price > 0)),
      price: Number(cat.price || 0),
      currency: (cat.currency || 'COP') as FormTicketCategory['currency'],
      description: cat.description || '',
      gateId: cat.gateId || defaultGateId,
    })),
  );
}

export type VenueOwnership = 'own' | 'thirdParty';

function pickVenueField(
  venue: Record<string, unknown>,
  keys: string[],
): string {
  for (const key of keys) {
    const direct = venue[key];
    if (typeof direct === 'string' && direct.trim()) return direct.trim();
  }
  const nested = venue.location;
  if (nested && typeof nested === 'object') {
    const loc = nested as Record<string, unknown>;
    for (const key of keys) {
      const value = loc[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return '';
}

export async function applyVenueToEventLocation(
  venueId: string,
  ownership: VenueOwnership = 'own',
): Promise<Partial<EventLocation>> {
  const venue = await getVenueById(venueId);
  const venueRecord = venue as Record<string, unknown>;
  const wizard = venueDetailToWizardState(venue as Parameters<typeof venueDetailToWizardState>[0]);
  const images = extractVenueImageUrls(venueRecord).map((url) => resolveImageUrl(url) || url);
  const ticketCategories = wizard.hasSeating
    ? undefined
    : wizardCategoriesToFormTicketCategories(wizard.floors, wizard.gates);

  const customAddress = pickVenueField(venueRecord, ['address', 'direccion', 'addressLine', 'street']);
  const detectedCity = pickVenueField(venueRecord, ['city', 'ciudad']);
  const latRaw = venue.latitude ?? venueRecord.lat;
  const lngRaw = venue.longitude ?? venueRecord.lng;
  const customLat = latRaw != null && Number.isFinite(Number(latRaw)) ? Number(latRaw) : undefined;
  const customLng = lngRaw != null && Number.isFinite(Number(lngRaw)) ? Number(lngRaw) : undefined;

  return {
    mode: 'mine',
    selectedVenueId: venueId,
    venueOwnership: ownership,
    customName: venue.name || '',
    customType: resolveVenueTypeDisplayLabel(
      String(venue.tags || '').trim() || String(venue.type || '').trim() || 'Salón de eventos',
    ),
    // Copiar literalmente los campos del lugar guardado (sin enriquecer con geocoder).
    customAddress,
    customLat,
    customLng,
    detectedCity,
    customImages: images,
    showMap: customLat != null && customLng != null,
    gates: wizardGatesToEventGates(wizard.gates),
    seatingMap: wizardFloorsToSeatingMap(wizard.floors),
    ticketingType: wizard.hasSeating ? 'with-seating' : 'only-tickets',
    seatingLayout: wizard.hasSeating ? 'numbered' : 'general',
    isOwner: ownership === 'own',
    ...(ticketCategories?.length ? { ticketCategories } : {}),
  };
}

function eventGatesToWizard(gates: EventGate[]): WizardGate[] {
  return gates.map((gate) => ({
    gateId: gate.id,
    gateNumber: gate.number,
    name: gate.name,
    description: '',
  }));
}

function resolveWizardFloorsFromLocation(loc: EventLocation, hasSeating: boolean): WizardFloor[] {
  const wizardGates = eventGatesToWizard(loc.gates || []);
  if (!loc.seatingMap?.figures?.length) return [];
  return seatingMapToWizardFloors(loc.seatingMap, wizardGates, undefined);
}

export async function persistOwnVenueFromEventLocation(
  loc: EventLocation,
  userId: string,
  capacity?: string | number,
): Promise<void> {
  const venueId = loc.selectedVenueId;
  if (!venueId) return;

  const hasSeating = loc.ticketingType === 'with-seating';
  const floors = resolveWizardFloorsFromLocation(loc, hasSeating);
  const wizardGates = eventGatesToWizard(loc.gates || []);

  if (floors.length || wizardGates.length) {
    await updateVenueLayout(venueId, {
      userId,
      hasSeating,
      floors,
      gates: wizardGates,
    });
  }

  await updateRentalVenue(venueId, {
    userId,
    name: loc.customName || 'Lugar',
    capacity: capacity != null ? Number(capacity) || 0 : 0,
    address: loc.customAddress,
    city: loc.detectedCity,
    latitude: loc.customLat ?? null,
    longitude: loc.customLng ?? null,
    placeType: loc.customType,
  });
}

export async function persistClonedVenueFromEventLocation(
  clonedVenueId: string,
  loc: EventLocation,
  userId: string,
): Promise<void> {
  const hasSeating = loc.ticketingType === 'with-seating';
  const floors = resolveWizardFloorsFromLocation(loc, hasSeating);
  const wizardGates = eventGatesToWizard(loc.gates || []);

  if (!floors.length && !wizardGates.length) return;

  await updateVenueLayout(clonedVenueId, {
    userId,
    hasSeating,
    floors,
    gates: wizardGates,
  });
}

export function buildVenuePublishPlan(loc: EventLocation): {
  shouldClone: boolean;
  shouldUpdateBase: boolean;
} {
  if (loc.mode !== 'mine' || !loc.selectedVenueId) {
    return { shouldClone: false, shouldUpdateBase: false };
  }
  const ownership = loc.venueOwnership || 'own';
  if (ownership === 'own') {
    return { shouldClone: true, shouldUpdateBase: true };
  }
  return { shouldClone: true, shouldUpdateBase: false };
}
