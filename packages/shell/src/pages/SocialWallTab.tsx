import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';

import { useSelector } from 'react-redux';

import {

  fetchEventsFeed,

  fetchNearbyEvents,

  getPreferences,

  getStoredUserLocation,

  Loader,

  RootState,

  resolveUserLocation,

  StoredUserLocation,

  buildSocialFeedCacheKey,

  createPublication,

  createPublicationComment,

  reportPublicationComment,

  deletePublication,

  fetchPublicationComments,

  fetchSocialFeed,

  enrichFeedEventsWithOrganizers,
  EVENTS_CACHE_INVALIDATED_EVENT,
  fetchUserById,
  getCachedProfiles,
  resolveImageUrl,

  getCachedSocialFeed,

  getCachedSocialFeedEntry,

  invalidateSocialFeedCache,

  isFresh,

  repostPublication,

  searchUsers,

  sharePublication,

  togglePublicationLike,

  updatePublication,

  useToast,

  FeedPublication,

  FeedHomeResponse,

  FeedPublishRedirectState,

  type Post,

  followUser,
  likeEvent,
  toggleEventLike,
  invalidateDiscoverCache,
  resolveEventIdFromFeedPublication,
  resolvePublicationDetailPath,
  EVENT_FAVORITE_CHANGED_EVENT,
  dispatchEventFavoriteChanged,
  applyEventFavoriteToPublications,
  type EventFavoriteChangedDetail,

  FeedEventItem,
  matchesEventCategory,
  buildEventCategoryMapForFeed,
  matchesPublicationCategory,

  mapDiscoverEventBadge,

} from '@doevents/shared';

import FeedHero from '@lovable/components/feed/FeedHero';
import FeedBanner from '@lovable/components/feed/FeedBanner';
import { useKyc } from '@lovable/contexts/KycContext';
import FeedVenuesCarousel from '@lovable/components/feed/FeedVenuesCarousel';
import { ReportPostDialog } from '@lovable/components/feed/ReportPostDialog';
import { ChangeLocationSheet } from '@lovable/components/feed/ChangeLocationSheet';
import { useNearbyVenues } from '../lovable-bridge/useNearbyVenues';
import { CreatePostSheet } from '@doevents/shared';
import { LovablePostCardBridge } from '../lovable-bridge/LovablePostCardBridge';
import { LovableCommentsBridge } from '../lovable-bridge/LovableCommentsBridge';
import { feedPublicationToLovablePost } from '../lovable-bridge/feedAdapter';
import { filterAndSortMyPublishedEvents } from '../lovable-bridge/discoverEventFilters';
import EditPostSheet from '@lovable/components/feed/EditPostSheet';
import RepostSheet from '@lovable/components/feed/RepostSheet';
import { useFeedStories } from '../lovable-bridge/useFeedStories';
import { useActiveStoryAuthors } from '../contexts/StoriesContext';
import { CreateStorySheet } from '../components/CreateStorySheet';
import { StoryViewer } from '@lovable/components/feed/StoryViewer';



const PAGE_SIZE = 15;

function applyFeedState(

  data: FeedHomeResponse,

  setPosts: React.Dispatch<React.SetStateAction<FeedPublication[]>>,

  setCursor: React.Dispatch<React.SetStateAction<string | null>>,

  setHasMore: React.Dispatch<React.SetStateAction<boolean>>,

  append = false,

) {

  setPosts((prev) => (append ? [...prev, ...(data.items || [])] : (data.items || [])));

  setCursor(data.nextCursor || null);

  setHasMore(Boolean(data.hasMore));

}

function filterByPreferences(items: FeedEventItem[], preferenceNames: string[]): FeedEventItem[] {
  if (!preferenceNames.length) return items;
  const preferred = items.filter((event) => {
    const categoria = ((event as { Categoria?: string }).Categoria || event.nombre || '').toLowerCase();
    return preferenceNames.some((pref) => categoria.includes(pref) || pref.includes(categoria));
  });
  return preferred.length ? preferred : items;
}



