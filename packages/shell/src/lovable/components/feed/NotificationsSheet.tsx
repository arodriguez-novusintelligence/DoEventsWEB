import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@lovable/components/ui/drawer';

import { Button } from '@lovable/components/ui/button';

import {

  Heart, MessageSquare, Repeat2, Share2, UserPlus, CheckCheck,

  CalendarPlus, Mail, Ticket, CreditCard, ShieldCheck, Star,

  Megaphone, FileText, Trash2, MessagesSquare, AtSign, Building2, Briefcase, Crown, Radio, ImageIcon, Send,

  ClipboardList, Copy,

} from 'lucide-react';

import { useEffect, type MouseEvent } from 'react';
import { useSelector } from 'react-redux';

import {

  acceptChatInvitation,

  declineChatInvitation,

  fetchUserInvitations,

  respondFollowRequest,

  respondToUserInvitation,

  RootState,

} from '@doevents/shared';

import { useNotifications, Notification, NotificationType } from '@lovable/contexts/NotificationsContext';

import {

  getNotificationActionLabel,
  isChatRoomInvitation,
  isNotificationRowClickable,
  resolveChatInviteTarget,
  resolveNotificationRoomId,
  resolveNotificationTarget,

  type NotificationNavigateTarget,

} from '../../../lovable-bridge/notificationNavigation';

import { cn } from '@lovable/lib/utils';

import { toast } from 'sonner';



interface NotificationsSheetProps {

  open: boolean;

  onOpenChange: (open: boolean) => void;

  onNavigateTo?: (target: NotificationNavigateTarget) => void;

  onGoToTickets?: () => void;

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

  task_assignment: { icon: ClipboardList, color: 'text-primary', bg: 'bg-primary/10' },

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

  promo_code_shared: { icon: Ticket, color: 'text-primary', bg: 'bg-primary/10' },

};



