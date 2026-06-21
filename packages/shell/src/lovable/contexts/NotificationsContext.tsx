import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  deleteAllNotifications,
  deleteNotification,
  emitNotificationsUpdated,
  fetchUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_UPDATED_EVENT,
} from '@doevents/shared';
import { appNotificationToLovable } from '../../lovable-bridge/notificationsAdapter';

export type NotificationType =
  | 'like'
  | 'comment'
  | 'repost'
  | 'share'
  | 'follow'
  | 'follow_request'
  | 'chatroom_invite'
  | 'event_created'
  | 'event_invite'
  | 'ticket_transfer'
  | 'refund'
  | 'access_assignment'
  | 'event_finished'
  | 'followed_event'
  | 'followed_post'
  | 'user_mention'
  | 'event_mention'
  | 'ticket_purchase'
  | 'ticket_sold'
  | 'venue_reservation'
  | 'venue_reserved'
  | 'service_booking'
  | 'service_booked'
  | 'subscription_purchase';

export interface Notification {
  id: string;
  type: NotificationType;
  fromUser: { id?: string; name: string; initials: string };
  postTitle?: string;
  eventName?: string;
  eventId?: string;
  venueId?: string;
  serviceId?: string;
  venueName?: string;
  serviceName?: string;
  priceLabel?: string;
  postId?: string;
  followId?: string;
  message?: string;
  timeAgo: string;
  read: boolean;
  actionable?: boolean;
  apiMeta?: {
    notificationId: string;
    userId: string;
    timestamp: string;
    type?: string;
    message?: string;
    status?: string;
  };
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  hasUnread: boolean;
  loading: boolean;
  loadError: string | null;
  loadErrorMessage: string | null;
  isEmpty: boolean;
  reload: () => Promise<void>;
  addNotification: (n: Omit<Notification, 'id' | 'timeAgo' | 'read'>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  dismissNotification: (id: string) => void;
  updateNotification: (id: string, patch: Partial<Notification>) => void;
  clearAll: () => void;
}

const fallbackContext: NotificationsContextType = {
  notifications: [],
  unreadCount: 0,
  hasUnread: false,
  loading: false,
  loadError: null,
  loadErrorMessage: null,
  isEmpty: true,
  reload: async () => undefined,
  addNotification: () => undefined,
  markAllRead: () => undefined,
  markRead: () => undefined,
  dismissNotification: () => undefined,
  updateNotification: () => undefined,
  clearAll: () => undefined,
};

const NotificationsContext = createContext<NotificationsContextType>(fallbackContext);

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);

  if (ctx === fallbackContext && import.meta.env.DEV) {
    console.warn('[Notifications] useNotifications is running without NotificationsProvider mounted.');
  }

  return ctx;
};

export const NotificationsProvider = ({
  children,
  userId,
}: {
  children: ReactNode;
  userId?: string;
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reloadFromApi = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoadError(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const items = await fetchUserNotifications(userId);
      setNotifications(items.map(appNotificationToLovable));
    } catch (err) {
      setNotifications([]);
      setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reloadFromApi();
  }, [reloadFromApi]);

  useEffect(() => {
    const handler = () => { void reloadFromApi(); };
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handler);
    return () => window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handler);
  }, [reloadFromApi]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback(
    (n: Omit<Notification, 'id' | 'timeAgo' | 'read'>) => {
      const newNotif: Notification = {
        ...n,
        id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timeAgo: 'Justo ahora',
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    },
    []
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    try {
      const raw = await fetchUserNotifications(userId);
      await markAllNotificationsRead(userId, raw);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      emitNotificationsUpdated();
    } catch {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      emitNotificationsUpdated();
    }
  }, [userId]);

  const markRead = useCallback(async (id: string) => {
    let target: Notification | undefined;
    setNotifications((prev) => {
      target = prev.find((n) => n.id === id);
      if (!target || target.read) return prev;
      return prev.map((n) => (n.id === id ? { ...n, read: true } : n));
    });
    if (!target || target.read) return;
    try {
      const meta = target.apiMeta;
      if (meta?.userId && meta.timestamp) {
        await markNotificationRead({
          id: meta.notificationId,
          notificationId: meta.notificationId,
          userId: meta.userId,
          timestamp: meta.timestamp,
          type: meta.type,
          message: meta.message,
          status: meta.status,
          read: false,
        });
      }
    } catch {
      // mantener estado local leído
    } finally {
      emitNotificationsUpdated();
    }
  }, []);

  const dismissNotification = useCallback(async (id: string) => {
    if (!userId) return;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNotification(userId, id);
      emitNotificationsUpdated();
    } catch {
      emitNotificationsUpdated();
    }
  }, [userId]);

  const updateNotification = useCallback((id: string, patch: Partial<Notification>) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, []);

  const clearAll = useCallback(async () => {
    if (!userId) return;
    setNotifications([]);
    try {
      await deleteAllNotifications(userId);
      emitNotificationsUpdated();
    } catch {
      emitNotificationsUpdated();
    }
  }, [userId]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        hasUnread: unreadCount > 0,
        loading,
        loadError,
        loadErrorMessage: loadError,
        isEmpty: !loading && !loadError && notifications.length === 0,
        reload: reloadFromApi,
        addNotification,
        markAllRead,
        markRead,
        dismissNotification,
        updateNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
