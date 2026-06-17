import type { FeedEventItem } from '../types/events';
import type { FeedPublication } from '../types/feed';
import { matchCategoryLabel } from '../data/eventCategories';
import { getCachedEvent } from './eventsCache';
import { resolveEventIdFromFeedPublication } from './feedPublicationUtils';

export function matchesEventCategory(
  event: FeedEventItem,
  selectedCategories: string[],
): boolean {
  if (!selectedCategories.length) return true;
  const eventCategory = matchCategoryLabel(event.Categoria || '');
  const eventHaystack = [
    event.Categoria,
    event.nombre,
    eventCategory?.id,
    eventCategory?.label,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return selectedCategories.some((catId) => {
    const selected = matchCategoryLabel(catId);
    if (eventCategory && selected) {
      return eventCategory.id === selected.id;
    }
    const needle = (selected?.label || selected?.id || catId).toLowerCase();
    return eventHaystack.includes(needle) || needle.includes(eventHaystack);
  });
}

function categoryFromMentionMetadata(metadata?: Record<string, unknown>): string | undefined {
  if (!metadata) return undefined;
  const value = metadata.Categoria ?? metadata.category ?? metadata.tipoEvento ?? metadata.CategoriaEvento;
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function categoryMatchesSelection(category: string | undefined, selectedCategories: string[]): boolean {
  if (!category) return false;
  return matchesEventCategory({ id: '', nombre: '', Categoria: category }, selectedCategories);
}

export function buildEventCategoryMapForFeed(
  posts: FeedPublication[],
  events: FeedEventItem[],
): Map<string, string> {
  const map = new Map<string, string>();

  for (const event of events) {
    if (event.id) map.set(event.id, event.Categoria || '');
  }

  for (const post of posts) {
    const eventId = resolveEventIdFromFeedPublication(post);
    if (eventId && !map.has(eventId)) {
      const cached = getCachedEvent(eventId);
      if (cached?.Categoria) map.set(eventId, cached.Categoria);
    }

    const postCategory = post.metadata?.Categoria as string | undefined;
    if (eventId && postCategory) map.set(eventId, postCategory);

    for (const mention of post.mentions || []) {
      const mentionEventId = mention.eventId
        || (mention.type === 'event' || mention.mentionType === 'event' ? mention.targetId : undefined);
      const mentionCategory = categoryFromMentionMetadata(mention.metadata);
      if (mentionEventId && mentionCategory) {
        map.set(mentionEventId, mentionCategory);
      }
    }

    const source = post.sourcePublication;
    if (source) {
      const sourceEventId = resolveEventIdFromFeedPublication(source);
      if (sourceEventId && !map.has(sourceEventId)) {
        const cached = getCachedEvent(sourceEventId);
        if (cached?.Categoria) map.set(sourceEventId, cached.Categoria);
      }
    }
  }

  return map;
}

export function matchesPublicationCategory(
  post: FeedPublication,
  selectedCategories: string[],
  eventCategoryById?: Map<string, string>,
): boolean {
  if (!selectedCategories.length) return true;

  const eventId = resolveEventIdFromFeedPublication(post);
  if (eventId && eventCategoryById?.has(eventId)) {
    return matchesEventCategory(
      { id: eventId, nombre: '', Categoria: eventCategoryById.get(eventId) },
      selectedCategories,
    );
  }

  const directCategory = post.metadata?.Categoria as string | undefined;
  if (categoryMatchesSelection(directCategory, selectedCategories)) return true;

  for (const mention of post.mentions || []) {
    const mentionCategory = categoryFromMentionMetadata(mention.metadata);
    if (categoryMatchesSelection(mentionCategory, selectedCategories)) return true;
  }

  const haystack = [
    post.title,
    post.description,
    post.locationLabel,
    post.metadata?.Categoria as string | undefined,
    post.metadata?.tipoEvento as string | undefined,
    ...(post.mentions || []).map((m) => m.title || m.name || ''),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return selectedCategories.some((catId) => {
    const selected = matchCategoryLabel(catId);
    if (!selected) {
      return haystack.includes(catId.toLowerCase());
    }
    return (
      haystack.includes(selected.label.toLowerCase())
      || haystack.includes(selected.id.toLowerCase())
    );
  });
}
