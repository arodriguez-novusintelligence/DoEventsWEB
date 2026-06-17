import type { EventFormData, EventGate, EventLocation } from '@lovable/data/eventFormData';
import {
  extractVenueImageUrls,
  getVenueById,
  resolveImageUrl,
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

export type VenueOwnership = 'own' | 'thirdParty';

export async function applyVenueToEventLocation(
  venueId: string,
  ownership: VenueOwnership = 'own',
): Promise<Partial<EventLocation>> {
  const venue = await getVenueById(venueId);
  const venueRecord = venue as Record<string, unknown>;
  const wizard = venueDetailToWizardState(venue as Parameters<typeof venueDetailToWizardState>[0]);
  const images = extractVenueImageUrls(venueRecord).map((url) => resolveImageUrl(url) || url);

  return {
    mode: 'mine',
    selectedVenueId: venueId,
    venueOwnership: ownership,
    customName: venue.name || '',
    customType: String(venue.tags || venue.type || 'Salón de eventos'),
    customAddress: venue.address || '',
    customLat: venue.latitude,
    customLng: venue.longitude,
    detectedCity: venue.city || '',
    customImages: images,
    showMap: venue.latitude != null && venue.longitude != null,
    gates: wizardGatesToEventGates(wizard.gates),
    seatingMap: wizardFloorsToSeatingMap(wizard.floors),
    ticketingType: wizard.hasSeating ? 'with-seating' : 'only-tickets',
    seatingLayout: wizard.hasSeating ? 'numbered' : 'general',
    isOwner: ownership === 'own',
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
