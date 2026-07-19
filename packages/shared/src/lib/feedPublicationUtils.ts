import type { FeedMention, FeedPublication } from '../types/feed';
import { feedPublicationImageScore } from './resolveFeedPublicationImages';

function isEventMention(mention: FeedMention): boolean {
  const type = String(mention.mentionType || mention.type || '').toLowerCase();
  if (type === 'event') return true;
  return Boolean(mention.eventId);
}

function eventIdFromMention(mention: FeedMention): string | null {
  if (mention.eventId) return mention.eventId;
  if (isEventMention(mention) && mention.targetId) return mention.targetId;
  const metaId = mention.metadata?.eventId;
  if (typeof metaId === 'string' && metaId.trim()) return metaId.trim();
  return null;
}

function eventIdFromPrefixedId(id: string): string | null {
  if (id.startsWith('event#')) return id.slice('event#'.length);
  if (id.startsWith('event:')) return id.slice('event:'.length);
  return null;
}

function isPublicationRecordId(id: string): boolean {
  return /^pub_/i.test(id);
}

/** Publicación creada por usuario desde el menú + (no sync nativo del timeline). */
export function isUserFeedPublicationRecord(post: FeedPublication): boolean {
  return post.type === 'post' || isPublicationRecordId(post.id);
}

function validEntityId(id: string | null | undefined): string | null {
  if (!id || typeof id !== 'string') return null;
  const trimmed = id.trim();
  if (!trimmed || isPublicationRecordId(trimmed)) return null;
  return trimmed;
}

function readMetaEntityId(
  metadata: Record<string, unknown> | undefined,
  ...keys: string[]
): string | null {
  if (!metadata) return null;
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string') {
      const resolved = validEntityId(value);
      if (resolved) return resolved;
    }
  }
  return null;
}

function preferVenuePublication(
  current: FeedPublication,
  candidate: FeedPublication,
): FeedPublication {
  const currentScore = feedPublicationImageScore(current);
  const candidateScore = feedPublicationImageScore(candidate);
  if (candidateScore !== currentScore) {
    return candidateScore > currentScore ? candidate : current;
  }
  if (candidate.isRepost === false && current.isRepost === true) return candidate;
  if (current.isRepost === false && candidate.isRepost === true) return current;
  if (!isPublicationRecordId(candidate.id) && isPublicationRecordId(current.id)) return candidate;
  return current;
}

function isNativeEventFeedItem(post: FeedPublication): boolean {
  return post.type === 'event'
    && Boolean(post.id)
    && !isPublicationRecordId(post.id)
    && post.isRepost !== true;
}

function preferEventPublication(
  current: FeedPublication,
  candidate: FeedPublication,
): FeedPublication {
  const currentNative = isNativeEventFeedItem(current);
  const candidateNative = isNativeEventFeedItem(candidate);
  if (candidateNative && !currentNative) return candidate;
  if (currentNative && !candidateNative) return current;

  const currentScore = feedPublicationImageScore(current);
  const candidateScore = feedPublicationImageScore(candidate);
  if (candidateScore !== currentScore) {
    return candidateScore > currentScore ? candidate : current;
  }
  if (candidate.isRepost === false && current.isRepost === true) return candidate;
  if (current.isRepost === false && candidate.isRepost === true) return current;
  if (!isPublicationRecordId(candidate.id) && isPublicationRecordId(current.id)) return candidate;
  return current;
}

export function resolveEventIdFromFeedPublication(post: FeedPublication): string | null {
  const direct = validEntityId(post.eventId);
  if (direct) return direct;

  const repostOf = post.repostOf;
  const repostEventId = validEntityId(repostOf?.eventId)
    || (repostOf?.targetType === 'event' ? validEntityId(repostOf.targetId) : null);
  if (repostEventId) return repostEventId;

  if (post.targetId && (post.type === 'event' || post.listItemType === 'event')) {
    const targetEventId = validEntityId(post.targetId);
    if (targetEventId) return targetEventId;
  }

  const prefixed = eventIdFromPrefixedId(post.id);
  if (prefixed) return validEntityId(prefixed);

  if (post.type === 'event' && post.id) {
    const nativeEventId = validEntityId(post.id);
    if (nativeEventId) return nativeEventId;
  }

  for (const mention of post.mentions || []) {
    const mentionEventId = validEntityId(eventIdFromMention(mention));
    if (mentionEventId) return mentionEventId;
  }

  const metaEventId = readMetaEntityId(
    post.metadata,
    'eventId',
    'sourceId',
    'entityId',
    'targetEntityId',
    'targetId',
  );
  if (metaEventId) return metaEventId;

  if (post.sourcePublication) {
    return resolveEventIdFromFeedPublication(post.sourcePublication);
  }

  return null;
}

