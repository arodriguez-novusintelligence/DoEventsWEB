import type { AppNotification } from '@doevents/shared';

import type { Notification, NotificationType } from '@lovable/contexts/NotificationsContext';



function formatRelativeTime(value?: string): string {

  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diffMins < 1) return 'Justo ahora';

  if (diffMins < 60) return `hace ${diffMins} min`;

  const diffHours = Math.floor(diffMins / 60);

  if (diffHours < 24) return `hace ${diffHours} h`;

  return `hace ${Math.floor(diffHours / 24)} d`;

}



function mapApiType(raw?: string, metadata?: Record<string, unknown>): NotificationType {

  const t = String(raw || '').toLowerCase();

  const metaType = String(metadata?.type || '').toLowerCase();



  if (t.includes('follow_request') || metaType.includes('follow_request')) return 'follow_request';

  if (t.includes('feed_event_mentioned') || metaType.includes('feed_event_mentioned')) return 'event_mention';

  if (t.includes('feed_user_mentioned') || metaType.includes('feed_user_mentioned')) return 'user_mention';

  if (t.includes('venue_reserved') || metaType.includes('venue_reserved')) return 'venue_reserved';

  if (t.includes('venue_reservation') || t.includes('venue_booking_confirmed_buyer')) return 'venue_reservation';

  if (t.includes('service_booked') || metaType.includes('service_booked')) return 'service_booked';

  if (t.includes('service_booking') || t.includes('service_booking_confirmed_buyer')) return 'service_booking';

  if (t.includes('like')) return 'like';

  if (t.includes('comment')) return 'comment';

  if (t.includes('repost')) return 'repost';

  if (t.includes('chat') && t.includes('invite')) return 'chatroom_invite';

  if (t.includes('event_invite') || t.includes('invitation')) return 'event_invite';

  if (t.includes('ticket_purchase') || t.includes('purchase')) return 'ticket_purchase';

  if (t.includes('ticket_sold')) return 'ticket_sold';

  if (t.includes('ticket_transfer')) return 'ticket_transfer';

  if (t.includes('refund')) return 'refund';

  if (t.includes('access')) return 'access_assignment';

  if (t.includes('follow')) return 'follow';

  if (t.includes('finished')) return 'event_finished';

  if (t.includes('event_created') || t.includes('published')) return 'event_created';

  return 'followed_post';

}



function isActionableType(type: NotificationType): boolean {

  return type === 'follow_request' || type === 'chatroom_invite' || type === 'event_finished';

}



export function appNotificationToLovable(n: AppNotification): Notification {

  const meta = n.metadata || {};

  const data = (meta.data || {}) as Record<string, unknown>;

  const type = mapApiType(n.type || String(meta.type || ''), meta);



  const senderName = String(

    meta.senderName

    || meta.actorName

    || meta.buyerName

    || meta.invitedBy

    || meta.userName

    || meta.fromName

    || (type === 'venue_reservation' || type === 'service_booking' ? 'Sistema' : 'Usuario'),

  );

  const initials = senderName.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'DE';



  const notificationId = n.notificationId || n.id;

  const timestamp = n.timestamp || n.createdAt || '';

  const apiUserId = n.userId || String(meta.userId || '');



  const venueName = String(meta.venueName || '');

  const serviceName = String(meta.serviceName || '');

  const eventName = n.eventName || String(meta.eventName || venueName || serviceName || '');

  const venueId = String(meta.venueId || data.venueId || '');

  const serviceId = String(meta.serviceId || data.serviceId || '');

  const eventId = n.eventId || String(meta.eventId || data.eventId || '');

  const followId = String(meta.followId || data.followId || '');

  const actorUserId = String(meta.actorUserId || data.actorUserId || meta.senderId || meta.fromUserId || '');



  const rawMessage = String(n.message || n.body || meta.message || meta.body || n.title || '');



  return {

    id: notificationId,

    type,

    apiMeta: {

      notificationId,

      userId: apiUserId,

      timestamp,

      type: n.type,

      message: rawMessage,

      status: n.status,

    },

    fromUser: {

      id: actorUserId || String(meta.buyerId || ''),

      name: senderName,

      initials,

    },

    postTitle: String(meta.postTitle || meta.publicationTitle || ''),

    eventName,

    eventId,

    venueId: venueId || undefined,

    serviceId: serviceId || undefined,

    venueName: venueName || undefined,

    serviceName: serviceName || undefined,

    priceLabel: String(meta.total || ''),

    postId: String(meta.postId || meta.publicationId || data.publicationId || ''),

    followId: followId || undefined,

    message: rawMessage,

    timeAgo: formatRelativeTime(n.timestamp || n.createdAt),

    read: Boolean(n.read || n.readStatus === 'read'),

    actionable: isActionableType(type),

  };

}


