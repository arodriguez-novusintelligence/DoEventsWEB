import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  clearSession,
  deletePublication,
  fetchFavoriteUserEvents,
  fetchFollowersCount,
  fetchFollowersList,
  fetchFollowingCount,
  fetchFollowingList,
  fetchGroupedUserTickets,
  fetchUserInvitations,
  fetchUserServiceBookings,
  fetchUserVenueBookings,
  EVENTS_CACHE_INVALIDATED_EVENT,
  fetchUserById,
  fetchUserEvents,
  fetchUserLikedPublications,
  fetchUserPublications,
  fetchUserServiceComments,
  fetchUserStats,
  fetchAllGuestContacts,
  fetchOwnerProfileVenues,
  fetchServicesByUserId,
  SERVICES_CACHE_INVALIDATED_EVENT,
  VENUES_CACHE_INVALIDATED_EVENT,
  formatTenure,
  getExperienceLabel,
  getExperienceSegment,
  cacheProfilePageSnapshot,
  getProfilePageCache,
  getProfileHeaderCache,
  invalidateProfileHeaderCache,
  patchProfilePageCounts,
  sanitizeProfileMediaForCache,
  invalidateCachedProfile,
  PROFILE_PAGE_CACHE_INVALIDATED_EVENT,
  SOCIAL_GRAPH_UPDATED_EVENT,
  appendImageCacheBuster,
  Loader,
  resolveImageUrl,
  RootState,
  updateUserProfile,
  uploadProfileAvatar,
  uploadProfileCover,
  setProfileAvatarFromGallery,
  setProfileCoverFromGallery,
  ProfileMediaPickerSheet,
  useToast,
  toggleEventLike,
  type UserProfile,
  type UserStats,
  resolveUserDisplayName,
  getPersistedUserDisplayName,
  getPersistedOAuthProfilePhoto,
  clearPersistedOAuthProfilePhoto,
  resolveUserAvatarUrl,
  setCachedPurchaseCounts,
  userIdsMatch,
} from '@doevents/shared';
import {
  composeFullPhone,
  normalizePhoneNumber,
} from '@lovable/components/guests/PhoneCountryFields';
import ProfileView from '@lovable/components/feed/ProfileView';
import type { FavEventItem, FavPlaceItem } from '@lovable/components/feed/FavoritesView';
import type { ProfileCommentItem } from '@lovable/components/feed/ProfileCommentsView';
import type { ProfileListUser } from '@lovable/components/feed/FollowersSheet';
import { groupedTicketsToLovable, enrichTicketsCategoryColors } from '../lovable-bridge/ticketsAdapter';
import { filterVisibleUserEvents } from '../lovable-bridge/discoverEventFilters';
import { feedEventToDiscoverItem } from '../lovable-bridge/discoverAdapter';
import { feedPublicationToLovablePost } from '../lovable-bridge/feedAdapter';
import { nearbyServiceToFormData } from '../lovable-bridge/servicesAdapter';
import type { ServiceFormData } from '@lovable/data/servicesData';
import { CreateStorySheet } from '../components/CreateStorySheet';
import { StoryViewer } from '../components/StoryViewer';
import { useActiveStoryAuthors } from '../contexts/StoriesContext';

function toProfileListUser(entry: { id: string; name: string; avatarUrl?: string | null }): ProfileListUser {
  const name = entry.name || 'Usuario';
  return {
    id: entry.id,
    name,
    initials: name.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'DE',
    avatarUrl: resolveUserAvatarUrl(entry.avatarUrl, entry.id) || undefined,
  };
}

