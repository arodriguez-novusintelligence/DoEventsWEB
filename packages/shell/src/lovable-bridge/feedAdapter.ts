import type { FeedPublication } from '@doevents/shared';
import {
  formatRelativeTime,
  resolveDisplayLocation,
  resolveImageUrl,
  resolveEventIdFromFeedPublication,
  resolveServiceIdFromFeedPublication,
  resolveVenueIdFromFeedPublication,
  resolvePublicationDetailPath,
} from '@doevents/shared';
import type { Post, User } from '@doevents/shared';

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
    avatarUrl: resolveImageUrl(author?.avatarUrl) || undefined,
  };
}

function resolveImages(pub: FeedPublication): string[] {
  if (pub.images?.length) return pub.images.filter(Boolean);
  if (pub.imageUrl) return [pub.imageUrl];
  return (pub.media || [])
    .map((m) => {
      if (!m) return '';
      if (typeof m === 'string') return m;
      return m.url || '';
    })
    .filter(Boolean);
}

function resolveFeedLocation(...candidates: Array<string | undefined | null>): string {
  for (const candidate of candidates) {
    const resolved = resolveDisplayLocation({ label: candidate, locationLabel: candidate });
    if (resolved !== '—') return resolved;
  }
  return '';
}

function resolvePublicationType(pub: FeedPublication): Post['type'] {
  if (pub.type === 'event' || resolveEventIdFromFeedPublication(pub)) return 'evento';
  if (pub.type === 'service' || resolveServiceIdFromFeedPublication(pub)) return 'servicio';
  if (pub.type === 'venue' || resolveVenueIdFromFeedPublication(pub)) return 'lugar';
  if (pub.type === 'post' || Boolean(pub.mentions?.length)) return 'publicacion';
  return 'publicacion';
}

function mapSourcePublicationToRepostOf(source: FeedPublication, parent?: FeedPublication) {
  let images = resolveImages(source).map((url) => resolveImageUrl(url) || url).filter(Boolean);
  if (!images.length && parent?.sourceImages?.length) {
    images = parent.sourceImages
      .map((url) => resolveImageUrl(url) || url)
      .filter(Boolean);
  } else if (!images.length && parent?.sourceImageUrl) {
    const fallbackImage = resolveImageUrl(parent.sourceImageUrl);
    if (fallbackImage) images = [fallbackImage];
  } else if (!images.length && parent?.imageUrl) {
    const fallbackImage = resolveImageUrl(parent.imageUrl);
    if (fallbackImage) images = [fallbackImage];
  }

  const type = resolvePublicationType(source);
  const title = source.title
    || parent?.title
    || source.description?.slice(0, 80)
    || parent?.description?.slice(0, 80)
    || '';
  const description = source.description || parent?.description || '';
  const date = source.dateLabel || parent?.dateLabel || '';
  const location = resolveFeedLocation(source.locationLabel, parent?.locationLabel);
  return {
    user: mapAuthor(source),
    timeAgo: formatRelativeTime(String(source.createdAt || parent?.createdAt || Date.now())),
    images,
    title,
    description,
    date,
    location,
    tags: (source.mentions || []).map((m) => m.tag || m.name || '').filter(Boolean).slice(0, 6),
    type,
    detailPath: resolvePublicationDetailPath(source),
  };
}

export function feedPublicationToLovablePost(pub: FeedPublication): Post {
  const author = mapAuthor(pub);
  const eventMention = pub.mentions?.find((m) => m.eventId || m.type === 'event' || m.mentionType === 'event');
  const serviceMention = pub.mentions?.find((m) => m.type === 'service' || m.mentionType === 'service');
  const venueMention = pub.mentions?.find((m) => m.type === 'venue' || m.mentionType === 'venue');

  const mentionImage = resolveImageUrl(
    String(
      eventMention?.metadata?.imageUrl
      || serviceMention?.metadata?.imageUrl
      || venueMention?.metadata?.imageUrl
      || '',
    ) || undefined,
  );

  const type = resolvePublicationType(pub);

  const baseImages = resolveImages(pub).map((url) => resolveImageUrl(url) || url);
  const images = baseImages.length ? baseImages : (mentionImage ? [mentionImage] : []);

  return {
    id: pub.id,
    user: author,
    timeAgo: formatRelativeTime(String(pub.createdAt || Date.now())),
    images,
    title: pub.title || eventMention?.title || serviceMention?.title || venueMention?.title || pub.description?.slice(0, 80) || 'Publicación',
    date: eventMention?.dateLabel || pub.dateLabel || '',
    location: resolveFeedLocation(
      eventMention?.locationLabel,
      serviceMention?.locationLabel,
      venueMention?.locationLabel,
      pub.locationLabel,
    ),
    tags: (pub.mentions || []).map((m) => m.tag || m.name || '').filter(Boolean).slice(0, 6),
    description: pub.description || '',
    likes: pub.stats?.likes ?? 0,
    likedBy: [],
    comments: [],
    commentsCount: pub.stats?.comments ?? 0,
    reposts: pub.stats?.reposts ?? 0,
    repostedBy: [],
    type,
    visibility: 'public',
    detailPath: resolvePublicationDetailPath(pub),
    repostOf: pub.sourcePublication
      ? mapSourcePublicationToRepostOf(pub.sourcePublication, pub)
      : undefined,
  };
}
