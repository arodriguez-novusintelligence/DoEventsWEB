import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@lovable/components/ui/drawer';
import { Avatar, AvatarFallback } from '@lovable/components/ui/avatar';
import { Button } from '@lovable/components/ui/button';
import {
  Heart, MessageSquare, Repeat2, Share2, UserPlus, CheckCheck,
  CalendarPlus, Mail, Ticket, CreditCard, ShieldCheck, Star,
  Megaphone, FileText, Trash2, MessagesSquare, AtSign, Building2, Briefcase, Crown, Bell, Loader2, AlertCircle, RefreshCw,
} from 'lucide-react';
import { useNotifications, Notification, NotificationType } from '@lovable/contexts/NotificationsContext';
import { cn } from '@lovable/lib/utils';
import { toast } from 'sonner';
import { respondFollowRequest } from '@doevents/shared';

interface NotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
  onViewProfile?: (user: { name: string; initials: string }) => void;
  onGoToEvent?: (eventName: string) => void;
  onGoToEventById?: (eventId: string) => void;
  onGoToPlace?: (venueId: string) => void;
  onGoToService?: (serviceId: string) => void;
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
  ticket_transfer: { icon: Ticket, color: 'text-secondary-foreground', bg: 'bg-secondary' },
  refund: { icon: CreditCard, color: 'text-primary', bg: 'bg-primary/10' },
  access_assignment: { icon: ShieldCheck, color: 'text-primary', bg: 'bg-primary/10' },
  event_finished: { icon: Star, color: 'text-secondary-foreground', bg: 'bg-secondary' },
  followed_event: { icon: Megaphone, color: 'text-primary', bg: 'bg-primary/10' },
  followed_post: { icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
  chatroom_invite: { icon: MessagesSquare, color: 'text-primary', bg: 'bg-primary/10' },
  user_mention: { icon: AtSign, color: 'text-primary', bg: 'bg-primary/10' },
  event_mention: { icon: AtSign, color: 'text-secondary-foreground', bg: 'bg-secondary' },
  ticket_purchase: { icon: Ticket, color: 'text-primary', bg: 'bg-primary/10' },
  ticket_sold: { icon: Ticket, color: 'text-primary', bg: 'bg-primary/10' },
  venue_reservation: { icon: Building2, color: 'text-primary', bg: 'bg-primary/10' },
  venue_reserved: { icon: Building2, color: 'text-primary', bg: 'bg-primary/10' },
  service_booking: { icon: Briefcase, color: 'text-primary', bg: 'bg-primary/10' },
  service_booked: { icon: Briefcase, color: 'text-primary', bg: 'bg-primary/10' },
  subscription_purchase: { icon: Crown, color: 'text-secondary-foreground', bg: 'bg-secondary' },
};

const getNotificationText = (n: Notification): string => {
  if (n.message) {
    if (n.type === 'venue_reservation' || n.type === 'service_booking') {
      return n.message;
    }
    if (n.type === 'venue_reserved' || n.type === 'service_booked') {
      return n.message;
    }
    if (n.type === 'event_mention') {
      const suffix = n.eventName ? `: ${n.eventName}` : '';
      if (n.message.includes('mencionó')) {
        return `${n.fromUser.name} ${n.message}${suffix}`;
      }
      return `${n.fromUser.name} mencionó tu evento en una publicación${suffix}`;
    }
    if (n.type === 'follow_request') {
      return `${n.fromUser.name} ${n.message.includes('quiere') ? n.message : 'quiere seguirte'}`;
    }
    if (n.type === 'user_mention') {
      return `${n.fromUser.name} ${n.message}`;
    }
    const target = n.eventName || n.postTitle || n.venueName || n.serviceName;
    if (n.type === 'event_created' || n.type === 'refund' || n.type === 'event_finished') {
      return `${n.message}${target ? `: ${target}` : ''}`;
    }
    return `${n.fromUser.name} ${n.message}${target ? `: ${target}` : ''}`;
  }
  const labelMap: Partial<Record<NotificationType, string>> = {
    like: 'le dio me gusta a tu evento',
    comment: 'comentó en tu evento',
    repost: 'reposteó',
    share: 'compartió',
    follow: 'te empezó a seguir',
    follow_request: 'quiere seguirte',
    user_mention: 'te mencionó en una publicación',
    event_mention: 'mencionó tu evento en una publicación',
    venue_reservation: 'Reserva de lugar confirmada',
    venue_reserved: '¡Tu lugar ha sido reservado!',
    service_booking: 'Reserva de servicio confirmada',
    service_booked: '¡Tu servicio ha sido reservado!',
  };
  const label = labelMap[n.type] || '';
  const target = n.eventName || n.venueName || n.serviceName || n.postTitle || '';
  if (n.type === 'venue_reservation' || n.type === 'service_booking') {
    const price = n.priceLabel ? ` - ${n.priceLabel}` : '';
    return `${label}${price}${target ? `: ${target}` : ''}`;
  }
  if (n.type === 'venue_reserved' || n.type === 'service_booked') {
    const price = n.priceLabel ? ` - ${n.priceLabel}` : '';
    return `${n.fromUser.name} ${label}${price}${target ? `: ${target}` : ''}`;
  }
  return `${n.fromUser.name} ${label}${target ? `: ${target}` : ''}`;
};

