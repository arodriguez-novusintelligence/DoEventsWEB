import type { AppNotification } from '@doevents/shared';

import type { Notification, NotificationType } from '@lovable/contexts/NotificationsContext';
import {
  extractIdFromAppPath,
  extractRoomIdFromRoute,
  isActionableNotificationType,
  mapTriggerToType,
} from './notificationNavigation';

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

function isReadNotification(n: AppNotification): boolean {
  if (n.read) return true;
  const status = String(n.readStatus || '').toLowerCase();
  return status === 'read';
}

function resolveNotificationRoute(
  n: AppNotification,
  meta: Record<string, unknown>,
  data: Record<string, unknown>,
): string {
  const direct = String(n.route || meta.route || data.route || '').trim();
  if (direct) return direct;

  const deepLink = String(meta.deepLink || data.deepLink || '').trim();
  if (!deepLink) return '';

  if (deepLink.startsWith('http://') || deepLink.startsWith('https://')) {
    try {
      const url = new URL(deepLink);
      return `${url.pathname}${url.search}`;
    } catch {
      return deepLink;
    }
  }

  return deepLink.startsWith('/') ? deepLink : `/${deepLink}`;
}

export function appNotificationToLovable(n: AppNotification): Notification {
  const meta = n.metadata || {};
  const data = (meta.data || {}) as Record<string, unknown>;
  const type = mapTriggerToType(n.type || String(meta.type || ''), meta);

  const senderName = String(
    meta.senderName
    || meta.actorName
    || meta.buyerName
    || meta.invitedBy
    || meta.inviterName
    || meta.userName
    || meta.organizerName
    || meta.fromName
    || meta.assignedByName
    || (type === 'venue_reservation' || type === 'service_booking' ? 'Sistema' : 'Usuario'),
  );
  const initials = senderName.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'DE';

  const notificationId = n.notificationId || n.id;
  const timestamp = n.timestamp || n.createdAt || '';
  const apiUserId = n.userId || String(meta.userId || '');

  const venueName = String(meta.venueName || '');
  const serviceName = String(meta.serviceName || meta.entityName || '');
  const eventName = n.eventName || String(meta.eventName || meta.entityName || venueName || serviceName || '');

  const entityType = String(meta.entityType || data.entityType || '');
  const entityId = String(meta.entityId || data.entityId || '');

  const venueId = String(
    meta.venueId
    || data.venueId
    || (entityType.toUpperCase() === 'VENUE' ? entityId : '')
    || extractIdFromAppPath(String(meta.link || meta.route || ''), 'places'),
  );

  const serviceId = String(
    meta.serviceId
    || data.serviceId
    || (entityType.toUpperCase() === 'SERVICE' ? entityId : '')
    || extractIdFromAppPath(String(meta.link || meta.route || ''), 'services'),
  );

  const eventId = String(
    n.eventId
    || meta.eventId
    || data.eventId
    || (entityType.toUpperCase() === 'EVENT' ? entityId : '')
    || extractIdFromAppPath(String(meta.link || meta.detailLink || meta.shareLink || meta.route || ''), 'events'),
  );

  const followId = String(meta.followId || data.followId || '');
  const actorUserId = String(
    meta.actorUserId
    || data.actorUserId
    || meta.senderId
    || meta.fromUserId
    || meta.invitedBy
    || meta.assignedByUserId
    || '',
  );

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
    entityId: entityId || undefined,
    entityType: entityType || undefined,
    triggerKey: String(meta.triggerId || meta.templateKey || n.type || ''),
    invitationId: String(meta.invitationId || data.invitationId || ''),
    gateId: String(meta.gateId || data.gateId || ''),
    gateName: String(meta.gateName || data.gateName || ''),
    roomId: String(
      meta.roomId
      || data.roomId
      || n.roomId
      || extractRoomIdFromRoute(String(n.route || meta.route || data.route || ''))
      || '',
    ),
    route: resolveNotificationRoute(n, meta, data),
    taskId: String(meta.taskId || data.taskId || ''),
    venueName: venueName || undefined,
    serviceName: serviceName || undefined,
    priceLabel: String(meta.total || ''),
    promoCode: String(meta.promoCode || meta.code || data.promoCode || data.code || '') || undefined,
    postId: String(meta.postId || meta.publicationId || data.publicationId || ''),
    followId: followId || undefined,
    message: rawMessage,
    timeAgo: formatRelativeTime(n.timestamp || n.createdAt),
    read: isReadNotification(n),
    actionable: isActionableNotificationType(type) || type === 'event_invite',
  };
}

export type { NotificationType };
