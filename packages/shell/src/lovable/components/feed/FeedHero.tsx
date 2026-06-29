import { useState } from 'react';
import {
  MapPin,
  Smile,
  PartyPopper,
  Gamepad2,
  Map,
  Music,
  Trophy,
  Plus,
  Sparkles,
  Loader2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { UserAvatar } from '@doevents/shared';
import dessertFestival from '@lovable/assets/dessert-festival.jpg';
import modernKitchen from '@lovable/assets/modern-kitchen.jpg';
import outdoorDining from '@lovable/assets/outdoor-dining.jpg';
import vintageCars from '@lovable/assets/vintage-cars.jpg';
import { cn } from '@lovable/lib/utils';
import { useStories } from '@lovable/contexts/StoriesContext';
import AddStorySheet from './AddStorySheet';
import StoryViewer from './StoryViewer';
import StoryViewersSheet from './StoryViewersSheet';

type Category = { label: string; icon: LucideIcon; bg: string; color: string };

/** Paleta semántica DSF — alineada con EventsView DISCOVER_CHIP_STYLES. */
const CATEGORY_CHIP_STYLES: Pick<Category, 'bg' | 'color'>[] = [
  { bg: 'bg-primary/10', color: 'text-primary' },
  { bg: 'bg-accent', color: 'text-accent-foreground' },
  { bg: 'bg-secondary', color: 'text-secondary-foreground' },
  { bg: 'bg-primary/15', color: 'text-primary' },
  { bg: 'bg-muted', color: 'text-muted-foreground' },
  { bg: 'bg-accent/80', color: 'text-accent-foreground' },
];

const categoryIcons = [Smile, PartyPopper, Gamepad2, Map, Music, Trophy];
const categoryLabels = [
  'Comedia en vivo',
  'Fiesta, Reunión social',
  'Juego o evento',
  'Recorrido',
  'Concierto',
  'Deportes',
];

const categories: Category[] = categoryLabels.map((label, index) => {
  const style = CATEGORY_CHIP_STYLES[index] || CATEGORY_CHIP_STYLES[0];
  return { label, icon: categoryIcons[index] || Smile, bg: style.bg, color: style.color };
});

/** Solo DEV cuando no hay historias API — nunca en runtime prod (showBuiltInStories=false). */
const defaultStories = [
  { id: 's0', name: 'Tu historia', image: dessertFestival, own: true },
  { id: 's1', name: 'Ana', image: outdoorDining },
  { id: 's2', name: 'Carlos', image: modernKitchen },
  { id: 's3', name: 'María', image: vintageCars },
  { id: 's4', name: 'Luis', image: dessertFestival },
];

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
  onSelectCategory?: (label: string) => void;
  selectedCategories?: string[];
  stories?: FeedStoryItem[];
  storiesLoading?: boolean;
  onStoryClick?: (story: FeedStoryItem) => void;
  onCreateStory?: () => void;
  showBuiltInStories?: boolean;
  onViewAllCategories?: () => void;
}

const STORY_RING_OWN = 'bg-gradient-to-tr from-primary via-accent to-destructive';
const STORY_RING_LIVE = 'bg-gradient-to-tr from-destructive via-primary to-accent';
const STORY_RING_DEFAULT = 'bg-gradient-to-tr from-primary via-accent to-destructive';

