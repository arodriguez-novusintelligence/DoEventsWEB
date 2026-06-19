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
  EVENTS_CACHE_INVALIDATED_EVENT,
  fetchUserById,
  fetchUserEvents,
  fetchUserLikedPublications,
  fetchUserPublications,
  fetchUserServiceComments,
  fetchUserStats,
  fetchOwnerProfileVenues,
  listUserVenues,
  fetchServicesByUserId,
  SERVICES_CACHE_INVALIDATED_EVENT,
  VENUES_CACHE_INVALIDATED_EVENT,
  formatTenure,
  getExperienceLabel,
  getExperienceSegment,
  cacheProfilePageSnapshot,
  getProfilePageCache,
  invalidateProfilePageCache,
  invalidateCachedProfile,
  PROFILE_PAGE_CACHE_INVALIDATED_EVENT,
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
} from '@doevents/shared';
import ProfileView from '@lovable/components/feed/ProfileView';
import type { FavEventItem, FavPlaceItem } from '@lovable/components/feed/FavoritesView';
import type { ProfileCommentItem } from '@lovable/components/feed/ProfileCommentsView';
import type { ProfileListUser } from '@lovable/components/feed/FollowersSheet';
import { groupedTicketsToLovable } from '../lovable-bridge/ticketsAdapter';
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
    avatarUrl: resolveImageUrl(entry.avatarUrl) || undefined,
  };
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [storyViewerUserId, setStoryViewerUserId] = useState<string | null>(null);
  const { refreshStories, hasActiveStory } = useActiveStoryAuthors();

  const [loading, setLoading] = useState(true);
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
  const [ticketsCount, setTicketsCount] = useState(0);
  const [rating, setRating] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'avatar' | 'cover' | null>(null);
  const [publishedServices, setPublishedServices] = useState<ServiceFormData[]>([]);
  const [myVenuesCount, setMyVenuesCount] = useState(0);

  const reload = useCallback(async (forceNetwork = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    if (!forceNetwork) {
      const cached = getProfilePageCache(userId);
      if (cached?.profile) {
        setProfile(cached.profile);
        setStats(cached.stats);
        setMyEventsCount(cached.myEventsCount);
        setTicketsCount(cached.ticketsCount);
        setMyVenuesCount(cached.myVenuesCount);
        setFollowersCount(cached.followersCount);
        setFollowingCount(cached.followingCount);
        setRating(cached.rating);
        setCommentsCount(cached.commentsCount);
        setLoading(false);
      }
    } else {
      invalidateProfilePageCache(userId);
    }

    setLoading((prev) => prev || !getProfilePageCache(userId));
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
      ] = await Promise.all([
        fetchUserById(userId),
        fetchUserStats(userId).catch(() => null),
        fetchUserEvents(userId, { forceNetwork, allEvents: true }).catch(() => ({ data: { datosEvento: [] } })),
        fetchFollowersCount(userId).catch(() => ({ count: 0 })),
        fetchFollowingCount(userId).catch(() => 0),
        fetchGroupedUserTickets(userId).catch(() => null),
        fetchUserServiceComments(userId).catch(() => []),
        fetchFollowersList(userId).catch(() => []),
        fetchFollowingList(userId).catch(() => []),
        fetchFavoriteUserEvents(userId).catch(() => []),
        fetchUserPublications(userId).catch(() => []),
        fetchUserLikedPublications(userId).catch(() => []),
        fetchOwnerProfileVenues(userId).catch(() => []),
        fetchServicesByUserId(userId, { forceNetwork, includeInactive: true }).catch(() => []),
      ]);
      setProfile(userProfile);
      setStats(userStats);
      setFollowersCount(followers.count || 0);
      setFollowingCount(typeof following === 'number' ? following : 0);
      setFollowersList(followersData.map(toProfileListUser));
      setFollowingList(followingData.map(toProfileListUser));
      setMyEventsCount(events.data?.datosEvento?.length || 0);
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
      setPublishedServices((userServices || []).map(nearbyServiceToFormData));
      setMyVenuesCount(userVenues.length);
      if (tickets) {
        const lovable = groupedTicketsToLovable(tickets);
        setTicketsCount(lovable.filter((t) => t.status === 'aprobada').length);
      } else {
        setTicketsCount(0);
      }
      setRating(userProfile?.calificacion || userStats?.calificacionPromedio || 0);
      setCommentsCount(comments?.length || 0);
      cacheProfilePageSnapshot({
        userId,
        profile: userProfile,
        stats: userStats,
        myEventsCount: events.data?.datosEvento?.length || 0,
        ticketsCount: tickets ? groupedTicketsToLovable(tickets).filter((t) => t.status === 'aprobada').length : 0,
        myVenuesCount: userVenues.length,
        followersCount: followers.count || 0,
        followingCount: typeof following === 'number' ? following : 0,
        rating: userProfile?.calificacion || userStats?.calificacionPromedio || 0,
        commentsCount: comments?.length || 0,
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
    const onCacheInvalidated = () => { void reload(true); };
    window.addEventListener(EVENTS_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    window.addEventListener(SERVICES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    window.addEventListener(VENUES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    window.addEventListener(PROFILE_PAGE_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    return () => {
      window.removeEventListener(EVENTS_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
      window.removeEventListener(SERVICES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
      window.removeEventListener(VENUES_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
      window.removeEventListener(PROFILE_PAGE_CACHE_INVALIDATED_EVENT, onCacheInvalidated);
    };
  }, [reload]);

  const handleAvatarUpload = async (file: File) => {
    if (!userId) return;
    setUploading(true);
    try {
      const newUrl = await uploadProfileAvatar(userId, file);
      const busted = appendImageCacheBuster(newUrl, Date.now()) || newUrl;
      invalidateProfilePageCache(userId);
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
      invalidateProfilePageCache(userId);
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
      invalidateProfilePageCache(userId);
      invalidateCachedProfile(userId);
      if (target === 'avatar') {
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
  }) => {
    if (!userId) return;
    await updateUserProfile({
      id: userId,
      name: data.nombres,
      lastName: data.apellidos,
      phone: data.phone,
      user: data.username,
      description: data.bio,
    });
    await reload();
    showToast('Perfil actualizado', 'success');
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-secondary">
        <Loader />
      </div>
    );
  }

  const profileName = [profile?.nombre, profile?.apellido].filter(Boolean).join(' ')
    || profile?.username
    || 'Eventer';
  const eventsDone = stats?.eventosRealizados ?? stats?.experienciaEventosRealizados ?? myEventsCount;

  return (
    <>
      <ProfileView
        userId={userId || undefined}
        profileName={profileName}
        profileUsername={profile?.username ? `@${profile.username}` : '@eventer'}
        profileAvatar={profile?.imagen || undefined}
        profileCover={profile?.coverImageUrl || undefined}
        profileBio={profile?.bio || ''}
        profileEmail={profile?.email}
        profilePhone={profile?.phone}
        profileDocument={profile?.documento}
        profileCity={profile?.ciudad}
        profileAddress={profile?.direccion}
        followersCount={followersCount}
        followingCount={followingCount}
        followersList={followersList}
        followingList={followingList}
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
        myVenuesCount={myVenuesCount || stats?.UserPlaces || 0}
        myServicesCount={publishedServices.length || stats?.UserServices || 0}
        myInvitationsCount={stats?.totalInvitaciones || stats?.UserInvitations || 0}
        myTicketsCount={ticketsCount}
        myGuestsCount={stats?.Invitados || 0}
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
        onOpenMyTickets={() => navigate('/tickets', { state: { from: 'profile' } })}
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
        onClose={() => setStoryViewerUserId(null)}
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
