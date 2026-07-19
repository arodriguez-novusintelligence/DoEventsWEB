import { SlidersHorizontal, Search, Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SideMenu from './SideMenu';
import NotificationsSheet from './NotificationsSheet';
import GlobalSearchView from './GlobalSearchView';
import { useNotifications } from '@lovable/contexts/NotificationsContext';

import type { NotificationNavigateTarget } from '../../../lovable-bridge/notificationNavigation';

interface TopHeaderProps {
  onViewProfile?: (user: { name: string; initials: string }) => void;
  onNavigateTo?: (target: NotificationNavigateTarget) => void;
  onGoToTickets?: () => void;
  onNavigate?: (section: string) => void;
  onGoToAdmin?: () => void;
  onLogout?: () => void;
  profileName?: string;
  profileUsername?: string;
  profileAvatar?: string;
  profileUserId?: string;
  unreadMessages?: number;
  isAdmin?: boolean;
}

const TopHeader = ({
  onViewProfile,
  onNavigateTo,
  onGoToTickets,
  onNavigate,
  onGoToAdmin,
  onLogout,
  profileName,
  profileUsername,
  profileAvatar,
  profileUserId,
  unreadMessages = 0,
  isAdmin = false,
}: TopHeaderProps) => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const { unreadCount } = useNotifications();

  useEffect(() => {
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const getScrollTop = () => {
      let max = window.scrollY || document.documentElement.scrollTop || 0;
      document.querySelectorAll<HTMLElement>('[data-scroll-root], main, .overflow-y-auto, .overflow-auto, .overflow-y-scroll').forEach((el) => {
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

  return (
    <>
      <header
        className={`sticky top-0 z-20 transition-transform duration-300 ease-in-out ${
          hidden ? '-translate-y-full' : 'translate-y-0'
        }`}
        style={{ background: 'var(--feed-header-bg)' }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <button
            onClick={() => setMenuOpen(true)}
            className="relative rounded-xl bg-card p-2.5 text-primary shadow-sm transition-colors hover:bg-accent"
          >
            <SlidersHorizontal className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          </button>
          <h1 className="relative text-2xl tracking-tight text-foreground">
            <span className="font-extrabold text-primary">Do</span>
            <span className="mx-0.5 text-foreground">·</span>
            <span className="font-light">events</span>
            <span className="absolute -bottom-1 left-1/2 h-[2px] w-20 -translate-x-1/2 bg-foreground" />
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNotifOpen(true)}
              className="relative p-1 text-primary transition-colors hover:opacity-80"
            >
              <Bell className="h-6 w-6" strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 999 ? '999+' : unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => setSearchOpen(true)} className="p-1 text-primary transition-colors hover:opacity-80">
              <Search className="h-6 w-6" strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      <SideMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onNavigate={onNavigate}
        onGoToTickets={onGoToTickets}
        onGoToAdmin={onGoToAdmin}
        onLogout={onLogout}
        profileName={profileName}
        profileUsername={profileUsername}
        profileAvatar={profileAvatar}
        profileUserId={profileUserId}
        unreadMessages={unreadMessages}
        isAdmin={isAdmin}
        onOpen={() => {
          window.dispatchEvent(new Event('doevents:chat-unread-updated'));
        }}
      />
      <NotificationsSheet
        open={notifOpen}
        onOpenChange={setNotifOpen}
        onNavigateTo={onNavigateTo}
        onGoToTickets={onGoToTickets}
      />
      {searchOpen && (
        <GlobalSearchView
          onBack={() => setSearchOpen(false)}
          onNavigate={onNavigate}
          onGoToTickets={onGoToTickets}
          onGoToAdmin={onGoToAdmin}
          onLogout={onLogout}
          profileName={profileName}
          profileUsername={profileUsername}
          profileAvatar={profileAvatar}
          profileUserId={profileUserId}
          unreadMessages={unreadMessages}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
};

export default TopHeader;
