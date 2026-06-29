import { MapPin, Plus, Sparkles, Loader2 } from 'lucide-react';
import { UserAvatar } from '@doevents/shared';
import { cn } from '@lovable/lib/utils';
import FeedThemeToggle from './FeedThemeToggle';

export interface FeedStoryItem {
  id: string;
  name: string;
  imageUrl?: string;
  own?: boolean;
  live?: boolean;
  hasStory?: boolean;
  storyCount?: number;
  authorId?: string;
}

interface FeedHeroProps {
  userName?: string;
  location?: string;
  onChangeLocation?: () => void;
  stories?: FeedStoryItem[];
  storiesLoading?: boolean;
  onStoryClick?: (story: FeedStoryItem) => void;
  onCreateStory?: () => void;
  showBuiltInStories?: boolean;
  selectedCategories?: string[];
  onSelectCategory?: (label: string) => void;
  onViewAllCategories?: () => void;
}

const FeedHero = ({
  userName = 'Andrés',
  location = 'Indica tu ubicación',
  onChangeLocation,
  stories = [],
  storiesLoading = false,
  onStoryClick,
  onCreateStory,
}: FeedHeroProps) => {
  return (
    <div className="relative pb-4">
      <div
        className="rounded-b-3xl px-4 pb-10 pt-5"
        style={{ background: 'var(--feed-hero-grad)' }}
      >
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 backdrop-blur">
                <MapPin className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70">
                  Tu ubicación
                </p>
                <p className="truncate text-sm font-bold text-primary-foreground">{location}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <FeedThemeToggle />
              <button
                type="button"
                onClick={() => onChangeLocation?.()}
                className="rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur hover:bg-primary-foreground/25"
              >
                Cambiar
              </button>
            </div>
          </div>

          <h1 className="mt-5 text-2xl font-extrabold text-primary-foreground">
            ¡Hola, {userName}! <span className="inline-block">👋</span>
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/85">Descubre qué está pasando hoy cerca de ti</p>
        </div>
      </div>

      <div className="mt-4 px-4">
        <div className="mx-auto max-w-lg">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-foreground">En vivo & Historias</h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
              Cerca de ti
            </span>
          </div>
          <div className="flex items-start gap-3 overflow-x-auto pb-1 no-scrollbar">
            {storiesLoading && (
              <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed border-border/40 bg-card px-4 py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs font-medium text-muted-foreground">Cargando historias…</p>
              </div>
            )}
            {!storiesLoading && stories.length === 0 && (
              <div className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-border/40 bg-card px-4 py-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <p className="text-xs font-medium text-foreground">No hay historias cerca de ti aún</p>
              </div>
            )}
            {!storiesLoading &&
              stories.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (s.own) {
                      if (s.hasStory && s.authorId) onStoryClick?.(s);
                      else onCreateStory?.();
                      return;
                    }
                    onStoryClick?.(s);
                  }}
                  className="flex w-16 shrink-0 flex-col items-center gap-1"
                >
                  <div
                    className={cn(
                      'relative h-16 w-16 rounded-full p-[2.5px]',
                      s.own
                        ? s.hasStory
                          ? 'bg-gradient-to-tr from-primary via-accent to-pink-400'
                          : 'bg-muted'
                        : s.live
                          ? 'bg-gradient-to-tr from-rose-500 via-primary to-pink-400'
                          : 'bg-gradient-to-tr from-primary via-accent to-pink-400',
                    )}
                  >
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-card bg-muted">
                      <UserAvatar name={s.name} imageUrl={s.imageUrl} size={58} />
                    </div>
                    {s.own && (
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Agregar historia"
                        className="absolute bottom-0 right-0 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateStory?.();
                        }}
                      >
                        <Plus className="h-3 w-3 text-primary-foreground" />
                      </span>
                    )}
                    {s.live && (
                      <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 rounded-full bg-rose-500 px-1.5 py-0.5 text-[8px] font-bold text-white">
                        LIVE
                      </span>
                    )}
                  </div>
                  <span className="w-full truncate text-center text-[10px] font-medium text-foreground">{s.name}</span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedHero;