const NotificationRow = ({
  notification,
  onOpen,
  onViewProfile,
  onAccept,
  onReject,
  onGoToEvent,
  onGoToPlace,
  onGoToService,
  onGoToTickets,
  onGoToPost,
}: {
  notification: Notification;
  onOpen?: () => void;
  onViewProfile?: (user: { name: string; initials: string }) => void;
  onAccept?: () => void;
  onReject?: () => void;
  onGoToEvent?: () => void;
  onGoToPlace?: () => void;
  onGoToService?: () => void;
  onGoToTickets?: () => void;
  onGoToPost?: () => void;
}) => {
  const { icon: Icon, color, bg } = iconMap[notification.type];
  const text = getNotificationText(notification);

  const isMention = notification.type === 'user_mention' || notification.type === 'event_mention';
  const isClickable = Boolean(onOpen) && !notification.actionable;

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={cn(
        'flex items-start gap-3 px-4 py-3.5 transition-colors',
        !notification.read && 'bg-primary/5',
        isClickable && 'cursor-pointer hover:bg-accent/50'
      )}
      onClick={() => {
        if (isClickable) onOpen?.();
      }}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onOpen?.();
        }
      }}
    >
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', bg, !notification.read && 'ring-2 ring-primary/40')}>
        <Icon className={cn('h-5 w-5', color)} fill={notification.type === 'like' ? 'currentColor' : 'none'} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">{text}</p>
        <p className="mt-1 text-xs text-muted-foreground">{notification.timeAgo}</p>

        {notification.eventName && !notification.actionable && notification.type !== 'ticket_transfer' && notification.type !== 'access_assignment'
          && (notification.type === 'event_mention' || notification.eventId || notification.type === 'event_created' || notification.type === 'event_invite' || notification.type === 'followed_event') && (
          <button
            className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-primary hover:underline w-fit"
            onClick={(e) => { e.stopPropagation(); onGoToEvent?.(); }}
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Ver evento
          </button>
        )}

        {(notification.type === 'venue_reservation' || notification.type === 'venue_reserved') && (
          <button
            className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-primary hover:underline w-fit"
            onClick={(e) => { e.stopPropagation(); onGoToPlace?.(); }}
          >
            <Building2 className="h-3.5 w-3.5" />
            Ver lugar
          </button>
        )}

        {(notification.type === 'service_booking' || notification.type === 'service_booked') && (
          <button
            className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-primary hover:underline w-fit"
            onClick={(e) => { e.stopPropagation(); onGoToService?.(); }}
          >
            <Briefcase className="h-3.5 w-3.5" />
            Ver servicio
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

const NotificationsSheet = ({
  open,
  onOpenChange,
  currentUserId,
  onViewProfile,
  onGoToEvent,
  onGoToEventById,
  onGoToPlace,
  onGoToService,
  onGoToTickets,
  onGoToPost,
}: NotificationsSheetProps) => {
  const { notifications, unreadCount, loading, loadError, reload, markAllRead, markRead, dismissNotification, updateNotification, clearAll } = useNotifications();

  const handleAccept = async (n: Notification) => {
    if (n.type === 'follow_request') {
      const followerId = n.fromUser.id;
      if (currentUserId && followerId) {
        try {
          await respondFollowRequest(currentUserId, followerId, 'accept');
          dismissNotification(n.id);
          toast.success(`Aceptaste la solicitud de ${n.fromUser.name}`);
          return;
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'No se pudo aceptar la solicitud');
          return;
        }
      }
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

  const handleReject = async (n: Notification) => {
    if (n.type === 'follow_request') {
      const followerId = n.fromUser.id;
      if (currentUserId && followerId) {
        try {
          await respondFollowRequest(currentUserId, followerId, 'reject');
        } catch {
          // mantener dismiss local aunque falle API
        }
      }
    }
    dismissNotification(n.id);
    toast(n.type === 'follow_request' ? 'Solicitud rechazada' : 'Invitación rechazada');
  };

  const handleRate = (id: string) => {
    dismissNotification(id);
    toast('¡Gracias por tu calificación!');
  };

  const handleGoToEvent = (n: Notification) => {
    onOpenChange(false);
    if (n.eventId) {
      onGoToEventById?.(n.eventId);
      return;
    }
    if (n.eventName) onGoToEvent?.(n.eventName);
  };

  const handleGoToTickets = () => {
    onOpenChange(false);
    onGoToTickets?.();
  };

  const handleGoToPost = (postId: string) => {
    onOpenChange(false);
    onGoToPost?.(postId);
  };

  const handleOpenNotification = async (n: Notification) => {
    if (!n.read) await markRead(n.id);
    if (n.venueId) {
      onOpenChange(false);
      onGoToPlace?.(n.venueId);
      return;
    }
    if (n.serviceId) {
      onOpenChange(false);
      onGoToService?.(n.serviceId);
      return;
    }
    if (n.eventId || n.eventName) {
      handleGoToEvent(n);
      return;
    }
    if (n.postId) {
      handleGoToPost(n.postId);
      return;
    }
    if (n.type === 'ticket_transfer' || n.type === 'ticket_purchase' || n.type === 'ticket_sold') {
      handleGoToTickets();
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="flex items-center justify-between pb-0">
          <DrawerTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            Notificaciones
            {unreadCount > 0 && (
              <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </DrawerTitle>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={() => { void markAllRead(); }}
                className="flex items-center gap-1 text-xs font-semibold text-primary"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar leídas
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => { void clearAll(); }}
                className="flex items-center gap-1 text-xs font-semibold text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar todas
              </button>
            )}
          </div>
        </DrawerHeader>

        <div className="mt-2 overflow-y-auto divide-y divide-border pb-6">
          {loading ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Cargando notificaciones…</p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center py-12 text-center px-4">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
                <AlertCircle className="h-7 w-7 text-destructive" strokeWidth={2} />
              </div>
              <p className="text-sm font-semibold text-foreground">Error al cargar</p>
              <p className="mt-1 max-w-[260px] text-xs text-muted-foreground">{loadError}</p>
              <button
                type="button"
                onClick={() => { void reload(); }}
                className="mt-4 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reintentar
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <Bell className="h-7 w-7 text-primary" strokeWidth={2} />
              </div>
              <p className="text-sm font-semibold text-foreground">Sin notificaciones</p>
              <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
                Aquí verás actividad de tus eventos, reservas y mensajes.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onOpen={() => { void handleOpenNotification(n); }}
                onViewProfile={onViewProfile}
                onAccept={() =>
                  n.type === 'event_finished' ? handleRate(n.id) : handleAccept(n)
                }
                onReject={() => handleReject(n)}
                onGoToEvent={() => (n.eventId || n.eventName) && handleGoToEvent(n)}
                onGoToPlace={() => {
                  if (!n.venueId) return;
                  onOpenChange(false);
                  onGoToPlace?.(n.venueId);
                }}
                onGoToService={() => {
                  if (!n.serviceId) return;
                  onOpenChange(false);
                  onGoToService?.(n.serviceId);
                }}
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
