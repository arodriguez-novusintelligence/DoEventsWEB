import { CalendarDays, ChevronRight, MapPin, Sparkles } from 'lucide-react';
import { cn } from '@lovable/lib/utils';
import type { FeedUiPost as Post } from '@doevents/shared';
import ImageCarousel from './ImageCarousel';
import MentionText from './MentionText';
import {
  entityFeedTheme,
  feedTopBadgeTheme,
  type EntityFeedType,
  type FeedTopBadge,
} from './entityFeedTheme';

export interface EntityFeedContent {
  topBadge: FeedTopBadge;
  summaryType?: EntityFeedType;
  showSummaryCard: boolean;
  images: string[];
  /** Miniatura de la tarjeta de entidad: solo media original del evento/servicio/lugar */
  summaryImage?: string;
  title: string;
  date: string;
  location: string;
  description: string;
  tags: string[];
}

function TopTypeBadge({ badge }: { badge: FeedTopBadge }) {
  const theme = feedTopBadgeTheme(badge);
  const Icon = theme.Icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm',
        theme.badgeBg,
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {theme.label}
    </span>
  );
}

function EntitySummaryCard({
  type,
  title,
  subtitle,
  image,
  onClick,
  compact = false,
}: {
  type: EntityFeedType;
  title: string;
  subtitle: string;
  image?: string;
  onClick?: () => void;
  compact?: boolean;
}) {
  const theme = entityFeedTheme[type];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary/5 via-violet-50/80 to-indigo-50/60 p-2.5 text-left transition hover:opacity-95',
        compact ? 'mx-3 mb-3' : 'mx-4 mb-4',
      )}
    >
      {image ? (
        <img
          src={image}
          alt=""
          className="h-12 w-12 shrink-0 rounded-lg object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
          <theme.Icon className={cn('h-5 w-5', theme.accent)} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-card-foreground">{title}</p>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <span
        className={cn(
          'inline-flex shrink-0 items-center gap-0.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white',
          theme.badgeBg,
        )}
      >
        {theme.label}
        <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
      </span>
    </button>
  );
}

interface EntityFeedBodyProps {
  content: EntityFeedContent;
  compact?: boolean;
  canOpen?: boolean;
  onOpenDetail?: (post: Post) => void;
  postForOpen?: Post;
  onMentionClick?: (mention: string) => void;
}