const FeedHero = ({
  userName = 'Eventer',
  location = 'Indica tu ubicación',
  onChangeLocation,
  onSelectCategory,
  selectedCategories = [],
  stories: apiStories,
  storiesLoading = false,
  onStoryClick,
  onCreateStory,
  showBuiltInStories = false,
  onViewAllCategories,
}: FeedHeroProps) => {
  const { users, currentUserId } = useStories();
  const useApiStories = apiStories !== undefined;
  const useContextStories = !useApiStories && showBuiltInStories;
  const showStoriesSection = useApiStories || useContextStories || (showBuiltInStories && import.meta.env.DEV);
  const showDevStories = !useApiStories && showBuiltInStories && import.meta.env.DEV;

  const [addOpen, setAddOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStartId, setViewerStartId] = useState<string | null>(null);
  const [viewersSheet, setViewersSheet] = useState<{ open: boolean; userId: string | null; itemId: string | null }>({
    open: false,
    userId: null,
    itemId: null,
  });

  const handleContextStoryClick = (userId: string, hasItems: boolean, isOwn: boolean) => {
    if (isOwn && !hasItems) {
      setAddOpen(true);
      return;
    }
    setViewerStartId(userId);
    setViewerOpen(true);
  };

  const handleOpenLocation = () => {
    onChangeLocation?.();
  };

  return (
    <div className="relative pb-4">
      <div
        className="rounded-b-3xl px-4 pb-16 pt-5"
        style={{
          background:
            'linear-gradient(135deg, hsl(var(--primary-deep)) 0%, hsl(var(--primary)) 65%, hsl(232 60% 40%) 100%)',
        }}
      >
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 ring-2 ring-primary-foreground/20 backdrop-blur">
                <MapPin className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-primary-foreground/70">
                  Tu ubicación
                </p>
                <p className="truncate text-sm font-extrabold text-primary-foreground">{location}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenLocation}
              className="shrink-0 rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs font-extrabold text-primary-foreground shadow-sm ring-1 ring-primary-foreground/20 backdrop-blur transition-colors hover:bg-primary-foreground/25"
            >
              Cambiar
            </button>
          </div>

          <h1 className="mt-5 text-2xl font-extrabold text-primary-foreground">
            ¡Hola, {userName}! <span className="inline-block">👋</span>
          </h1>
          <p className="mt-1 text-sm font-extrabold text-primary-foreground/85">
            Descubre qué está pasando hoy cerca de ti
          </p>
        </div>
      </div>

      <div className="-mt-12 px-4">
        <div className="mx-auto max-w-lg rounded-2xl border border-border/60 bg-card p-4 shadow-sm ring-1 ring-primary/10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-foreground">Categorías</h2>
            {onViewAllCategories && (
              <button
                type="button"
                onClick={onViewAllCategories}
                className="text-xs font-extrabold text-primary shadow-sm hover:underline"
              >
                Ver todas
              </button>
            )}
          </div>
          <div className="grid grid-cols-6 gap-2">
            {categories.map((c) => {
              const Icon = c.icon;
              const active = selectedCategories.includes(c.label);
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => onSelectCategory?.(c.label)}
                  className="flex flex-col items-center gap-1.5 text-center"
                >
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-primary/20 transition shadow-sm',
                      c.bg,
                      active && 'scale-105 ring-2 ring-primary',
                    )}
                  >
                    <Icon className={cn('h-6 w-6', c.color)} />
                  </div>
                  <span className="line-clamp-2 text-[10px] font-extrabold leading-tight text-foreground">
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showStoriesSection && (
        <div className="mt-5 px-4">
          <div className="mx-auto max-w-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-foreground">En vivo & Historias</h2>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-primary">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  Cerca de ti
                </span>
                {onViewAllCategories && (
                  <button
                    type="button"
                    onClick={onViewAllCategories}
                    className="text-xs font-extrabold text-primary hover:underline"
                  >
                    Ver todas
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3 overflow-x-auto pb-1 no-scrollbar">
              {useApiStories && storiesLoading && (
                <div className="flex h-14 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-card px-4 py-6 shadow-sm ring-2 ring-primary/20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs font-extrabold text-muted-foreground">Cargando historias…</p>
                </div>
              )}
              {useApiStories && !storiesLoading && apiStories!.length === 0 && (
                <div className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-primary/25 bg-card px-4 py-6 shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                    <Sparkles className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-xs font-extrabold text-foreground">No hay historias cerca de ti aún</p>
                  <p className="text-center text-[10px] font-extrabold text-muted-foreground">
                    Sé el primero en compartir lo que está pasando
                  </p>
                </div>
              )}
              {useApiStories &&
                !storiesLoading &&
                apiStories!.map((s) => (
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
                            ? STORY_RING_OWN
                            : 'bg-muted'
                          : s.live
                            ? STORY_RING_LIVE
                            : STORY_RING_DEFAULT,
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
                          className="absolute bottom-0 right-0 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-primary shadow-sm ring-1 ring-primary/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateStory?.();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              onCreateStory?.();
                            }
                          }}
                        >
                          <Plus className="h-3 w-3 text-primary-foreground" />
                        </span>
                      )}
                      {s.live && (
                        <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 rounded-full bg-destructive px-1.5 py-0.5 text-[8px] font-extrabold text-destructive-foreground">
                          LIVE
                        </span>
                      )}
                    </div>
                    <span className="w-full truncate text-center text-[10px] font-extrabold text-foreground">
                      {s.name}
                    </span>
                  </button>
                ))}
              {useContextStories &&
                users.map((s) => {
                  const isOwn = s.id === currentUserId;
                  const hasItems = s.items.length > 0;
                  const hasUnseen = !isOwn && s.items.some((i) => !i.viewers.some((v) => v.id === currentUserId));
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleContextStoryClick(s.id, hasItems, isOwn)}
                      className="flex w-16 shrink-0 flex-col items-center gap-1"
                    >
                      <div
                        className={cn(
                          'relative h-16 w-16 rounded-full p-[2.5px]',
                          isOwn
                            ? hasItems
                              ? STORY_RING_OWN
                              : 'bg-muted'
                            : hasUnseen
                              ? STORY_RING_DEFAULT
                              : 'bg-muted',
                        )}
                      >
                        <div className="h-full w-full overflow-hidden rounded-full border-2 border-card">
                          <img src={s.avatar} alt={s.name} className="h-full w-full object-cover" />
                        </div>
                        {isOwn && (
                          <span
                            role="button"
                            tabIndex={0}
                            aria-label="Agregar historia"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddOpen(true);
                            }}
                            className="absolute bottom-0 right-0 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-primary shadow-sm ring-1 ring-primary/20"
                          >
                            <Plus className="h-3 w-3 text-primary-foreground" />
                          </span>
                        )}
                      </div>
                      <span className="w-full truncate text-center text-[10px] font-extrabold text-foreground">
                        {s.name}
                      </span>
                    </button>
                  );
                })}
              {showDevStories &&
                defaultStories.map((s) => (
                  <button key={s.id} type="button" className="flex w-16 shrink-0 flex-col items-center gap-1">
                    <div
                      className={cn(
                        'relative h-16 w-16 rounded-full p-[2.5px]',
                        s.own ? 'bg-muted' : 'bg-gradient-to-tr from-primary via-accent to-destructive',
                      )}
                    >
                      <div className="h-full w-full overflow-hidden rounded-full border-2 border-card">
                        <img src={s.image} alt={s.name} className="h-full w-full object-cover" />
                      </div>
                      {s.own && (
                        <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-primary shadow-sm ring-1 ring-primary/20">
                          <Plus className="h-3 w-3 text-primary-foreground" />
                        </span>
                      )}
                    </div>
                    <span className="w-full truncate text-center text-[10px] font-extrabold text-foreground">
                      {s.name}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {useContextStories && (
        <>
          <AddStorySheet open={addOpen} onOpenChange={setAddOpen} />
          <StoryViewer
            open={viewerOpen}
            startUserId={viewerStartId}
            onClose={() => setViewerOpen(false)}
            onOpenViewers={(userId, itemId) => setViewersSheet({ open: true, userId, itemId })}
          />
          <StoryViewersSheet
            open={viewersSheet.open}
            onOpenChange={(v) => setViewersSheet((prev) => ({ ...prev, open: v }))}
            userId={viewersSheet.userId}
            itemId={viewersSheet.itemId}
          />
        </>
      )}
    </div>
  );
};

export default FeedHero;
