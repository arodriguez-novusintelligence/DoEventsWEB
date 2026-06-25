import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  clearSession,
  fetchUserById,
  fetchUserChatRooms,
  isPlatformAdmin,
  PROFILE_PAGE_CACHE_INVALIDATED_EVENT,
  resolveImageUrl,
  RootState,
} from '@doevents/shared';
import TopHeader from '@lovable/components/feed/TopHeader';
import BottomNav from '@lovable/components/feed/BottomNav';
import { NotificationsProvider } from '@lovable/contexts/NotificationsContext';
import { PrivacyProvider } from '@lovable/contexts/PrivacyContext';
import { CompanyProvider } from '@lovable/contexts/CompanyContext';
import { KycProvider } from '@lovable/contexts/KycContext';
import { StoriesProvider } from '../contexts/StoriesContext';
import { Toaster } from '@lovable/components/ui/sonner';
import CreateFAB from '@lovable/components/feed/CreateFAB';
import AIAssistantFAB from '@lovable/components/ai/AIAssistantFAB';

const BOTTOM_NAV_ROUTES = ['/', '/events', '/map', '/profile'];

const PROFILE_SUB_ROUTES = [
  '/profile/publications',
  '/profile/venues',
  '/profile/stats',
  '/profile/invitations',
  '/profile/refunds',
  '/my-events',
  '/tickets',
  '/guests',
  '/access',
];

/** Rutas donde no mostramos el menú hamburguesa (chat/checkout tienen UI propia). */
function shouldHideHeader(pathname: string): boolean {
  return pathname.startsWith('/chat')
    || pathname.includes('/checkout')
    || pathname.startsWith('/assistant');
}

/** Ocultar FAB de creación en flujos de creación/edición/detalle. */
function shouldHideCreateFab(pathname: string): boolean {
  if (pathname.includes('/create') || pathname.includes('/publish') || pathname.includes('/edit')) {
    return true;
  }
  if (/^\/events\/[^/]+$/.test(pathname)) return true;
  if (/^\/services\/[^/]+$/.test(pathname)) return true;
  if (/^\/places\/[^/]+$/.test(pathname)) return true;
  return false;
}

function resolveActiveTab(pathname: string): string {
  if (pathname === '/' || pathname.startsWith('/users/')) return 'wall';
  if (pathname.startsWith('/events')) return 'eventos';
  if (pathname.startsWith('/map')) return 'mapa';
  if (pathname.startsWith('/profile')) return 'perfil';
  return 'wall';
}

