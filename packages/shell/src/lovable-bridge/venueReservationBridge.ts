import type { NavigateFunction } from 'react-router-dom';
import {
  extractVenueImageUrls,
  parseVenuePrice,
  resolveDisplayLocation,
  resolveImageUrl,
  type VenueDetail,
  type VenueAddonService,
  type VenueBookingServiceItem,
} from '@doevents/shared';
import type { PublishedVenueDraft } from '@lovable/components/venues/VenueCreator';
import { nearbyVenueToPublishedDraft, parseVenueAmenities } from './venuesAdapter';

const DEFAULT_VENUE_IMAGE =
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=70';

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
  rentalUnit: 'day' | 'month';
  pricePerDay: number;
  pricePerMonth: number;
  checkIn: string;
  checkOut: string;
  /** false cuando el lugar no tiene tarifas configuradas — se muestra detalle sin reserva */
  bookingEnabled: boolean;
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
): VenueReservationContext {
  const meta = parseVenueAmenities(String(venue.amenities || ''));
  const pricing = meta.pricing || {};
  let rentalUnit: 'day' | 'month' = meta.rentalUnit === 'month' ? 'month' : 'day';
  const pricePerDay = parseVenuePrice(pricing.perDay || pricing.perMultiDay);
  const pricePerMonth = parseVenuePrice(pricing.perMonth);
  const bookingEnabled = Boolean(pricePerDay || pricePerMonth);

  if (rentalUnit === 'day' && !pricePerDay && pricePerMonth) rentalUnit = 'month';
  if (rentalUnit === 'month' && !pricePerMonth && pricePerDay) rentalUnit = 'day';

  const images = extractVenueImageUrls(venue as Record<string, unknown>)
    .map((url) => resolveImageUrl(url) || url)
    .filter(Boolean);
  const cover = images[0] || resolveImageUrl(venue.mainImage) || DEFAULT_VENUE_IMAGE;

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
    images: images.length ? images : [cover],
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
    addonServices: options.addonServices?.length ? options.addonServices : (meta.addonServices || []),
    draft,
    rentalUnit,
    pricePerDay,
    pricePerMonth,
    checkIn: meta.availability?.globalStartTime || '12:00',
    checkOut: meta.availability?.globalEndTime || '15:00',
    bookingEnabled,
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
    services?: VenueBookingServiceItem[];
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
