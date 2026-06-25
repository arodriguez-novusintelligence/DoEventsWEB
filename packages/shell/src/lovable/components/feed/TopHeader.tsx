import { SlidersHorizontal, Search, Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import SideMenu from './SideMenu';
import NotificationsSheet from './NotificationsSheet';
import { useNotifications } from '@lovable/contexts/NotificationsContext';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';

interface TopHeaderProps {
  onGoHome?: () => void;
  onViewProfile?: (user: { name: string; initials: string; userId?: string }) => void;
  onGoToEvent?: (eventName: string) => void;
  onGoToEventById?: (eventId: string) => void;
  onGoToPlace?: (venueId: string) => void;
  onGoToService?: (serviceId: string) => void;
  onGoToTickets?: () => void;
  onGoToPost?: (postId: string) => void;
  onNavigate?: (section: string) => void;
  onSearch?: () => void;
  onLogout?: () => void;
  onGoToAdmin?: () => void;
  isAdmin?: boolean;
  profileName?: string;
  profileUsername?: string;
  profileAvatar?: string;
  profileUserId?: string;
  unreadMessages?: number;
}

const TopHeader = ({
  onGoHome,
  onViewProfile,
  onGoToEvent,
  onGoToEventById,
  onGoToPlace,
  onGoToService,
  onGoToTickets,
  onGoToPost,
  onNavigate,
  onSearch,
  onLogout,
  onGoToAdmin,
  isAdmin = false,
  profileName,
  profileUsername,
  profileAvatar,
  profileUserId,
  unreadMessages = 0,
}: TopHeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const { unreadCount, hasUnread } = useNotifications();

  useEffect(() => {
    const getScrollTop = () => {
      let max = window.scrollY || document.documentElement.scrollTop || 0;
      document
        .querySelectorAll<HTMLElement>('[data-scroll-root], main, .overflow-y-auto, .overflow-auto, .overflow-y-scroll')
        .forEach((el) => {
          if (el.scrollTop > max) max = el.scrollTop;
        });
      return max;
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = getScrollTop();
        const delta = y - lastY.current;
        if (Math.abs(delta) > 6) {
          if (delta > 0 && y > 60) setHidden(true);
          else if (delta < 0) setHidden(false);
          lastY.current = y;
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', onScroll, true);
  }, []);

  const handleViewProfileFromNotif = (user: { name: string; initials: string; userId?: string }) => {
    setNotifOpen(false);
    if (user.userId && user.userId !== profileUserId) {
      onNavigate?.(`user-${user.userId}`);
      return;
    }
    onViewProfile?.(user);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-20 bg-[hsl(230_40%_96%)] transition-transform duration-300 ease-in-out ${
          hidden ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="relative rounded-xl bg-card p-2.5 text-primary shadow-sm transition-colors hover:bg-accent"
          >
            <SlidersHorizontal className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          </button>
          <button
            type="button"
            onClick={onGoHome}
            className="relative text-2xl tracking-tight text-foreground"
            aria-label="Ir al inicio"
          >
            <span className="font-extrabold text-primary">Do</span>
            <span className="mx-0.5 text-foreground">·</span>
            <span className="font-light">events</span>
            <span className="absolute -bottom-1 left-1/2 h-[2px] w-20 -translate-x-1/2 bg-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              className="relative p-1 text-primary transition-colors hover:opacity-80"
            >
              <Bell className="h-6 w-6" strokeWidth={2} />
              {hasUnread && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 999 ? '999+' : unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onSearch}
              className="p-1 text-primary transition-colors hover:opacity-80"
              aria-label="Buscar"
            >
              <Search className="h-6 w-6" strokeWidth={2} />
            </button>
            {profileAvatar && (
              <button
                type="button"
                onClick={() => {
                  if (profileUserId) onNavigate?.('perfil');
                  else setMenuOpen(true);
                }}
                className="rounded-full transition-opacity hover:opacity-80"
                aria-label="Ir a mi perfil"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profileAvatar} alt={profileName || 'Perfil'} />
                  <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                    {(profileName || 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            )}
          </div>
        </div>
      </header>

      <SideMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onNavigate={onNavigate}
        onGoToTickets={onGoToTickets}
        onLogout={onLogout}
        onGoToAdmin={onGoToAdmin}
        isAdmin={isAdmin}
        profileName={profileName}
        profileUsername={profileUsername}
        profileAvatar={profileAvatar}
        profileUserId={profileUserId}
        unreadMessages={unreadMessages}
      />
      <NotificationsSheet
        open={notifOpen}
        onOpenChange={setNotifOpen}
        currentUserId={profileUserId}
        onViewProfile={handleViewProfileFromNotif}
        onGoToEvent={onGoToEvent}
        onGoToEventById={onGoToEventById}
        onGoToPlace={onGoToPlace}
        onGoToService={onGoToService}
        onGoToTickets={onGoToTickets}
        onGoToPost={onGoToPost}
      />
    </>
  );
};

export default TopHeader;
