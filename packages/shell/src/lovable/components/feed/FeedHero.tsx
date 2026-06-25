import { useEffect, useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { cn } from '@lovable/lib/utils';
import { useStories } from '@lovable/contexts/StoriesContext';
import AddStorySheet from './AddStorySheet';
import StoryViewer from './StoryViewer';
import StoryViewersSheet from './StoryViewersSheet';
import ChangeLocationSheet, { type SelectedLocation } from './ChangeLocationSheet';

import { UserAvatar } from '@doevents/shared';
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
}

const LOCATION_STORAGE_KEY = 'feed_user_location_v1';

const FeedHero = ({
  userName = 'Andrés',
  location = 'Ricaurte, Cundinamarca',
  onChangeLocation,
}: FeedHeroProps) => {
  const { users, currentUserId } = useStories();
  const [addOpen, setAddOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStartId, setViewerStartId] = useState<string | null>(null);
  const [viewersSheet, setViewersSheet] = useState<{ open: boolean; userId: string | null; itemId: string | null }>({ open: false, userId: null, itemId: null });
  const [locationOpen, setLocationOpen] = useState(false);
  const [storedLocation, setStoredLocation] = useState<SelectedLocation | null>(() => {
    try {
      const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SelectedLocation) : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (storedLocation) {
      try { localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(storedLocation)); } catch { /* ignore */ }
    }
  }, [storedLocation]);

  const displayLocation = storedLocation?.label ?? location;
  const displayCity = storedLocation?.city;
  const displayCountry = storedLocation?.country;
  const displayDetail = storedLocation?.detail;

  const handleStoryClick = (userId: string, hasItems: boolean, isOwn: boolean) => {
    if (isOwn && !hasItems) {
      setAddOpen(true);
      return;
    }
    setViewerStartId(userId);
    setViewerOpen(true);
  };

  const handleOpenLocation = () => {
    onChangeLocation?.();
    setLocationOpen(true);
  };

  return (
    <div className="relative pb-4">
      {/* Darker hero */}
      <div
        className="px-4 pt-5 pb-10 rounded-b-3xl"
        style={{
          background:
            'linear-gradient(135deg, hsl(var(--primary-deep)) 0%, hsl(var(--primary)) 65%, hsl(232 60% 40%) 100%)',
        }}
      >
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 backdrop-blur">
                <MapPin className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70">Tu ubicación</p>
                {displayLocation && displayLocation !== displayCity && (
                  <p className="text-sm font-bold text-primary-foreground truncate">{displayLocation}</p>
                )}
                {displayCity && <p className="text-sm font-bold text-primary-foreground truncate">{displayCity}</p>}
                {displayCountry && <p className="text-[11px] font-semibold text-primary-foreground truncate">{displayCountry}</p>}
                {!displayCity && !displayCountry && displayDetail && <p className="text-[11px] text-primary-foreground/80 truncate">{displayDetail}</p>}
              </div>
            </div>
            <button
              onClick={handleOpenLocation}
              className="shrink-0 rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur hover:bg-primary-foreground/25"
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

      {/* En vivo & Historias */}
      <div className="mt-4 px-4">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-foreground">En vivo & Historias</h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              Cerca de ti
            </span>
          </div>
          <div className="flex items-start gap-3 overflow-x-auto no-scrollbar pb-1">
            {users.map((s) => {
              const isOwn = s.id === currentUserId;
              const hasItems = s.items.length > 0;
              const hasUnseen = !isOwn && s.items.some((i) => !i.viewers.some((v) => v.id === currentUserId));
              return (
                <button
                  key={s.id}
                  onClick={() => handleStoryClick(s.id, hasItems, isOwn)}
                  className="flex flex-col items-center gap-1 shrink-0 w-16"
                >
                  <div className={cn(
                    'relative h-16 w-16 rounded-full p-[2.5px]',
                    isOwn
                      ? hasItems
                        ? 'bg-gradient-to-tr from-primary via-accent to-pink-400'
                        : 'bg-muted'
                      : hasUnseen
                        ? 'bg-gradient-to-tr from-primary via-accent to-pink-400'
                        : 'bg-muted',
                  )}>
                    <div className="h-full w-full overflow-hidden rounded-full border-2 border-card">
                      <img src={s.avatar} alt={s.name} className="h-full w-full object-cover" />
                    </div>
                    {isOwn && (
                      <span
                        onClick={(e) => { e.stopPropagation(); setAddOpen(true); }}
                        className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary border-2 border-card cursor-pointer"
                      >
                        <Plus className="h-3 w-3 text-primary-foreground" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-foreground truncate w-full text-center">{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <AddStorySheet open={addOpen} onOpenChange={setAddOpen} />
      <StoryViewer
        open={viewerOpen}
        startUserId={viewerStartId}
        onClose={() => setViewerOpen(false)}
        onOpenViewers={(userId, itemId) => setViewersSheet({ open: true, userId, itemId })}
      />
      <StoryViewersSheet
        open={viewersSheet.open}
        onOpenChange={(v) => setViewersSheet((s) => ({ ...s, open: v }))}
        userId={viewersSheet.userId}
        itemId={viewersSheet.itemId}
      />
      <ChangeLocationSheet
        open={locationOpen}
        onOpenChange={setLocationOpen}
        initial={storedLocation}
        onSelect={(loc) => setStoredLocation(loc)}
      />
    </div>
  );
};

export default FeedHero;