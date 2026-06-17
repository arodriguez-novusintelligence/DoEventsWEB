import type { FeedMention, FeedPublication } from '../types/feed';

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
  return id.startsWith('pub_');
}

export function resolveEventIdFromFeedPublication(post: FeedPublication): string | null {
  if (post.eventId) return post.eventId;

  const repostOf = post.repostOf;
  if (repostOf?.eventId) return repostOf.eventId;
  if (repostOf?.targetType === 'event' && repostOf.targetId) return repostOf.targetId;

  if (post.targetId && (post.type === 'event' || post.listItemType === 'event')) {
    return post.targetId;
  }

  const prefixed = eventIdFromPrefixedId(post.id);
  if (prefixed) return prefixed;

  if (post.type === 'event' && post.id && !isPublicationRecordId(post.id)) {
    return post.id;
  }

  for (const mention of post.mentions || []) {
    const mentionEventId = eventIdFromMention(mention);
    if (mentionEventId) return mentionEventId;
  }

  const metaEventId = post.metadata?.eventId;
  if (typeof metaEventId === 'string' && metaEventId.trim()) {
    return metaEventId.trim();
  }

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
  const repostOf = post.repostOf;
  if (repostOf?.serviceId) return repostOf.serviceId;
  if (repostOf?.targetType === 'service' && repostOf.targetId) return repostOf.targetId;

  if (post.type === 'service' && post.targetId) return post.targetId;
  if (post.type === 'service' && post.id && !isPublicationRecordId(post.id)) return post.id;
  for (const mention of post.mentions || []) {
    if (mentionTypeOf(mention) === 'service' && mention.targetId) {
      return String(mention.targetId);
    }
    const metaId = mention.metadata?.serviceId;
    if (typeof metaId === 'string' && metaId.trim()) return metaId.trim();
  }
  return null;
}

export function resolveVenueIdFromFeedPublication(post: FeedPublication): string | null {
  const repostOf = post.repostOf;
  if (repostOf?.venueId) return repostOf.venueId;
  if (repostOf?.targetType === 'venue' && repostOf.targetId) return repostOf.targetId;

  if (post.type === 'venue' && post.targetId) return post.targetId;
  if (post.type === 'venue' && post.id && !isPublicationRecordId(post.id)) return post.id;
  const metaVenueId = post.metadata?.venueId;
  if (typeof metaVenueId === 'string' && metaVenueId.trim()) {
    return metaVenueId.trim();
  }
  for (const mention of post.mentions || []) {
    if (mentionTypeOf(mention) === 'venue' && mention.targetId) {
      return String(mention.targetId);
    }
    const metaId = mention.metadata?.venueId;
    if (typeof metaId === 'string' && metaId.trim()) return metaId.trim();
  }
  return null;
}

/** Ruta interna para abrir el contenido promocionado de una publicación */
export function resolvePublicationDetailPath(post: FeedPublication): string | null {
  if (post.sourcePublication) {
    return resolvePublicationDetailPath(post.sourcePublication);
  }
  const eventId = resolveEventIdFromFeedPublication(post);
  if (eventId) return `/events/${eventId}`;
  const serviceId = resolveServiceIdFromFeedPublication(post);
  if (serviceId) return `/services/${serviceId}`;
  const venueId = resolveVenueIdFromFeedPublication(post);
  if (venueId) return `/places/${venueId}`;
  return null;
}
