import React, { useCallback, useEffect, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { useSelector } from 'react-redux';

import {

  fetchFollowersCount,

  fetchFollowingCount,

  fetchUserById,

  fetchUserEvents,

  fetchServicesByUserId,

  fetchUserStats,

  followUser,

  formatTenure,

  getExperienceLabel,

  getExperienceSegment,

  Loader,

  RootState,

  unfollowUser,

  UserAvatar,

  UserEventItem,

  UserProfile,

  UserStats,

  useToast,

} from '@doevents/shared';

import { FollowersSheet } from '../components/FollowersSheet';
import { StoryAvatar } from '../components/StoryAvatar';
import { StoryViewer } from '../components/StoryViewer';
import { useActiveStoryAuthors } from '../contexts/StoriesContext';



export const PublicUserProfilePage: React.FC = () => {

  const { userId: profileUserId } = useParams<{ userId: string }>();

  const navigate = useNavigate();

  const { showToast } = useToast();

  const viewerId = useSelector((s: RootState) => s.auth.idUser);

  const isOwnProfile = Boolean(viewerId && profileUserId && viewerId === profileUserId);



  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [stats, setStats] = useState<UserStats | null>(null);

  const [events, setEvents] = useState<UserEventItem[]>([]);

  const [followersCount, setFollowersCount] = useState(0);

  const [followingCount, setFollowingCount] = useState(0);

  const [following, setFollowing] = useState(false);

  const [followBusy, setFollowBusy] = useState(false);

  const [followersSheet, setFollowersSheet] = useState<'followers' | 'following' | null>(null);

  const [storyViewerUserId, setStoryViewerUserId] = useState<string | null>(null);

  const { hasActiveStory } = useActiveStoryAuthors();

  const [servicesCount, setServicesCount] = useState(0);



  const loadProfile = useCallback(async () => {

    if (!profileUserId) return;

    setLoading(true);

    try {

      const [user, mine, followersResult, followingN, userStats, userServices] = await Promise.all([

        fetchUserById(profileUserId),

        fetchUserEvents(profileUserId).catch(() => ({ data: { datosEvento: [] } })),

        fetchFollowersCount(profileUserId, viewerId || undefined).catch(() => ({ count: 0, isFollowing: false })),

        fetchFollowingCount(profileUserId).catch(() => 0),

        fetchUserStats(profileUserId).catch(() => null),

        fetchServicesByUserId(profileUserId).catch(() => []),

      ]);

      setProfile(user);

      setStats(userStats);

      setEvents(mine.data?.datosEvento || []);

      setFollowersCount(followersResult.count);

      setFollowing(followersResult.isFollowing);

      setFollowingCount(followingN);

      setServicesCount(userServices.length);

    } catch (err) {

      showToast(err instanceof Error ? err.message : 'Error al cargar perfil', 'error');

    } finally {

      setLoading(false);

    }

  }, [profileUserId, showToast, viewerId]);



  useEffect(() => {

    loadProfile();

  }, [loadProfile]);



  useEffect(() => {

    if (isOwnProfile) {

      navigate('/profile', { replace: true });

    }

  }, [isOwnProfile, navigate]);



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

        setFollowersCount((c) => Math.max(0, c - 1));

        showToast('Dejaste de seguir a este usuario', 'success');

      } else {

        const result = await followUser(viewerId, profileUserId);

        setFollowing(true);

        setFollowersCount((c) => c + 1);

        showToast(result.message || 'Ahora sigues a este usuario', 'success');

      }

    } catch (err) {

      showToast(err instanceof Error ? err.message : 'No se pudo actualizar el seguimiento', 'error');

    } finally {

      setFollowBusy(false);

    }

  };



  if (loading) {

    return <div className="de-profile-page"><Loader /></div>;

  }



  if (!profile) {

    return (

      <div className="de-profile-page de-empty-state">

        <p>Perfil no encontrado.</p>

        <button type="button" onClick={() => navigate(-1)}>Volver</button>

      </div>

    );

  }



  const displayName = [profile.nombre, profile.apellido].filter(Boolean).join(' ') || profile.username || 'Eventer';

  const username = profile.username ? `@${profile.username}` : '';

  const eventsFinished = stats?.eventosRealizados ?? stats?.eventosFinalizados ?? 0;

  const rating = stats?.calificacionPromedio || profile.calificacion || 0;

  const tenure = formatTenure(profile.createDate);

  const experienceSeg = getExperienceSegment(eventsFinished);

  const experienceLabel = getExperienceLabel(eventsFinished);

  const activeEvents = events.filter((e) => {

    const status = String((e as { estatus?: string }).estatus || '').toLowerCase();

    return !status || ['activo', 'active', 'publicado', 'published'].includes(status);

  });

  const pastEvents = events.filter((e) => !activeEvents.includes(e));



  return (

    <div className="de-profile-page">

      <div className="de-profile-lovable">

        <button type="button" className="de-back-btn" onClick={() => navigate(-1)}>← Volver</button>



        <article className="de-profile-hero-card">

          <div

            className="de-profile-cover"

            style={profile.coverImageUrl ? { backgroundImage: `url(${profile.coverImageUrl})` } : undefined}

          />

          <div className="de-profile-hero-body">

            <div className="de-profile-avatar-wrap">

              <StoryAvatar
                userId={profileUserId}
                name={displayName}
                imageUrl={profile.imagen}
                size={96}
                onClick={() => {
                  if (profileUserId && hasActiveStory(profileUserId)) {
                    setStoryViewerUserId(profileUserId);
                  }
                }}
              />

            </div>

            <div className="de-profile-header-row">

              <div>

                <h2 className="de-profile-name">{displayName}</h2>

                {username && <p className="de-profile-username">{username}</p>}

                {(profile.ciudad || profile.departamento) && (

                  <p className="de-profile-username">

                    📍 {[profile.ciudad, profile.departamento].filter(Boolean).join(', ')}

                  </p>

                )}

              </div>

              {viewerId && !isOwnProfile && (

                <button

                  type="button"

                  className="de-profile-edit-btn"

                  onClick={handleFollow}

                  disabled={followBusy}

                >

                  {following ? 'Siguiendo' : '+ Seguir'}

                </button>

              )}

            </div>

            {profile.bio && <p className="de-profile-bio">{profile.bio}</p>}

            {servicesCount > 0 && (
              <button
                type="button"
                className="de-profile-edit-btn"
                style={{ marginTop: 12, width: '100%' }}
                onClick={() => navigate(`/users/${profileUserId}/services`)}
              >
                Ver {servicesCount} {servicesCount === 1 ? 'servicio' : 'servicios'} publicados
              </button>
            )}

            <div className="de-profile-stats-row">

              <button type="button" className="de-profile-stat-btn" onClick={() => setFollowersSheet('followers')}>

                <strong>{followersCount}</strong><span>Seguidores</span>

              </button>

              <button type="button" className="de-profile-stat-btn" onClick={() => setFollowersSheet('following')}>

                <strong>{followingCount}</strong><span>Seguidos</span>

              </button>

              <div className="de-profile-stat-btn">

                <strong>♥ {profile.likesReceivedCount || 0}</strong>

              </div>

            </div>

          </div>

        </article>



        <article className="de-profile-section-card de-profile-experience">

          <h3>Experiencia de servicio</h3>

          <div className="de-profile-experience__bar" aria-hidden="true">

            {[1, 2, 3, 4].map((seg) => (

              <span

                key={seg}

                className={`de-profile-experience__seg de-profile-experience__seg--${seg}${experienceSeg >= seg ? '' : ' de-profile-experience__seg--inactive'}`}

              />

            ))}

          </div>

          <p className="de-profile-experience__label">{experienceLabel}</p>

          <div className="de-profile-plan-row de-profile-experience__stats">

            <div>

              <strong style={{ fontSize: 24 }}>{rating > 0 ? rating.toFixed(1) : '0.0'}</strong>

              <span style={{ marginLeft: 4 }}>⭐</span>

              <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Calificación</p>

            </div>

            <div>

              <strong style={{ fontSize: 24 }}>{eventsFinished}</strong>

              <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Eventos realizados</p>

            </div>

            <div>

              <strong style={{ fontSize: 24 }}>{tenure || 'Nuevo'}</strong>

              <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Antigüedad</p>

            </div>

            <div>

              <strong style={{ fontSize: 24 }}>{activeEvents.length}</strong>

              <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Eventos actuales</p>

            </div>

          </div>

        </article>



        {activeEvents.length > 0 && (

          <article className="de-profile-section-card">

            <h3>Eventos actuales</h3>

            <ul className="de-public-profile-events">

              {activeEvents.map((ev) => (

                <li key={ev.id}>

                  <button type="button" onClick={() => navigate(`/events/${ev.id}`)}>

                    <strong>{ev.nombre}</strong>

                    <span>{[ev.ciudad, ev.fechaIni].filter(Boolean).join(' · ')}</span>

                  </button>

                </li>

              ))}

            </ul>

          </article>

        )}



        {pastEvents.length > 0 && (

          <article className="de-profile-section-card">

            <h3>Eventos anteriores</h3>

            <ul className="de-public-profile-events">

              {pastEvents.slice(0, 8).map((ev) => (

                <li key={ev.id}>

                  <button type="button" onClick={() => navigate(`/events/${ev.id}`)}>

                    <strong>{ev.nombre}</strong>

                    <span>{[ev.ciudad, ev.fechaIni].filter(Boolean).join(' · ')}</span>

                  </button>

                </li>

              ))}

            </ul>

          </article>

        )}

      </div>



      {profileUserId && followersSheet && (

        <FollowersSheet

          open

          userId={profileUserId}

          viewerId={viewerId || undefined}

          tab={followersSheet}

          onClose={() => setFollowersSheet(null)}

        />

      )}

      <StoryViewer
        open={Boolean(storyViewerUserId)}
        authorUserId={storyViewerUserId}
        currentUserId={viewerId}
        onClose={() => setStoryViewerUserId(null)}
      />

    </div>

  );

};



export default PublicUserProfilePage;

