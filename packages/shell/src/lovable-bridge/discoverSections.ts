import type { DiscoverEventItem } from './discoverAdapter';

const RECOMMENDED_CAROUSEL_LIMIT = 8;

export function buildUpcomingDiscoverEvents(myEvents: DiscoverEventItem[]): DiscoverEventItem[] {
  return myEvents.filter((event) => event.status === 'activo');
}

export function buildOtherDiscoverEvents(
  recommended: DiscoverEventItem[],
  options: {
    nearby: DiscoverEventItem[];
    favorites: DiscoverEventItem[];
    myEvents: DiscoverEventItem[];
    carouselLimit?: number;
  },
): DiscoverEventItem[] {
  const carouselLimit = options.carouselLimit ?? RECOMMENDED_CAROUSEL_LIMIT;
  const carouselIds = new Set(recommended.slice(0, carouselLimit).map((e) => e.id));
  const exclude = new Set([
    ...options.nearby.map((e) => e.id),
    ...options.favorites.map((e) => e.id),
    ...options.myEvents.map((e) => e.id),
    ...carouselIds,
  ]);
  return recommended.filter((e) => e.id && !exclude.has(e.id)).slice(0, 20);
}

export function splitRecommendedCarousel(
  recommended: DiscoverEventItem[],
  limit = RECOMMENDED_CAROUSEL_LIMIT,
): DiscoverEventItem[] {
  return recommended.slice(0, limit);
}