export function getEventMentionsFromFeedPublication(post: FeedPublication): FeedMention[] {
  return (post.mentions || []).filter((mention) => eventIdFromMention(mention) !== null);
}

function mentionTypeOf(mention: FeedMention): string {
  return String(mention.mentionType || mention.type || '').toLowerCase();
}

export function resolveServiceIdFromFeedPublication(post: FeedPublication): string | null {
  const direct = validEntityId((post as FeedPublication & { serviceId?: string }).serviceId);
  if (direct) return direct;

  const repostOf = post.repostOf;
  const repostServiceId = validEntityId(repostOf?.serviceId)
    || (repostOf?.targetType === 'service' ? validEntityId(repostOf.targetId) : null);
  if (repostServiceId) return repostServiceId;

  if (post.type === 'service' && post.targetId) {
    const targetServiceId = validEntityId(post.targetId);
    if (targetServiceId) return targetServiceId;
  }
  if (post.type === 'service' && post.id) {
    const nativeServiceId = validEntityId(post.id);
    if (nativeServiceId) return nativeServiceId;
  }

  const metaServiceId = readMetaEntityId(
    post.metadata,
    'serviceId',
    'sourceId',
    'entityId',
    'targetEntityId',
    'targetId',
  );
  if (metaServiceId) return metaServiceId;

  for (const mention of post.mentions || []) {
    const mentionType = mentionTypeOf(mention);
    if (mentionType === 'service' && mention.targetId) {
      const mentionServiceId = validEntityId(String(mention.targetId));
      if (mentionServiceId) return mentionServiceId;
    }
    if (mentionType === 'service') {
      const metaId = readMetaEntityId(mention.metadata, 'serviceId', 'targetId', 'entityId');
      if (metaId) return metaId;
    }
  }

  if (post.sourcePublication) {
    return resolveServiceIdFromFeedPublication(post.sourcePublication);
  }

  return null;
}

export function resolveVenueIdFromFeedPublication(post: FeedPublication): string | null {
  const direct = validEntityId((post as FeedPublication & { venueId?: string }).venueId);
  if (direct) return direct;

  const repostOf = post.repostOf;
  const repostVenueId = validEntityId(repostOf?.venueId)
    || (repostOf?.targetType === 'venue' ? validEntityId(repostOf.targetId) : null);
  if (repostVenueId) return repostVenueId;

  if (post.type === 'venue' && post.targetId) {
    const targetVenueId = validEntityId(post.targetId);
    if (targetVenueId) return targetVenueId;
  }
  if (post.type === 'venue' && post.id) {
    const nativeVenueId = validEntityId(post.id);
    if (nativeVenueId) return nativeVenueId;
  }

  const metaVenueId = readMetaEntityId(
    post.metadata,
    'venueId',
    'sourceId',
    'entityId',
    'targetEntityId',
    'targetId',
  );
  if (metaVenueId) return metaVenueId;

  for (const mention of post.mentions || []) {
    const mentionType = mentionTypeOf(mention);
    if (mentionType === 'venue' && mention.targetId) {
      const mentionVenueId = validEntityId(String(mention.targetId));
      if (mentionVenueId) return mentionVenueId;
    }
    if (mentionType === 'venue') {
      const metaId = readMetaEntityId(mention.metadata, 'venueId', 'targetId', 'entityId');
      if (metaId) return metaId;
    }
  }

  if (post.sourcePublication) {
    return resolveVenueIdFromFeedPublication(post.sourcePublication);
  }

  return null;
}

function isNativeServiceFeedItem(post: FeedPublication): boolean {
  return post.type === 'service'
    && Boolean(post.id)
    && !isPublicationRecordId(post.id)
    && post.isRepost !== true;
}

