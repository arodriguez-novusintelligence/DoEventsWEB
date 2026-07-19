import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  canMessageUser,
  canViewUserContent,
  EVENTS_CACHE_INVALIDATED_EVENT,
  SOCIAL_GRAPH_UPDATED_EVENT,
  fetchFollowersCount,
  fetchFollowersList,
  fetchFollowingCount,
  fetchFollowingList,
  fetchOwnerProfileVenues,
  fetchProfileGallery,
  fetchServicesByUserId,
  fetchUserById,
  fetchUserEvents,
  fetchUserPublications,
  fetchUserServiceComments,
  fetchUserStats,
  followUser,
  formatTenure,
  getDirectMessageBlockReason,
  getExperienceLabel,
  getExperienceSegment,
  Loader,
  resolveGalleryDisplayUrl,
  resolveImageUrl,
  resolveUserAvatarUrl,
  resolveUserDisplayName,
  RootState,
  unfollowUser,
  useToast,
  userIdsMatch,
  type UserProfile,
  type UserStats,
} from '@doevents/shared';
import OtherUserProfileView, {
  type OtherUserEventItem,
  type OtherUserServiceItem,
  type OtherUserVenueItem,
} from '../lovable/components/feed/OtherUserProfileView';
import type { ProfileCommentItem } from '../lovable/components/feed/ProfileCommentsView';
import type { ProfileListUser } from '../lovable/components/feed/FollowersSheet';
import { StoryViewer } from '../components/StoryViewer';
import { useActiveStoryAuthors } from '../contexts/StoriesContext';
import { feedPublicationToLovablePost } from '../lovable-bridge/feedAdapter';
import { serviceCoverUrl } from '../lovable-bridge/serviceFormMapper';
import { filterVisibleUserEvents } from '../lovable-bridge/discoverEventFilters';

function toProfileListUser(entry: { id: string; name: string; avatarUrl?: string | null }): ProfileListUser {
  const name = entry.name || 'Usuario';
  return {
    id: entry.id,
    name,
    initials: name.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'DE',
    avatarUrl: resolveUserAvatarUrl(entry.avatarUrl, entry.id) || undefined,
  };
}