const getNotificationText = (n: Notification): string => {

  if (n.type === 'chatroom_invite' || isChatRoomInvitation(n)) {
    if (n.message) return n.message;
    const target = n.eventName ? ` de ${n.eventName}` : '';
    return `${n.fromUser.name || 'Alguien'} te invitó a unirte al chat${target}.`;
  }

  if (n.message) {
    const target = n.eventName || n.postTitle || n.venueName || n.serviceName;
    const targetSuffix = target && !n.message.includes(target) ? `: ${target}` : '';

    if (
      n.type === 'event_created'
      || n.type === 'refund'
      || n.type === 'event_finished'
      || n.type === 'promo_code_canceled'
      || n.type === 'promo_code_shared'
      || n.type === 'venue_reserved'
      || n.type === 'service_booked'
    ) {
      return `${n.message}${targetSuffix}`;
    }

    const actorName = (n.fromUser.name || '').trim() || 'Usuario';
    return `${actorName} ${n.message}${targetSuffix}`;
  }

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

  actionLabel,

  onOpen,

  onAccept,

  onReject,

}: {

  notification: Notification;

  actionLabel: string | null;

  onOpen?: () => void;

  onAccept?: () => void;

  onReject?: () => void;

}) => {

  const { icon: Icon, color, bg } = iconMap[notification.type] ?? iconMap.followed_post;

  const text = getNotificationText(notification);

  const clickable = isNotificationRowClickable(notification);

  const showInviteActions = notification.type === 'event_invite';

  const showFollowActions = notification.actionable
    && (notification.type === 'chatroom_invite' || notification.type === 'follow_request' || isChatRoomInvitation(notification))
    && !notification.followRequestStatus;

  const showFollowStatus = notification.followRequestStatus === 'accepted'

    || notification.followRequestStatus === 'rejected';

  const showRateAction = notification.actionable && notification.type === 'event_finished';
  const promoCode = notification.promoCode
    || notification.message?.match(/\bDOE-[A-Z0-9]{6}\b/i)?.[0];

  const copyPromoCode = async (event: MouseEvent) => {
    event.stopPropagation();
    if (!promoCode) return;
    try {
      await navigator.clipboard.writeText(promoCode);
      toast.success('Código promocional copiado');
    } catch {
      toast.error('No se pudo copiar el código promocional');
    }
  };



  return (

    <div

      className={cn(

        'flex items-start gap-3 px-4 py-3.5 transition-colors',

        !notification.read && 'bg-primary/5',

        clickable && 'cursor-pointer hover:bg-accent/50',

      )}

      onClick={() => {

        if (clickable) onOpen?.();

      }}

    >

      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', bg)}>

        <Icon className={cn('h-5 w-5', color)} fill={notification.type === 'like' ? 'currentColor' : 'none'} />

      </div>



      <div className="flex-1 min-w-0">

        <p className="text-sm text-foreground leading-snug">{text}</p>

        <p className="mt-1 text-xs text-muted-foreground">{notification.timeAgo}</p>

        {notification.type === 'promo_code_shared' && promoCode && (
          <button
            type="button"
            className="mt-2 flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 font-mono text-xs font-bold text-primary hover:bg-primary/10"
            onClick={copyPromoCode}
            aria-label={`Copiar código ${promoCode}`}
          >
            <Copy className="h-3.5 w-3.5" />
            {promoCode}
          </button>
        )}



        {actionLabel && !showInviteActions && !showFollowActions && !showRateAction && (

          <button

            type="button"

            className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-primary hover:underline w-fit"

            onClick={(e) => { e.stopPropagation(); onOpen?.(); }}

          >

            <CalendarPlus className="h-3.5 w-3.5" />

            {actionLabel}

          </button>

        )}



        {showInviteActions && (

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



        {showFollowActions && (

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



        {showFollowStatus && (

          <p className={cn(

            'mt-2 text-xs font-semibold',

            notification.followRequestStatus === 'accepted' ? 'text-primary' : 'text-muted-foreground',

          )}

          >

            {notification.followRequestStatus === 'accepted' ? 'Aceptado' : 'Rechazado'}

          </p>

        )}



        {showRateAction && (

          <div className="mt-2">

            <Button

              size="sm"

              variant="outline"

              onClick={(e) => { e.stopPropagation(); onAccept?.(); }}

            >

              Calificar evento

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

  onNavigateTo,

  onGoToTickets,

}: NotificationsSheetProps) => {

  const userId = useSelector((s: RootState) => s.auth.idUser);

  const {

    notifications,

    unreadCount,

    markAllRead,

    markRead,

    dismissNotification,

    updateNotification,

    clearAll,

    reload,

  } = useNotifications();

  useEffect(() => {
    if (open) {
      void reload();
    }
  }, [open, reload]);

  const markAsReadIfNeeded = (n: Notification) => {

    if (!n.read) {

      void markRead(n.id);

    }

  };



  const navigateFromNotification = (n: Notification) => {

    const target = resolveNotificationTarget(n);

    if (!target) {

      markAsReadIfNeeded(n);

      return;

    }

    markAsReadIfNeeded(n);

    onOpenChange(false);

    onNavigateTo?.(target);

  };



  const resolveInvitationId = async (n: Notification): Promise<string | undefined> => {

    if (n.invitationId) return n.invitationId;

    if (!userId || !n.eventId) return undefined;

    try {

      const data = await fetchUserInvitations(userId);

      const match = (data.invitations || []).find(

        (inv) => inv.eventId === n.eventId && String(inv.status || 'pending').toLowerCase() === 'pending',

      );

      return match?.invitationId || match?.id;

    } catch {

      return undefined;

    }

  };



  const handleAcceptInvite = async (n: Notification) => {

    if (isChatRoomInvitation(n)) {

      await handleAcceptChatInvite(n);

      return;

    }

    if (!n.eventId) {

      toast.error('No se encontró el evento de la invitación');

      return;

    }

    try {

      const invitationId = await resolveInvitationId(n);

      if (invitationId) {

        await respondToUserInvitation(n.eventId, invitationId, 'accepted');

      }

      markAsReadIfNeeded(n);

      dismissNotification(n.id);

      onOpenChange(false);

      toast.success('Invitación aceptada');

      onNavigateTo?.({ path: `/events/${n.eventId}/checkout` });

    } catch (err) {

      toast.error(err instanceof Error ? err.message : 'No se pudo aceptar la invitación');

    }

  };



  const handleRejectInvite = async (n: Notification) => {

    if (!n.eventId) {

      dismissNotification(n.id);

      return;

    }

    try {

      const invitationId = await resolveInvitationId(n);

      if (invitationId) {

        await respondToUserInvitation(n.eventId, invitationId, 'rejected');

      }

      markAsReadIfNeeded(n);

      dismissNotification(n.id);

      toast('Invitación rechazada');

    } catch (err) {

      toast.error(err instanceof Error ? err.message : 'No se pudo rechazar la invitación');

    }

  };



  const handleAcceptChatInvite = async (n: Notification) => {

    const roomId = resolveNotificationRoomId(n);

    if (!roomId) {

      toast.error('No se encontró la sala del chat');

      return;

    }

    try {

      if (userId) {

        await acceptChatInvitation(userId, roomId);

      }

      markAsReadIfNeeded(n);

      dismissNotification(n.id);

      onOpenChange(false);

      onNavigateTo?.(resolveChatInviteTarget(n));

      toast.success('Invitación aceptada. Ya puedes participar en el chat.');

    } catch (err) {

      toast.error(err instanceof Error ? err.message : 'No se pudo aceptar la invitación al chat');

    }

  };



  const handleRejectChatInvite = async (n: Notification) => {

    const roomId = resolveNotificationRoomId(n);

    try {

      if (userId && roomId) {

        await declineChatInvitation(userId, roomId);

      }

      markAsReadIfNeeded(n);

      dismissNotification(n.id);

      toast('Invitación al chat rechazada');

    } catch (err) {

      toast.error(err instanceof Error ? err.message : 'No se pudo rechazar la invitación al chat');

    }

  };



  const handleAccept = async (n: Notification) => {

    if (isChatRoomInvitation(n)) {

      await handleAcceptChatInvite(n);

      return;

    }

    if (n.type === 'event_invite') {

      await handleAcceptInvite(n);

      return;

    }

    if (n.type === 'follow_request') {

      try {

        if (userId && n.fromUser.id) {

          await respondFollowRequest(userId, n.fromUser.id, 'accept');

        }

        markAsReadIfNeeded(n);

        updateNotification(n.id, {

          type: 'follow',

          actionable: false,

          followRequestStatus: 'accepted',

          message: `${n.fromUser.name} te sigue`,

          read: true,

        });

        toast.success(`Aceptaste la solicitud de ${n.fromUser.name}`);

      } catch (err) {

        toast.error(err instanceof Error ? err.message : 'No se pudo aceptar la solicitud');

      }

      return;

    }

    if (n.type === 'chatroom_invite') {

      await handleAcceptChatInvite(n);

      return;

    }

    if (n.type === 'event_finished') {

      dismissNotification(n.id);

      navigateFromNotification(n);

      toast('Gracias por calificar el evento');

      return;

    }

    dismissNotification(n.id);

    toast('Acción completada');

  };



  const handleReject = async (n: Notification) => {

    if (isChatRoomInvitation(n) || n.type === 'chatroom_invite') {

      await handleRejectChatInvite(n);

      return;

    }

    if (n.type === 'event_invite') {

      await handleRejectInvite(n);

      return;

    }

    if (n.type === 'follow_request') {

      try {

        if (userId && n.fromUser.id) {

          await respondFollowRequest(userId, n.fromUser.id, 'reject');

        }

        updateNotification(n.id, {

          actionable: false,

          followRequestStatus: 'rejected',

          read: true,

        });

        toast('Solicitud rechazada');

      } catch (err) {

        toast.error(err instanceof Error ? err.message : 'No se pudo rechazar la solicitud');

      }

      return;

    }

    dismissNotification(n.id);

    toast('Invitación rechazada');

  };



  const handleOpen = (n: Notification) => {
    navigateFromNotification(n);
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

                type="button"

                onClick={markAllRead}

                className="flex items-center gap-1 text-xs font-semibold text-primary"

              >

                <CheckCheck className="h-3.5 w-3.5" />

                Marcar leídas

              </button>

            )}

            {notifications.length > 0 && (

              <button

                type="button"

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

                actionLabel={getNotificationActionLabel(n)}

                onOpen={() => handleOpen(n)}

                onAccept={() => { void handleAccept(n); }}

                onReject={() => { void handleReject(n); }}

              />

            ))

          )}

        </div>

      </DrawerContent>

    </Drawer>

  );

};



export default NotificationsSheet;