export function EntityFeedBody({
  content,
  compact = false,
  canOpen = false,
  onOpenDetail,
  postForOpen,
  onMentionClick,
}: EntityFeedBodyProps) {
  const accentType = content.summaryType
    ?? (content.topBadge !== 'publicacion' ? content.topBadge : 'evento');
  const theme = entityFeedTheme[accentType];
  const open = canOpen && onOpenDetail && postForOpen
    ? () => onOpenDetail(postForOpen)
    : undefined;
  const px = compact ? 'px-3' : 'px-4';
  const summarySubtitle = accentType === 'evento'
    ? content.date
    : content.location || content.date;
  const hasMedia = content.images.length > 0;
  const showEventDatePill = Boolean(content.date)
    && (content.summaryType === 'evento' || content.topBadge === 'evento');

  return (
    <>
      {hasMedia ? (
        <div
          className={cn('relative pt-3', px, open && 'cursor-pointer')}
          onClick={open}
        >
          <div className="relative">
            <ImageCarousel
              images={content.images}
              className="aspect-[16/10] rounded-xl"
              bare
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
              <TopTypeBadge badge={content.topBadge} />
              {showEventDatePill ? (
                <span className="inline-flex max-w-[55%] items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
                  <Sparkles className="h-3 w-3 shrink-0 text-amber-500" />
                  <span className="truncate">{content.date}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={cn(hasMedia ? 'pt-3' : 'pt-3', px, open && 'cursor-pointer')}
        onClick={open}
      >
        {!hasMedia ? (
          <div className="mb-2">
            <TopTypeBadge badge={content.topBadge} />
          </div>
        ) : null}

        <h2 className="text-[15px] font-bold leading-tight text-card-foreground transition-colors hover:text-primary">
          {content.title}
        </h2>

        {accentType !== 'evento' && content.date ? (
          <p className={cn('mt-2 flex items-start gap-1.5 text-xs text-card-foreground')}>
            <CalendarDays className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', theme.accent)} strokeWidth={2} />
            <span>{content.date}</span>
          </p>
        ) : null}

        {content.location ? (
          <p className={cn('mt-1.5 flex items-start gap-1.5 text-xs text-card-foreground')}>
            <MapPin className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', theme.accent)} strokeWidth={2} />
            <span>{content.location}</span>
          </p>
        ) : null}

        {content.description ? (
          <MentionText
            text={content.description}
            onMentionClick={onMentionClick}
            className="mt-2 text-sm leading-relaxed text-card-foreground"
          />
        ) : null}

        {content.tags.length > 0 ? (
          <p className="mt-2 text-sm text-primary">
            {content.tags.map((tag, index) => {
              const handle = tag.replace(/^@/, '');
              return (
                <button
                  key={`${tag}-${index}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMentionClick?.(handle);
                  }}
                  className="mr-2 font-semibold hover:underline"
                >
                  {tag.startsWith('@') ? tag : `@${tag}`}
                </button>
              );
            })}
          </p>
        ) : null}
      </div>

      {content.showSummaryCard && content.summaryType ? (
        <EntitySummaryCard
          type={content.summaryType}
          title={content.title}
          subtitle={summarySubtitle}
          image={content.summaryImage || (content.topBadge !== 'publicacion' ? content.images[0] : undefined)}
          onClick={open}
          compact={compact}
        />
      ) : null}
    </>
  );
}

function buildEntityFeedContent(
  post: Pick<
    Post,
    | 'type'
    | 'isUserPublication'
    | 'promotedEntityType'
    | 'promotedEntityImages'
    | 'images'
    | 'title'
    | 'date'
    | 'location'
    | 'description'
    | 'tags'
  >,
): EntityFeedContent | null {
  if (post.isUserPublication) {
    return {
      topBadge: 'publicacion',
      summaryType: post.promotedEntityType,
      showSummaryCard: Boolean(post.promotedEntityType),
      images: post.images,
      summaryImage: post.promotedEntityImages?.[0],
      title: post.title,
      date: post.date,
      location: post.location,
      description: post.description,
      tags: post.tags,
    };
  }

  if (post.type === 'evento' || post.type === 'servicio' || post.type === 'lugar') {
    return {
      topBadge: post.type,
      summaryType: post.type,
      showSummaryCard: true,
      images: post.images,
      summaryImage: post.promotedEntityImages?.[0] || post.images[0],
      title: post.title,
      date: post.date,
      location: post.location,
      description: post.description,
      tags: post.tags,
    };
  }

  return null;
}

export function postToEntityContent(post: Post): EntityFeedContent | null {
  return buildEntityFeedContent(post);
}

export function repostOfToEntityContent(
  repostOf: NonNullable<Post['repostOf']>,
): EntityFeedContent | null {
  if (repostOf.isUserPublication) {
    return {
      topBadge: 'publicacion',
      summaryType: repostOf.promotedEntityType,
      showSummaryCard: Boolean(repostOf.promotedEntityType),
      images: repostOf.images,
      summaryImage: repostOf.promotedEntityImages?.[0],
      title: repostOf.title,
      date: repostOf.date || '',
      location: repostOf.location || '',
      description: repostOf.description,
      tags: repostOf.tags,
    };
  }

  if (!repostOf.type || (repostOf.type !== 'evento' && repostOf.type !== 'servicio' && repostOf.type !== 'lugar')) {
    return null;
  }

  return {
    topBadge: repostOf.type,
    summaryType: repostOf.type,
    showSummaryCard: true,
    images: repostOf.images,
    summaryImage: repostOf.promotedEntityImages?.[0] || repostOf.images[0],
    title: repostOf.title,
    date: repostOf.date || '',
    location: repostOf.location || '',
    description: repostOf.description,
    tags: repostOf.tags,
  };
}

export default EntityFeedBody;
