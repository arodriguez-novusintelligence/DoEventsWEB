import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft, Search, UserPlus, Check, MessageCircle, AlertCircle, Loader2, RefreshCw, X } from 'lucide-react';
import {
  EventSection,
  FeedPublication,
  fetchFollowersCount,
  fetchPendingFollowRequests,
  followUser,
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
import { cn } from '@lovable/lib/utils';

type SearchTab = 'events' | 'users' | 'posts' | 'venues' | 'services';
type FollowState = 'idle' | 'pending' | 'following';

const TABS: { key: SearchTab; label: string; placeholder: string }[] = [
  { key: 'events', label: 'Eventos', placeholder: 'Busca tu evento por nombre...' },
  { key: 'venues', label: 'Lugares', placeholder: 'Buscar lugar por nombre...' },
  { key: 'services', label: 'Servicios', placeholder: 'Buscar servicio (ej: DJ, mesero)...' },
  { key: 'users', label: 'Usuarios', placeholder: 'Busca usuario por @ o nombre...' },
  { key: 'posts', label: 'Publicaciones', placeholder: 'Buscar publicación...' },
];

interface GlobalSearchViewProps {
  onBack?: () => void;
  initialQuery?: string;
  initialTab?: SearchTab;
}

export const GlobalSearchView = ({
  onBack,
  initialQuery = '',
  initialTab = 'users',
}: GlobalSearchViewProps) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUserId = useSelector((s: RootState) => s.auth.idUser);
  const [query, setQuery] = useState(initialQuery);
  const [tab, setTab] = useState<SearchTab>(initialTab);
  const [loading, setLoading] = useState(false);
  const [eventResults, setEventResults] = useState<Awaited<ReturnType<typeof searchEvents>>['items']>([]);
  const [userResults, setUserResults] = useState<SearchUserResult[]>([]);
  const [postResults, setPostResults] = useState<FeedPublication[]>([]);
  const [followState, setFollowState] = useState<Record<string, FollowState>>({});
  const [messageBusy, setMessageBusy] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const currentTab = TABS.find((t) => t.key === tab) ?? TABS[0];

  const runSearch = async (term: string, activeTab: SearchTab) => {
    if (activeTab === 'venues' || activeTab === 'services') {
      setHasSearched(Boolean(term.trim()));
      return;
    }
    if (!term.trim()) {
      showToast('Escribe un término de búsqueda', 'error');
      return;
    }
    setLoading(true);
    setSearchError(null);
    setHasSearched(true);
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
      const message = err instanceof Error ? err.message : 'Error en la búsqueda';
      setSearchError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!query.trim()) return;
    if (tab === 'venues' || tab === 'services') {
      setHasSearched(true);
      return;
    }
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-secondary">
      <div className="mx-auto max-w-lg pb-28">
        <div className="rounded-b-3xl bg-gradient-to-br from-primary via-primary to-accent px-4 pb-10 pt-4">
          <div className="mx-auto max-w-2xl">
            <button
              type="button"
              onClick={handleBack}
              className="-ml-2 flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-primary-foreground transition hover:bg-primary-foreground/10"
            >
              <ChevronLeft className="h-4 w-4" /> Atrás
            </button>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur">
                <Search className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold leading-tight text-primary-foreground">Buscador</h1>
                <p className="text-[11px] text-primary-foreground/80">
                  Eventos, usuarios, publicaciones, lugares y servicios
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={currentTab.placeholder}
              aria-label="Buscar"
              className="w-full rounded-xl border border-border bg-card py-3 pl-9 pr-9 text-sm shadow-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="-mx-1 mt-3 flex flex-wrap gap-2 px-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition',
                  tab === t.key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-primary',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Buscando…</p>
            </div>
          ) : searchError ? (
            <div className="mt-4 rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
              <p className="mt-3 text-sm text-destructive">{searchError}</p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 rounded-full"
                onClick={() => void runSearch(query, tab)}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {tab === 'posts' && (
                <div className="flex flex-col gap-2 rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-warning" />
                    <span>
                      La búsqueda de publicaciones filtra resultados recientes del feed.
                      Un endpoint dedicado de búsqueda full-text está pendiente en backend.
                    </span>
                  </div>
                  <span className="inline-block self-start rounded-full bg-warning/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-warning">
                    Backend requerido
                  </span>
                </div>
              )}

              {(tab === 'venues' || tab === 'services') && (
                <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                    <Search className="h-7 w-7 text-primary" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    Búsqueda de {tab === 'venues' ? 'lugares' : 'servicios'} próximamente
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Esta pestaña replica el diseño Lovable. El endpoint de búsqueda en DoEventsBack
                    aún no está disponible.
                  </p>
                </div>
              )}

              {tab === 'events' && (
                <>
                  {!hasSearched || !query.trim() ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Escribe para buscar eventos por nombre, ciudad o categoría.
                    </p>
                  ) : eventResults.length === 0 ? (
                    <div className="rounded-2xl bg-card py-10 text-center shadow-sm">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                        <Search className="h-7 w-7 text-primary" />
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">Sin eventos para «{query.trim()}»</p>
                    </div>
                  ) : (
                    <EventSection
                      title={`Resultados (${eventResults.length})`}
                      events={eventResults}
                      onEventClick={(id) => navigate(`/events/${id}`)}
                    />
                  )}
                </>
              )}

              {tab === 'users' && (
                <>
                  {(!hasSearched || !query.trim()) && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Escribe un nombre o usuario para encontrar personas.
                    </p>
                  )}
                  {hasSearched && query.trim() && userResults.map((user) => {
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
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
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
                  {hasSearched && query.trim() && !userResults.length && (
                    <div className="rounded-2xl bg-card py-10 text-center shadow-sm">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                        <Search className="h-7 w-7 text-primary" />
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">Sin usuarios para «{query.trim()}»</p>
                    </div>
                  )}
                </>
              )}

              {tab === 'posts' && (
                <>
                  {(!hasSearched || !query.trim()) && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Escribe palabras clave para buscar en publicaciones recientes.
                    </p>
                  )}
                  {hasSearched && query.trim() && postResults.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                  {hasSearched && query.trim() && !postResults.length && (
                    <div className="rounded-2xl bg-card py-10 text-center shadow-sm">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                        <Search className="h-7 w-7 text-primary" />
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">Sin publicaciones para «{query.trim()}»</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchView;
