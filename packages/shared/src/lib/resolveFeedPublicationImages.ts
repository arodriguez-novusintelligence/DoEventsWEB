import type { FeedPublication } from '../types/feed';
import { extractVenueImageUrls, getVenueById } from '../api/venueService';
import { resolveImageUrl } from './resolveImageUrl';
import {
  resolveEventIdFromFeedPublication,
  resolveServiceIdFromFeedPublication,
  resolveVenueIdFromFeedPublication,
} from './feedPublicationUtils';

function pushUnique(out: string[], seen: Set<string>, raw?: string | null) {
  if (!raw) return;
  const resolved = resolveImageUrl(String(raw).trim()) || String(raw).trim();
  if (!resolved || seen.has(resolved)) return;
  seen.add(resolved);
  out.push(resolved);
}

export function feedPublicationImageScore(pub: FeedPublication): number {
  return resolveFeedPublicationImages(pub).length;
}

export async function enrichVenueFeedPublicationImages(
  items: FeedPublication[],
): Promise<FeedPublication[]> {
  const targets = items.filter((item) => {
    const venueId = resolveVenueIdFromFeedPublication(item);
    if (!venueId) return false;
    return feedPublicationImageScore(item) === 0;
  });
  if (!targets.length) return items;

  const venueIds = [...new Set(
    targets
      .map((item) => resolveVenueIdFromFeedPublication(item))
      .filter((id): id is string => Boolean(id)),
  )];

  const imageMap = new Map<string, string[]>();
  await Promise.all(venueIds.map(async (venueId) => {
    try {
      const venue = await getVenueById(venueId);
      const urls = extractVenueImageUrls(venue as unknown as Record<string, unknown>)
        .map((url) => resolveImageUrl(url) || url)
        .filter(Boolean);
      if (urls.length) imageMap.set(venueId, urls);
    } catch {
      // ignore per-venue fetch errors
    }
  }));

  if (!imageMap.size) return items;

  return items.map((item) => {
    const venueId = resolveVenueIdFromFeedPublication(item);
    if (!venueId || feedPublicationImageScore(item) > 0) return item;
    const urls = imageMap.get(venueId);
    if (!urls?.length) return item;
    return {
      ...item,
      images: urls,
      imageUrl: urls[0],
      media: urls.map((url) => ({ url, kind: 'image' as const })),
      metadata: {
        ...(item.metadata || {}),
        imageUrls: urls,
        mainImage: urls[0],
        images: urls,
      },
    };
  });
}
export function resolveFeedPublicationImages(
  pub: FeedPublication,
  parent?: FeedPublication,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const collect = (source?: FeedPublication | null) => {
    if (!source) return;
    for (const url of source.images || []) pushUnique(out, seen, url);
    pushUnique(out, seen, source.imageUrl);
    for (const entry of source.media || []) {
      if (!entry) continue;
      if (typeof entry === 'string') pushUnique(out, seen, entry);
      else pushUnique(out, seen, entry.url);
    }

    const meta = (source.metadata || {}) as Record<string, unknown>;
    if (Array.isArray(meta.images)) {
      meta.images.forEach((url) => pushUnique(out, seen, String(url)));
    } else if (typeof meta.images === 'string' && meta.images.trim()) {
      extractVenueImageUrls({ images: meta.images }).forEach((url) => pushUnique(out, seen, url));
    }
    if (Array.isArray(meta.imageUrls)) {
      meta.imageUrls.forEach((url) => pushUnique(out, seen, String(url)));
    }
    if (Array.isArray(meta.gallery)) {
      meta.gallery.forEach((url) => pushUnique(out, seen, String(url)));
    }
    pushUnique(out, seen, meta.imageUrl as string | undefined);
    pushUnique(out, seen, meta.mainImage as string | undefined);

    if (resolveVenueIdFromFeedPublication(source)) {
      extractVenueImageUrls({
        images: meta.images ?? source.images ?? meta.venueImages,
        imageUrls: meta.imageUrls,
        mainImage: meta.mainImage ?? source.imageUrl,
        amenities: meta.amenities,
      }).forEach((url) => pushUnique(out, seen, url));
    }

    for (const mention of source.mentions || []) {
      const mentionMeta = (mention.metadata || {}) as Record<string, unknown>;
      pushUnique(out, seen, mentionMeta.imageUrl as string | undefined);
      if (Array.isArray(mentionMeta.images)) {
        mentionMeta.images.forEach((url) => pushUnique(out, seen, String(url)));
      }
      if (Array.isArray(mentionMeta.gallery)) {
        mentionMeta.gallery.forEach((url) => pushUnique(out, seen, String(url)));
      }
    }
  };

  collect(pub);

  if (!out.length) {
    collect(pub.sourcePublication);
  }

  if (!out.length && parent) {
    for (const url of parent.sourceImages || []) pushUnique(out, seen, url);
    pushUnique(out, seen, parent.sourceImageUrl);
    pushUnique(out, seen, parent.imageUrl);
    collect(parent);
  }

  if (!out.length) {
    const eventMention = pub.mentions?.find(
      (m) => m.eventId || m.type === 'event' || m.mentionType === 'event',
    );
    const serviceMention = pub.mentions?.find(
      (m) => m.type === 'service' || m.mentionType === 'service',
    );
    const venueMention = pub.mentions?.find(
      (m) => m.type === 'venue' || m.mentionType === 'venue',
    );
    pushUnique(
      out,
      seen,
      String(
        eventMention?.metadata?.imageUrl
        || serviceMention?.metadata?.imageUrl
        || venueMention?.metadata?.imageUrl
        || '',
      ) || undefined,
    );
  }

  const typeHint = pub.type
    || (resolveEventIdFromFeedPublication(pub) ? 'event' : null)
    || (resolveServiceIdFromFeedPublication(pub) ? 'service' : null)
    || (resolveVenueIdFromFeedPublication(pub) ? 'venue' : null);

  if (!out.length && typeHint) {
    // Sin multimedia: el carrusel no renderiza; el summary card muestra icono de categoría.
  }

  return out;
}

