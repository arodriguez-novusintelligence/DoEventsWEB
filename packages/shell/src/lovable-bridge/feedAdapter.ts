import type { FeedPublication, FeedMention } from '@doevents/shared';
import {
  formatRelativeTime,
  normalizeVenueAddonServices,
  resolveDisplayLocation,
  resolveFeedPublicationImages,
  resolveFeedPromotedEntityImages,
  resolveImageUrl,
  resolveUserAvatarUrl,
  resolveEventIdFromFeedPublication,
  resolveServiceIdFromFeedPublication,
  resolveVenueIdFromFeedPublication,
  resolvePublicationDetailPath,
} from '@doevents/shared';
import type { Post, User, VenueFeedData } from '@doevents/shared';

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'DE';
}

function mapAuthor(pub: FeedPublication): User {
  const author = pub.author;
  const name = author?.name || 'Usuario';
  return {
    id: author?.id || pub.id,
    name,
    initials: initialsFromName(name),
    avatarUrl: resolveUserAvatarUrl(author?.avatarUrl, author?.id) || undefined,
  };
}

function resolveFeedLocation(...candidates: Array<string | undefined | null>): string {
  for (const candidate of candidates) {
    const resolved = resolveDisplayLocation({ label: candidate, locationLabel: candidate });
    if (resolved !== '—') return resolved;
  }
  return '';
}

function mapVenueFeed(pub: FeedPublication): VenueFeedData | undefined {
  const venueId = resolveVenueIdFromFeedPublication(pub);
  if (!venueId && pub.type !== 'venue') return undefined;
  const meta = (pub.metadata || {}) as Record<string, unknown>;
  const availability = meta.availability as VenueFeedData['availability'] | undefined;
  const pricePerDay = Number(meta.pricePerDay);
  return {
    venueId: venueId || String(meta.venueId || pub.targetId || pub.id),
    pricePerDay: Number.isFinite(pricePerDay) && pricePerDay > 0 ? pricePerDay : undefined,
    checkIn: String(meta.checkIn || availability?.globalStartTime || '').trim() || undefined,
    checkOut: String(meta.checkOut || availability?.globalEndTime || '').trim() || undefined,
    capacity: (meta.capacity as number | string | undefined) ?? undefined,
    addonServices: normalizeVenueAddonServices(meta.addonServices),
    availability: availability || undefined,
  };
}

function resolveVenueLocation(pub: FeedPublication): string {
  const meta = (pub.metadata || {}) as Record<string, unknown>;
  return resolveFeedLocation(
    resolveDisplayLocation({
      label: pub.locationLabel,
      locationLabel: pub.locationLabel,
      city: meta.city as string | undefined,
      ciudad: meta.city as string | undefined,
      departamento: meta.department as string | undefined,
      department: meta.department as string | undefined,
      address: meta.address as string | undefined,
      direccion: meta.address as string | undefined,
    }),
  );
}

function isUserFeedPublication(pub: FeedPublication): boolean {
  return pub.type === 'post' || /^pub_/i.test(pub.id);
}

function mentionEntityType(mention: FeedMention): 'evento' | 'servicio' | 'lugar' | null {
  const type = String(mention.mentionType || mention.type || '').toLowerCase();
  if (type === 'event' || mention.eventId) return 'evento';
  if (type === 'venue') return 'lugar';
  if (type === 'service') return 'servicio';
  return null;
}

function resolvePromotedEntityType(pub: FeedPublication): Post['promotedEntityType'] | undefined {
  for (const mention of pub.mentions || []) {
    const entityType = mentionEntityType(mention);
    if (entityType) return entityType;
  }

  if (pub.type === 'event' || resolveEventIdFromFeedPublication(pub)) return 'evento';
  if (pub.type === 'venue' || resolveVenueIdFromFeedPublication(pub)) return 'lugar';
  if (pub.type === 'service' || resolveServiceIdFromFeedPublication(pub)) return 'servicio';
  return undefined;
}

function resolvePublicationType(pub: FeedPublication): Post['type'] {
  if (isUserFeedPublication(pub)) return 'publicacion';
  if (pub.type === 'event' || resolveEventIdFromFeedPublication(pub)) return 'evento';
  if (pub.type === 'service' || resolveServiceIdFromFeedPublication(pub)) return 'servicio';
  if (pub.type === 'venue' || resolveVenueIdFromFeedPublication(pub)) return 'lugar';
  return 'publicacion';
}

function mapUserMentionTags(mentions?: FeedMention[]): string[] {
  return (mentions || [])
    .filter((mention) => {
      const type = String(mention.mentionType || mention.type || '').toLowerCase();
      return type === 'user' || Boolean(mention.userId);
    })
    .map((mention) => {
      if (mention.tag) return String(mention.tag).trim();
      const username = String(mention.username || mention.name || '').replace(/^@/, '').trim();
      return username ? `@${username}` : '';
    })
    .filter(Boolean)
    .slice(0, 8);
}

