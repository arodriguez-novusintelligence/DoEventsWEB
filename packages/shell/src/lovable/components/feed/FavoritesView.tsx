import { useState } from 'react';
import { ChevronLeft, Heart, MapPin, User, CalendarDays, FileText, Building2, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lovable/components/ui/tabs';
import PostCard from './PostCard';
import type { Post } from '@doevents/shared';
import type { ProfileListUser } from './FollowersSheet';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';

export type FavEventItem = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image: string;
  status?: 'Finalizado' | 'Próximamente' | 'Activo';
};

export type FavPlaceItem = {
  id: string;
  name: string;
  city?: string;
  capacity?: number;
};

interface FavoritesViewProps {
  onBack: () => void;
  favoriteEvents?: FavEventItem[];
  favoritePosts?: Post[];
  favoritePlaces?: FavPlaceItem[];
  favoriteProfiles?: ProfileListUser[];
  loading?: boolean;
  onViewProfile?: (user: ProfileListUser) => void;
  onToggleEventFavorite?: (eventId: string) => void;
  onOpenEvent?: (eventId: string) => void;
}

const statusStyle = (s: FavEventItem['status']) => {
  switch (s) {
    case 'Finalizado':
      return 'bg-primary/80 text-primary-foreground';
    case 'Próximamente':
      return 'bg-amber-400 text-amber-950';
    default:
      return 'bg-emerald-500 text-white';
  }
};

const FavoriteHeartButton = ({
  liked,
  onToggle,
}: {
  liked: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label="Quitar de favoritos"
    className={`h-9 w-9 rounded-full flex items-center justify-center border transition ${
      liked
        ? 'bg-primary text-primary-foreground border-primary'
        : 'bg-card text-primary border-primary/30'
    }`}
  >
    <Heart className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} />
  </button>
);

const EmptyTab = ({ message, icon: Icon }: { message: string; icon: typeof Heart }) => (
  <div className="flex flex-col items-center gap-3 py-12">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
      <Icon className="h-7 w-7 text-primary" />
    </div>
    <p className="text-sm text-muted-foreground max-w-[240px] text-center">{message}</p>
  </div>
);