/**
 * Solo multimedia de la entidad promocionada (evento/servicio/lugar).
 * No incluye fotos/videos subidos en la publicación del usuario.
 */
export function resolveFeedPromotedEntityImages(pub: FeedPublication): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const pushFromMeta = (meta?: Record<string, unknown> | null) => {
    if (!meta) return;
    pushUnique(out, seen, meta.imageUrl as string | undefined);
    pushUnique(out, seen, meta.mainImage as string | undefined);
    pushUnique(out, seen, meta.coverImage as string | undefined);
    pushUnique(out, seen, meta.coverUrl as string | undefined);
    if (Array.isArray(meta.images)) {
      meta.images.forEach((url) => pushUnique(out, seen, String(url)));
    } else if (typeof meta.images === 'string' && meta.images.trim()) {
      extractVenueImageUrls({ images: meta.images }).forEach((url) => pushUnique(out, seen, url));
    }
    if (Array.isArray(meta.imageUrls)) {
      meta.imageUrls.forEach((url) => pushUnique(out, seen, String(url)));
    }
    if (Array.isArray(meta.gallery)) {
      meta.gallery.forEach((url) => pushUnique(out, seen, String(url)));
    }
  };

  for (const mention of pub.mentions || []) {
    const type = String(mention.mentionType || mention.type || '').toLowerCase();
    const isEntity = Boolean(
      mention.eventId
      || type === 'event'
      || type === 'venue'
      || type === 'service',
    );
    if (!isEntity) continue;
    pushFromMeta((mention.metadata || {}) as Record<string, unknown>);
  }

  if (out.length) return out;

  // Fallback: metadata de entidad a nivel publicación (sin mezclar media propia del post).
  const meta = (pub.metadata || {}) as Record<string, unknown>;
  pushUnique(out, seen, meta.entityImageUrl as string | undefined);
  pushUnique(out, seen, meta.eventImageUrl as string | undefined);
  pushUnique(out, seen, meta.venueImageUrl as string | undefined);
  pushUnique(out, seen, meta.serviceImageUrl as string | undefined);
  pushFromMeta({
    imageUrl: meta.entityImageUrl || meta.eventImage || meta.mainEntityImage,
    mainImage: meta.entityMainImage,
    images: meta.entityImages,
    imageUrls: meta.entityImageUrls,
    gallery: meta.entityGallery,
  } as Record<string, unknown>);

  return out;
}
