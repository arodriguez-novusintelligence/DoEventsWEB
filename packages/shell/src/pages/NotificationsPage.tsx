import React, { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useSelector } from 'react-redux';

import {

  AppNotification,

  deleteAllNotifications,

  deleteNotification,

  fetchUserNotifications,

  Loader,

  markAllNotificationsRead,

  markNotificationRead,

  RootState,

  useToast,

  emitNotificationsUpdated,

} from '@doevents/shared';

import { appNotificationToLovable } from '../lovable-bridge/notificationsAdapter';
import {
  isNotificationRowClickable,
  resolveNotificationTarget,
} from '../lovable-bridge/notificationNavigation';



function formatRelativeTime(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `hace ${diffDays} d`;
}


function notificationMessage(n: AppNotification): string {
  const meta = n.metadata || {};
  const metaType = String(n.type || meta.type || '').toLowerCase();
  if (metaType.includes('chat-message') || metaType.includes('chat_user_new_message')) {
    const sender = String(meta.senderName || 'Alguien');
    return `${sender} está intentando contactarte por chat.`;
  }
  return n.message || n.body || 'Nueva notificación';
}

function notificationTitle(n: AppNotification): string {
  const meta = n.metadata || {};
  const metaType = String(n.type || meta.type || '').toLowerCase();
  const text = `${n.type || ''} ${n.title || ''} ${n.message || ''} ${meta.type || ''}`.toLowerCase();

  if (metaType.includes('chat-message') || metaType.includes('chat_user_new_message')) {
    const sender = String(meta.senderName || 'Alguien');
    return `💬 ${sender} está intentando contactarte`;
  }
  if (metaType.includes('chat-room-invitation') || metaType.includes('chat_user_invite')) {
    const sender = String(n.metadata?.invitedBy || n.metadata?.eventName || 'Alguien');
    if (String(n.metadata?.chatType || '').toLowerCase() === 'direct') {
      return `✉️ ${sender} quiere chatear contigo`;
    }
    return `✉️ Invitación de chat de ${sender}`;
  }
  if (text.includes('invite_accepted') || text.includes('invite-accepted')) {
    return '✅ Invitación de chat aceptada';
  }
  if (text.includes('invite_declined') || text.includes('invite-declined')) {
    return '❌ Invitación de chat rechazada';
  }
  if (text.includes('chat')) return '💬 Mensaje de chat';
  if (text.includes('venta') && text.includes('final')) return '✅ Venta finalizada';
  if (text.includes('entrada') || text.includes('ticket')) return '🎟️ Entradas disponibles';
  if (text.includes('cerr') || text.includes('próxim')) return '⏰ Venta próxima a cerrar';

  return n.title || n.type || '🔔 Notificación';
}



