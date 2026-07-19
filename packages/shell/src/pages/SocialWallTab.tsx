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

  useStoredUserLocation,

  buildSocialFeedCacheKey,

  createPublication,

  createPublicationComment,

  reportPublicationComment,

  deletePublication,

  fetchPublicationComments,

  fetchPublicationById,

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
  dedupeFeedPublications,
  resolveEventIdFromFeedPublication,
  resolveVenueIdFromFeedPublication,
  enrichVenueFeedPublicationImages,
  feedPublicationImageScore,
  resolvePublicationDetailPath,
  resolvePublicationDetailPathAsync,
  EVENT_FAVORITE_CHANGED_EVENT,
  dispatchEventFavoriteChanged,
  applyEventFavoriteToPublications,
  type EventFavoriteChangedDetail,

  FeedEventItem,
  matchesEventCategory,
  buildEventCategoryMapForFeed,
  matchesPublicationCategory,

  isDiscoverableFeedEvent,

  resolveUserDisplayName,
  resolveUserFirstName,
  getPersistedUserDisplayName,
  userIdsMatch,

} from '@doevents/shared';

import FeedHero from '@lovable/components/feed/FeedHero';
import FeedServicesCarousel from '@lovable/components/feed/FeedServicesCarousel';
import { ReportPostDialog } from '@lovable/components/feed/ReportPostDialog';
import { ChangeLocationSheet } from '@lovable/components/feed/ChangeLocationSheet';
import FeedCreatePostSheet from '@lovable/components/feed/FeedCreatePostSheet';
import { LovablePostCardBridge } from '../lovable-bridge/LovablePostCardBridge';
import { LovableCommentsBridge } from '../lovable-bridge/LovableCommentsBridge';
import { feedPublicationToLovablePost } from '../lovable-bridge/feedAdapter';
import { filterAndSortMyPublishedEvents } from '../lovable-bridge/discoverEventFilters';
import RepostSheet from '@lovable/components/feed/RepostSheet';
import { useFeedStories } from '../lovable-bridge/useFeedStories';
import { useActiveStoryAuthors } from '../contexts/StoriesContext';
import { useNearbyServices } from '../lovable-bridge/useNearbyServices';
import { CreateStorySheet } from '../components/CreateStorySheet';
import { StoryViewer } from '../components/StoryViewer';



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

  const userLocation = useStoredUserLocation();
  const cacheKey = useMemo(
    () => buildSocialFeedCacheKey(userId, null, PAGE_SIZE, userLocation),
    [userId, userLocation?.lat, userLocation?.lng],
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

  const feedLocationDetails = useMemo(() => {
    if (!userLocation) {
      return profileCity ? { city: profileCity } : undefined;
    }

    const country = userLocation.country?.trim();
    const labelParts = (userLocation.label || '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    if (
      country
      && labelParts.length
      && labelParts[labelParts.length - 1].toLocaleLowerCase() === country.toLocaleLowerCase()
    ) {
      labelParts.pop();
    }

    const address = userLocation.street
      ? [userLocation.departamento, userLocation.street].filter(Boolean).join(', ')
      : labelParts.join(', ');

    return {
      city: userLocation.city,
      address: address || undefined,
      country,
    };
  }, [
    profileCity,
    userLocation?.city,
    userLocation?.country,
    userLocation?.departamento,
    userLocation?.label,
    userLocation?.street,
  ]);

  const { refreshStories } = useActiveStoryAuthors();
  const { stories: feedStories, loading: storiesLoading } = useFeedStories(
    storiesRefreshKey,
    userId,
    profileName,
    profileAvatar,
  );
  const { providers: nearbyServiceCards, loading: servicesLoading } = useNearbyServices(50);

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
        return dedupeFeedPublications([...preserved, ...incoming]);
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
  }, []);



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
        if (!getStoredUserLocation()) {
          setLocationLabel((current) => current || profile.ciudad || null);
        }
      }
      if (profile?.imagen) setProfileAvatar(profile.imagen);
      const name = resolveUserDisplayName(profile) || getPersistedUserDisplayName();
      if (name) setProfileName(name);
    }).catch(() => undefined);
  }, [userId]);

  useEffect(() => {
    if (userLocation) {
      setLocationLabel(userLocation.label || userLocation.city || null);
      void loadRecommended(userLocation);
      return;
    }

    let cancelled = false;
    resolveUserLocation({ prompt: false, profileCity }).then((resolved) => {
      if (cancelled) return;
      if (resolved) {
        setLocationLabel(resolved.label || resolved.city || null);
        void loadRecommended(resolved);
      } else {
        void loadRecommended(null);
      }
    });
    return () => { cancelled = true; };
  }, [userLocation?.lat, userLocation?.lng, profileCity, loadRecommended]);

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

  const enrichedVenueImagesRef = useRef(new Set<string>());

  useEffect(() => {
    const pending = posts.filter((post) => {
      if (enrichedVenueImagesRef.current.has(post.id)) return false;
      const venueId = resolveVenueIdFromFeedPublication(post);
      return Boolean(venueId) && feedPublicationImageScore(post) === 0;
    });
    if (!pending.length) return;

    let cancelled = false;
    pending.forEach((post) => enrichedVenueImagesRef.current.add(post.id));

    void enrichVenueFeedPublicationImages(posts).then((enriched) => {
      if (cancelled) return;
      const changed = enriched.some((item, index) => item !== posts[index]);
      if (changed) setPosts(enriched);
    }).catch(() => undefined);

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
          const estatus = String(
            p.metadata?.estatus || p.metadata?.status || (p.type === 'event' ? 'activo' : ''),
          );
          if (!p.metadata?.estatus && !p.metadata?.fechaIni) {
            return true;
          }
          return isDiscoverableFeedEvent({
            estatus,
            fechaIni: String(p.metadata?.fechaIni || ''),
            fechaFin: String(p.metadata?.fechaFin || ''),
            horaIni: String(p.metadata?.horaIni || ''),
            horaFin: String(p.metadata?.horaFin || ''),
          });
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
        item.author?.id === post.author.id
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
    if (userId && userIdsMatch(targetUserId, userId)) {
      navigate('/profile');
      return;
    }
    navigate(`/users/${encodeURIComponent(targetUserId)}`);
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
    setPosts((prev) => dedupeFeedPublications([
      publication,
      ...prev.filter((p) => p.id !== publication.id),
    ]));
    await loadFeed(null, true);
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
      const message = err instanceof Error ? err.message : 'Error al repostear';
      if (/FEED_REPOST_LIMIT|límite de republicaciones/i.test(message)) {
        showToast('Alcanzaste el límite de republicaciones para este contenido', 'error');
        return;
      }
      if (/FEED_REPOST_COOLDOWN|esperar.*día/i.test(message)) {
        showToast(message, 'error');
        return;
      }
      showToast(message, 'error');
    }
  };



  const handleRepost = (post: FeedPublication) => {

    if (post.viewerState?.reposted) {

      showToast('Ya reposteaste esta publicación', 'error');

      return;

    }

    setRepostingPost(post);

  };



  const handleEditSave = async (data: {
    title: string;
    description: string;
    mediaIds?: string[];
    visibility?: string;
    locationLabel?: string;
    latitude?: number;
    longitude?: number;
    mentions?: import('@doevents/shared').FeedMention[];
    mediaChanged?: boolean;
  }) => {
    if (!editingPost) return;
    try {
      const mediaPayload = data.mediaChanged
        ? {
            mediaIds: data.mediaIds || [],
            replaceMedia: true as const,
            clearMedia: !(data.mediaIds && data.mediaIds.length),
          }
        : {};
      const updated = await updatePublication(editingPost.id, {
        title: data.title,
        description: data.description,
        locationLabel: data.locationLabel,
        visibility: data.visibility,
        mentions: data.mentions || [],
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        ...mediaPayload,
      });
      setPosts((prev) => prev.map((p) => (p.id === editingPost.id ? updated : p)));
      setEditingPost(null);
      showToast('Publicación actualizada', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al editar', 'error');
    }
  };



  const handleMentionClick = useCallback(async (mention: string, publicationId?: string) => {
    const normalized = mention.toLowerCase().replace(/^@/, '').replace(/\s+/g, '');
    const feedPost = publicationId ? posts.find((item) => item.id === publicationId) : undefined;
    const storedMention = feedPost?.mentions?.find((entry) => {
      const type = String(entry.mentionType || entry.type || '').toLowerCase();
      if (type !== 'user' && !entry.userId) return false;
      const tag = String(entry.tag || entry.username || entry.name || '').replace(/^@/, '').toLowerCase().replace(/\s+/g, '');
      return tag === normalized;
    });
    if (storedMention?.userId) {
      navigate(`/users/${storedMention.userId}`);
      return;
    }
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
  }, [navigate, posts, showToast]);



  const openFeedPublication = useCallback(async (post: FeedPublication) => {
    try {
      const detailPath = await resolvePublicationDetailPathAsync(post, {
        fetchPublication: (publicationId) => fetchPublicationById(publicationId, userId || undefined),
      });

      if (detailPath) {
        navigate(detailPath);
        return;
      }

      const lovablePath = feedPublicationToLovablePost(post).detailPath;
      if (lovablePath) {
        navigate(lovablePath);
        return;
      }

      if (post.type === 'post' || post.listItemType === 'publication') {
        setCommentPostId(post.id);
        return;
      }

      showToast('No se pudo abrir este contenido', 'error');
    } catch {
      showToast('No se pudo abrir este contenido', 'error');
    }
  }, [navigate, showToast, userId]);



  const handleShare = async (post: FeedPublication) => {
    try {
      const detailPath = resolvePublicationDetailPath(post);
      const origin = (typeof window !== 'undefined' && window.location?.origin)
        || 'https://dev.doeventsapp.com';
      // Preferir deep-link al detalle de evento/lugar/servicio cuando el ítem del feed lo promociona.
      let url = detailPath
        ? `${origin}${detailPath}`
        : `${origin}/p/${encodeURIComponent(post.id)}`;

      try {
        const { shareUrl } = await sharePublication(post.id);
        // Si no hay detalle de entidad, usar la URL pública del backend.
        if (!detailPath && shareUrl) url = shareUrl;
      } catch (apiErr) {
        // Si el backend falla pero ya tenemos URL de detalle, aún así compartimos el enlace.
        if (!detailPath) {
          throw apiErr;
        }
      }

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
        userName={profileName?.split(/\s+/)[0] || resolveUserFirstName(null) || undefined}
        location={locationLabel || profileCity || 'Indica tu ubicación'}
        locationDetails={feedLocationDetails}
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

      <div className="mx-auto max-w-lg">
        <FeedServicesCarousel
          providers={nearbyServiceCards}
          loading={servicesLoading}
          onOpenService={(card) => {
            if (card.id) navigate(`/services/${card.id}`);
          }}
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
              onOpen={() => { void openFeedPublication(post); }}
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



      <FeedCreatePostSheet
        open={showCreate}
        onOpenChange={setShowCreate}
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
        currentUserAvatar={profileAvatar}
        onClose={() => setStoryViewerUserId(null)}
        onOpenProfile={openUserProfile}
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
        <FeedCreatePostSheet
          open
          mode="edit"
          initialPublication={editingPost}
          onOpenChange={(open) => { if (!open) setEditingPost(null); }}
          onSubmit={handleEditSave}
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