function preferServicePublication(
  current: FeedPublication,
  candidate: FeedPublication,
): FeedPublication {
  const currentNative = isNativeServiceFeedItem(current);
  const candidateNative = isNativeServiceFeedItem(candidate);
  if (candidateNative && !currentNative) return candidate;
  if (currentNative && !candidateNative) return current;

  const currentScore = feedPublicationImageScore(current);
  const candidateScore = feedPublicationImageScore(candidate);
  if (candidateScore !== currentScore) {
    return candidateScore > currentScore ? candidate : current;
  }
  if (candidate.isRepost === false && current.isRepost === true) return candidate;
  if (current.isRepost === false && candidate.isRepost === true) return current;
  if (!isPublicationRecordId(candidate.id) && isPublicationRecordId(current.id)) return candidate;
  return current;
}

/** Evita entradas duplicadas del mismo evento, servicio o lugar (sync timeline + repost). */
export function dedupeFeedPublications(items: FeedPublication[]): FeedPublication[] {
  const seenIds = new Set<string>();
  const venuePrimary = new Map<string, FeedPublication>();
  const eventPrimary = new Map<string, FeedPublication>();
  const servicePrimary = new Map<string, FeedPublication>();
  const out: FeedPublication[] = [];

  for (const item of items) {
    if (seenIds.has(item.id)) continue;

    // Las publicaciones de usuario (pub_*) siempre se muestran aunque promocionen
    // el mismo evento/servicio/lugar que ya existe en el timeline nativo.
    if (isUserFeedPublicationRecord(item)) {
      seenIds.add(item.id);
      out.push(item);
      continue;
    }

    const venueId = resolveVenueIdFromFeedPublication(item);
    if (venueId) {
      const existing = venuePrimary.get(venueId);
      if (existing) {
        const preferred = preferVenuePublication(existing, item);
        if (preferred !== existing) {
          const idx = out.indexOf(existing);
          if (idx >= 0) out[idx] = preferred;
          venuePrimary.set(venueId, preferred);
        }
        seenIds.add(item.id);
        continue;
      }
      venuePrimary.set(venueId, item);
    }

    const eventId = resolveEventIdFromFeedPublication(item);
    if (eventId) {
      const existing = eventPrimary.get(eventId);
      if (existing) {
        const preferred = preferEventPublication(existing, item);
        if (preferred !== existing) {
          const idx = out.indexOf(existing);
          if (idx >= 0) out[idx] = preferred;
          eventPrimary.set(eventId, preferred);
        }
        seenIds.add(item.id);
        continue;
      }
      eventPrimary.set(eventId, item);
    }

    const serviceId = resolveServiceIdFromFeedPublication(item);
    if (serviceId) {
      const existing = servicePrimary.get(serviceId);
      if (existing) {
        const preferred = preferServicePublication(existing, item);
        if (preferred !== existing) {
          const idx = out.indexOf(existing);
          if (idx >= 0) out[idx] = preferred;
          servicePrimary.set(serviceId, preferred);
        }
        seenIds.add(item.id);
        continue;
      }
      servicePrimary.set(serviceId, item);
    }

    seenIds.add(item.id);
    out.push(item);
  }

  return out;
}

/** Ruta interna para abrir el contenido promocionado de una publicación */
export function resolvePublicationDetailPath(post: FeedPublication): string | null {
  if (post.sourcePublication) {
    const fromSource = resolvePublicationDetailPath(post.sourcePublication);
    if (fromSource) return fromSource;
  }

  const eventId = resolveEventIdFromFeedPublication(post);
  if (eventId) return `/events/${eventId}`;

  const venueId = resolveVenueIdFromFeedPublication(post);
  if (venueId) return `/places/${venueId}`;

  const serviceId = resolveServiceIdFromFeedPublication(post);
  if (serviceId) return `/services/${serviceId}`;

  return null;
}

export type FeedPublicationPathResolver = (publicationId: string) => Promise<FeedPublication | null>;

/** Resuelve la ruta de detalle; si el item es `pub_*`, puede pedir la publicación completa al backend. */
export async function resolvePublicationDetailPathAsync(
  post: FeedPublication,
  options?: { fetchPublication?: FeedPublicationPathResolver },
): Promise<string | null> {
  const immediate = resolvePublicationDetailPath(post);
  if (immediate) return immediate;

  if (!isPublicationRecordId(post.id) || !options?.fetchPublication) {
    return null;
  }

  const fullPublication = await options.fetchPublication(post.id);
  if (!fullPublication) return null;
  return resolvePublicationDetailPath(fullPublication);
}