export const PublicUserProfilePage: React.FC = () => {
  const { userId: profileUserId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const viewerId = useSelector((s: RootState) => s.auth.idUser);
  const isOwnProfile = Boolean(viewerId && profileUserId && viewerId === profileUserId);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [followPending, setFollowPending] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [followRequestOpen, setFollowRequestOpen] = useState(false);
  const [storyViewerUserId, setStoryViewerUserId] = useState<string | null>(null);
  const { hasActiveStory } = useActiveStoryAuthors();

  const [publications, setPublications] = useState<ReturnType<typeof feedPublicationToLovablePost>[]>([]);
  const [events, setEvents] = useState<OtherUserEventItem[]>([]);
  const [venues, setVenues] = useState<OtherUserVenueItem[]>([]);
  const [services, setServices] = useState<OtherUserServiceItem[]>([]);
  const [profileComments, setProfileComments] = useState<ProfileCommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [followersList, setFollowersList] = useState<ProfileListUser[]>([]);
  const [followingList, setFollowingList] = useState<ProfileListUser[]>([]);

  const loadProfile = useCallback(async (options?: { silent?: boolean }) => {
    if (!profileUserId) return;
    if (!options?.silent) setLoading(true);
    try {
      const [user, followersResult, followingN, userStats] = await Promise.all([
        fetchUserById(profileUserId),
        fetchFollowersCount(profileUserId, viewerId || undefined).catch(() => ({
          count: 0,
          isFollowing: false,
          followStatus: 'none' as const,
        })),
        fetchFollowingCount(profileUserId).catch(() => 0),
        fetchUserStats(profileUserId).catch(() => null),
      ]);

      if (!user) {
        setProfile(null);
        return;
      }

      const isFollowingAccepted = followersResult.isFollowing || followersResult.followStatus === 'accepted';
      const canSeeContent = canViewUserContent({
        isOwnProfile: Boolean(viewerId && profileUserId && viewerId === profileUserId),
        isPublicProfile: user.isPublicProfile !== false,
        isFollowing: isFollowingAccepted,
      });

      setProfile(user);
      setStats(userStats);
      setFollowersCount(followersResult.count);
      setFollowing(isFollowingAccepted);
      setFollowPending(followersResult.followStatus === 'pending');
      setFollowingCount(followingN);

      if (canSeeContent) {
        const [
          userEvents,
          userPublications,
          userVenues,
          userServices,
          comments,
          followersData,
          followingData,
        ] = await Promise.all([
          fetchUserEvents(profileUserId).catch(() => ({ data: { datosEvento: [] } })),
          fetchUserPublications(profileUserId).catch(() => []),
          fetchOwnerProfileVenues(profileUserId).catch(() => []),
          fetchServicesByUserId(profileUserId).catch(() => []),
          fetchUserServiceComments(profileUserId).catch(() => []),
          fetchFollowersList(profileUserId).catch(() => []),
          fetchFollowingList(profileUserId).catch(() => []),
        ]);

        const visibleEvents = filterVisibleUserEvents(userEvents.data?.datosEvento || []);
        setEvents(visibleEvents.map((ev) => ({
          id: ev.id,
          title: ev.nombre || 'Evento',
          date: ev.fechaIni,
          location: [ev.ciudad, ev.departamento].filter(Boolean).join(', '),
          description: ev.descripcion,
          image: resolveImageUrl(ev.imagenPrincipal || ev.imagen) || undefined,
          status: String(ev.estatus || '').toLowerCase(),
        })));

        setPublications(
          userPublications
            .filter((pub) => pub.type !== 'story')
            .map(feedPublicationToLovablePost),
        );

        setVenues(userVenues.map((v) => ({
          id: v.venueId || v.id,
          name: v.name || v.nombre || 'Lugar',
          address: v.address || v.direccion,
          type: v.type || v.tipo,
          capacity: v.capacity || v.capacidad,
          image: resolveImageUrl(v.image || v.imagen) || undefined,
        })));

        setServices(userServices.map((s) => ({
          id: s.serviceId,
          title: s.sectors?.[0] || s.category || s.role || 'Servicio',
          activities: s.activities?.length || Object.keys(s.pricing || {}).length || 0,
          priceLabel: s.priceFrom ? `Desde ${s.priceFrom}` : undefined,
          image: serviceCoverUrl(s) || undefined,
        })));

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

        setFollowersList(followersData.map(toProfileListUser));
        setFollowingList(followingData.map(toProfileListUser));
      } else {
        setPublications([]);
        setEvents([]);
        setVenues([]);
        setServices([]);
        setProfileComments([]);
        setFollowersList([]);
        setFollowingList([]);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al cargar perfil', 'error');
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [profileUserId, showToast, viewerId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const onFollowGraphChanged = () => { void loadProfile({ silent: true }); };
    window.addEventListener(SOCIAL_GRAPH_UPDATED_EVENT, onFollowGraphChanged);
    window.addEventListener(EVENTS_CACHE_INVALIDATED_EVENT, onFollowGraphChanged);
    return () => {
      window.removeEventListener(SOCIAL_GRAPH_UPDATED_EVENT, onFollowGraphChanged);
      window.removeEventListener(EVENTS_CACHE_INVALIDATED_EVENT, onFollowGraphChanged);
    };
  }, [loadProfile]);

  useEffect(() => {
    if (isOwnProfile) {
      navigate('/profile', { replace: true });
    }
  }, [isOwnProfile, navigate]);

  const reloadComments = useCallback(async () => {
    if (!profileUserId) return;
    setCommentsLoading(true);
    setCommentsError(null);
    try {
      const comments = await fetchUserServiceComments(profileUserId);
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
    } catch (err) {
      setCommentsError(err instanceof Error ? err.message : 'No se pudieron cargar los comentarios');
    } finally {
      setCommentsLoading(false);
    }
  }, [profileUserId]);

  const openFollowAction = () => {
    if (!viewerId || !profileUserId || followBusy) {
      if (!viewerId) showToast('Inicia sesión para seguir usuarios', 'error');
      return;
    }
    if (following) {
      void handleFollow();
      return;
    }
    if (followPending) {
      void handleFollow();
      return;
    }
    if (profile?.isPublicProfile === false) {
      setFollowRequestOpen(true);
      return;
    }
    void handleFollow();
  };

  const sendFollowRequest = async () => {
    setFollowRequestOpen(false);
    await handleFollow();
  };

  const loadGalleryPhotos = async () => {
    if (!profileUserId) return;
    setGalleryLoading(true);
    try {
      const images = await fetchProfileGallery(profileUserId);
      setGalleryPhotos(
        images.map((img) => resolveGalleryDisplayUrl(img)).filter(Boolean),
      );
    } catch {
      setGalleryPhotos([]);
    } finally {
      setGalleryLoading(false);
    }
  };

  const openGallery = async () => {
    const canAccess = profile && canViewUserContent({
      isOwnProfile,
      isPublicProfile: profile.isPublicProfile !== false,
      isFollowing: following,
    });
    if (!canAccess) {
      showToast('Sigue a este usuario o solicita acceso para ver sus fotos', 'error');
      return;
    }
    await loadGalleryPhotos();
  };

  const openChat = () => {
    if (!viewerId) {
      showToast('Inicia sesión para enviar mensajes', 'error');
      return;
    }
    if (followPending) {
      showToast('Debes esperar a que acepte tu solicitud de seguimiento para enviar mensajes.', 'error');
      return;
    }
    const isPublic = profile?.isPublicProfile !== false;
    const blockReason = getDirectMessageBlockReason({
      isPublicProfile: isPublic,
      isFollowing: following,
      followPending,
    });
    if (blockReason || !canMessageUser({ isPublicProfile: isPublic, isFollowing: following })) {
      showToast(blockReason || 'Sigue a este usuario para enviar mensajes', 'error');
      return;
    }
    if (!profileUserId) return;
    const returnTo = `/users/${encodeURIComponent(profileUserId)}`;
    navigate(
      `/chat?peerId=${encodeURIComponent(profileUserId)}&returnTo=${encodeURIComponent(returnTo)}`,
    );
  };

  const handleFollow = async () => {
    if (!viewerId || !profileUserId || followBusy) {
      if (!viewerId) showToast('Inicia sesión para seguir usuarios', 'error');
      return;
    }

    setFollowBusy(true);
    try {
      if (following) {
        await unfollowUser(viewerId, profileUserId);
        setFollowing(false);
        setFollowPending(false);
        setFollowersCount((c) => Math.max(0, c - 1));
        showToast('Dejaste de seguir a este usuario', 'success');
        await loadProfile();
      } else if (followPending) {
        await unfollowUser(viewerId, profileUserId);
        setFollowPending(false);
        setFollowing(false);
        showToast('Solicitud de seguimiento cancelada', 'success');
      } else {
        const result = await followUser(viewerId, profileUserId);
        if (result.status === 'pending') {
          setFollowPending(true);
          setFollowing(false);
          showToast(result.message || 'Solicitud de seguimiento enviada', 'success');
        } else {
          setFollowing(true);
          setFollowPending(false);
          setFollowersCount((c) => c + 1);
          showToast(result.message || 'Ahora sigues a este usuario', 'success');
          await loadProfile();
        }
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo actualizar el seguimiento', 'error');
    } finally {
      setFollowBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="de-profile-page">
        <Loader />
      </div>
    );
  }

  if (!profile || !profileUserId) {
    return (
      <div className="de-profile-page de-empty-state">
        <p>Perfil no encontrado.</p>
        <button type="button" onClick={() => navigate(-1)}>Volver</button>
      </div>
    );
  }

  const displayName = resolveUserDisplayName(profile) || profile.username || 'Usuario';
  const username = profile.username || '';
  const initials = displayName.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'DE';
  const eventsFinished = stats?.eventosRealizados ?? stats?.eventosFinalizados ?? events.length;
  const rating = stats?.calificacionPromedio || profile.calificacion || 0;
  const tenureLabel = formatTenure(profile.createDate) || '—';
  const canSeeContent = canViewUserContent({
    isOwnProfile,
    isPublicProfile: profile.isPublicProfile !== false,
    isFollowing: following,
  });
  const cityLabel = profile.ciudad || profile.departamento
    ? `📍 ${[profile.ciudad, profile.departamento].filter(Boolean).join(', ')}`
    : undefined;

  return (
    <div className="de-profile-page bg-secondary min-h-screen">
      <OtherUserProfileView
        displayName={displayName}
        username={username}
        initials={initials}
        avatarUrl={resolveUserAvatarUrl(profile.imagen, profileUserId)}
        coverUrl={profile.coverImageUrl}
        bio={profile.bio}
        cityLabel={cityLabel}
        canViewContent={canSeeContent}
        isPrivateProfile={profile.isPublicProfile === false}
        isFollowing={following}
        followPending={followPending}
        followBusy={followBusy}
        followersCount={followersCount}
        followingCount={followingCount}
        likesCount={profile.likesReceivedCount || 0}
        experienceLabel={getExperienceLabel(eventsFinished)}
        experienceSegment={getExperienceSegment(eventsFinished)}
        tenureLabel={tenureLabel}
        rating={rating}
        commentsCount={profileComments.length}
        publicationsCount={publications.length}
        eventsCount={events.length}
        venuesCount={venues.length}
        servicesCount={services.length}
        publications={publications}
        events={events}
        venues={venues}
        services={services}
        galleryPhotos={galleryPhotos}
        galleryLoading={galleryLoading}
        profileComments={profileComments}
        profileCommentsLoading={commentsLoading}
        profileCommentsError={commentsError}
        viewerId={viewerId || undefined}
        profileUserId={profileUserId}
        followersList={followersList}
        followingList={followingList}
        onBack={() => navigate(-1)}
        onFollowAction={openFollowAction}
        onOpenGallery={openGallery}
        onOpenChat={openChat}
        onOpenEvent={(eventId) => navigate(`/events/${eventId}`)}
        onOpenVenue={(venueId) => navigate(`/events?venue=${encodeURIComponent(venueId)}`)}
        onOpenService={(serviceId) => navigate(`/services/${serviceId}`)}
        onOpenServicesPage={() => navigate(`/users/${profileUserId}/services`)}
        onRetryComments={() => void reloadComments()}
      />

      <StoryViewer
        open={Boolean(storyViewerUserId)}
        authorUserId={storyViewerUserId}
        currentUserId={viewerId}
        onClose={() => setStoryViewerUserId(null)}
        onOpenProfile={(id) => {
          if (viewerId && userIdsMatch(id, viewerId)) navigate('/profile');
          else navigate(`/users/${encodeURIComponent(id)}`);
        }}
      />

      {followRequestOpen && (
        <div
          role="presentation"
          onClick={() => setFollowRequestOpen(false)}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 p-5"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="follow-request-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl"
          >
            <h3 id="follow-request-title" className="text-lg font-extrabold text-foreground">
              Solicitud de seguimiento
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Se enviará una solicitud de seguimiento a este usuario.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFollowRequestOpen(false)}
                className="px-3 py-2 text-sm font-bold text-primary"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={() => void sendFollowRequest()}
                disabled={followBusy}
                className="px-3 py-2 text-sm font-bold text-primary disabled:opacity-60"
              >
                ENVIAR SOLICITUD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicUserProfilePage;
