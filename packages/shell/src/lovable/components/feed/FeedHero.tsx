import { MapPin, Smile, PartyPopper, Gamepad2, Map, Music, Trophy, Plus, Sparkles, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { UserAvatar } from '@doevents/shared';
import dessertFestival from '@lovable/assets/dessert-festival.jpg';
import modernKitchen from '@lovable/assets/modern-kitchen.jpg';
import outdoorDining from '@lovable/assets/outdoor-dining.jpg';
import vintageCars from '@lovable/assets/vintage-cars.jpg';
import { cn } from '@lovable/lib/utils';

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
  /** Historias desde API; si se pasa, reemplaza el mock */
  stories?: FeedStoryItem[];
  storiesLoading?: boolean;
  onStoryClick?: (story: FeedStoryItem) => void;
  onCreateStory?: () => void;
  showBuiltInStories?: boolean;
  onViewAllCategories?: () => void;
}

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
  showBuiltInStories = import.meta.env.DEV,
  onViewAllCategories,
}: FeedHeroProps) => {
  const useApiStories = apiStories !== undefined;
  const showStories = useApiStories || showBuiltInStories;
  const showDevStories = !useApiStories && showBuiltInStories && import.meta.env.DEV;
  return (
    <div className="relative pb-4">
      {/* Darker hero */}
      <div
        className="px-4 pt-5 pb-16 rounded-b-3xl"
        style={{
          background:
            'linear-gradient(135deg, hsl(var(--primary-deep)) 0%, hsl(var(--primary)) 65%, hsl(232 60% 40%) 100%)',
        }}
      >
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 ring-2 ring-primary-foreground/20 backdrop-blur">
                <MapPin className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70">Tu ubicación</p>
                <p className="text-sm font-bold text-primary-foreground truncate">{location}</p>
              </div>
            </div>
            <button
              onClick={onChangeLocation}
              className="shrink-0 rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur ring-1 ring-primary-foreground/20 hover:bg-primary-foreground/25 transition-colors"
            >
              Cambiar
            </button>
          </div>

          <h1 className="mt-5 text-2xl font-extrabold text-primary-foreground">
            ¡Hola, {userName}! <span className="inline-block">👋</span>
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/85">
            Descubre qué está pasando hoy cerca de ti
          </p>
        </div>
      </div>

      {/* Categorías card overlapping */}
      <div className="-mt-12 px-4">
        <div className="mx-auto max-w-lg rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-foreground">Categorías</h2>
            <button
              type="button"
              onClick={onViewAllCategories}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Ver todas
            </button>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {categories.map((c) => {
              const Icon = c.icon;
              const active = selectedCategories.includes(c.label);
              return (
                <button
                  key={c.label}
                  onClick={() => onSelectCategory?.(c.label)}
                  className="flex flex-col items-center gap-1.5 text-center"
                >
                  <div className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-2xl ring-2 transition',
                    c.bg,
                    active ? 'ring-primary scale-105' : 'ring-transparent',
                  )}>
                    <Icon className={cn('h-6 w-6', c.color)} />
                  </div>
                  <span className="text-[10px] font-medium text-foreground leading-tight line-clamp-2">
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showStories && (
        <div className="mt-5 px-4">
          <div className="mx-auto max-w-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-extrabold text-foreground">En vivo & Historias</h2>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Cerca de ti
                </span>
                {onViewAllCategories && (
                  <button
                    type="button"
                    onClick={onViewAllCategories}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Ver todas
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3 overflow-x-auto no-scrollbar pb-1">
              {storiesLoading && (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-primary/25 bg-card py-6 px-4 w-full shadow-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs font-medium text-muted-foreground">Cargando historias…</p>
                </div>
              )}
              {!storiesLoading && useApiStories && apiStories!.length === 0 && (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-primary/25 bg-card py-6 px-4 w-full shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                    <Sparkles className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-foreground">No hay historias cerca de ti aún</p>
                  <p className="text-[10px] text-muted-foreground text-center">Sé el primero en compartir lo que está pasando</p>
                </div>
              )}
              {!storiesLoading && useApiStories && apiStories!.map((s) => (
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
                  className="flex flex-col items-center gap-1 shrink-0 w-16"
                >
                  <div className={cn(
                    'relative h-16 w-16 rounded-full p-[2.5px]',
                    s.own
                      ? (s.hasStory
                        ? 'bg-gradient-to-tr from-primary via-violet-500 to-pink-400'
                        : 'bg-primary')
                      : s.live
                        ? 'bg-gradient-to-tr from-rose-500 via-primary to-pink-400'
                        : 'bg-gradient-to-tr from-primary via-violet-500 to-pink-400',
                  )}>
                    <div className="h-full w-full overflow-hidden rounded-full border-2 border-card bg-muted flex items-center justify-center">
                      <UserAvatar name={s.name} imageUrl={s.imageUrl} size={58} />
                    </div>
                    {s.own && (
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Agregar historia"
                        className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary border-2 border-card z-10"
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
                      <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 rounded-full bg-rose-500 px-1.5 py-0.5 text-[8px] font-bold text-white">LIVE</span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-foreground truncate w-full text-center">{s.name}</span>
                </button>
              ))}
              {!storiesLoading && showDevStories && defaultStories.map((s) => (
                <button key={s.id} type="button" className="flex flex-col items-center gap-1 shrink-0 w-16">
                  <div className={cn(
                    'relative h-16 w-16 rounded-full p-[2.5px]',
                    s.own ? 'bg-primary' : 'bg-gradient-to-tr from-primary via-accent to-pink-400'
                  )}>
                    <div className="h-full w-full overflow-hidden rounded-full border-2 border-card">
                      <img src={s.image} alt={s.name} className="h-full w-full object-cover" />
                    </div>
                    {s.own && (
                      <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary border-2 border-card">
                        <Plus className="h-3 w-3 text-primary-foreground" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-foreground truncate w-full text-center">{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedHero;