export const LovableLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [profileName, setProfileName] = useState('Eventer');
  const [profileUsername, setProfileUsername] = useState('@eventer');
  const [profileAvatar, setProfileAvatar] = useState<string | undefined>();
  const [chatUnread, setChatUnread] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  const fullBleedRoute = useMemo(
    () => location.pathname.startsWith('/chat')
      || location.pathname.startsWith('/events/create')
      || location.pathname.includes('/checkout')
      || location.pathname.startsWith('/guests')
      || location.pathname.startsWith('/access')
      || location.pathname.startsWith('/tickets')
      || location.pathname.startsWith('/admin')
      || location.pathname.startsWith('/assistant')
      || location.pathname === '/my-events'
      || /^\/events\/[^/]+$/.test(location.pathname),
    [location.pathname],
  );

  useEffect(() => {
    if (!userId) return;
    const loadProfile = () => {
      fetchUserById(userId)
        .then((profile) => {
          if (!profile) return;
          const name = [profile.nombre, profile.apellido].filter(Boolean).join(' ')
            || profile.username
            || 'Eventer';
          setProfileName(name);
          setProfileUsername(profile.username ? `@${profile.username}` : '@eventer');
          setProfileAvatar(resolveImageUrl(profile.imagen) || undefined);
          setIsAdmin(isPlatformAdmin(profile.platformRole));
        })
        .catch(() => undefined);
    };
    loadProfile();
    const onProfileUpdated = () => { loadProfile(); };
    window.addEventListener(PROFILE_PAGE_CACHE_INVALIDATED_EVENT, onProfileUpdated);
    return () => {
      window.removeEventListener(PROFILE_PAGE_CACHE_INVALIDATED_EVENT, onProfileUpdated);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setChatUnread(0);
      return;
    }
    fetchUserChatRooms(userId)
      .then((rooms) => {
        const total = rooms.reduce((acc, room) => acc + (room.unreadCount || 0), 0);
        setChatUnread(total);
      })
      .catch(() => setChatUnread(0));
  }, [userId, location.pathname]);

  const showHeader = useMemo(
    () => !shouldHideHeader(location.pathname),
    [location.pathname],
  );

  const hideCreateFab = useMemo(
    () => shouldHideCreateFab(location.pathname) || location.pathname.startsWith('/assistant'),
    [location.pathname],
  );

  const showAiFab = useMemo(
    () => !location.pathname.startsWith('/assistant')
      && !location.pathname.startsWith('/chat')
      && !hideCreateFab,
    [location.pathname, hideCreateFab],
  );

  const showBottomNav = useMemo(
    () => BOTTOM_NAV_ROUTES.includes(location.pathname)
      || location.pathname.startsWith('/profile/plan')
      || location.pathname === '/profile/gallery'
      || PROFILE_SUB_ROUTES.some((r) => location.pathname === r || location.pathname.startsWith(`${r}/`))
      || (location.pathname.startsWith('/users/') && location.pathname.endsWith('/services')),
    [location.pathname],
  );

  const handleNavigate = (section: string) => {
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

  const handleTabChange = (tab: string) => {
    const routes: Record<string, string> = {
      wall: '/',
      eventos: '/events',
      mapa: '/map',
      perfil: '/profile',
    };
    navigate(routes[tab] || '/');
  };

  return (
    <StoriesProvider currentUserId={userId}>
    <KycProvider userId={userId}>
    <CompanyProvider userId={userId}>
    <NotificationsProvider userId={userId || undefined}>
      <PrivacyProvider>
        <div className="min-h-screen bg-background overflow-x-hidden">
          <div className={`relative mx-auto min-h-screen w-full bg-background ${fullBleedRoute ? '' : 'max-w-lg shadow-sm'}`}>
            {showHeader && (
              <div className="fixed inset-x-0 top-0 z-[100] mx-auto w-full max-w-lg">
                <TopHeader
                  onGoHome={() => navigate('/')}
                  onNavigate={handleNavigate}
                  onGoToTickets={() => navigate('/tickets')}
                  onGoToEvent={(eventName) => navigate('/search', { state: { q: eventName } })}
                  onGoToEventById={(id) => navigate(`/events/${id}`)}
                  onGoToPlace={(venueId) => navigate(`/places/${venueId}`)}
                  onGoToService={(serviceId) => navigate(`/services/${serviceId}`)}
                  onGoToPost={() => navigate('/')}
                  onViewProfile={() => navigate(userId ? '/profile' : '/auth/login')}
                  onSearch={() => navigate('/search')}
                  onGoToAdmin={() => navigate('/admin')}
                  onLogout={() => {
                    clearSession();
                    navigate('/auth/login');
                  }}
                  profileName={profileName}
                  profileUsername={profileUsername}
                  profileAvatar={profileAvatar}
                  profileUserId={userId || undefined}
                  unreadMessages={chatUnread}
                  isAdmin={isAdmin}
                />
              </div>
            )}
            <main className={`${showHeader ? 'pt-[60px]' : ''} ${showBottomNav ? 'pb-28' : 'pb-4'} overflow-x-hidden`}>
              <Outlet />
            </main>
            {showBottomNav && (
              <BottomNav
                activeTab={resolveActiveTab(location.pathname)}
                onTabChange={handleTabChange}
                onCreate={() => setCreateMenuOpen(true)}
              />
            )}
            {!hideCreateFab && (
              <CreateFAB
                open={createMenuOpen}
                onOpenChange={setCreateMenuOpen}
                onCreatePost={() => window.dispatchEvent(new Event('de-open-create-post'))}
                onCreateEvent={() => navigate('/events/create')}
                onCreateService={() => navigate('/services/create')}
                onPublishSite={() => navigate('/places/publish')}
              />
            )}
            {showAiFab && (
              <AIAssistantFAB onClick={() => navigate('/assistant')} />
            )}
          </div>
        </div>
        <Toaster position="top-center" richColors closeButton />
      </PrivacyProvider>
    </NotificationsProvider>
    </CompanyProvider>
    </KycProvider>
    </StoriesProvider>
  );
};

export default LovableLayout;
