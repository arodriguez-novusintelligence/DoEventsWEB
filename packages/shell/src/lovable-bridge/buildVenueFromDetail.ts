import type { VenueAddonService, VenueDetail, VenueFloorDetail } from '@doevents/shared';
import { resolveImageUrl } from '@doevents/shared';
import type { PublishedVenueDraft } from '@lovable/components/venues/VenueCreator';
import type { VenueData } from '@lovable/types/venue';
import { parseVenueAmenities, type ParsedVenueAmenities } from './venuesAdapter';

const REFUND_TYPES = new Set(['mismo-dia', '1-dia', '7-dias', '30-dias', 'caso-a-caso']);

function buildSeatingMap(
  draft: PublishedVenueDraft,
  floors: VenueFloorDetail[] | undefined,
  hasSeating?: boolean,
) {
  if (!hasSeating || !floors?.length) return undefined;

  const zones = floors.flatMap((floor) =>
    (floor.categories || []).map((cat) => ({
      name: cat.name || 'Zona',
      capacity: cat.seats?.length
        || (Number(cat.rows || 0) * Number(cat.seatsPerRow || 0))
        || 0,
      color: cat.color || '#3B82F6',
    })),
  ).filter((z) => z.capacity > 0);

  if (!zones.length) return undefined;

  return {
    imageUrl: draft.image || '',
    description: `Mapa de silletería con ${zones.length} zona(s) configuradas en la publicación del lugar.`,
    zones,
  };
}

export function buildVenueFromDetail(
  draft: PublishedVenueDraft,
  options: {
    venue?: VenueDetail | null;
    amenities?: ParsedVenueAmenities;
    hostName?: string;
    hostEmail?: string;
    hostPhone?: string;
    addonServices?: VenueAddonService[];
    rating?: number;
    reviewCount?: number;
  } = {},
): VenueData {
  const meta = options.amenities || parseVenueAmenities(String(options.venue?.amenities || ''));
  const refundKey = String(meta.refundPolicy || '').toLowerCase();
  const refundType = REFUND_TYPES.has(refundKey)
    ? (refundKey as 'mismo-dia' | '1-dia' | '7-dias' | '30-dias' | 'caso-a-caso')
    : 'caso-a-caso';

  const images = (options.venue?.imageUrls || [])
    .map((url) => resolveImageUrl(url) || url)
    .filter(Boolean);
  const cover = draft.image || images[0] || '';

  const paidFromAddons = (options.addonServices || meta.addonServices || []).map((s) => ({
    name: s.name,
    price: s.price,
    serviceId: s.id,
  }));

  const nearbyRefs = Array.isArray(meta.nearbyReferences)
    ? meta.nearbyReferences.filter((r) => r?.name)
    : [];

  const lat = Number(options.venue?.latitude);
  const lng = Number(options.venue?.longitude);
  const coordinates = Number.isFinite(lat) && Number.isFinite(lng)
    ? { lat, lng }
    : undefined;

  return {
    id: draft.id,
    name: draft.name,
    venueName: draft.name,
    address: draft.address || String(options.venue?.address || ''),
    city: options.venue?.city || draft.sector?.split(',')[0] || '',
    department: options.venue?.department || '',
    description: draft.description || String(options.venue?.description || ''),
    coverImage: cover,
    images: images.length ? images : (cover ? [cover] : []),
    venueTypes: [draft.type || String(options.venue?.type || 'Lugar')],
    eventTypes: meta.features?.length ? meta.features : [],
    facilities: meta.features || [],
    services: meta.features || [],
    accessibility: meta.parking ? ['Parqueadero disponible'] : [],
    security: [],
    basePrice: Number(meta.pricing?.perDay || meta.pricing?.perMultiDay || 0),
    startTime: meta.availability?.globalStartTime || '08:00',
    endTime: meta.availability?.globalEndTime || '22:00',
    capacity: draft.capacity || Number(options.venue?.capacity || 0),
    rating: options.rating ?? Number(options.venue?.rating || 0),
    eventsCompleted: options.reviewCount ?? Number(options.venue?.reviewCount || 0),
    hostName: options.hostName || 'Anfitrión',
    hostPhone: options.hostPhone || '',
    hostEmail: options.hostEmail || '',
    dayConfigs: [],
    hasLodging: false,
    cancellationPolicy: meta.refundPolicy || '',
    faqs: [],
    coordinates,
    directions: meta.directions || '',
    seatingMap: buildSeatingMap(draft, options.venue?.floors, options.venue?.hasSeating),
    paidServices: paidFromAddons.map(({ name, price }) => ({ name, price })),
    refundPolicy: meta.refundPolicy
      ? {
          type: refundType,
          description: meta.refundPolicy,
        }
      : undefined,
    nearbyReferences: nearbyRefs,
  };
}
