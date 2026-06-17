import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchUserNotifications } from '../api';
import { NOTIFICATIONS_UPDATED_EVENT } from '../lib/notificationsEvents';
import { chatWebSocketClient } from '../services/chatWebSocket';
import { Colors } from '../theme';
import { RootState } from '../store';
import { SearchIcon, TabIcon } from './icons/TabIcons';

export interface AppHeaderProps {
  onMenuOpen?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onMenuOpen }) => {
  const navigate = useNavigate();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchUserNotifications(userId)
      .then((items) => {
        if (!cancelled) setUnreadCount(items.filter((n) => !n.read).length);
      })
      .catch(() => {
        if (!cancelled) setUnreadCount(0);
      });
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;

    const refreshUnread = () => {
      fetchUserNotifications(userId)
        .then((items) => setUnreadCount(items.filter((n) => !n.read).length))
        .catch(() => undefined);
    };

    chatWebSocketClient.connect(userId);
    const interval = window.setInterval(refreshUnread, 15000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshUnread();
    };
    const onNotificationsUpdated = () => refreshUnread();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onNotificationsUpdated);
    const unsubscribeWs = chatWebSocketClient.onMessage((payload) => {
      if (payload.channel === 'notification' || payload.action === 'inapp_notification' || payload.action === 'InApp') {
        refreshUnread();
      }
    });

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onNotificationsUpdated);
      unsubscribeWs();
    };
  }, [userId]);

  return (
    <header className="de-app-header">
      <div className="de-safe-top" />
      <div className="de-app-header__row">
        <button
          type="button"
          className="de-app-header__menu"
          aria-label="Abrir menú"
          onClick={onMenuOpen}
        >
          <span className="de-app-header__menu-lines" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          {unreadCount > 0 && <span className="de-app-header__menu-dot" aria-hidden="true" />}
        </button>

        <button type="button" className="de-app-header__logo-text" onClick={() => navigate('/')}>
          <span className="de-app-header__logo-do">Do</span>
          <span className="de-app-header__logo-dot">·</span>
          <span className="de-app-header__logo-events">events</span>
          <span className="de-app-header__logo-underline" aria-hidden="true" />
        </button>

        <div className="de-app-header__actions">
          <button
            type="button"
            className="de-app-header__icon-btn"
            aria-label="Notificaciones"
            onClick={() => navigate('/notifications')}
          >
            <TabIcon name="notifications" color={Colors.LovablePrimary} size={24} />
            {unreadCount > 0 && (
              <span className="de-app-header__badge">
                {unreadCount > 999 ? '999+' : unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            className="de-app-header__icon-btn"
            aria-label="Buscar"
            onClick={() => navigate('/search')}
          >
            <SearchIcon color={Colors.LovablePrimary} size={24} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
