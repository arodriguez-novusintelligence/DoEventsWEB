import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@lovable/components/ui/drawer';
import { Avatar, AvatarFallback } from '@lovable/components/ui/avatar';
import { Button } from '@lovable/components/ui/button';
import {
  Heart, MessageSquare, Repeat2, Share2, UserPlus, CheckCheck,
  CalendarPlus, Mail, Ticket, CreditCard, ShieldCheck, Star,
  Megaphone, FileText, Trash2, MessagesSquare, AtSign, Building2, Briefcase, Crown, Radio, ImageIcon, Send,
} from 'lucide-react';
import { useNotifications, Notification, NotificationType } from '@lovable/contexts/NotificationsContext';
import { cn } from '@lovable/lib/utils';
import { toast } from 'sonner';
import { respondFollowRequest } from '@doevents/shared';

interface NotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewProfile?: (user: { name: string; initials: string }) => void;
  onGoToEvent?: (eventName: string) => void;
  onGoToTickets?: () => void;
  onGoToPost?: (postId: string) => void;
}

const iconMap: Record<NotificationType, { icon: typeof Heart; color: string; bg: string }> = {
  like: { icon: Heart, color: 'text-destructive', bg: 'bg-destructive/10' },
  comment: { icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10' },
  repost: { icon: Repeat2, color: 'text-primary', bg: 'bg-primary/10' },
  share: { icon: Share2, color: 'text-primary', bg: 'bg-primary/10' },
  follow: { icon: UserPlus, color: 'text-primary', bg: 'bg-primary/10' },
  follow_request: { icon: UserPlus, color: 'text-primary', bg: 'bg-primary/10' },
  event_created: { icon: CalendarPlus, color: 'text-primary', bg: 'bg-primary/10' },
  event_invite: { icon: Mail, color: 'text-primary', bg: 'bg-primary/10' },
  ticket_transfer: { icon: Ticket, color: 'text-amber-600', bg: 'bg-amber-100' },
  refund: { icon: CreditCard, color: 'text-green-600', bg: 'bg-green-100' },
  access_assignment: { icon: ShieldCheck, color: 'text-primary', bg: 'bg-primary/10' },
  event_finished: { icon: Star, color: 'text-amber-500', bg: 'bg-amber-100' },
  followed_event: { icon: Megaphone, color: 'text-primary', bg: 'bg-primary/10' },
  followed_post: { icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
  chatroom_invite: { icon: MessagesSquare, color: 'text-primary', bg: 'bg-primary/10' },
  user_mention: { icon: AtSign, color: 'text-primary', bg: 'bg-primary/10' },
  event_mention: { icon: AtSign, color: 'text-amber-600', bg: 'bg-amber-100' },
  ticket_purchase: { icon: Ticket, color: 'text-green-600', bg: 'bg-green-100' },
  ticket_sold: { icon: Ticket, color: 'text-primary', bg: 'bg-primary/10' },
  venue_reservation: { icon: Building2, color: 'text-green-600', bg: 'bg-green-100' },
  venue_reserved: { icon: Building2, color: 'text-primary', bg: 'bg-primary/10' },
  service_booking: { icon: Briefcase, color: 'text-green-600', bg: 'bg-green-100' },
  service_booked: { icon: Briefcase, color: 'text-primary', bg: 'bg-primary/10' },
  subscription_purchase: { icon: Crown, color: 'text-amber-600', bg: 'bg-amber-100' },
  own_publication: { icon: Send, color: 'text-primary', bg: 'bg-primary/10' },
  story_published: { icon: ImageIcon, color: 'text-primary', bg: 'bg-primary/10' },
  live_started: { icon: Radio, color: 'text-red-500', bg: 'bg-red-500/10' },
  promo_code_canceled: { icon: Ticket, color: 'text-rose-600', bg: 'bg-rose-100' },
};

const getNotificationText = (n: Notification): string => {
  if (n.message) {
    const target = n.eventName || n.postTitle;
    if (n.type === 'event_created' || n.type === 'refund' || n.type === 'event_finished' || n.type === 'promo_code_canceled') {
      return `${n.message}: ${target || ''}`;
    }
    return `${n.fromUser.name} ${n.message}${target ? `: ${target}` : ''}`;
  }
  // Fallback for legacy types
  const labelMap: Partial<Record<NotificationType, string>> = {
    like: 'le dio me gusta a tu evento',
    comment: 'comentó en tu evento',
    repost: 'reposteó',
    share: 'compartió',
    follow: 'te empezó a seguir',
    user_mention: 'te mencionó',
    event_mention: 'mencionó tu evento',
  };
  const label = labelMap[n.type] || '';
  const target = n.postTitle || n.eventName || '';
  return `${n.fromUser.name} ${label}${target ? ` "${target}"` : ''}`;
};

const NotificationRow = ({
  notification,
  onViewProfile,
  onAccept,
  onReject,
  onGoToEvent,
  onGoToTickets,
  onGoToPost,
}: {
  notification: Notification;
  onViewProfile?: (user: { name: string; initials: string }) => void;
  onAccept?: () => void;
  onReject?: () => void;
  onGoToEvent?: () => void;
  onGoToTickets?: () => void;
  onGoToPost?: () => void;
}) => {
  const { icon: Icon, color, bg } = iconMap[notification.type];
  const text = getNotificationText(notification);

  const isMention = notification.type === 'user_mention' || notification.type === 'event_mention';

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3.5 transition-colors',
        !notification.read && 'bg-primary/5',
        isMention && notification.postId && 'cursor-pointer hover:bg-accent/50'
      )}
      onClick={() => {
        if (isMention && notification.postId) {
          onGoToPost?.();
        }
      }}
    >
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', bg)}>
        <Icon className={cn('h-5 w-5', color)} fill={notification.type === 'like' ? 'currentColor' : 'none'} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">{text}</p>
        <p className="mt-1 text-xs text-muted-foreground">{notification.timeAgo}</p>

        {notification.eventName && !notification.actionable && notification.type !== 'ticket_transfer' && notification.type !== 'access_assignment' && (
          <button
            className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-primary hover:underline w-fit"
            onClick={(e) => { e.stopPropagation(); onGoToEvent?.(); }}
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Ver evento
          </button>
        )}

        {notification.type === 'access_assignment' && (
          <button
            className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-primary hover:underline w-fit"
            onClick={(e) => { e.stopPropagation(); onGoToEvent?.(); }}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Ver detalle control de accesos
          </button>
        )}

        {(notification.type === 'followed_post' || notification.type === 'repost') && notification.postTitle && (
          <button
            className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-primary hover:underline w-fit"
            onClick={(e) => { e.stopPropagation(); onGoToEvent?.(); }}
          >
            <FileText className="h-3.5 w-3.5" />
            Ver post
          </button>
        )}

        {notification.type === 'ticket_transfer' && (
          <button
            className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-primary hover:underline w-fit"
            onClick={(e) => { e.stopPropagation(); onGoToTickets?.(); }}
          >
            <Ticket className="h-3.5 w-3.5" />
            Ver detalle en Mis Boletas
          </button>
        )}

        {notification.actionable && (notification.type === 'chatroom_invite' || notification.type === 'follow_request') && (
          <div className="mt-2 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={(e) => { e.stopPropagation(); onReject?.(); }}
            >
              Rechazar
            </Button>
            <Button
              size="sm"
              onClick={(e) => { e.stopPropagation(); onAccept?.(); }}
            >
              Aceptar
            </Button>
          </div>
        )}

        {notification.type === 'event_invite' && notification.eventName && (
          <button
            className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-primary hover:underline w-fit"
            onClick={(e) => { e.stopPropagation(); onGoToEvent?.(); }}
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Ir al evento
          </button>
        )}

        {notification.actionable && notification.type === 'event_finished' && (
          <div className="mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => { e.stopPropagation(); onAccept?.(); }}
            >
              ⭐ Calificar evento
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const NotificationsSheet = ({ open, onOpenChange, onViewProfile, onGoToEvent, onGoToTickets, onGoToPost }: NotificationsSheetProps) => {
  const { notifications, unreadCount, markAllRead, dismissNotification, updateNotification, clearAll } = useNotifications();

  const handleAccept = (n: Notification) => {
    if (n.type === 'follow_request') {
      updateNotification(n.id, {
        type: 'follow',
        actionable: false,
        message: 'te empezó a seguir',
        read: true,
      });
      toast.success(`Aceptaste la solicitud de ${n.fromUser.name}`);
      return;
    }
    dismissNotification(n.id);
    toast('¡Invitación aceptada!');
  };

  const handleReject = (n: Notification) => {
    dismissNotification(n.id);
    toast(n.type === 'follow_request' ? 'Solicitud rechazada' : 'Invitación rechazada');
  };

  const handleRate = (id: string) => {
    dismissNotification(id);
    toast('¡Gracias por tu calificación!');
  };

  const handleGoToEvent = (eventName: string) => {
    onOpenChange(false);
    onGoToEvent?.(eventName);
  };

  const handleGoToTickets = () => {
    onOpenChange(false);
    onGoToTickets?.();
  };

  const handleGoToPost = (postId: string) => {
    onOpenChange(false);
    onGoToPost?.(postId);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="flex items-center justify-between pb-0">
          <DrawerTitle className="text-base font-bold text-foreground">
            Notificaciones
          </DrawerTitle>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-semibold text-primary"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar leídas
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-xs font-semibold text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar todas
              </button>
            )}
          </div>
        </DrawerHeader>

        <div className="mt-2 overflow-y-auto divide-y divide-border pb-6">
          {notifications.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No tienes notificaciones
            </p>
          ) : (
            notifications.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onViewProfile={onViewProfile}
                onAccept={() =>
                  n.type === 'event_finished' ? handleRate(n.id) : handleAccept(n)
                }
                onReject={() => handleReject(n)}
                onGoToEvent={() => n.eventName && handleGoToEvent(n.eventName)}
                onGoToTickets={handleGoToTickets}
                onGoToPost={() => n.postId && handleGoToPost(n.postId)}
              />
            ))
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default NotificationsSheet;