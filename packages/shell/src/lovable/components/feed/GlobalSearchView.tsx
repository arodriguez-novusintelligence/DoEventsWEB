import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  AlertCircle,
  Briefcase,
  Check,
  ChevronLeft,
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  UserPlus,
  X,
} from 'lucide-react';
import {
  EventSection,
  FeedPublication,
  fetchFollowersCount,
  fetchPendingFollowRequests,
  fetchSubscriptionStatus,
  fetchUserById,
  fetchUserChatRooms,
  followUser,
  unfollowUser,
  NearbyServiceProvider,
  NearbyVenue,
  PostCard,
  RootState,
  SearchUserResult,
  UserAvatar,
  canAccessAdminPanel,
  canMessageUser,
  clearSession,
  fetchSocialFeed,
  getDirectMessageBlockReason,
  getPersistedPlatformRole,
  getPersistedUserDisplayName,
  persistPlatformRole,
  resolveImageUrl,
  resolveEventIdFromFeedPublication,
  resolveUserDisplayName,
  searchEvents,
  searchServices,
  searchUsers,
  searchVenues,
  toUserFacingError,
  useToast,
} from '@doevents/shared';
import { Button } from '@lovable/components/ui/button';
import { cn } from '@lovable/lib/utils';
import SideMenu from './SideMenu';

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
  onNavigate?: (section: string) => void;
  onGoToTickets?: () => void;
  onGoToAdmin?: () => void;
  onLogout?: () => void;
  profileName?: string;
  profileUsername?: string;
  profileAvatar?: string;
  profileUserId?: string;
  unreadMessages?: number;
  isAdmin?: boolean;
}

