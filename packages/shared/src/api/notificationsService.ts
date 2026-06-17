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

    eventId: (item.eventId || metadata.eventId || data.eventId) as string | undefined,

    eventName: (metadata.eventName || data.eventName) as string | undefined,

    route: (metadata.route || data.route) as string | undefined,

    roomId: (metadata.roomId || metadata.link || data.roomId) as string | undefined,

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

    return raw.map((item) => normalizeNotification(item as unknown as Record<string, unknown>));

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

    return raw.map((item: Record<string, unknown>) => normalizeNotification(item));

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

