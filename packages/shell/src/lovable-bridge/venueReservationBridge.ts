import type { NavigateFunction } from 'react-router-dom';
import {
  extractVenueImageUrls,
  parseVenuePrice,
  resolveDisplayLocation,
  resolveImageUrl,
  type VenueDetail,
  type VenueAddonService,
} from '@doevents/shared';
import type { PublishedVenueDraft } from '@lovable/components/venues/VenueCreator';
import { nearbyVenueToPublishedDraft, parseVenueAmenities } from './venuesAdapter';

export interface VenueReservationContext {
  venue: VenueDetail;
  venueId: string;
  userId: string;
  buyerProfile: { firstName: string; lastName: string; email: string };
  hostProfile?: { name?: string; email?: string };
  rating?: number;
  reviewCount?: number;
  readOnly?: boolean;
  addonServices: VenueAddonService[];
  draft: PublishedVenueDraft;
  pricePerDay: number;
  checkIn: string;
  checkOut: string;
}

export function buildVenueReservationContext(
  venue: VenueDetail,
  venueId: string,
  options: {
    userId: string;
    buyerProfile: { firstName: string; lastName: string; email: string };
    hostProfile?: { name?: string; email?: string };
    rating?: number;
    reviewCount?: number;
    readOnly?: boolean;
    addonServices?: VenueAddonService[];
  },
): VenueReservationContext | null {
  const meta = parseVenueAmenities(String(venue.amenities || ''));
  const pricing = meta.pricing || {};
  const pricePerDay = parseVenuePrice(pricing.perDay || pricing.perMultiDay);
  if (!pricePerDay) return null;

  const images = extractVenueImageUrls(venue as Record<string, unknown>);
  const cover = resolveImageUrl(images[0] || venue.mainImage) || '';

  const draft = {
    ...nearbyVenueToPublishedDraft({
      venueId: venue.venueId || venueId,
      name: String(venue.name || 'Lugar'),
      address: String(venue.address || ''),
      city: String(venue.city || ''),
      type: String(venue.type || venue.tags || 'Lugar'),
      capacity: Number(venue.capacity || 0),
      mainImage: cover,
      description: String(venue.description || ''),
      tags: String(venue.tags || ''),
    }),
    image: cover,
    description: String(venue.description || ''),
    sector: resolveDisplayLocation({
      address: String(venue.address || ''),
      city: String(venue.city || ''),
      departamento: String(venue.department || ''),
    }),
  };

  return {
    venue,
    venueId,
    userId: options.userId,
    buyerProfile: options.buyerProfile,
    hostProfile: options.hostProfile,
    rating: options.rating,
    reviewCount: options.reviewCount,
    readOnly: options.readOnly,
    addonServices: options.addonServices ?? [],
    draft,
    pricePerDay,
    checkIn: meta.availability?.globalStartTime || '12:00',
    checkOut: meta.availability?.globalEndTime || '15:00',
  };
}

export function buildVenuePaymentNavigation(
  navigate: NavigateFunction,
  payload: {
    orderId: string;
    bookingId: string;
    totalAmount: number;
    expiredAtTs: number;
    selectedDates: string[];
    venueId: string;
    venueName: string;
    services?: VenueAddonService[];
  },
) {
  navigate(`/orders/${encodeURIComponent(payload.orderId)}/confirm`, {
    state: {
      order: {
        order_id: payload.orderId,
        total_amount: payload.totalAmount,
        expired_at_ts: payload.expiredAtTs,
        payment_status: 'PENDING',
        metadata: {
          orderType: 'VENUE_RENTAL',
          venueId: payload.venueId,
          venueName: payload.venueName,
          selectedDates: payload.selectedDates,
          bookingId: payload.bookingId,
          services: payload.services,
        },
      },
      venueId: payload.venueId,
      venueName: payload.venueName,
      bookingId: payload.bookingId,
      orderType: 'venue',
      selectedDates: payload.selectedDates,
    },
  });
}
