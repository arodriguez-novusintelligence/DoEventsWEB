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

const initialNotifications: Notification[] = [
  {
    id: 'n-freq-1',
    type: 'follow_request',
    fromUser: { id: 'u-VT', name: 'Valentina Torres', initials: 'VT' },
    message: 'quiere seguirte',
    timeAgo: 'hace 1 min',
    read: false,
    actionable: true,
  },
  {
    id: 'n-freq-2',
    type: 'follow_request',
    fromUser: { id: 'u-CG', name: 'Carolina Gil', initials: 'CG' },
    message: 'quiere seguirte',
    timeAgo: 'hace 8 min',
    read: false,
    actionable: true,
  },
  {
    id: 'n-evmention-carros',
    type: 'event_mention',
    fromUser: { name: 'Tú', initials: 'TU' },
    eventName: 'Exposición de Carros Antiguos',
    postTitle: 'Me voy al evento de carros antiguos',
    message: 'mencionó tu evento en una publicación',
    timeAgo: 'Justo ahora',
    read: false,
  },
  {
    id: 'n-mention-jeison',
    type: 'user_mention',
    fromUser: { name: 'Tú', initials: 'TU' },
    postTitle: 'Me voy al evento de carros antiguos',
    message: 'te mencionó en una publicación',
    timeAgo: 'Justo ahora',
    read: false,
  },
  {
    id: 'n-evmention1',
    type: 'event_mention',
    fromUser: { name: 'Juan Sebastián', initials: 'JS' },
    eventName: 'Feria de Postres',
    postTitle: 'Restaurante Mirador del Valle',
    postId: '2',
    message: 'mencionó tu evento en una publicación',
    timeAgo: 'hace 1 min',
    read: false,
  },
  {
    id: 'n-mention1',
    type: 'user_mention',
    fromUser: { name: 'Camila Días', initials: 'CD' },
    postTitle: '¡Dulce Fiesta: La Feria de Postres Más Sabrosa del Año!',
    postId: '1',
    message: 'te mencionó en una publicación',
    timeAgo: 'hace 2 min',
    read: false,
  },
  {
    id: 'n-mention2',
    type: 'user_mention',
    fromUser: { name: 'Camila Días', initials: 'CD' },
    postTitle: '¡Dulce Fiesta: La Feria de Postres Más Sabrosa del Año!',
    postId: '1',
    message: 'te mencionó en una publicación',
    timeAgo: 'hace 2 min',
    read: false,
  },
  {
    id: 'n-mention3',
    type: 'user_mention',
    fromUser: { name: 'Camila Días', initials: 'CD' },
    postTitle: '¡Dulce Fiesta: La Feria de Postres Más Sabrosa del Año!',
    postId: '1',
    message: 'te mencionó en una publicación',
    timeAgo: 'hace 2 min',
    read: false,
  },
  {
    id: 'n-mention4',
    type: 'user_mention',
    fromUser: { name: 'Camila Días', initials: 'CD' },
    postTitle: '¡Dulce Fiesta: La Feria de Postres Más Sabrosa del Año!',
    postId: '1',
    message: 'te mencionó en una publicación',
    timeAgo: 'hace 2 min',
    read: false,
  },
  {
    id: 'n-mention5',
    type: 'user_mention',
    fromUser: { name: 'Camila Días', initials: 'CD' },
    postTitle: '¡Dulce Fiesta: La Feria de Postres Más Sabrosa del Año!',
    postId: '1',
    message: 'te mencionó en una publicación',
    timeAgo: 'hace 2 min',
    read: false,
  },
  {
    id: 'n1',
    type: 'chatroom_invite',
    fromUser: { name: 'Andrea Ruiz', initials: 'AR' },
    eventName: 'Festival de Primavera 2026',
    message: 'Te ha invitado a participar en el ChatRoom del evento',
    timeAgo: 'hace 30 seg',
    read: false,
    actionable: true,
  },
  {
    id: 'n1b',
    type: 'event_invite',
    fromUser: { name: 'Carlos Mendoza', initials: 'CM' },
    eventName: 'Festival de Primavera 2026',
    message: 'Te ha invitado a ir al evento',
    timeAgo: 'hace 1 min',
    read: false,
    actionable: true,
  },
  {
    id: 'n2',
    type: 'event_created',
    fromUser: { name: 'Tú', initials: 'TU' },
    eventName: 'Noche de Jazz en el Parque',
    message: '🎉 Tu evento ha sido creado exitosamente',
    timeAgo: 'hace 5 min',
    read: false,
  },
  {
    id: 'n3',
    type: 'ticket_transfer',
    fromUser: { name: 'María López', initials: 'ML' },
    eventName: 'Concierto Sinfónico Nacional',
    message: 'Te ha transferido una boleta',
    timeAgo: 'hace 10 min',
    read: false,
  },
  {
    id: 'n4',
    type: 'refund',
    fromUser: { name: 'Sistema', initials: '💳' },
    eventName: 'Workshop de Fotografía',
    message: 'Reembolso procesado exitosamente',
    timeAgo: 'hace 20 min',
    read: false,
  },
  {
    id: 'n5',
    type: 'access_assignment',
    fromUser: { name: 'Andrea Ruiz', initials: 'AR' },
    eventName: 'Expo Gastronómica 2026',
    message: 'Te han asignado a la Puerta Principal para gestión de control de acceso',
    timeAgo: 'hace 30 min',
    read: false,
  },
  {
    id: 'n6',
    type: 'event_finished',
    fromUser: { name: 'Sistema', initials: '⭐' },
    eventName: 'Exposición de Carros Clásicos',
    message: 'El evento ha finalizado. ¡Califica tu experiencia!',
    timeAgo: 'hace 1 hora',
    read: false,
    actionable: true,
  },
  {
    id: 'n7',
    type: 'followed_event',
    fromUser: { name: 'Camila Días', initials: 'CD' },
    eventName: 'Mercado Nocturno Artesanal',
    message: 'a quien sigues, ha publicado un nuevo evento',
    timeAgo: 'hace 2 horas',
    read: true,
  },
  {
    id: 'n8',
    type: 'followed_post',
    fromUser: { name: 'Juan Sebastián', initials: 'JS' },
    postTitle: 'Los mejores restaurantes de la ciudad',
    message: 'a quien sigues, ha publicado un nuevo post',
    timeAgo: 'hace 3 horas',
    read: true,
  },
  {
    id: 'n8b',
    type: 'repost',
    fromUser: { name: 'Andrés Gómez', initials: 'AG' },
    postTitle: 'Noche de Jazz en el Parque',
    message: 'reposteó tu evento',
    timeAgo: 'hace 3.5 horas',
    read: true,
  },
  {
    id: 'n9',
    type: 'like',
    fromUser: { name: 'Carolina Gil', initials: 'CG' },
    postTitle: 'Exposición de Carros Clásicos',
    timeAgo: 'hace 4 horas',
    read: true,
  },
  {
    id: 'n10',
    type: 'comment',
    fromUser: { name: 'Daniel Arroyave', initials: 'DA' },
    postTitle: 'Noche de Jazz en el Parque',
    timeAgo: 'hace 5 horas',
    read: true,
  },
  {
    id: 'n11',
    type: 'follow',
    fromUser: { name: 'Valentina Torres', initials: 'VT' },
    timeAgo: 'hace 6 horas',
    read: true,
  },
];

export const NotificationsProvider = ({
  children,
  userId,
}: {
  children: ReactNode;
  userId?: string;
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const reloadFromApi = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      return;
    }
    try {
      const items = await fetchUserNotifications(userId);
      setNotifications(items.map(appNotificationToLovable));
    } catch {
      setNotifications([]);
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
      value={{ notifications, unreadCount, addNotification, markAllRead, markRead, dismissNotification, updateNotification, clearAll }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