const EventsTab = ({
  events,
  onToggleEventFavorite,
  onOpenEvent,
}: {
  events: FavEventItem[];
  onToggleEventFavorite?: (eventId: string) => void;
  onOpenEvent?: (eventId: string) => void;
}) => {
  const [likes, setLikes] = useState<Record<string, boolean>>(
    Object.fromEntries(events.map((e) => [e.id, true])),
  );

  if (!events.length) {
    return <EmptyTab message="No tienes eventos favoritos todavía" icon={CalendarDays} />;
  }

  return (
    <div className="space-y-4 pt-4">
      {events
        .filter((e) => likes[e.id] !== false)
        .map((e) => (
          <div key={e.id} className="rounded-2xl bg-card shadow-sm overflow-hidden">
            <div className="flex">
              <button
                type="button"
                onClick={() => onOpenEvent?.(e.id)}
                className="relative w-[120px] shrink-0 text-left"
              >
                {e.image ? (
                  <img src={e.image} alt={e.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full min-h-[100px] bg-muted" />
                )}
                {e.status && (
                  <span
                    className={`absolute top-2 left-2 text-[11px] font-semibold rounded-full px-2.5 py-1 ${statusStyle(e.status)}`}
                  >
                    {e.status}
                  </span>
                )}
              </button>
              <div className="flex-1 p-3 pr-2">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenEvent?.(e.id)}
                    className="text-left flex-1 min-w-0"
                  >
                    <h3 className="text-sm font-bold text-foreground leading-snug">{e.title}</h3>
                  </button>
                  <FavoriteHeartButton
                    liked={!!likes[e.id]}
                    onToggle={() => {
                      setLikes((p) => ({ ...p, [e.id]: !p[e.id] }));
                      if (likes[e.id]) onToggleEventFavorite?.(e.id);
                    }}
                  />
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">{e.date}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {e.location}
                </p>
                {e.description && (
                  <p className="mt-1.5 text-xs text-foreground leading-relaxed line-clamp-3">
                    {e.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
};

const PostsTab = ({ posts }: { posts: Post[] }) => {
  if (!posts.length) {
    return <EmptyTab message="No tienes publicaciones favoritas" icon={FileText} />;
  }
  return (
    <div className="space-y-4 pt-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

const PlacesTab = ({ places }: { places: FavPlaceItem[] }) => {
  if (!places.length) {
    return <EmptyTab message="No tienes lugares favoritos" icon={Building2} />;
  }
  return (
    <div className="space-y-3 pt-4">
      {places.map((place) => (
        <div key={place.id} className="rounded-2xl bg-card border border-border p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground">{place.name}</h3>
              {place.city && (
                <p className="mt-0.5 text-xs text-muted-foreground">{place.city}</p>
              )}
              {place.capacity != null && (
                <p className="mt-1 text-xs text-muted-foreground">Capacidad: {place.capacity}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const ProfilesTab = ({
  profiles,
  onViewProfile,
}: {
  profiles: ProfileListUser[];
  onViewProfile?: (user: ProfileListUser) => void;
}) => {
  if (!profiles.length) {
    return <EmptyTab message="No tienes perfiles favoritos" icon={User} />;
  }
  return (
    <div className="space-y-3 pt-4">
      {profiles.map((profile) => (
        <button
          key={profile.id}
          type="button"
          onClick={() => onViewProfile?.(profile)}
          className="flex w-full items-center gap-3 rounded-2xl bg-card border border-border p-3 text-left shadow-sm hover:bg-accent/30"
        >
          <Avatar className="h-11 w-11">
            {profile.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {profile.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground truncate">{profile.name}</p>
            <p className="text-xs text-muted-foreground">Perfil seguido</p>
          </div>
          <User className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      ))}
    </div>
  );
};

const FavoritesView = ({
  onBack,
  favoriteEvents = [],
  favoritePosts = [],
  favoritePlaces = [],
  favoriteProfiles = [],
  loading = false,
  onViewProfile,
  onToggleEventFavorite,
  onOpenEvent,
}: FavoritesViewProps) => (
  <div className="mx-auto max-w-lg min-h-screen bg-secondary pb-24">
    <div className="px-4 pt-4">
      <button onClick={onBack} className="flex items-center gap-1 text-foreground font-medium">
        <ChevronLeft className="h-5 w-5 text-primary" />
        Atrás
      </button>
      <h1 className="mt-2 text-2xl font-extrabold text-primary">Tus favoritos</h1>

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando favoritos…</p>
        </div>
      ) : (
      <Tabs defaultValue="eventos" className="mt-4">
        <TabsList className="w-full grid grid-cols-4 bg-transparent p-0 h-auto border-b border-border rounded-none gap-0">
          {[
            { v: 'eventos', l: 'Eventos' },
            { v: 'posts', l: 'Posts' },
            { v: 'lugares', l: 'Lugares' },
            { v: 'servicios', l: 'Servicios' },
          ].map((t) => (
            <TabsTrigger
              key={t.v}
              value={t.v}
              className="rounded-none bg-transparent text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary py-2.5"
            >
              {t.l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="eventos">
          <EventsTab
            events={favoriteEvents}
            onToggleEventFavorite={onToggleEventFavorite}
            onOpenEvent={onOpenEvent}
          />
        </TabsContent>
        <TabsContent value="posts">
          <PostsTab posts={favoritePosts} />
        </TabsContent>
        <TabsContent value="lugares">
          <PlacesTab places={favoritePlaces} />
        </TabsContent>
        <TabsContent value="servicios">
          <ProfilesTab profiles={favoriteProfiles} onViewProfile={onViewProfile} />
        </TabsContent>
      </Tabs>
      )}
    </div>
  </div>
);

export default FavoritesView;
