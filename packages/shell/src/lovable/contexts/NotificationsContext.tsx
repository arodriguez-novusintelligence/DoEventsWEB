/**
 * Notifications context — empalme Lovable sobre API real `@doevents/shared`.
 *
 * API expuesta (paridad Lovable):
 * - `notifications`, `unreadNotifications`, `unreadCount`, `unread`, `hasUnread`, `hasNotifications`, `loading`, `loadError`, `loadErrorMessage`, `isEmpty`, `hasError`, `error`
 * - `count`, `notificationCount`, `totalCount` (alias de `notifications.length`)
 * - `loadingState` (`idle` | `loading` | `error` | `empty` | `ready`)
 * - `reload` / `refreshNotifications` / `refresh` / `reloadNotifications` / `fetchNotifications`, `markAllRead`, `markRead` / `markAsRead`, `dismissNotification` / `removeNotification`, `clearAll` / `clearNotifications`
 *
 * Datos vía `fetchUserNotifications` — sin mocks.
 */
import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
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
  | 'task_assignment'
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
  | 'subscription_purchase'
  | 'promo_code_shared'
  | 'promo_code_canceled';

export interface Notification {
  id: string;
  type: NotificationType;
  fromUser: { id?: string; name: string; initials: string };
  postTitle?: string;
  eventName?: string;
  eventId?: string;
  venueId?: string;
  serviceId?: string;
  entityId?: string;
  entityType?: string;
  triggerKey?: string;
  invitationId?: string;
  gateId?: string;
  gateName?: string;
  roomId?: string;
  route?: string;
  taskId?: string;
  venueName?: string;
  serviceName?: string;
  priceLabel?: string;
  promoCode?: string;
  postId?: string;
  followId?: string;
  message?: string;
  timeAgo: string;
  read: boolean;
  actionable?: boolean;
  /** Estado local tras aceptar/rechazar una solicitud de seguimiento. */
  followRequestStatus?: 'accepted' | 'rejected';
  apiMeta?: {
    notificationId: string;
    userId: string;
    timestamp: string;
    type?: string;
    message?: string;
    status?: string;
  };
}

export type NotificationsLoadingState = 'idle' | 'loading' | 'error' | 'empty' | 'ready';

export interface NotificationsContextValue {
  notifications: Notification[];
  /** Alias Lovable — lista filtrada de notificaciones no leídas. */
  unreadNotifications: Notification[];
  unreadCount: number;
  /** Alias Lovable — mismo valor que `unreadCount`. */
  unread: number;
  hasUnread: boolean;
  /** Alias Lovable — inverso de `isEmpty` cuando no hay error ni carga. */
  hasNotifications: boolean;
  loading: boolean;
  loadError: string | null;
  loadErrorMessage: string | null;
  isEmpty: boolean;
  /** Alias Lovable — flag derivado de `loadError`. */
  hasError: boolean;
  /** Alias Lovable — mensaje de error (mismo que `loadErrorMessage`). */
  error: string | null;
  /** Alias Lovable — mismo valor que `loading`. */
  isLoading: boolean;
  reload: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  /** Alias Lovable — mismo handler que `reload`. */
  refresh: () => Promise<void>;
  /** Alias Lovable — mismo handler que `reload`. */
  reloadNotifications: () => Promise<void>;
  /** Alias Lovable — mismo handler que `reload`. */
  fetchNotifications: () => Promise<void>;
  /** Alias Lovable — total de notificaciones en lista. */
  count: number;
  /** Alias Lovable — mismo valor que `count`. */
  notificationCount: number;
  /** Alias Lovable — mismo valor que `count`. */
  totalCount: number;
  /** Alias Lovable — estado derivado para sheets (idle/loading/error/empty/ready). */
  loadingState: NotificationsLoadingState;
  addNotification: (n: Omit<Notification, 'id' | 'timeAgo' | 'read'>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  /** Alias Lovable — mismo handler que `markRead`. */
  markAsRead: (id: string) => void;
  dismissNotification: (id: string) => void;
  /** Alias Lovable — mismo handler que `dismissNotification`. */
  removeNotification: (id: string) => void;
  updateNotification: (id: string, patch: Partial<Notification>) => void;
  clearAll: () => void;
  /** Alias Lovable — mismo handler que `clearAll`. */
  clearNotifications: () => void;
}

const fallbackContext: NotificationsContextValue = {
  notifications: [],
  unreadNotifications: [],
  unreadCount: 0,
  unread: 0,
  hasUnread: false,
  hasNotifications: false,
  loading: false,
  loadError: null,
  loadErrorMessage: null,
  isEmpty: true,
  hasError: false,
  error: null,
  isLoading: false,
  reload: async () => undefined,
  refreshNotifications: async () => undefined,
  refresh: async () => undefined,
  reloadNotifications: async () => undefined,
  fetchNotifications: async () => undefined,
  count: 0,
  notificationCount: 0,
  totalCount: 0,
  loadingState: 'idle',
  addNotification: () => undefined,
  markAllRead: () => undefined,
  markRead: () => undefined,
  markAsRead: () => undefined,
  dismissNotification: () => undefined,
  removeNotification: () => undefined,
  updateNotification: () => undefined,
  clearAll: () => undefined,
  clearNotifications: () => undefined,
};

const NotificationsContext = createContext<NotificationsContextValue>(fallbackContext);

export { NotificationsContext, NOTIFICATIONS_UPDATED_EVENT };

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);

  if (ctx === fallbackContext && import.meta.env.DEV) {
    console.warn('[Notifications] useNotifications is running without NotificationsProvider mounted.');
  }

  return ctx;
};

/** Alias Lovable — misma API que `useNotifications`. */
export const useNotificationsContext = useNotifications;

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
  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read),
    [notifications],
  );
  const loadingState = useMemo((): NotificationsLoadingState => {
    if (loading) return 'loading';
    if (loadError) return 'error';
    if (notifications.length === 0) return 'empty';
    return 'ready';
  }, [loading, loadError, notifications.length]);

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
        unreadNotifications,
        unreadCount,
        unread: unreadCount,
        hasUnread: unreadCount > 0,
        hasNotifications: notifications.length > 0,
        loading,
        loadError,
        loadErrorMessage: loadError,
        isEmpty: !loading && !loadError && notifications.length === 0,
        hasError: Boolean(loadError),
        error: loadError,
        isLoading: loading,
        reload: reloadFromApi,
        refreshNotifications: reloadFromApi,
        refresh: reloadFromApi,
        reloadNotifications: reloadFromApi,
        fetchNotifications: reloadFromApi,
        count: notifications.length,
        notificationCount: notifications.length,
        totalCount: notifications.length,
        loadingState,
        addNotification,
        markAllRead,
        markRead,
        markAsRead: markRead,
        dismissNotification,
        removeNotification: dismissNotification,
        updateNotification,
        clearAll,
        clearNotifications: clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
