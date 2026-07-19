import { Briefcase, CalendarDays, FileText, Home, type LucideIcon } from 'lucide-react';

export type EntityFeedType = 'evento' | 'servicio' | 'lugar';
export type FeedTopBadge = EntityFeedType | 'publicacion';

export const ENTITY_FEED_TYPES: EntityFeedType[] = ['evento', 'servicio', 'lugar'];

export const entityFeedTheme: Record<
  EntityFeedType,
  {
    label: string;
    Icon: LucideIcon;
    badgeBg: string;
    accent: string;
    cardBorder: string;
  }
> = {
  evento: {
    label: 'EVENTOS',
    Icon: CalendarDays,
    badgeBg: 'bg-[hsl(245,72%,59%)]',
    accent: 'text-[hsl(245,72%,59%)]',
    cardBorder: 'border-t-[3px] border-[hsl(245,72%,59%)]',
  },
  lugar: {
    label: 'LUGARES',
    Icon: Home,
    badgeBg: 'bg-[hsl(28,92%,55%)]',
    accent: 'text-[hsl(28,92%,55%)]',
    cardBorder: 'border-t-[3px] border-[hsl(28,92%,55%)]',
  },
  servicio: {
    label: 'SERVICIOS',
    Icon: Briefcase,
    badgeBg: 'bg-[hsl(152,65%,42%)]',
    accent: 'text-[hsl(152,65%,42%)]',
    cardBorder: 'border-t-[3px] border-[hsl(152,65%,42%)]',
  },
};

export function isEntityFeedType(type?: string): type is EntityFeedType {
  return Boolean(type && ENTITY_FEED_TYPES.includes(type as EntityFeedType));
}

/** Etiqueta superior de publicaciones creadas por usuarios en el menú + */
export const publicationFeedTheme = {
  label: 'PUBLICACIÓN',
  Icon: FileText,
  badgeBg: 'bg-[hsl(245,72%,59%)]',
  accent: 'text-[hsl(245,72%,59%)]',
  cardBorder: 'border-t-[3px] border-[hsl(245,72%,59%)]',
};

export function feedTopBadgeTheme(badge: FeedTopBadge) {
  if (badge === 'publicacion') return publicationFeedTheme;
  return entityFeedTheme[badge];
}
