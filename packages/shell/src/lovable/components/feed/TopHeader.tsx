import { SlidersHorizontal, Search, Bell } from 'lucide-react';
import { useState } from 'react';
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
  const { unreadCount, hasUnread } = useNotifications();

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
      <header className="bg-primary shadow-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <button
            onClick={() => setMenuOpen(true)}
            className="relative rounded-xl bg-card p-2.5 text-primary shadow-sm ring-2 ring-primary/20 transition-colors hover:bg-accent"
          >
            <SlidersHorizontal className="h-5 w-5" />
            {unreadMessages > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            )}
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
              onClick={() => setNotifOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-card text-primary shadow-sm ring-2 ring-primary/20 transition-colors hover:bg-accent"
            >
              <Bell className="h-5 w-5" strokeWidth={2} />
              {hasUnread && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 999 ? '999+' : unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onSearch}
              className="rounded-xl bg-card p-1.5 text-primary shadow-sm ring-2 ring-primary/20 transition-colors hover:bg-accent"
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
                className="rounded-full ring-2 ring-primary/20 transition-opacity hover:opacity-80"
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