export const SocialWallTab: React.FC = () => {

  const navigate = useNavigate();
  const location = useLocation();

  const { showToast } = useToast();

  const userId = useSelector((s: RootState) => s.auth.idUser);
  const { isCertified, loading: kycLoading } = useKyc();

  const storedLocation = getStoredUserLocation();
  const cacheKey = useMemo(
    () => buildSocialFeedCacheKey(userId, null, PAGE_SIZE, storedLocation),
    [userId, storedLocation?.lat, storedLocation?.lng],
  );

  const cachedFeed = useMemo(() => getCachedSocialFeed(cacheKey, true), [cacheKey]);



  const [loading, setLoading] = useState(() => !(cachedFeed?.items?.length));

  const [refreshing, setRefreshing] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);

  const [posts, setPosts] = useState<FeedPublication[]>(() => cachedFeed?.items || []);

  const [cursor, setCursor] = useState<string | null>(() => cachedFeed?.nextCursor || null);

  const [hasMore, setHasMore] = useState(() => Boolean(cachedFeed?.hasMore));

  const [showCreate, setShowCreate] = useState(false);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [recommendedEvents, setRecommendedEvents] = useState<FeedEventItem[]>([]);
  const [trendingPool, setTrendingPool] = useState<FeedEventItem[]>([]);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [profileCity, setProfileCity] = useState<string | undefined>();
  const [profileAvatar, setProfileAvatar] = useState<string | undefined>();
  const [profileName, setProfileName] = useState<string | undefined>();
  const [hiddenPosts, setHiddenPosts] = useState<Set<string>>(new Set());
  const [feedError, setFeedError] = useState<string | null>(null);
  const [selectedFeedCategories, setSelectedFeedCategories] = useState<string[]>([]);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [storyViewerUserId, setStoryViewerUserId] = useState<string | null>(null);
  const [storiesRefreshKey, setStoriesRefreshKey] = useState(0);
  const [editingPost, setEditingPost] = useState<FeedPublication | null>(null);
  const [repostingPost, setRepostingPost] = useState<FeedPublication | null>(null);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const recentLocalPostIds = useRef<Set<string>>(new Set());

  const { refreshStories } = useActiveStoryAuthors();
  const { stories: feedStories, loading: storiesLoading } = useFeedStories(
    storiesRefreshKey,
    userId,
    profileName,
    profileAvatar,
  );
  const { venues: nearbyVenues, loading: nearbyVenuesLoading } = useNearbyVenues();

  const loadFeed = useCallback(async (nextCursor?: string | null, forceNetwork = false) => {

    const data = await fetchSocialFeed(nextCursor, PAGE_SIZE, {
      userId,
      location: getStoredUserLocation(),
      forceNetwork: forceNetwork || Boolean(nextCursor),
    });

    if (nextCursor) {
      applyFeedState(data, setPosts, setCursor, setHasMore, true);
    } else {
      setPosts((prev) => {
        const incoming = data.items || [];
        const incomingIds = new Set(incoming.map((p) => p.id));
        const preserved = prev.filter(
          (p) => recentLocalPostIds.current.has(p.id) && !incomingIds.has(p.id),
        );
        return [...preserved, ...incoming];
      });
      setCursor(data.nextCursor || null);
      setHasMore(Boolean(data.hasMore));
    }

    return data;

  }, [userId]);

  const loadRecommended = useCallback(async (location?: StoredUserLocation | null) => {
    const stored = location ?? getStoredUserLocation();
    try {
      const [feed, prefsResult] = await Promise.all([
        fetchEventsFeed(userId, 0, 40, { forceNetwork: true }),
        getPreferences().catch(() => ({ data: [] })),
      ]);
      const preferenceNames = (prefsResult.data || []).map((p) => p.name.toLowerCase());
      let items = feed.items || [];

      if (stored) {
        const nearby = await fetchNearbyEvents(stored.lat, stored.lng, 100, userId || undefined, 30);
        if (nearby.length) {
          items = nearby;
        }
      }

      items = filterByPreferences(items, preferenceNames);
      items = filterAndSortMyPublishedEvents(items);
      const enriched = await enrichFeedEventsWithOrganizers(items.slice(0, 12));
      const enrichedPool = await enrichFeedEventsWithOrganizers(items.slice(0, 40));
      setRecommendedEvents(enriched);
      setTrendingPool(enrichedPool);
    } catch {
      setRecommendedEvents([]);
      setTrendingPool([]);
    }
  }, [userId]);

  const handleLocationResolved = useCallback((location: StoredUserLocation) => {
    setLocationLabel(location.label || location.city || null);
    loadRecommended(location);
  }, [loadRecommended]);



  useEffect(() => {

    let cancelled = false;

    const entry = getCachedSocialFeedEntry(cacheKey, true);



    if (entry?.data?.items?.length) {

      applyFeedState(entry.data, setPosts, setCursor, setHasMore);

      setLoading(false);

    } else {

      setLoading(true);

    }



    const needsNetwork = !entry || !isFresh(entry.cachedAt);

    if (needsNetwork) setRefreshing(Boolean(entry?.data?.items?.length));



    loadFeed(null, needsNetwork)
      .then(() => {
        if (!cancelled) setFeedError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'No se pudo cargar el muro social';
        setFeedError(message);
        if (!entry?.data?.items?.length) {
          invalidateSocialFeedCache();
          showToast(message, 'error');
        }
      })

      .finally(() => {

        if (!cancelled) {

          setLoading(false);

          setRefreshing(false);

        }

      });



    return () => { cancelled = true; };

  }, [cacheKey, loadFeed, showToast]);



  useEffect(() => {

    const openCreate = () => setShowCreate(true);

    window.addEventListener('de-open-create-post', openCreate);

    return () => window.removeEventListener('de-open-create-post', openCreate);

  }, []);

  useEffect(() => {
    const onCacheInvalidated = () => {
      void loadFeed(null, true);
      void loadRecommended(getStoredUserLocation());
    };
    window.addEventListener(EVENTS_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    return () => window.removeEventListener(EVENTS_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
  }, [loadFeed, loadRecommended]);

  useEffect(() => {
    const onEventFavoriteChanged = (event: Event) => {
      const detail = (event as CustomEvent<EventFavoriteChangedDetail>).detail;
      if (!detail?.eventId || detail.liked === undefined) return;
      setPosts((prev) => applyEventFavoriteToPublications(
        prev,
        detail.eventId,
        detail.liked,
        detail.previousLiked,
      ));
    };
    window.addEventListener(EVENT_FAVORITE_CHANGED_EVENT, onEventFavoriteChanged);
    return () => window.removeEventListener(EVENT_FAVORITE_CHANGED_EVENT, onEventFavoriteChanged);
  }, []);

  useEffect(() => {
    const state = location.state as FeedPublishRedirectState | null;
    if (!state?.feedRefresh) return;

    if (state.feedHighlightId) {
      recentLocalPostIds.current.add(state.feedHighlightId);
    }

    let cancelled = false;
    void loadFeed(null, true)
      .then(() => {
        if (!cancelled) void loadRecommended(getStoredUserLocation());
      })
      .finally(() => {
        navigate(location.pathname, { replace: true, state: {} });
      });

    return () => { cancelled = true; };
  }, [location.state, location.pathname, loadFeed, loadRecommended, navigate]);

  useEffect(() => {
    if (!userId) return;
    fetchUserById(userId).then((profile) => {
      if (profile?.ciudad) {
        setProfileCity(profile.ciudad);
        setLocationLabel((current) => current || profile.ciudad || null);
      }
      if (profile?.imagen) setProfileAvatar(resolveImageUrl(profile.imagen));
      const name = [profile?.nombre, profile?.apellido].filter(Boolean).join(' ').trim();
      if (name) setProfileName(name);
    }).catch(() => undefined);
  }, [userId]);

  useEffect(() => {
    const stored = getStoredUserLocation();
    if (stored?.label || stored?.city) {
      setLocationLabel(stored.label || stored.city || null);
      loadRecommended(stored);
      return;
    }
    resolveUserLocation({ prompt: false, profileCity }).then((resolved) => {
      if (resolved) {
        setLocationLabel(resolved.label || resolved.city || null);
        loadRecommended(resolved);
      } else {
        loadRecommended(null);
      }
    });
  }, [loadRecommended, profileCity]);

  const enrichedAuthorsRef = useRef(new Set<string>());

  useEffect(() => {
    const authorIds = [...new Set(
      posts
        .filter((post) => post.author?.id && !post.author.avatarUrl)
        .map((post) => post.author.id)
        .filter((id) => !enrichedAuthorsRef.current.has(id)),
    )];

    if (!authorIds.length) return;

    let cancelled = false;

    getCachedProfiles(authorIds)
      .then((profileMap) => {
        if (cancelled) return;

        authorIds.forEach((id) => enrichedAuthorsRef.current.add(id));

        setPosts((prev) => prev.map((post) => {
          const profile = profileMap.get(post.author?.id || '');
          if (!profile?.imagen || post.author?.avatarUrl) return post;

          const fullName = [profile.nombre, profile.apellido].filter(Boolean).join(' ').trim();
          return {
            ...post,
            author: {
              ...post.author,
              name: fullName || post.author.name,
              avatarUrl: resolveImageUrl(profile.imagen) || profile.imagen,
            },
          };
        }));
      })
      .catch(() => undefined);

    return () => { cancelled = true; };
  }, [posts]);

  const filteredRecommendedEvents = useMemo(
    () => recommendedEvents.filter((ev) => matchesEventCategory(ev, selectedFeedCategories)),
    [recommendedEvents, selectedFeedCategories],
  );

  const filteredTrendingPool = useMemo(
    () => trendingPool.filter((ev) => matchesEventCategory(ev, selectedFeedCategories)),
    [trendingPool, selectedFeedCategories],
  );

  const filteredPosts = useMemo(
    () => {
      const eventCategoryMap = buildEventCategoryMapForFeed(
        posts,
        [...recommendedEvents, ...trendingPool],
      );
      return posts
        .filter((p) => p.type !== 'story')
        .filter((p) => p.listItemType !== 'services-section')
        .filter((p) => !hiddenPosts.has(p.id))
        .filter((p) => {
          if (p.type !== 'event') return true;
          const status = String(p.metadata?.estatus || p.metadata?.status || '').toLowerCase();
          const badge = mapDiscoverEventBadge({
            estatus: status,
            fechaIni: String(p.metadata?.fechaIni || ''),
            fechaFin: String(p.metadata?.fechaFin || ''),
          });
          return badge !== 'borrador' && badge !== 'inactivo';
        })
        .filter((p) => matchesPublicationCategory(p, selectedFeedCategories, eventCategoryMap));
    },
    [posts, hiddenPosts, selectedFeedCategories, recommendedEvents, trendingPool],
  );

  const handleFollow = useCallback(async (post: FeedPublication) => {
    if (!userId || !post.author?.id) {
      showToast('Inicia sesión para seguir usuarios', 'error');
      return;
    }
    if (post.author.id === userId) return;
    try {
      const result = await followUser(userId, post.author.id);
      setPosts((prev) => prev.map((item) => (
        item.id === post.id
          ? { ...item, author: { ...item.author, isFollowing: true } }
          : item
      )));
      showToast(result.message || `Siguiendo a ${post.author?.name || 'usuario'}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo seguir al usuario', 'error');
    }
  }, [showToast, userId]);

  const openUserProfile = useCallback((targetUserId: string) => {
    if (!targetUserId) return;
    if (targetUserId === userId) {
      navigate('/profile');
      return;
    }
    navigate(`/users/${targetUserId}`);
  }, [navigate, userId]);

  const handleLike = async (post: FeedPublication) => {
    const liked = !post.viewerState?.liked;
    const previousLiked = Boolean(post.viewerState?.liked);
    const currentLikes = Number(post.stats?.likes ?? 0);
    const optimisticLikes = liked
      ? currentLikes + (previousLiked ? 0 : 1)
      : Math.max(0, currentLikes - (previousLiked ? 1 : 0));

    setPosts((prev) => prev.map((item) => (
      item.id === post.id
        ? {
            ...item,
            viewerState: { ...item.viewerState, liked },
            stats: { ...item.stats, likes: optimisticLikes },
          }
        : item
    )));

    try {
      const result = await togglePublicationLike(post.id, liked);

      setPosts((prev) => prev.map((item) => (
        item.id === post.id
          ? {
              ...item,
              viewerState: { ...item.viewerState, liked: result.viewerState?.liked ?? liked },
              stats: {
                ...item.stats,
                likes: result.stats?.likes ?? optimisticLikes,
              },
            }
          : item
      )));

      const eventId = resolveEventIdFromFeedPublication(post);
      if (eventId && userId && (post.type === 'event' || eventId)) {
        try {
          await toggleEventLike(userId, eventId, liked);
          invalidateDiscoverCache();
          dispatchEventFavoriteChanged(eventId, liked, previousLiked);
        } catch {
          // favorito de evento opcional si falla backend
        }
      }
    } catch (err) {
      setPosts((prev) => prev.map((item) => (
        item.id === post.id
          ? {
              ...item,
              viewerState: { ...item.viewerState, liked: previousLiked },
              stats: { ...item.stats, likes: currentLikes },
            }
          : item
      )));
      showToast(err instanceof Error ? err.message : 'Error al dar like', 'error');
    }
  };



  const handleCreate = async (data: {
    title: string;
    description: string;
    mediaIds?: string[];
    visibility?: string;
    locationLabel?: string;
    latitude?: number;
    longitude?: number;
    type?: string;
    mentions?: import('@doevents/shared').FeedMention[];
  }) => {
    const publication = await createPublication({
      title: data.title,
      description: data.description,
      mediaIds: data.mediaIds,
      visibility: data.visibility,
      locationLabel: data.locationLabel,
      latitude: data.latitude,
      longitude: data.longitude,
      type: 'post',
      mentions: data.mentions,
    });
    recentLocalPostIds.current.add(publication.id);
    setPosts((prev) => [publication, ...prev.filter((p) => p.id !== publication.id)]);
    void loadFeed(null, true);
    showToast('Publicación promocionada en el Feed', 'success');
  };



  const handlePublishRepost = async (
    repostData: Omit<Post, 'id' | 'likes' | 'comments' | 'reposts'>,
  ) => {
    if (!repostingPost) return;
    try {
      const result = await repostPublication(repostingPost.id, {
        opinion: repostData.description,
        title: repostData.title,
        visibility: repostData.visibility === 'private' ? 'PRIVATE' : 'PUBLIC',
      });
      recentLocalPostIds.current.add(result.repostPublication.id);
      setPosts((prev) => {
        const updatedSource = result.sourcePublication
          ? prev.map((p) => (p.id === repostingPost.id ? result.sourcePublication! : p))
          : prev.map((p) => (
            p.id === repostingPost.id
              ? {
                ...p,
                viewerState: { ...p.viewerState, reposted: true },
                stats: { ...p.stats, reposts: (p.stats?.reposts || 0) + 1 },
              }
              : p
          ));
        return [result.repostPublication, ...updatedSource.filter((p) => p.id !== result.repostPublication.id)];
      });
      void loadFeed(null, true);
      setRepostingPost(null);
      showToast('Publicación reposteada', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al repostear', 'error');
    }
  };



  const handleRepost = (post: FeedPublication) => {

    if (post.viewerState?.reposted) {

      showToast('Ya reposteaste esta publicación', 'error');

      return;

    }

    setRepostingPost(post);

  };



  const handleEditSave = async (
    postId: string,
    updates: { title: string; description: string; location: string; images: string[] },
  ) => {
    try {
      const updated = await updatePublication(postId, {
        title: updates.title,
        description: updates.description,
        locationLabel: updates.location,
      });
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      setEditingPost(null);
      showToast('Publicación actualizada', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al editar', 'error');
    }
  };



  const handleMentionClick = useCallback(async (mention: string) => {
    const normalized = mention.toLowerCase().replace(/\s+/g, '');
    try {
      const users = await searchUsers(mention);
      const match = users.find((u) => {
        const username = (u.username || u.user || '').toLowerCase().replace(/^@/, '');
        const name = (u.name || '').toLowerCase().replace(/\s+/g, '');
        return username === normalized || name === normalized || name.includes(normalized);
      });
      if (match?.id) {
        navigate(`/users/${match.id}`);
        return;
      }
      showToast('Usuario no encontrado', 'error');
    } catch {
      showToast('No se pudo abrir el perfil', 'error');
    }
  }, [navigate, showToast]);



  const handleShare = async (post: FeedPublication) => {
    try {
      const { shareUrl } = await sharePublication(post.id);
      const detailPath = resolvePublicationDetailPath(post);
      const fallbackUrl = detailPath
        ? `${window.location.origin}${detailPath}`
        : `${window.location.origin}/`;
      const url = shareUrl || fallbackUrl;
      const shareText = [post.title, post.description].filter(Boolean).join(' — ').slice(0, 280);

      if (typeof navigator.share === 'function') {
        await navigator.share({
          title: post.title || 'Do.Events',
          text: shareText || undefined,
          url,
        });
        showToast('Compartido', 'success');
        return;
      }

      await navigator.clipboard.writeText(url);
      showToast('Enlace copiado al portapapeles', 'success');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      showToast(err instanceof Error ? err.message : 'Error al compartir', 'error');
    }
  };



  const handleDelete = async (publicationId: string) => {

    try {

      await deletePublication(publicationId);

      setPosts((prev) => prev.filter((item) => item.id !== publicationId));

      showToast('Publicación eliminada', 'success');

    } catch (err) {

      showToast(err instanceof Error ? err.message : 'Error al eliminar', 'error');

    }

  };



  const loadComments = useCallback(async (publicationId: string) => {

    const data = await fetchPublicationComments(publicationId);

    return data.items || [];

  }, []);



  const submitComment = useCallback(async (
    publicationId: string,
    payload: { text: string; parentCommentId?: string; mediaIds?: string[] },
  ) => {
    await createPublicationComment(publicationId, payload.text, {
      parentCommentId: payload.parentCommentId,
      mediaIds: payload.mediaIds,
    });

    setPosts((prev) => prev.map((item) => (
      item.id === publicationId
        ? { ...item, stats: { ...item.stats, comments: (item.stats.comments || 0) + 1 } }
        : item
    )));

    showToast('Comentario publicado', 'success');
  }, [showToast]);

  const reportComment = useCallback(async (commentId: string) => {
    await reportPublicationComment(commentId, { reason: 'inappropriate' });
    showToast('Gracias. Revisaremos tu reporte.', 'success');
  }, [showToast]);



  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-secondary">
        <Loader />
      </div>
    );
  }



  return (

    <>

      {refreshing && <p className="de-wall-refresh-hint">Actualizando publicaciones…</p>}
      {feedError && posts.length === 0 && (
        <div className="de-feed-error-banner" role="alert">
          <strong>No se pudo cargar el muro social</strong>
          <p>{feedError}</p>
          <button
            type="button"
            className="mt-2 text-sm font-semibold text-primary underline"
            onClick={() => {
              invalidateSocialFeedCache();
              setFeedError(null);
              void loadFeed(null, true);
            }}
          >
            Reintentar
          </button>
        </div>
      )}
      {feedError && posts.length > 0 && (
        <p className="de-wall-refresh-hint text-amber-700">
          No se pudo actualizar el feed. Mostrando la última versión guardada.
        </p>
      )}

      <FeedHero
        stories={feedStories}
        storiesLoading={storiesLoading}
        showBuiltInStories={false}
        userName={profileName?.split(' ')[0] || 'Eventer'}
        location={locationLabel || profileCity || 'Indica tu ubicación'}
        onChangeLocation={() => setShowLocationSheet(true)}
        selectedCategories={selectedFeedCategories}
        onSelectCategory={(label) => {
          setSelectedFeedCategories((prev) => (
            prev.includes(label) ? prev.filter((id) => id !== label) : [...prev, label]
          ));
        }}
        onViewAllCategories={() => navigate('/events')}
        onCreateStory={() => setShowCreateStory(true)}
        onStoryClick={(story) => {
          const authorId = story.authorId || (story.own ? userId : undefined);
          if (authorId) setStoryViewerUserId(authorId);
        }}
      />

      {!kycLoading && !isCertified && userId && (
        <FeedBanner
          title="Organizador certificado"
          message="Obtén el sello KYC y desbloquea eventos de gran escala con mayor visibilidad."
          actionLabel="Ver certificación"
          onAction={() => navigate('/profile/kyc')}
          className="mt-3"
          dismissible
        />
      )}

      <div className="mx-auto max-w-lg">
        <FeedVenuesCarousel
          venues={nearbyVenues}
          loading={nearbyVenuesLoading}
          onOpenVenue={(venue) => navigate(`/places/${venue.id}`)}
        />

        <div className="space-y-2 px-4 pb-4">

        {!userId && (
          <p className="rounded-xl bg-muted/50 px-4 py-3 text-center text-sm text-muted-foreground">
            Inicia sesión para publicar y reaccionar.
          </p>
        )}

        {filteredPosts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {selectedFeedCategories.length
              ? 'No hay publicaciones para las categorías seleccionadas.'
              : 'Aún no hay publicaciones. ¡Sé el primero en publicar!'}
          </p>
        ) : (

          filteredPosts.map((post) => {
            const detailPath = resolvePublicationDetailPath(post);
            const authorId = post.author?.id;
            return (
            <LovablePostCardBridge
              key={post.id}
              post={post}
              onLike={() => handleLike(post)}
              onComment={() => setCommentPostId(post.id)}
              onRepost={() => handleRepost(post)}
              onShare={() => handleShare(post)}
              onEdit={post.viewerState?.canDelete ? () => setEditingPost(post) : undefined}
              onDelete={post.viewerState?.canDelete ? () => handleDelete(post.id) : undefined}
              onMentionClick={handleMentionClick}
              onAuthorClick={authorId ? () => openUserProfile(authorId) : undefined}
              onFollow={() => handleFollow(post)}
              onMenuAction={(action) => {
                if (action === 'hide' || action === 'not-interested') {
                  setHiddenPosts((prev) => new Set(prev).add(post.id));
                  showToast('Publicación oculta', 'success');
                  return;
                }
                if (action === 'save') {
                  showToast('Publicación guardada', 'success');
                  return;
                }
                if (action === 'block') {
                  showToast('Usuario bloqueado', 'success');
                  return;
                }
                if (action === 'report') {
                  setReportPostId(post.id);
                }
              }}
              onOpen={detailPath ? () => navigate(detailPath) : undefined}
              onOpenStory={(authorUserId) => setStoryViewerUserId(authorUserId)}
            />
            );
          })

        )}

        {hasMore && (
          <div className="flex justify-center pt-4 pb-2">
            <button
              type="button"
              disabled={loadingMore}
              onClick={async () => {
                setLoadingMore(true);
                try {
                  await loadFeed(cursor, true);
                } catch (err) {
                  showToast(err instanceof Error ? err.message : 'Error al cargar más', 'error');
                } finally {
                  setLoadingMore(false);
                }
              }}
              className="rounded-full border border-primary/30 bg-primary/5 px-6 py-2.5 text-sm font-semibold text-primary disabled:opacity-50"
            >
              {loadingMore ? 'Cargando…' : 'Ver más publicaciones'}
            </button>
          </div>
        )}
        </div>
      </div>



      <CreatePostSheet
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        onOpenStorySheet={() => setShowCreateStory(true)}
      />

      <CreateStorySheet
        open={showCreateStory}
        onClose={() => setShowCreateStory(false)}
        onCreated={() => {
          setStoriesRefreshKey((k) => k + 1);
          refreshStories();
        }}
      />

      <StoryViewer
        open={Boolean(storyViewerUserId)}
        authorUserId={storyViewerUserId}
        currentUserId={userId}
        onClose={() => setStoryViewerUserId(null)}
        onStoriesChanged={() => {
          setStoriesRefreshKey((k) => k + 1);
          refreshStories();
        }}
      />

      <LovableCommentsBridge
        open={Boolean(commentPostId)}
        onClose={() => setCommentPostId(null)}
        publicationId={commentPostId}
        currentUserId={userId}
        loadComments={loadComments}
        onSubmitComment={submitComment}
        onReportComment={userId ? reportComment : undefined}
      />

      {editingPost && (
        <EditPostSheet
          open
          onOpenChange={(open) => { if (!open) setEditingPost(null); }}
          post={feedPublicationToLovablePost(editingPost)}
          onSave={handleEditSave}
        />
      )}

      {repostingPost && (
        <RepostSheet
          open
          onOpenChange={(open) => { if (!open) setRepostingPost(null); }}
          post={feedPublicationToLovablePost(repostingPost)}
          onPublishRepost={handlePublishRepost}
        />
      )}

      <ReportPostDialog
        open={Boolean(reportPostId)}
        onOpenChange={(open) => { if (!open) setReportPostId(null); }}
        publicationId={reportPostId}
      />

      <ChangeLocationSheet
        open={showLocationSheet}
        onOpenChange={setShowLocationSheet}
        label={locationLabel}
        fallbackCity={profileCity}
        onLocationResolved={handleLocationResolved}
      />

    </>

  );

};



export default SocialWallTab;