export const NotificationsPage: React.FC = () => {

  const navigate = useNavigate();

  const { showToast } = useToast();

  const userId = useSelector((s: RootState) => s.auth.idUser);

  const [loading, setLoading] = useState(true);

  const [items, setItems] = useState<AppNotification[]>([]);



  const load = async () => {

    if (!userId) return;

    setLoading(true);

    try {

      const data = await fetchUserNotifications(userId);

      setItems(data);

    } catch (err) {

      showToast(err instanceof Error ? err.message : 'Error al cargar notificaciones', 'error');

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    load();

  }, [userId]);



  const handleOpen = async (notification: AppNotification) => {

    try {

      if (!notification.read) {

        await markNotificationRead(notification);

        setItems((prev) => prev.map((n) => (

          n.id === notification.id ? { ...n, read: true, readStatus: 'READ' } : n

        )));

        emitNotificationsUpdated();

      }

      const lovable = appNotificationToLovable(notification);
      const target = resolveNotificationTarget(lovable);
      if (!target) return;

      navigate(target.path, { state: target.state });

    } catch (err) {

      showToast(err instanceof Error ? err.message : 'No se pudo abrir la notificación', 'error');

    }

  };



  const handleMarkAllRead = async () => {

    if (!userId || !items.length) return;

    try {

      await markAllNotificationsRead(userId, items);

      setItems((prev) => prev.map((n) => ({ ...n, read: true, readStatus: 'READ' })));

      emitNotificationsUpdated();

      showToast('Notificaciones marcadas como leídas', 'success');

    } catch (err) {

      showToast(err instanceof Error ? err.message : 'Error al marcar leídas', 'error');

    }

  };



  const handleDeleteAll = async () => {

    if (!userId) return;

    try {

      await deleteAllNotifications(userId);

      setItems([]);

      showToast('Notificaciones eliminadas', 'success');

    } catch (err) {

      showToast(err instanceof Error ? err.message : 'Error al eliminar todas', 'error');

    }

  };



  return (

    <div className="de-notifications-page">

      <div className="de-safe-top" />

      <header className="de-notifications-header">

        <button type="button" className="de-notifications-header__back" aria-label="Volver" onClick={() => navigate(-1)}>

          ‹

        </button>

        <h1>Notificaciones</h1>

        <div className="de-notifications-header__actions">

          {items.some((n) => !n.read) && (

            <button type="button" className="de-notifications-header__action" onClick={handleMarkAllRead}>

              ✓✓ Marcar leídas

            </button>

          )}

          {items.length > 0 && (

            <button type="button" className="de-notifications-header__action de-notifications-header__action--danger" onClick={handleDeleteAll}>

              🗑 Eliminar todas

            </button>

          )}

        </div>

      </header>



      <div className="de-page-body">

        {loading ? (

          <Loader />

        ) : items.length === 0 ? (

          <p className="de-empty-state">No tienes notificaciones.</p>

        ) : (

          <div className="de-notification-list de-notification-list--app">

            {items.map((n) => {
              const lovable = appNotificationToLovable(n);
              const isOpenable = isNotificationRowClickable(lovable);

              return (
              <article

                key={n.id || n.notificationId}

                className={`de-notification-app-item${n.read ? '' : ' de-notification-app-item--unread'}${isOpenable ? ' de-notification-app-item--clickable' : ''}`}

                onClick={isOpenable ? () => handleOpen(n) : undefined}

                role={isOpenable ? 'button' : undefined}

                tabIndex={isOpenable ? 0 : undefined}

                onKeyDown={isOpenable ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleOpen(n); } : undefined}

              >

                <div className="de-notification-app-item__icon" aria-hidden="true">🔔</div>

                <div className="de-notification-app-item__body">

                  <div className="de-notification-app-item__title-row">

                    <strong>{notificationTitle(n)}</strong>

                    {!n.read && <span className="de-notification-app-item__dot" aria-hidden="true" />}

                  </div>

                  <p>{notificationMessage(n)}</p>

                  <div className="de-notification-app-item__meta">

                    <span>👤 Sistema</span>

                    {n.eventName && <span>📅 {n.eventName}</span>}

                  </div>

                  <span className="de-notification-app-item__time">

                    {formatRelativeTime(n.createdAt || n.timestamp)}

                  </span>

                  {(resolvedEventId || n.route || n.roomId || metaType.includes('chat') || metaType.includes('wizard_draft')) && (

                    <button type="button" className="de-notification-app-item__link" onClick={(e) => { e.stopPropagation(); handleOpen(n); }}>

                      {metaType.includes('wizard_draft')
                        ? '✏️ Continuar borrador'
                        : metaType.includes('chat-message')
                        ? '💬 Abrir chat'
                        : metaType.includes('chat')
                        ? '💬 Ver solicitud de chat'
                        : n.route?.includes('/edit')
                          ? '✏️ Continuar edición'
                          : '📅 Ver evento'}

                    </button>

                  )}

                </div>

              </article>
              );
            })}

          </div>

        )}

      </div>

    </div>

  );

};



export default NotificationsPage;