function resolveProfileAvatarForUi(
  profile: UserProfile | null | undefined,
  userId: string | null | undefined,
): string | undefined {
  return resolveUserAvatarUrl(profile?.imagen, userId);
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [storyViewerUserId, setStoryViewerUserId] = useState<string | null>(null);
  const { refreshStories, hasActiveStory } = useActiveStoryAuthors();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersList, setFollowersList] = useState<ProfileListUser[]>([]);
  const [followingList, setFollowingList] = useState<ProfileListUser[]>([]);
  const [favoriteEvents, setFavoriteEvents] = useState<FavEventItem[]>([]);
  const [favoritePosts, setFavoritePosts] = useState<ReturnType<typeof feedPublicationToLovablePost>[]>([]);
  const [favoritePlaces, setFavoritePlaces] = useState<FavPlaceItem[]>([]);
  const [favoriteProfiles, setFavoriteProfiles] = useState<ProfileListUser[]>([]);
  const [profileComments, setProfileComments] = useState<ProfileCommentItem[]>([]);
  const [myPosts, setMyPosts] = useState<ReturnType<typeof feedPublicationToLovablePost>[]>([]);
  const [myEventsCount, setMyEventsCount] = useState(0);
  const [myStatsCount, setMyStatsCount] = useState(0);
  const [myPurchasesCount, setMyPurchasesCount] = useState(0);
  const [myInvitationsCount, setMyInvitationsCount] = useState(0);
  const [myGuestsCount, setMyGuestsCount] = useState(0);
  const [rating, setRating] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'avatar' | 'cover' | null>(null);
  const [publishedServices, setPublishedServices] = useState<ServiceFormData[]>([]);
  const [myServicesCount, setMyServicesCount] = useState(0);
  const [myVenuesCount, setMyVenuesCount] = useState(0);

  const applyHeaderFromCache = useCallback((cached: ReturnType<typeof getProfileHeaderCache>) => {
    if (!cached?.profile) return;
    setProfile(sanitizeProfileMediaForCache(cached.profile, userId));
    setFollowersCount(cached.followersCount);
    setFollowingCount(cached.followingCount);
    setRating(cached.rating);
  }, [userId]);

  const applyFullCache = useCallback((cached: NonNullable<ReturnType<typeof getProfilePageCache>>) => {
    if (cached.profile) {
      setProfile(sanitizeProfileMediaForCache(cached.profile, userId));
    }
    setStats(cached.stats);
    setMyEventsCount(cached.myEventsCount);
    setMyStatsCount(cached.myStatsCount ?? cached.myEventsCount ?? 0);
    setMyPurchasesCount(
      cached.myPurchasesCount
      ?? (cached as { ticketsCount?: number }).ticketsCount
      ?? 0,
    );
    setMyInvitationsCount(cached.myInvitationsCount ?? 0);
    setMyVenuesCount(cached.myVenuesCount);
    setMyServicesCount(cached.myServicesCount ?? 0);
    setFollowersCount(cached.followersCount);
    setFollowingCount(cached.followingCount);
    setRating(cached.rating);
    setCommentsCount(cached.commentsCount);
  }, [userId]);

  const applyUserServices = useCallback((userServices: Awaited<ReturnType<typeof fetchServicesByUserId>>) => {
    const mapped = (userServices || []).map(nearbyServiceToFormData);
    setPublishedServices(mapped);
    setMyServicesCount(mapped.length);
    if (userId) {
      patchProfilePageCounts(userId, { myServicesCount: mapped.length });
    }
  }, [userId]);

  const refreshUserServices = useCallback(async (forceNetwork = false) => {
    if (!userId) return;
    const userServices = await fetchServicesByUserId(userId, {
      forceNetwork,
      includeInactive: true,
    }).catch(() => []);
    applyUserServices(userServices);
  }, [userId, applyUserServices]);

  const refreshProfileCounts = useCallback(async (forceNetwork = false) => {
    if (!userId) return;
    try {
      const [events, userVenues, userServices] = await Promise.all([
        fetchUserEvents(userId, { forceNetwork, allEvents: true }).catch(() => ({ data: { datosEvento: [] } })),
        fetchOwnerProfileVenues(userId).catch(() => []),
        fetchServicesByUserId(userId, { forceNetwork, includeInactive: true }).catch(() => []),
      ]);
      const visibleEvents = filterVisibleUserEvents(events.data?.datosEvento || []);
      const eventsCount = visibleEvents.length;
      const venuesCount = userVenues.length;
      const servicesCount = (userServices || []).length;

      setMyEventsCount(eventsCount);
      setMyVenuesCount(venuesCount);
      applyUserServices(userServices);
      setMyStatsCount((prev) => (prev > 0 ? prev : eventsCount));

      patchProfilePageCounts(userId, {
        myEventsCount: eventsCount,
        myVenuesCount: venuesCount,
        myServicesCount: servicesCount,
      });
    } catch {
      // refresco en segundo plano; no bloquear la UI
    }
  }, [userId, applyUserServices]);

  const loadSocialLists = useCallback(async () => {
    if (!userId) return;
    const [followersData, followingData, followersRes, followingCountRes] = await Promise.all([
      fetchFollowersList(userId).catch(() => []),
      fetchFollowingList(userId).catch(() => []),
      fetchFollowersCount(userId).catch(() => ({ count: 0 })),
      fetchFollowingCount(userId).catch(() => 0),
    ]);
    setFollowersList(followersData.map(toProfileListUser));
    setFollowingList(followingData.map(toProfileListUser));
    setFollowersCount(followersRes.count || 0);
    setFollowingCount(typeof followingCountRes === 'number' ? followingCountRes : 0);
  }, [userId]);

  const reload = useCallback(async (forceHeaderRefresh = false) => {
    if (!userId) {
      setLoading(false);
      setLoadError(null);
      return;
    }

    setLoadError(null);

    const fullCache = !forceHeaderRefresh ? getProfilePageCache(userId) : null;
    const headerCache = !forceHeaderRefresh ? getProfileHeaderCache(userId) : null;
    const headerFresh = Boolean(headerCache?.profile);
    const fullFresh = Boolean(fullCache?.profile);

    if (fullFresh && fullCache) {
      applyFullCache(fullCache);
      setLoading(false);
      void refreshUserServices(forceHeaderRefresh);
      void refreshProfileCounts(true);
      void loadSocialLists();
      return;
    }

    if (headerFresh && headerCache) {
      applyHeaderFromCache(headerCache);
      setLoading(false);
    } else if (forceHeaderRefresh) {
      invalidateProfileHeaderCache(userId);
    }

    if (!headerFresh && !fullFresh) {
      setLoading(true);
    }

    try {
      const [
        userProfile,
        userStats,
        events,
        followers,
        following,
        tickets,
        comments,
        followersData,
        followingData,
        favEvents,
        publications,
        likedPosts,
        userVenues,
        userServices,
        userInvitations,
        venueBookings,
        serviceBookings,
        guestContacts,
      ] = await Promise.all([
        headerFresh
          ? Promise.resolve(headerCache?.profile ?? null)
          : fetchUserById(userId).catch(() => null),
        fetchUserStats(userId).catch(() => null),
        fetchUserEvents(userId, { forceNetwork: forceHeaderRefresh, allEvents: true }).catch(() => ({ data: { datosEvento: [] } })),
        headerFresh
          ? Promise.resolve({ count: headerCache?.followersCount ?? 0 })
          : fetchFollowersCount(userId).catch(() => ({ count: 0 })),
        headerFresh
          ? Promise.resolve(headerCache?.followingCount ?? 0)
          : fetchFollowingCount(userId).catch(() => 0),
        fetchGroupedUserTickets(userId).catch(() => null),
        fetchUserServiceComments(userId).catch(() => []),
        fetchFollowersList(userId).catch(() => []),
        fetchFollowingList(userId).catch(() => []),
        fetchFavoriteUserEvents(userId).catch(() => []),
        fetchUserPublications(userId).catch(() => []),
        fetchUserLikedPublications(userId).catch(() => []),
        fetchOwnerProfileVenues(userId).catch(() => []),
        fetchServicesByUserId(userId, { forceNetwork: forceHeaderRefresh, includeInactive: true }).catch(() => []),
        fetchUserInvitations(userId).catch(() => ({ invitations: [] })),
        fetchUserVenueBookings(userId).catch(() => []),
        fetchUserServiceBookings(userId).catch(() => []),
        fetchAllGuestContacts(userId).catch(() => []),
      ]);
      const visibleEvents = filterVisibleUserEvents(events.data?.datosEvento || []);
      const lovableTickets = tickets
        ? await enrichTicketsCategoryColors(groupedTicketsToLovable(tickets))
        : [];
      const activeTickets = lovableTickets.filter(
        (ticket) => ticket.status === 'aprobada' || ticket.status === 'pendiente',
      ).length;
      const purchasesTotal = activeTickets + venueBookings.length + serviceBookings.length;
      setCachedPurchaseCounts(userId, {
        ticketCount: activeTickets,
        venueCount: venueBookings.length,
        serviceCount: serviceBookings.length,
      });
      const invitationsTotal = userInvitations.invitations?.length || 0;
      setProfile(userProfile);
      setStats(userStats);
      setFollowersCount(followers.count || 0);
      setFollowingCount(typeof following === 'number' ? following : 0);
      setFollowersList(followersData.map(toProfileListUser));
      setFollowingList(followingData.map(toProfileListUser));
      setMyEventsCount(visibleEvents.length);
      setMyStatsCount(userStats?.totalEventos ?? visibleEvents.length);
      setMyInvitationsCount(invitationsTotal);
      setMyGuestsCount(
        Array.isArray(guestContacts) && guestContacts.length > 0
          ? guestContacts.length
          : (userStats?.Invitados || 0),
      );
      setMyPurchasesCount(purchasesTotal);
      setFavoriteEvents(
        (Array.isArray(favEvents) ? favEvents : []).map((ev) => {
          const item = feedEventToDiscoverItem(ev);
          return {
            ...item,
            status: 'Activo' as const,
          };
        }),
      );
      setProfileComments(
        (comments || []).map((c) => ({
          id: c.id,
          authorName: c.authorName || 'Usuario',
          comment: c.comment,
          rating: c.rating,
          createdAt: c.createdAt,
          eventName: c.eventName,
        })),
      );
      setMyPosts(
        publications
          .filter((pub) => pub.type !== 'story')
          .map(feedPublicationToLovablePost),
      );
      setFavoritePosts(likedPosts.map(feedPublicationToLovablePost));
      setFavoritePlaces([]);
      setFavoriteProfiles(followingData.map(toProfileListUser));
      applyUserServices(userServices);
      setMyVenuesCount(userVenues.length);
      setRating(userProfile?.calificacion || userStats?.calificacionPromedio || 0);
      setCommentsCount(comments?.length || 0);
      cacheProfilePageSnapshot({
        userId,
        profile: userProfile ? sanitizeProfileMediaForCache(userProfile, userId) : userProfile,
        stats: userStats,
        myEventsCount: visibleEvents.length,
        myStatsCount: userStats?.totalEventos ?? visibleEvents.length,
        myPurchasesCount: purchasesTotal,
        myInvitationsCount: invitationsTotal,
        myVenuesCount: userVenues.length,
        myServicesCount: (userServices || []).length,
        followersCount: followers.count || 0,
        followingCount: typeof following === 'number' ? following : 0,
        rating: userProfile?.calificacion || userStats?.calificacionPromedio || 0,
        commentsCount: comments?.length || 0,
      }, { preserveHeader: headerFresh });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No se pudo cargar tu perfil');
    } finally {
      setLoading(false);
    }
  }, [userId, applyFullCache, applyHeaderFromCache, applyUserServices, refreshUserServices, refreshProfileCounts, loadSocialLists]);

  useEffect(() => {
    void reload();
    const onSecondaryDataChanged = () => { void reload(true); };
    const onHeaderCacheInvalidated = () => { void reload(true); };
    const onSocialGraphUpdated = () => { void loadSocialLists(); };
    window.addEventListener(EVENTS_CACHE_INVALIDATED_EVENT, onSecondaryDataChanged);
    window.addEventListener(SERVICES_CACHE_INVALIDATED_EVENT, onSecondaryDataChanged);
    window.addEventListener(VENUES_CACHE_INVALIDATED_EVENT, onSecondaryDataChanged);
    window.addEventListener(PROFILE_PAGE_CACHE_INVALIDATED_EVENT, onHeaderCacheInvalidated);
    window.addEventListener(SOCIAL_GRAPH_UPDATED_EVENT, onSocialGraphUpdated);
    return () => {
      window.removeEventListener(EVENTS_CACHE_INVALIDATED_EVENT, onSecondaryDataChanged);
      window.removeEventListener(SERVICES_CACHE_INVALIDATED_EVENT, onSecondaryDataChanged);
      window.removeEventListener(VENUES_CACHE_INVALIDATED_EVENT, onSecondaryDataChanged);
      window.removeEventListener(PROFILE_PAGE_CACHE_INVALIDATED_EVENT, onHeaderCacheInvalidated);
      window.removeEventListener(SOCIAL_GRAPH_UPDATED_EVENT, onSocialGraphUpdated);
    };
  }, [reload, loadSocialLists]);

  const handleAvatarUpload = async (file: File) => {
    if (!userId) return;
    setUploading(true);
    try {
      const newUrl = await uploadProfileAvatar(userId, file);
      clearPersistedOAuthProfilePhoto(userId);
      const busted = appendImageCacheBuster(newUrl, Date.now()) || newUrl;
      invalidateProfileHeaderCache(userId);
      invalidateCachedProfile(userId);
      setProfile((prev) => (prev ? { ...prev, imagen: busted } : prev));
      window.dispatchEvent(new Event(PROFILE_PAGE_CACHE_INVALIDATED_EVENT));
      await reload(true);
      showToast('Foto de perfil actualizada', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo actualizar la foto', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (file: File) => {
    if (!userId) return;
    setUploading(true);
    try {
      const newUrl = await uploadProfileCover(userId, file);
      const busted = appendImageCacheBuster(newUrl, Date.now()) || newUrl;
      invalidateProfileHeaderCache(userId);
      invalidateCachedProfile(userId);
      setProfile((prev) => (prev ? { ...prev, coverImageUrl: busted } : prev));
      window.dispatchEvent(new Event(PROFILE_PAGE_CACHE_INVALIDATED_EVENT));
      await reload(true);
      showToast('Portada actualizada', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo actualizar la portada', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryImageForProfile = async (
    item: { imageId: string; key?: string },
    target: 'avatar' | 'cover',
  ) => {
    if (!userId) return;
    setUploading(true);
    try {
      const input = { imageId: item.imageId, key: item.key };
      const newUrl = target === 'avatar'
        ? await setProfileAvatarFromGallery(userId, input)
        : await setProfileCoverFromGallery(userId, input);
      const busted = appendImageCacheBuster(newUrl, Date.now()) || newUrl;
      invalidateProfileHeaderCache(userId);
      invalidateCachedProfile(userId);
      if (target === 'avatar') {
        clearPersistedOAuthProfilePhoto(userId);
        setProfile((prev) => (prev ? { ...prev, imagen: busted } : prev));
        showToast('Foto de perfil actualizada', 'success');
      } else {
        setProfile((prev) => (prev ? { ...prev, coverImageUrl: busted } : prev));
        showToast('Portada actualizada', 'success');
      }
      window.dispatchEvent(new Event(PROFILE_PAGE_CACHE_INVALIDATED_EVENT));
      await reload(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo usar la imagen de la galería', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveContact = async (data: {
    nombres: string;
    apellidos: string;
    phone: string;
    username: string;
    bio: string;
    fecha?: string;
    phonePrefix?: string;
  }) => {
    if (!userId) return;
    const prefix = (data.phonePrefix || '+57').trim();
    const digits = normalizePhoneNumber(data.phone);
    const normalizedPhone = composeFullPhone(prefix, digits);
    await updateUserProfile({
      id: userId,
      name: data.nombres,
      lastName: data.apellidos,
      phone: normalizedPhone,
      phoneNumber: digits,
      user: data.username,
      description: data.bio,
      date: data.fecha || undefined,
      countryCode: prefix,
      indicativo: prefix.replace(/^\+/, ''),
    });
    invalidateProfileHeaderCache(userId);
    await reload(true);
    showToast('Perfil actualizado', 'success');
  };

  if (!userId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-sm text-muted-foreground">Inicia sesión para ver tu perfil.</p>
        <button
          type="button"
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
          onClick={() => navigate('/auth/login')}
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  if (loading && !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-secondary">
        <Loader />
      </div>
    );
  }

  if (loadError && !profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-sm font-medium text-destructive">{loadError}</p>
        <button
          type="button"
          className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold"
          onClick={() => void reload(true)}
        >
          Reintentar
        </button>
      </div>
    );
  }

  const profileName = resolveUserDisplayName(profile) || getPersistedUserDisplayName() || 'Usuario';
  const eventsDone = stats?.eventosRealizados ?? stats?.experienciaEventosRealizados ?? myEventsCount;

  return (
    <>
      <ProfileView
        userId={userId || undefined}
        isPublicProfile={profile?.isPublicProfile !== false}
        onVisibilityChange={(isPublic) => {
          setProfile((prev) => (prev ? { ...prev, isPublicProfile: isPublic } : prev));
        }}
        profileName={profileName}
        profileUsername={profile?.username ? `@${profile.username}` : '@eventer'}
        profileAvatar={resolveProfileAvatarForUi(profile, userId)}
        profileCover={profile?.coverImageUrl || undefined}
        profileBio={profile?.bio || ''}
        profileEmail={profile?.email}
        profilePhone={profile?.phone}
        profilePhoneNumber={profile?.phoneNumber}
        profileCountryCode={profile?.countryCode}
        profileDocument={profile?.documento}
        profileBirthDate={profile?.date}
        profileCity={profile?.ciudad}
        profileAddress={profile?.direccion}
        followersCount={followersCount}
        followingCount={followingCount}
        followersList={followersList}
        followingList={followingList}
        onFollowersChange={(next) => {
          setFollowersList(next);
          setFollowersCount(next.length);
        }}
        favoriteEvents={favoriteEvents}
        favoritePosts={favoritePosts}
        favoritePlaces={favoritePlaces}
        favoriteProfiles={favoriteProfiles}
        profileComments={profileComments}
        profileCommentsLoading={loading}
        onRetryComments={() => void reload(true)}
        myPosts={myPosts}
        onDeletePost={async (postId) => {
          await deletePublication(postId);
          setMyPosts((prev) => prev.filter((p) => p.id !== postId));
        }}
        profileLikes={profile?.likesReceivedCount || stats?.totalPostFavoritos || 0}
        myEventsCount={myEventsCount}
        myVenuesCount={myVenuesCount}
        myServicesCount={myServicesCount || publishedServices.length}
        myStatsCount={myStatsCount}
        myInvitationsCount={myInvitationsCount}
        myPurchasesCount={myPurchasesCount}
        myGuestsCount={myGuestsCount || stats?.Invitados || 0}
        myPostsCount={myPosts.length || stats?.totalPublicaciones || 0}
        favEventsCount={favoriteEvents.length || stats?.totalEventosFavoritos || 0}
        favPostsCount={favoritePosts.length || stats?.totalPostFavoritos || 0}
        favPlacesCount={favoritePlaces.length || stats?.LugaresFavoritos || 0}
        favProfilesCount={favoriteProfiles.length || stats?.PerfilesFavoritos || 0}
        experienceLabel={getExperienceLabel(eventsDone)}
        experienceSegment={getExperienceSegment(eventsDone)}
        tenureLabel={formatTenure(profile?.createDate) || '—'}
        rating={rating}
        commentsCount={commentsCount}
        currentPlan={(profile?.plan === 'pro' || profile?.plan === 'PRO') ? 'pro' : 'free'}
        uploadingMedia={uploading}
        onAvatarClick={() => setMediaPickerTarget('avatar')}
        onOpenStory={() => {
          if (userId && hasActiveStory(userId)) setStoryViewerUserId(userId);
        }}
        onCreateStory={() => setShowCreateStory(true)}
        onCoverClick={() => setMediaPickerTarget('cover')}
        onSaveContact={handleSaveContact}
        onOpenGallery={() => navigate('/profile/gallery')}
        onOpenPlan={() => navigate('/profile/plan/detail')}
        onOpenPlansCatalog={() => navigate('/profile/plans')}
        onNavigateMessages={() => navigate('/chat')}
        onNavigateStats={() => navigate('/profile/stats')}
        onOpenMyEvents={() => navigate('/my-events')}
        onOpenMyVenues={() => navigate('/profile/venues')}
        onOpenMyTickets={() => navigate('/purchases')}
        onOpenMyInvitations={() => navigate('/profile/invitations')}
        onOpenGuests={() => navigate('/guests')}
        onOpenMyPosts={() => navigate('/profile/publications')}
        publishedServices={publishedServices}
        onOpenServices={() => navigate(`/users/${userId}/services`)}
        onViewProfile={(u) => navigate(`/users/${u.id}`)}
        onOpenFavoriteEvent={(eventId) => navigate(`/events/${eventId}`)}
        onToggleEventFavorite={(eventId) => {
          void toggleEventLike(eventId).then(() => {
            setFavoriteEvents((prev) => prev.filter((e) => e.id !== eventId));
          });
        }}
        onLogout={() => {
          clearSession();
          navigate('/auth/login');
        }}
      />
      <CreateStorySheet
        open={showCreateStory}
        onClose={() => setShowCreateStory(false)}
        onCreated={() => {
          setShowCreateStory(false);
          refreshStories();
        }}
      />
      <StoryViewer
        open={Boolean(storyViewerUserId)}
        authorUserId={storyViewerUserId}
        currentUserId={userId}
        currentUserAvatar={profile?.imagen || getPersistedOAuthProfilePhoto(userId)}
        onClose={() => setStoryViewerUserId(null)}
        onOpenProfile={(id) => {
          if (userId && userIdsMatch(id, userId)) navigate('/profile');
          else navigate(`/users/${encodeURIComponent(id)}`);
        }}
        onStoriesChanged={refreshStories}
      />
      {userId && mediaPickerTarget && (
        <ProfileMediaPickerSheet
          open
          onClose={() => setMediaPickerTarget(null)}
          userId={userId}
          title={mediaPickerTarget === 'avatar' ? 'Cambiar foto de perfil' : 'Cambiar portada'}
          onFile={(file) => {
            if (mediaPickerTarget === 'avatar') void handleAvatarUpload(file);
            else void handleCoverUpload(file);
          }}
          onGallerySelect={(item) => { void handleGalleryImageForProfile(item, mediaPickerTarget); }}
        />
      )}
    </>
  );
};

export default ProfilePage;
