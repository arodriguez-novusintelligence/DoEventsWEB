import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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

type SearchTab = 'events' | 'users' | 'posts';
type FollowState = 'idle' | 'pending' | 'following';

export const SearchEventsPage: React.FC = () => {
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

  const tabLabel = useMemo(() => ({
    events: 'Eventos',
    users: 'Usuarios',
    posts: 'Publicaciones',
  }), []);

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

  const handleMessage = async (targetUserId?: string) => {
    if (!currentUserId || !targetUserId) {
      showToast('Inicia sesión para enviar mensajes', 'error');
      return;
    }
    if (currentUserId === targetUserId) {
      showToast('No puedes enviarte mensajes a ti mismo', 'error');
      return;
    }
    setMessageBusy(targetUserId);
    try {
      navigate(`/chat?peerId=${encodeURIComponent(targetUserId)}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo abrir el chat', 'error');
    } finally {
      setMessageBusy(null);
    }
  };

  return (
    <div className="de-page-content de-search-page">
      <div className="de-safe-top" />
      <header className="de-page-topbar" style={{ padding: '12px 16px 0' }}>
        <button type="button" className="de-search-page__back" onClick={() => navigate(-1)}>
          ← Atrás
        </button>
      </header>

      <div className="de-search-input-wrap">
        <span aria-hidden="true">🔍</span>
        <input
          type="search"
          placeholder={tab === 'users' ? 'Buscar por nombre o usuario...' : 'Busca tu evento por nombre...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar"
        />
      </div>

      <div className="de-search-tabs" role="tablist">
        {(Object.keys(tabLabel) as SearchTab[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`de-search-tabs__btn${tab === key ? ' de-search-tabs__btn--active' : ''}`}
            onClick={() => setTab(key)}
          >
            {tabLabel[key]}
          </button>
        ))}
      </div>

      <button type="button" className="de-search-filters-btn" onClick={() => showToast('Filtros avanzados próximamente', 'success')}>
        <span aria-hidden="true">⏷</span> Filtros
      </button>

      {loading ? (
        <Loader />
      ) : tab === 'events' ? (
        <EventSection
          title={`Resultados (${eventResults.length})`}
          events={eventResults}
          onEventClick={(id) => navigate(`/events/${id}`)}
        />
      ) : tab === 'users' ? (
        <div>
          {userResults.map((user) => {
            const userId = user.id || '';
            const state = followState[userId] || 'idle';
            const displayName = user.name || user.username || user.email || 'Usuario';
            return (
              <div key={userId || user.email} className="de-search-user-card">
                <button type="button" className="de-search-user-card__profile" onClick={() => userId && navigate(`/users/${userId}`)}>
                  <UserAvatar name={displayName} imageUrl={user.imagen} size={44} />
                  <div className="de-search-user-card__info">
                    <strong>{displayName}</strong>
                    {user.username && <span>@{user.username}</span>}
                  </div>
                </button>
                {userId && userId !== currentUserId && (
                  <div className="de-search-user-card__actions">
                    <button
                      type="button"
                      className="de-search-user-card__message"
                      disabled={messageBusy === userId}
                      onClick={() => handleMessage(userId)}
                    >
                      {messageBusy === userId ? '…' : 'Mensaje'}
                    </button>
                    <button
                      type="button"
                      className={`de-search-user-card__follow${state === 'pending' ? ' de-search-user-card__follow--pending' : ''}`}
                      disabled={state === 'following' || state === 'pending'}
                      onClick={() => handleFollow(userId)}
                    >
                      {state === 'following' ? 'Siguiendo' : state === 'pending' ? 'Pendiente' : 'Seguir'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="de-wall-main">
          {postResults.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={() => undefined}
              onComment={() => undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchEventsPage;
