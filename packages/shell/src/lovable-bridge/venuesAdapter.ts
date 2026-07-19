import type { NearbyVenue } from '@doevents/shared';
import { extractVenueImageUrls, normalizeVenueAddonServices, resolveImageUrl } from '@doevents/shared';
import type { PublishedVenueDraft } from '@lovable/components/venues/VenueCreator';

const DEFAULT_VENUE_IMAGE =
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=70';

export interface ParsedVenueAmenities {
  parking?: boolean;
  features?: string[];
  pricing?: {
    perDay?: string;
    perMultiDay?: string;
    perWeek?: string;
    perMonth?: string;
    currency?: string;
  };
  promoCodes?: Array<{
    id: string;
    currency: string;
    value: number;
    quantity: number;
    description: string;
    codes: string[];
  }>;
  rentalUnit?: 'day' | 'month';
  datePrices?: Record<string, { price?: string; blocked?: boolean }>;
  videos?: string[];
  availability?: {
    selectedDates?: string[];
    blockedDates?: string[];
    datePrices?: Record<string, { price?: string; blocked?: boolean }>;
    globalStartTime?: string;
    globalEndTime?: string;
  };
  bookingPreference?: string;
  refundPolicy?: string;
  listingType?: string;
  directions?: string;
  nearbyReferences?: Array<{ name: string; type: string; distance: string }>;
  addonServices?: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    unit?: 'evento' | 'día' | 'dia';
  }>;
  facilities?: Array<{ id: string; count: number }>;
  allowedEventTypes?: string[];
  accessibility?: Array<string | { id: string; label: string }>;
  security?: Array<string | { id: string; label: string }>;
  includedServices?: Array<string | { id: string; label: string }>;
  chargeType?: string;
  calendarWeekdays?: number[];
  calendarMonths?: number[];
  hostRole?: string;
  faqs?: Array<{ id?: string; question: string; answer: string }>;
  neighborhood?: string;
}

export function parseVenueAmenities(raw: string): ParsedVenueAmenities {
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as ParsedVenueAmenities;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return { features: raw.split(',').map((s) => s.trim()).filter(Boolean) };
  }
}

export function resolveVenueAddonServices(meta: ParsedVenueAmenities) {
  return normalizeVenueAddonServices(meta.addonServices);
}

export function nearbyVenueToPublishedDraft(venue: NearbyVenue): PublishedVenueDraft {
  const parsedImages = extractVenueImageUrls(venue as unknown as Record<string, unknown>);
  const image = resolveImageUrl(venue.mainImage || venue.imageUrls?.[0] || parsedImages[0]) || DEFAULT_VENUE_IMAGE;
  return {
    id: venue.venueId,
    name: venue.name || 'Lugar',
    link: venue.venueId,
    address: [venue.address, venue.city].filter(Boolean).join(', ') || '—',
    type: venue.type || venue.tags || 'Lugar de eventos',
    capacity: venue.capacity || 0,
    image,
    sector: venue.tags,
    description: venue.description || '',
    status: venue.status,
  };
}
