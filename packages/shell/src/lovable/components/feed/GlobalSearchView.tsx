import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft, Search, UserPlus, Check, MessageCircle } from 'lucide-react';
import {
  EventSection,
  FeedPublication,
  fetchFollowersCount,
  fetchPendingFollowRequests,
  followUser,
  Loader,
  PostCard,
  RootState,
  SearchUserResult,
  UserAvatar,
  fetchSocialFeed,
  searchEvents,
  searchUsers,
  useToast,
} from '@doevents/shared';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lovable/components/ui/tabs';

type SearchTab = 'events' | 'users' | 'posts';
type FollowState = 'idle' | 'pending' | 'following';

interface GlobalSearchViewProps {
  onBack?: () => void;
}

export const GlobalSearchView = ({ onBack }: GlobalSearchViewProps) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUserId = useSelector((s: RootState) => s.auth.idUser);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<SearchTab>('users');
  const [loading, setLoading] = useState(false);
  const [eventResults, setEventResults] = useState<Awaited<ReturnType<typeof searchEvents>>['items']>([]);
  const [userResults, setUserResults] = useState<SearchUserResult[]>([]);
  const [postResults, setPostResults] = useState<FeedPublication[]>([]);
  const [followState, setFollowState] = useState<Record<string, FollowState>>({});
  const [messageBusy, setMessageBusy] = useState<string | null>(null);

  const tabLabel = useMemo(() => ({
    events: 'Eventos',
    users: 'Usuarios',
    posts: 'Publicaciones',
  }), []);

  const runSearch = async (term: string, activeTab: SearchTab) => {
    if (!term.trim()) {
      showToast('Escribe un término de búsqueda', 'error');
      return;
    }
    setLoading(true);
    try {
      if (activeTab === 'events') {
        const data = await searchEvents(term.trim());
        setEventResults(data.items);
        if (!data.items.length) showToast('No se encontraron eventos', 'success');
      } else if (activeTab === 'users') {
        const users = await searchUsers(term.trim());
        setUserResults(users);
        if (currentUserId) {
          const states: Record<string, FollowState> = {};
          const pending = await fetchPendingFollowRequests(currentUserId).catch(() => []);
          const pendingIds = new Set(pending.map((r) => r.userId));
          await Promise.all(users.map(async (user) => {
            if (!user.id || user.id === currentUserId) return;
            if (pendingIds.has(user.id)) {
              states[user.id] = 'pending';
              return;
            }
            const info = await fetchFollowersCount(user.id, currentUserId);
            if (info.isFollowing) states[user.id] = 'following';
          }));
          setFollowState(states);
        }
        if (!users.length) showToast('No se encontraron usuarios', 'success');
      } else {
        const feed = await fetchSocialFeed(null, 40);
        const q = term.trim().toLowerCase();
        const filtered = (feed.items || []).filter((post) => {
          const haystack = [
            post.title,
            post.description,
            post.author?.name,
          ].filter(Boolean).join(' ').toLowerCase();
          return haystack.includes(q);
        });
        setPostResults(filtered);
        if (!filtered.length) showToast('No se encontraron publicaciones', 'success');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error en la búsqueda', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!query.trim()) return;
    const timer = window.setTimeout(() => {
      runSearch(query, tab);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [query, tab]);

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  const handleFollow = async (targetUserId?: string) => {
    if (!currentUserId || !targetUserId) {
      showToast('Inicia sesión para seguir usuarios', 'error');
      return;
    }
    if (currentUserId === targetUserId) {
      showToast('No puedes seguirte a ti mismo', 'error');
      return;
    }
    try {
      const result = await followUser(currentUserId, targetUserId);
      const nextState: FollowState = result.status === 'pending' ? 'pending' : 'following';
      setFollowState((prev) => ({ ...prev, [targetUserId]: nextState }));
      showToast(
        result.message || (nextState === 'pending'
          ? 'Solicitud de seguimiento enviada'
          : 'Ahora sigues a este usuario'),
        'success',
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo seguir al usuario', 'error');
    }
  };

  const handleMessage = (targetUserId?: string) => {
    if (!currentUserId || !targetUserId) {
      showToast('Inicia sesión para enviar mensajes', 'error');
      return;
    }
    setMessageBusy(targetUserId);
    navigate(`/chat?peerId=${encodeURIComponent(targetUserId)}`);
    setMessageBusy(null);
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-24">
      <div className="sticky top-0 z-20 border-b border-border bg-background px-4 py-3">
        <button
          type="button"
          onClick={handleBack}
          className="mb-3 flex items-center gap-1 text-sm font-medium text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
          Atrás
        </button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={tab === 'users' ? 'Buscar por nombre o usuario…' : 'Busca eventos, usuarios o posts…'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 rounded-full"
            aria-label="Buscar"
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as SearchTab)} className="px-4 pt-3">
        <TabsList className="grid w-full grid-cols-3">
          {(Object.keys(tabLabel) as SearchTab[]).map((key) => (
            <TabsTrigger key={key} value={key} className="text-xs">
              {tabLabel[key]}
            </TabsTrigger>
          ))}
        </TabsList>

        {loading ? (
          <div className="py-12">
            <Loader />
          </div>
        ) : (
          <>
            <TabsContent value="events" className="mt-4">
              <EventSection
                title={`Resultados (${eventResults.length})`}
                events={eventResults}
                onEventClick={(id) => navigate(`/events/${id}`)}
              />
            </TabsContent>

            <TabsContent value="users" className="mt-4 space-y-2">
              {userResults.map((user) => {
                const userId = user.id || '';
                const state = followState[userId] || 'idle';
                const displayName = user.name || user.username || user.email || 'Usuario';
                return (
                  <div
                    key={userId || user.email}
                    className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm"
                  >
                    <button
                      type="button"
                      className="flex flex-1 min-w-0 items-center gap-3 text-left"
                      onClick={() => userId && navigate(`/users/${userId}`)}
                    >
                      <UserAvatar
                        name={displayName}
                        imageUrl={user.avatarUrl}
                        size={44}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{displayName}</p>
                        {user.username && (
                          <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                        )}
                      </div>
                    </button>
                    {userId && userId !== currentUserId && (
                      <div className="flex shrink-0 gap-1">
                        <Button
                          size="sm"
                          variant={state === 'following' ? 'outline' : 'default'}
                          className="h-8 rounded-full text-xs"
                          onClick={() => handleFollow(userId)}
                          disabled={state === 'following' || state === 'pending'}
                        >
                          {state === 'following' ? (
                            <>
                              <Check className="mr-1 h-3.5 w-3.5" />
                              Siguiendo
                            </>
                          ) : state === 'pending' ? (
                            'Pendiente'
                          ) : (
                            <>
                              <UserPlus className="mr-1 h-3.5 w-3.5" />
                              Seguir
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-full text-xs"
                          onClick={() => handleMessage(userId)}
                          disabled={messageBusy === userId}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
              {!userResults.length && query.trim() && (
                <p className="py-8 text-center text-sm text-muted-foreground">Sin resultados</p>
              )}
            </TabsContent>

            <TabsContent value="posts" className="mt-4 space-y-3">
              {postResults.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {!postResults.length && query.trim() && (
                <p className="py-8 text-center text-sm text-muted-foreground">Sin publicaciones</p>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default GlobalSearchView;