function mapSourcePublicationToRepostOf(source: FeedPublication, parent?: FeedPublication) {
  const images = resolveFeedPublicationImages(source, parent);
  const isUserPublication = isUserFeedPublication(source);
  const type = resolvePublicationType(source);
  const promotedEntityType = isUserPublication ? resolvePromotedEntityType(source) : undefined;
  const promotedEntityImages = isUserPublication
    ? resolveFeedPromotedEntityImages(source)
    : (type !== 'publicacion' ? images : []);
  const title = source.title
    || parent?.title
    || source.description?.slice(0, 80)
    || parent?.description?.slice(0, 80)
    || '';
  const description = source.description || parent?.description || '';
  const date = source.dateLabel || parent?.dateLabel || '';
  const entityType = promotedEntityType ?? (type !== 'publicacion' ? type : undefined);
  const location = entityType === 'lugar'
    ? resolveVenueLocation(source) || resolveFeedLocation(source.locationLabel, parent?.locationLabel)
    : resolveFeedLocation(source.locationLabel, parent?.locationLabel);
  return {
    user: mapAuthor(source),
    timeAgo: formatRelativeTime(String(source.createdAt || parent?.createdAt || Date.now())),
    images,
    title,
    description,
    date,
    location,
    tags: mapUserMentionTags(source.mentions),
    type,
    isUserPublication,
    promotedEntityType,
    promotedEntityImages: promotedEntityImages.length ? promotedEntityImages : undefined,
    feedMentions: source.mentions,
    detailPath: resolvePublicationDetailPath(source),
    venueFeed: mapVenueFeed(source),
  };
}

export function feedPublicationToLovablePost(pub: FeedPublication): Post {
  const author = mapAuthor(pub);
  const eventMention = pub.mentions?.find((m) => m.eventId || m.type === 'event' || m.mentionType === 'event');
  const serviceMention = pub.mentions?.find((m) => m.type === 'service' || m.mentionType === 'service');
  const venueMention = pub.mentions?.find((m) => m.type === 'venue' || m.mentionType === 'venue');

  const isUserPublication = isUserFeedPublication(pub);
  const type = resolvePublicationType(pub);
  const promotedEntityType = isUserPublication ? resolvePromotedEntityType(pub) : undefined;
  const entityType = promotedEntityType ?? (type !== 'publicacion' ? type : undefined);
  const images = resolveFeedPublicationImages(pub);
  const promotedEntityImages = isUserPublication
    ? resolveFeedPromotedEntityImages(pub)
    : (type !== 'publicacion' ? images : []);

  return {
    id: pub.id,
    user: author,
    timeAgo: formatRelativeTime(String(pub.createdAt || Date.now())),
    images,
    title: pub.title || eventMention?.title || serviceMention?.title || venueMention?.title || pub.description?.slice(0, 80) || 'Publicación',
    date:
      eventMention?.dateLabel
      || serviceMention?.dateLabel
      || venueMention?.dateLabel
      || String(serviceMention?.metadata?.scheduleLabel || serviceMention?.metadata?.availabilityLabel || '')
      || String(venueMention?.metadata?.scheduleLabel || venueMention?.metadata?.hoursLabel || '')
      || pub.dateLabel
      || '',
    location: entityType === 'lugar'
      ? resolveVenueLocation(pub) || resolveFeedLocation(
        eventMention?.locationLabel,
        serviceMention?.locationLabel,
        venueMention?.locationLabel,
        pub.locationLabel,
      )
      : resolveFeedLocation(
        eventMention?.locationLabel,
        serviceMention?.locationLabel,
        venueMention?.locationLabel,
        pub.locationLabel,
      ),
    tags: mapUserMentionTags(pub.mentions),
    description: pub.description || '',
    likes: pub.stats?.likes ?? 0,
    likedBy: [],
    comments: [],
    commentsCount: pub.stats?.comments ?? 0,
    reposts: pub.stats?.reposts ?? 0,
    repostedBy: [],
    type,
    isUserPublication,
    promotedEntityType,
    promotedEntityImages: promotedEntityImages.length ? promotedEntityImages : undefined,
    feedMentions: pub.mentions,
    visibility: 'public',
    detailPath: resolvePublicationDetailPath(pub),
    venueFeed: entityType === 'lugar' ? mapVenueFeed(pub) : undefined,
    repostOf: pub.sourcePublication
      ? mapSourcePublicationToRepostOf(pub.sourcePublication, pub)
      : undefined,
  };
}