export const GlobalSearchView = ({
  onBack,
  initialQuery = '',
  initialTab = 'users',
  onNavigate: onNavigateProp,
  onGoToTickets: onGoToTicketsProp,
  onGoToAdmin: onGoToAdminProp,
  onLogout: onLogoutProp,
  profileName: profileNameProp,
  profileUsername: profileUsernameProp,
  profileAvatar: profileAvatarProp,
  profileUserId: profileUserIdProp,
  unreadMessages: unreadMessagesProp,
  isAdmin: isAdminProp,
}: GlobalSearchViewProps) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUserId = useSelector((s: RootState) => s.auth.idUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileName, setProfileName] = useState(() => profileNameProp || getPersistedUserDisplayName());
  const [profileUsername, setProfileUsername] = useState(profileUsernameProp || '@usuario');
  const [profileAvatar, setProfileAvatar] = useState(profileAvatarProp);
  const [chatUnread, setChatUnread] = useState(unreadMessagesProp ?? 0);
  const [isAdmin, setIsAdmin] = useState(() => isAdminProp ?? canAccessAdminPanel(getPersistedPlatformRole()));
  const [query, setQuery] = useState(initialQuery);
  const [tab, setTab] = useState<SearchTab>(initialTab);
  const [loading, setLoading] = useState(false);
  const [eventResults, setEventResults] = useState<Awaited<ReturnType<typeof searchEvents>>['items']>([]);
  const [userResults, setUserResults] = useState<SearchUserResult[]>([]);
  const [postResults, setPostResults] = useState<FeedPublication[]>([]);
  const [venueResults, setVenueResults] = useState<NearbyVenue[]>([]);
  const [serviceResults, setServiceResults] = useState<NearbyServiceProvider[]>([]);
  const [followState, setFollowState] = useState<Record<string, FollowState>>({});
  const [userPrivacy, setUserPrivacy] = useState<Record<string, boolean>>({});
  const [messageBusy, setMessageBusy] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const currentTab = TABS.find((t) => t.key === tab) ?? TABS[0];

  useEffect(() => {
    if (profileNameProp) setProfileName(profileNameProp);
    if (profileUsernameProp) setProfileUsername(profileUsernameProp);
    if (profileAvatarProp !== undefined) setProfileAvatar(profileAvatarProp);
    if (unreadMessagesProp !== undefined) setChatUnread(unreadMessagesProp);
    if (isAdminProp !== undefined) setIsAdmin(isAdminProp);
  }, [profileNameProp, profileUsernameProp, profileAvatarProp, unreadMessagesProp, isAdminProp]);

  useEffect(() => {
    if (!currentUserId || profileNameProp) return;

    Promise.all([
      fetchUserById(currentUserId).catch(() => null),
      fetchSubscriptionStatus(currentUserId).catch(() => null),
    ]).then(([profile, subscription]) => {
      if (profile) {
        const name = resolveUserDisplayName(profile) || getPersistedUserDisplayName() || 'Usuario';
        setProfileName(name);
        setProfileUsername(profile.username ? `@${profile.username.replace(/^@/, '')}` : '@usuario');
        setProfileAvatar(profile.imagen || undefined);
      }
      const role = profile?.platformRole || subscription?.platformRole;
      if (role) persistPlatformRole(role);
      setIsAdmin(
        canAccessAdminPanel(profile?.platformRole)
          || canAccessAdminPanel(subscription?.platformRole),
      );
    }).catch(() => undefined);
  }, [currentUserId, profileNameProp]);

  useEffect(() => {
    if (!currentUserId || unreadMessagesProp !== undefined) return;
    fetchUserChatRooms(currentUserId)
      .then((rooms) => {
        const total = rooms.reduce((acc, room) => acc + (room.unreadCount || 0), 0);
        setChatUnread(total);
      })
      .catch(() => setChatUnread(0));
  }, [currentUserId, unreadMessagesProp]);

  const handleNavigate = (section: string) => {
    if (onNavigateProp) {
      onNavigateProp(section);
      return;
    }
    if (section.startsWith('user-')) {
      navigate(`/users/${section.slice(5)}`);
      return;
    }
    const routes: Record<string, string> = {
      feed: '/',
      wall: '/',
      mensajes: '/chat',
      'control-accesos': '/access',
      mapa: '/map',
      invitados: '/guests',
      perfil: '/profile',
      'ai-assistant': '/assistant',
    };
    const target = routes[section];
    if (target) navigate(target);
  };

  const handleGoToTickets = () => {
    if (onGoToTicketsProp) onGoToTicketsProp();
    else navigate('/purchases');
  };

  const handleGoToAdmin = () => {
    if (onGoToAdminProp) onGoToAdminProp();
    else navigate('/admin');
  };

  const handleLogout = () => {
    if (onLogoutProp) onLogoutProp();
    else {
      clearSession();
      navigate('/auth/login');
    }
  };

  const loadFollowStates = async (users: SearchUserResult[]) => {
    if (!currentUserId || !users.length) {
      setFollowState({});
      setUserPrivacy({});
      return;
    }
    try {
      const states: Record<string, FollowState> = {};
      const privacy: Record<string, boolean> = {};
      const pending = await fetchPendingFollowRequests(currentUserId).catch(() => []);
      const pendingIds = new Set(pending.map((r) => r.userId));
      await Promise.all(users.map(async (user) => {
        if (!user.id || user.id === currentUserId) return;
        if (pendingIds.has(user.id)) {
          states[user.id] = 'pending';
        } else {
          const info = await fetchFollowersCount(user.id, currentUserId).catch(() => ({
            count: 0,
            isFollowing: false,
          }));
          if (info.isFollowing) states[user.id] = 'following';
        }
        const profile = await fetchUserById(user.id).catch(() => null);
        privacy[user.id] = profile?.isPublicProfile !== false;
      }));
      setFollowState(states);
      setUserPrivacy(privacy);
    } catch {
      setFollowState({});
      setUserPrivacy({});
    }
  };

  const runSearch = async (term: string, activeTab: SearchTab) => {
    const q = term.trim();
    if (!q) {
      setHasSearched(false);
      setSearchError(null);
      setEventResults([]);
      setUserResults([]);
      setPostResults([]);
      setVenueResults([]);
      setServiceResults([]);
      return;
    }

    setLoading(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      if (activeTab === 'events') {
        const data = await searchEvents(q);
        setEventResults(data.items);
      } else if (activeTab === 'users') {
        const users = await searchUsers(q);
        setUserResults(users);
        void loadFollowStates(users);
      } else if (activeTab === 'venues') {
        const venues = await searchVenues(q);
        setVenueResults(venues);
      } else if (activeTab === 'services') {
        const services = await searchServices(q);
        setServiceResults(services);
      } else {
        const feed = await fetchSocialFeed(null, 60, {
          forceNetwork: true,
          userId: currentUserId || undefined,
        });
        const needle = q.toLowerCase();
        const filtered = (feed.items || []).filter((post) => {
          const haystack = [
            post.title,
            post.description,
            post.author?.name,
            post.locationLabel,
          ].filter(Boolean).join(' ').toLowerCase();
          return haystack.includes(needle);
        });
        setPostResults(filtered);
      }
    } catch (err) {
      const message = toUserFacingError(err, 'la búsqueda');
      setSearchError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      setHasSearched(false);
      setSearchError(null);
      return;
    }
    const timer = window.setTimeout(() => {
      void runSearch(query, tab);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [query, tab]);

  const handleBack = () => {
    onBack?.();
    navigate('/');
  };

  const navigateFromSearch = (path: string) => {
    onBack?.();
    navigate(path);
  };

  const openUserProfile = (targetUserId?: string) => {
    if (!targetUserId) return;
    if (targetUserId === currentUserId) {
      navigateFromSearch('/profile');
      return;
    }
    navigateFromSearch(`/users/${encodeURIComponent(targetUserId)}`);
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

    const currentState = followState[targetUserId] || 'idle';
    if (currentState === 'pending') {
      try {
        await unfollowUser(currentUserId, targetUserId);
        setFollowState((prev) => ({ ...prev, [targetUserId]: 'idle' }));
        showToast('Solicitud de seguimiento cancelada', 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'No se pudo cancelar la solicitud', 'error');
      }
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

  const handleMessage = async (targetUserId?: string) => {
    if (!currentUserId || !targetUserId) {
      showToast('Inicia sesión para enviar mensajes', 'error');
      return;
    }
    if (currentUserId === targetUserId) {
      showToast('No puedes enviarte mensajes a ti mismo', 'error');
      return;
    }

    const state = followState[targetUserId] || 'idle';
    let isPublic = userPrivacy[targetUserId];
    if (isPublic === undefined) {
      const profile = await fetchUserById(targetUserId).catch(() => null);
      isPublic = profile?.isPublicProfile !== false;
      setUserPrivacy((prev) => ({ ...prev, [targetUserId]: isPublic !== false }));
    }
    const isFollowing = state === 'following';
    const followPending = state === 'pending';
    const blockReason = getDirectMessageBlockReason({
      isPublicProfile: isPublic,
      isFollowing,
      followPending,
    });
    if (blockReason || !canMessageUser({ isPublicProfile: isPublic, isFollowing })) {
      showToast(blockReason || 'No puedes enviar mensajes a este usuario', 'error');
      return;
    }

    const returnTo = `/users/${encodeURIComponent(targetUserId)}`;
    navigateFromSearch(
      `/chat?peerId=${encodeURIComponent(targetUserId)}&returnTo=${encodeURIComponent(returnTo)}`,
    );
  };

  const openPostResult = (post: FeedPublication) => {
    const eventId = resolveEventIdFromFeedPublication(post);
    if (eventId) {
      navigateFromSearch(`/events/${eventId}`);
      return;
    }
    const serviceId = (post as { serviceId?: string }).serviceId
      || (post.metadata as { serviceId?: string } | undefined)?.serviceId;
    if (serviceId) {
      navigateFromSearch(`/services/${serviceId}`);
      return;
    }
    const venueId = (post as { venueId?: string }).venueId
      || (post.metadata as { venueId?: string } | undefined)?.venueId;
    if (venueId) {
      navigateFromSearch(`/places/${venueId}`);
      return;
    }
    const authorId = post.author?.id;
    if (authorId) {
      openUserProfile(authorId);
      return;
    }
    navigateFromSearch('/');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-secondary">
      <SideMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onNavigate={handleNavigate}
        onGoToTickets={handleGoToTickets}
        onGoToAdmin={handleGoToAdmin}
        onLogout={handleLogout}
        profileName={profileName}
        profileUsername={profileUsername}
        profileAvatar={profileAvatar}
        profileUserId={profileUserIdProp || currentUserId || undefined}
        unreadMessages={chatUnread}
        isAdmin={isAdmin}
      />
      <div className="mx-auto max-w-lg pb-28">
        <div className="rounded-b-3xl bg-gradient-to-br from-primary via-primary to-accent px-4 pb-10 pt-4">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15 text-primary-foreground backdrop-blur transition hover:bg-primary-foreground/25"
                aria-label="Abrir menú"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-primary-foreground transition hover:bg-primary-foreground/10"
              >
                <ChevronLeft className="h-4 w-4" /> Atrás
              </button>
            </div>
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
                      onEventClick={(id) => navigateFromSearch(`/events/${id}`)}
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
                          className="flex min-w-0 flex-1 items-center gap-3 text-left transition hover:opacity-90"
                          onClick={() => openUserProfile(userId)}
                          aria-label={`Ver perfil de ${displayName}`}
                        >
                          <UserAvatar
                            name={displayName}
                            imageUrl={user.avatarUrl || user.imagen}
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
                              variant={state === 'following' || state === 'pending' ? 'outline' : 'default'}
                              className="h-8 rounded-full text-xs"
                              onClick={() => handleFollow(userId)}
                              disabled={state === 'following'}
                              title={state === 'pending' ? 'Toca para cancelar la solicitud' : undefined}
                            >
                              {state === 'following' ? (
                                <>
                                  <Check className="mr-1 h-3.5 w-3.5" />
                                  Siguiendo
                                </>
                              ) : state === 'pending' ? (
                                <>
                                  <Clock className="mr-1 h-3.5 w-3.5" />
                                  Solicitado
                                </>
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

              {tab === 'venues' && (
                <>
                  {(!hasSearched || !query.trim()) && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Escribe el nombre, ciudad o tipo de lugar.
                    </p>
                  )}
                  {hasSearched && query.trim() && venueResults.map((venue) => (
                    <button
                      key={venue.venueId}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-sm transition hover:bg-accent/40"
                      onClick={() => navigateFromSearch(`/places/${venue.venueId}`)}
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {venue.mainImage ? (
                          <img
                            src={resolveImageUrl(venue.mainImage) || venue.mainImage}
                            alt={venue.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <MapPin className="h-6 w-6 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{venue.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[venue.type, venue.city].filter(Boolean).join(' · ') || venue.address || 'Lugar'}
                        </p>
                      </div>
                    </button>
                  ))}
                  {hasSearched && query.trim() && !venueResults.length && (
                    <div className="rounded-2xl bg-card py-10 text-center shadow-sm">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                        <MapPin className="h-7 w-7 text-primary" />
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">Sin lugares para «{query.trim()}»</p>
                    </div>
                  )}
                </>
              )}

              {tab === 'services' && (
                <>
                  {(!hasSearched || !query.trim()) && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Escribe un servicio, rol o categoría (ej: DJ, músico).
                    </p>
                  )}
                  {hasSearched && query.trim() && serviceResults.map((service) => (
                    <button
                      key={service.serviceId}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-sm transition hover:bg-accent/40"
                      onClick={() => navigateFromSearch(`/services/${service.serviceId}`)}
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {service.profileImageUrl ? (
                          <img
                            src={resolveImageUrl(service.profileImageUrl) || service.profileImageUrl}
                            alt={service.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Briefcase className="h-6 w-6 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {service.name || service.role || 'Servicio'}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[service.category || service.role, service.providerDisplayName || service.username]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                    </button>
                  ))}
                  {hasSearched && query.trim() && !serviceResults.length && (
                    <div className="rounded-2xl bg-card py-10 text-center shadow-sm">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                        <Briefcase className="h-7 w-7 text-primary" />
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">Sin servicios para «{query.trim()}»</p>
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
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={() => undefined}
                      onComment={() => openPostResult(post)}
                      onAuthorClick={() => {
                        const authorId = post.author?.id;
                        if (authorId) openUserProfile(authorId);
                      }}
                      onOpen={() => openPostResult(post)}
                    />
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
