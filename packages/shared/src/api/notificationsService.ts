import { apiRequest, getAuthToken, getCurrentEnv } from './client';



export interface AppNotification {

  id: string;

  notificationId?: string;

  userId?: string;

  channel?: string;

  type?: string;

  status?: string;

  title?: string;

  message?: string;

  body?: string;

  createdAt?: string;

  timestamp?: string;

  read?: boolean;

  readStatus?: string;

  eventId?: string;

  eventName?: string;

  route?: string;

  roomId?: string;

  metadata?: Record<string, unknown>;

}



function authHeaders(): Record<string, string> {

  const token = getAuthToken();

  return {

    'Content-Type': 'application/json',

    Accept: 'application/json',

    ...(token ? { Authorization: token } : {}),

  };

}



function extractIdFromAppPath(segment: 'events' | 'places' | 'services', link?: unknown): string | undefined {
  if (typeof link !== 'string' || !link) return undefined;
  const match = link.match(new RegExp(`/${segment}/([^/?#]+)`, 'i'));
  return match?.[1]?.trim() || undefined;
}

function extractRoomIdFromNotification(item: Record<string, unknown>, metadata: Record<string, unknown>): string | undefined {
  const direct = metadata.roomId || (item as { roomId?: string }).roomId;
  if (direct && typeof direct === 'string' && !direct.includes('/')) {
    return direct.trim();
  }
  const candidates = [metadata.route, metadata.link, metadata.url].filter(Boolean);
  for (const candidate of candidates) {
    const value = String(candidate);
    const fromQuery = value.match(/[?&]roomId=([^&#]+)/i)?.[1];
    if (fromQuery) return decodeURIComponent(fromQuery).trim();
  }
  return undefined;
}

function isChatMessageNotification(type: string, metadata: Record<string, unknown>): boolean {
  const text = `${type} ${metadata.type || ''} ${metadata.templateKey || ''}`.toLowerCase();
  return text.includes('chat-message') || text.includes('chat_user_new_message');
}

function dedupeChatNotifications(items: AppNotification[]): AppNotification[] {
  const chatByRoom = new Map<string, AppNotification>();
  const others: AppNotification[] = [];

  for (const notification of items) {
    const meta = notification.metadata || {};
    const type = String(notification.type || meta.type || '');
    if (!isChatMessageNotification(type, meta)) {
      others.push(notification);
      continue;
    }
    const roomId = notification.roomId || extractRoomIdFromNotification(
      notification as unknown as Record<string, unknown>,
      meta,
    );
    if (!roomId) {
      others.push(notification);
      continue;
    }
    const normalized = { ...notification, roomId };
    const existing = chatByRoom.get(roomId);
    if (!existing) {
      chatByRoom.set(roomId, normalized);
      continue;
    }
    const existingTs = Date.parse(existing.createdAt || existing.timestamp || '') || 0;
    const nextTs = Date.parse(normalized.createdAt || normalized.timestamp || '') || 0;
    if (nextTs >= existingTs) chatByRoom.set(roomId, normalized);
  }

  return [...others, ...chatByRoom.values()].sort((a, b) => {
    const ta = Date.parse(a.createdAt || a.timestamp || '') || 0;
    const tb = Date.parse(b.createdAt || b.timestamp || '') || 0;
    return tb - ta;
  });
}

function normalizeNotification(item: Record<string, unknown>): AppNotification {

  const metadata = (item.metadata || {}) as Record<string, unknown>;

  const data = (item.data || {}) as Record<string, unknown>;

  const timestamp = String(

    item.timestamp

    || item.createdAt

    || metadata.notificationTimestamp

    || metadata.createdAt

    || '',

  );



  return {

    id: String(item.id || item.notificationId || timestamp || ''),

    notificationId: String(item.notificationId || item.id || timestamp || ''),

    userId: String(item.userId || metadata.userId || data.userId || ''),

    channel: (item.channel as string | undefined) || 'inApp',

    type: String(item.type || metadata.type || metadata.entityType || 'notification'),

    status: String(item.status || metadata.status || 'active'),

    title: String(item.title || metadata.title || ''),

    message: String(item.message || item.body || metadata.body || item.title || ''),

    body: item.body as string | undefined,

    createdAt: String(item.createdAt || metadata.createdAt || timestamp),

    timestamp,

    read: Boolean(item.read ?? metadata.read ?? data.read),

    readStatus: String(item.readStatus || metadata.readStatus || (item.read ? 'READ' : 'UNREAD')),

    eventId: (item.eventId || metadata.eventId || data.eventId || extractIdFromAppPath('events', metadata.link || metadata.detailLink || metadata.shareLink || metadata.route)) as string | undefined,

    eventName: (metadata.eventName || data.eventName) as string | undefined,

    route: (() => {
      const direct = (metadata.route || data.route) as string | undefined;
      if (direct) return direct;
      const deepLink = String(metadata.deepLink || data.deepLink || '').trim();
      if (!deepLink) return undefined;
      if (deepLink.startsWith('http://') || deepLink.startsWith('https://')) {
        try {
          const url = new URL(deepLink);
          return `${url.pathname}${url.search}`;
        } catch {
          return deepLink;
        }
      }
      return deepLink.startsWith('/') ? deepLink : `/${deepLink}`;
    })(),

    roomId: extractRoomIdFromNotification(item, metadata),

    metadata,

  };

}



export async function fetchUserNotifications(userId: string): Promise<AppNotification[]> {

  const env = getCurrentEnv();

  try {

    const data = await apiRequest<AppNotification[] | { items?: AppNotification[]; notifications?: AppNotification[] }>({

      method: 'GET',

      url: `${env.endpoints.notificationsByUser}/${encodeURIComponent(userId)}`,

    });

    const raw = Array.isArray(data) ? data : data?.items || data?.notifications || [];

    return dedupeChatNotifications(
      raw.map((item) => normalizeNotification(item as unknown as Record<string, unknown>)),
    );

  } catch (err) {

    const response = await fetch(

      `${env.endpoints.notificationsByUser}/${encodeURIComponent(userId)}`,

      { headers: authHeaders(), mode: 'cors' },

    );

    if (!response.ok) {

      throw new Error(err instanceof Error ? err.message : 'Error al cargar notificaciones');

    }

    const data = await response.json();

    const raw = Array.isArray(data) ? data : data?.items || data?.notifications || [];

    return dedupeChatNotifications(
      raw.map((item: Record<string, unknown>) => normalizeNotification(item)),
    );

  }

}



export async function markNotificationRead(notification: AppNotification): Promise<void> {

  const env = getCurrentEnv();

  const id = notification.notificationId || notification.id;

  if (!notification.userId || !notification.timestamp) {

    throw new Error('Notificación incompleta');

  }

  await apiRequest({

    method: 'PUT',

    url: `${env.endpoints.updateNotification}/${encodeURIComponent(id)}`,

    data: {

      userId: notification.userId,

      timestamp: notification.timestamp,

      type: notification.type || 'notification',

      message: notification.message || notification.body || '',

      status: notification.status || 'active',

      read: true,

    },

  });

}



export async function markAllNotificationsRead(
  userId: string,
  notifications: AppNotification[],
): Promise<void> {
  const unread = notifications.filter((n) => !n.read);
  await Promise.all(unread.map((n) => markNotificationRead({
    ...n,
    userId: n.userId || userId,
  })));
}

export async function deleteNotification(userId: string, notificationId: string): Promise<void> {
  const env = getCurrentEnv();

  await apiRequest({

    method: 'DELETE',

    url: `${env.endpoints.deleteNotification}/${encodeURIComponent(userId)}/${encodeURIComponent(notificationId)}`,

  });

}



export async function deleteAllNotifications(userId: string): Promise<void> {

  const env = getCurrentEnv();

  await apiRequest({

    method: 'DELETE',

    url: `${env.endpoints.deleteAllNotifications}/${encodeURIComponent(userId)}/all`,

  });

}

export async function triggerNotification(input: {
  triggerId: string;
  userId: string;
  eventId?: string;
  channels?: string[];
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const env = getCurrentEnv();
  const token = getAuthToken();
  const response = await fetch(env.endpoints.triggerNotification, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: token } : {}),
    },
    body: JSON.stringify({
      triggerId: input.triggerId,
      templateKey: input.triggerId,
      userId: input.userId,
      eventId: input.eventId,
      channels: input.channels || ['inApp', 'email'],
      metadata: {
        userId: input.userId,
        eventId: input.eventId,
        ...input.metadata,
      },
    }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string; error?: string };
    throw new Error(body.message || body.error || 'No se pudo enviar la notificación');
  }
}

