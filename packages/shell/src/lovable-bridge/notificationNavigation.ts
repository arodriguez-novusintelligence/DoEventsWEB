import type { Notification, NotificationType } from '@lovable/contexts/NotificationsContext';

export interface NotificationNavigateTarget {
  path: string;
  state?: Record<string, unknown>;
}

export function extractIdFromAppPath(
  link: unknown,
  segment: 'events' | 'places' | 'services',
): string {
  if (typeof link !== 'string' || !link) return '';
  const match = link.match(new RegExp(`/${segment}/([^/?#]+)`, 'i'));
  return match?.[1]?.trim() || '';
}

export function isValidEntityId(id?: string): boolean {
  if (!id) return false;
  const trimmed = id.trim();
  if (trimmed.length < 3) return false;
  if (/^(usuario|sistema|null|undefined)$/i.test(trimmed)) return false;
  return true;
}

function pickId(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (isValidEntityId(value)) return value!.trim();
  }
  return '';
}

export function extractRoomIdFromRoute(route?: string): string {
  if (!route) return '';
  const match = route.match(/[?&]roomId=([^&#]+)/i);
  return match?.[1] ? decodeURIComponent(match[1]).trim() : '';
}

export function extractEventIdFromRoute(route?: string): string {
  if (!route) return '';
  const match = route.match(/[?&]eventId=([^&#]+)/i);
  return match?.[1] ? decodeURIComponent(match[1]).trim() : '';
}

export function resolveNotificationRoomId(n: Notification): string {
  return n.roomId?.trim() || extractRoomIdFromRoute(n.route) || '';
}

/** Invitación al chat de evento/grupo (admin invita sin boleta). Distinto de invitación al evento. */
export function isChatRoomInvitation(n: Notification): boolean {
  if (n.type === 'chatroom_invite') return true;
  const trigger = String(n.triggerKey || '').toUpperCase();
  if (trigger === 'CHAT_USER_INVITE_SEND') return true;
  const route = String(n.route || '').trim();
  if (route.startsWith('/chat') && route.includes('invite=1')) return true;
  const message = String(n.message || '').toLowerCase();
  if (message.includes('invitó al chat') || message.includes('chat del evento')) return true;
  return false;
}

export function resolveChatInviteTarget(n: Notification): NotificationNavigateTarget {
  const route = String(n.route || '').trim();
  if (route.startsWith('/chat')) {
    return { path: route };
  }
  const roomId = resolveNotificationRoomId(n);
  const eventId = n.eventId || extractEventIdFromRoute(route);
  if (eventId && roomId) {
    return {
      path: `/chat?eventId=${encodeURIComponent(eventId)}&roomId=${encodeURIComponent(roomId)}&invite=1`,
    };
  }
  if (roomId) {
    return { path: `/chat?roomId=${encodeURIComponent(roomId)}&invite=1` };
  }
  return { path: '/chat' };
}

export function buildSalesStatsPath(eventId?: string): string {
  if (isValidEntityId(eventId)) {
    return `/profile/stats?event=${encodeURIComponent(eventId!)}&view=ventas`;
  }
  return '/profile/stats';
}

export function resolveNotificationIds(n: Notification) {
  const meta = (n as Notification & { rawMeta?: Record<string, unknown> }).rawMeta || {};
  const triggerKey = String(n.triggerKey || meta.triggerId || meta.templateKey || '').toUpperCase();
  const entityType = String(n.entityType || meta.entityType || '').toUpperCase();

  const eventId = pickId(
    n.eventId,
    extractIdFromAppPath(n.route, 'events'),
    extractIdFromAppPath(String(meta.link || meta.detailLink || meta.shareLink || ''), 'events'),
    entityType === 'EVENT' ? n.entityId : undefined,
    String(meta.eventId || ''),
  );

  const venueId = pickId(
    n.venueId,
    extractIdFromAppPath(n.route, 'places'),
    extractIdFromAppPath(String(meta.link || ''), 'places'),
    entityType === 'VENUE' ? n.entityId : undefined,
    String(meta.venueId || meta.entityId || ''),
  );

  const serviceId = pickId(
    n.serviceId,
    extractIdFromAppPath(n.route, 'services'),
    extractIdFromAppPath(String(meta.link || ''), 'services'),
    entityType === 'SERVICE' ? n.entityId : undefined,
    String(meta.serviceId || meta.entityId || ''),
  );

  const orderId = pickId(
    String(meta.orderID || meta.orderId || meta.order_id || ''),
    extractIdFromAppPath(String(meta.ticketViewLink || meta.viewTicketsLink || ''), 'tickets'),
  );

  return { eventId, venueId, serviceId, orderId, triggerKey, entityType };
}

export function isNotificationActionable(n: Notification): boolean {
  return n.type === 'follow_request'
    || n.type === 'chatroom_invite'
    || n.type === 'event_invite'
    || (Boolean(n.actionable) && n.type === 'event_finished');
}

export function resolveNotificationTarget(n: Notification): NotificationNavigateTarget | null {
  const { eventId, venueId, serviceId, orderId, triggerKey, entityType } = resolveNotificationIds(n);

  if (isChatRoomInvitation(n)) {
    return resolveChatInviteTarget(n);
  }

  if (n.route) {
    const route = n.route.trim();
    if (route.startsWith('http://') || route.startsWith('https://')) {
      try {
        const url = new URL(route);
        return { path: `${url.pathname}${url.search}` };
      } catch {
        // ignore malformed url
      }
    }
    if (route.startsWith('/')) {
      return { path: route };
    }
    if (route.startsWith('event-detail:')) {
      const id = route.slice('event-detail:'.length);
      return isValidEntityId(id) ? { path: `/events/${id}` } : null;
    }
  }

  if (triggerKey === 'ORDER_PAYMENT_APPROVED_BUYER') {
    return { path: '/purchases' };
  }

  if (triggerKey === 'ORDER_NEW_SALE_OWNER') {
    return { path: buildSalesStatsPath(eventId) };
  }

  if (triggerKey === 'PLATFORM_ADMIN_GRANTED') {
    return { path: '/admin' };
  }

  if (triggerKey === 'CO_ADMIN_ASSIGNED' || triggerKey === 'CO-ADMIN_ASSIGNED') {
    if (entityType === 'VENUE' && (venueId || n.entityId)) {
      return { path: `/places/${venueId || n.entityId}` };
    }
    if (entityType === 'SERVICE' && (serviceId || n.entityId)) {
      return { path: `/services/${serviceId || n.entityId}` };
    }
    if (eventId || n.entityId) {
      return { path: `/events/${eventId || n.entityId}` };
    }
  }

  switch (n.type) {
    case 'access_assignment':
      return {
        path: '/access',
        state: {
          eventId: eventId || undefined,
          gateId: n.gateId || undefined,
          initialTab: 'asignados',
          autoScan: Boolean(eventId),
        },
      };

    case 'task_assignment':
      return eventId ? { path: `/events/${eventId}` } : null;

    case 'event_invite':
      return {
        path: '/profile/invitations',
        state: { openEventId: eventId || undefined, invitationId: n.invitationId || undefined },
      };

    case 'venue_reserved':
      return venueId ? { path: `/places/${venueId}` } : null;

    case 'venue_reservation':
      if (venueId) return { path: `/places/${venueId}` };
      return { path: '/purchases' };

    case 'service_booked':
      return serviceId ? { path: `/services/${serviceId}` } : null;

    case 'service_booking':
      return { path: '/purchases/services' };

    case 'ticket_transfer':
      return orderId
        ? { path: `/tickets/${encodeURIComponent(orderId)}` }
        : { path: '/tickets' };
    case 'ticket_purchase':
    case 'refund':
      return { path: '/purchases' };

    case 'ticket_sold':
      return { path: buildSalesStatsPath(eventId) };

    case 'chatroom_invite':
      return resolveChatInviteTarget(n);

    case 'user_mention':
    case 'event_mention':
      return n.postId ? { path: '/', state: { focusPostId: n.postId } } : null;

    case 'event_finished':
      return eventId
        ? { path: `/events/${eventId}`, state: { rateEvent: true } }
        : null;

    case 'promo_code_shared':
    case 'promo_code_canceled':
      return eventId ? { path: `/events/${eventId}` } : null;

    case 'subscription_purchase':
      return { path: '/profile' };

    case 'follow':
      if (n.fromUser.id) {
        return { path: `/users/${encodeURIComponent(n.fromUser.id)}` };
      }
      return { path: '/profile' };

    case 'follow_request':
    case 'chatroom_invite':
      return null;

    default:
      break;
  }

  if (entityType === 'VENUE' && (venueId || n.entityId)) {
    return { path: `/places/${venueId || n.entityId}` };
  }
  if (entityType === 'SERVICE' && (serviceId || n.entityId)) {
    return { path: `/services/${serviceId || n.entityId}` };
  }
  if (entityType === 'EVENT' && (eventId || n.entityId)) {
    return { path: `/events/${eventId || n.entityId}` };
  }
  if (eventId) return { path: `/events/${eventId}` };
  if (serviceId) return { path: `/services/${serviceId}` };
  if (venueId) return { path: `/places/${venueId}` };

  return null;
}

export function isNotificationRowClickable(n: Notification): boolean {
  if (n.type === 'user_mention' || n.type === 'event_mention') {
    return Boolean(n.postId);
  }
  if (isNotificationActionable(n)) {
    return n.type === 'event_invite';
  }
  return resolveNotificationTarget(n) !== null;
}

export function getNotificationActionLabel(n: Notification): string | null {
  const { eventId, venueId, serviceId } = resolveNotificationIds(n);

  switch (n.type) {
    case 'access_assignment':
      return 'Ver control de accesos';
    case 'task_assignment':
      return 'Ver evento';
    case 'event_invite':
      return 'Ver invitación';
    case 'venue_reserved':
    case 'venue_reservation':
      return venueId ? 'Ver lugar' : 'Ver reservas';
    case 'service_booked':
    case 'service_booking':
      return serviceId ? 'Ver servicio' : 'Ver reservas';
    case 'ticket_transfer':
      return 'Ver mis boletas';
    case 'ticket_purchase':
      return 'Ver mis compras';
    case 'ticket_sold':
      return 'Ver estadísticas de ventas';
    case 'refund':
      return 'Ver compras';
    case 'chatroom_invite':
      return 'Ver chat';
    case 'user_mention':
    case 'event_mention':
      return n.postId ? 'Ver publicación' : null;
    case 'followed_post':
    case 'repost':
      return n.postId ? 'Ver publicación' : null;
    case 'promo_code_shared':
    case 'promo_code_canceled':
      return eventId ? 'Ver evento' : null;
    case 'event_created':
    case 'followed_event':
      return eventId ? 'Ver evento' : null;
    default:
      if (serviceId) return 'Ver servicio';
      if (venueId) return 'Ver lugar';
      if (eventId) return 'Ver evento';
      return null;
  }
}

export function mapTriggerToType(
  raw?: string,
  metadata?: Record<string, unknown>,
): NotificationType {
  const t = String(raw || '').toLowerCase();
  const metaType = String(metadata?.type || '').toLowerCase();
  const trigger = String(metadata?.triggerId || metadata?.templateKey || '').toUpperCase();

  if (trigger === 'STAFF_ASSIGNED') return 'access_assignment';
  if (trigger === 'ITINERARY_TASK_ASSIGNED') return 'task_assignment';
  if (
    trigger === 'CHAT_USER_INVITE_SEND'
    || t.includes('chat-room-invitation')
    || t === 'chatroom_invite'
    || metaType === 'chat-room-invitation'
    || metaType.includes('chat_user_invite')
    || metaType.includes('chat-room-invitation')
  ) {
    return 'chatroom_invite';
  }
  const isChatInviteType = (value: string) => (
    value.includes('chat')
    && (value.includes('invite') || value.includes('invitation'))
    && !value.includes('event_invitation')
    && !value.includes('invitacion_evento')
  );
  if (isChatInviteType(t) || isChatInviteType(metaType)) return 'chatroom_invite';
  if (trigger === 'EVENT_INVITATION' || metaType === 'event_invitation' || metaType === 'invitacion_evento') {
    return 'event_invite';
  }
  if (trigger === 'SERVICE_CREATED') return 'service_booked';
  if (trigger === 'VENUE_CREATED') return 'venue_reserved';
  if (trigger === 'EVENT_CREATED' || trigger === 'EVENT_PUBLISHED' || metaType === 'event_published') {
    return 'event_created';
  }
  if (trigger === 'CO_ADMIN_ASSIGNED') return 'followed_post';

  if (trigger === 'ORDER_PAYMENT_APPROVED_BUYER' || metaType === 'order_payment_approved_buyer') {
    return 'ticket_purchase';
  }
  if (trigger === 'ORDER_NEW_SALE_OWNER' || metaType === 'order_new_sale_owner') {
    return 'ticket_sold';
  }

  if (trigger === 'FOLLOW_REQUEST_ACCEPTED' || metaType.includes('follow_request_accepted')) {
    return 'follow';
  }
  if (trigger === 'FOLLOW_REQUEST_REJECTED' || metaType.includes('follow_request_rejected')) {
    return 'follow';
  }

  if (t.includes('follow_request') || metaType.includes('follow_request')) return 'follow_request';
  if (t.includes('feed_event_mentioned') || metaType.includes('feed_event_mentioned')) return 'event_mention';
  if (t.includes('feed_user_mentioned') || metaType.includes('feed_user_mentioned')) return 'user_mention';
  if (t.includes('venue_reserved') || metaType.includes('venue_reserved')) return 'venue_reserved';
  if (t.includes('venue_reservation') || t.includes('venue_booking_confirmed')) return 'venue_reservation';
  if (t.includes('service_booked') || metaType.includes('service_booked')) return 'service_booked';
  if (t.includes('service_booking') || t.includes('service_booking_confirmed')) return 'service_booking';
  if (t.includes('like')) return 'like';
  if (t.includes('comment')) return 'comment';
  if (t.includes('repost')) return 'repost';
  if (t.includes('event_invite') || (t.includes('invitation') && !t.includes('accepted') && !t.includes('rejected'))) {
    return 'event_invite';
  }
  if (t.includes('ticket_purchase') || t.includes('purchase')) return 'ticket_purchase';
  if (t.includes('ticket_sold')) return 'ticket_sold';
  if (t.includes('promo_code_canceled') || metaType.includes('promo_code_canceled')) return 'promo_code_canceled';
  if (t.includes('promo_code_shared') || metaType.includes('promo_code_shared')) return 'promo_code_shared';
  if (t.includes('ticket_transfer')) return 'ticket_transfer';
  if (t.includes('refund')) return 'refund';
  if (t.includes('staff_assigned') || (t.includes('access') && t.includes('assign'))) return 'access_assignment';
  if (t.includes('task_assigned') || t.includes('itinerary_task')) return 'task_assignment';
  if (t.includes('follow')) return 'follow';
  if (t.includes('finished') || t.includes('rate_request')) return 'event_finished';
  if (t.includes('event_created') || t.includes('published')) return 'event_created';

  return 'followed_post';
}

export function isActionableNotificationType(type: NotificationType): boolean {
  return type === 'follow_request' || type === 'chatroom_invite' || type === 'event_finished';
}
