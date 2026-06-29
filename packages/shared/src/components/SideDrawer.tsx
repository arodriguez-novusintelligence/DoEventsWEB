import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { clearSession } from '../api/authService';
import { fetchUserById, UserProfile } from '../api/userService';
import { resolveUserDisplayName, getPersistedUserDisplayName } from '../lib/userDisplayName';
import { RootState } from '../store';
import { UserAvatar } from './UserAvatar';

export interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
}

const PRINCIPAL_ITEMS = [
  { label: 'Feed', path: '/', icon: '🏠', tint: 'sky' },
  { label: 'Mis Boletas', path: '/tickets', icon: '🎟️', tint: 'rose' },
  { label: 'Mensajes', path: '/chat', icon: '💬', tint: 'sky' },
  { label: 'Control de accesos', path: '/access', icon: '📱', tint: 'amber' },
  { label: 'Mapa', path: '/map', icon: '🗺️', tint: 'emerald' },
  { label: 'Gestión de invitados', path: '/guests', icon: '👥', tint: 'fuchsia' },
];

const SUPPORT_ITEMS = [
  { label: 'Costos de la plataforma', path: '/profile/plan/detail', icon: '💲', tint: 'emerald' },
  { label: 'Términos y Condiciones', path: '/search', icon: '📄', tint: 'slate' },
  { label: 'Política de seguridad', path: '/search', icon: '🛡️', tint: 'blue' },
  { label: 'Recuerdos y Reembolsos', path: '/profile/refunds', icon: '↩️', tint: 'indigo' },
];

const PROFILE_MENU_ITEMS = [
  { label: 'Editar mi perfil', path: '/profile', icon: '✏️', openEdit: true },
  { label: 'Mis fotos', path: '/profile/gallery', icon: '📷' },
  { label: 'Mis invitaciones', path: '/profile/invitations', icon: '💌' },
  { label: 'Mi plan', path: '/profile/plan/detail', icon: '⭐' },
  { label: 'Configuración', path: '/profile', icon: '⚙️', scrollSettings: true },
];

export const SideDrawer: React.FC<SideDrawerProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    fetchUserById(userId)
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [open, userId]);

  useEffect(() => {
    if (!open) setProfileMenuOpen(false);
  }, [open]);

  const goTo = (path: string, options?: { openEdit?: boolean; scrollSettings?: boolean }) => {
    onClose();
    setProfileMenuOpen(false);
    navigate(path, {
      state: {
        openEdit: options?.openEdit,
        scrollSettings: options?.scrollSettings,
      },
    });
  };

  const handleLogout = () => {
    onClose();
    setProfileMenuOpen(false);
    clearSession();
    navigate('/auth/login');
  };

  const displayName = resolveUserDisplayName(profile) || getPersistedUserDisplayName() || 'Usuario';
  const username = profile?.username ? `@${profile.username}` : '@usuario';

  const toggleProfileMenu = () => {
    if (!userId) {
      goTo('/auth/login');
      return;
    }
    setProfileMenuOpen((prev) => !prev);
  };

  return (
    <>
      {open && (
        <button type="button" className="de-drawer-overlay" aria-label="Cerrar menú" onClick={onClose} />
      )}
      <aside className={`de-drawer${open ? ' de-drawer--open' : ''}`} aria-hidden={!open}>
        <div className="de-drawer__profile">
          <button
            type="button"
            className="de-drawer__profile-trigger"
            onClick={toggleProfileMenu}
            aria-expanded={profileMenuOpen}
            aria-label="Opciones de perfil"
          >
            <UserAvatar
              name={displayName}
              imageUrl={profile?.imagen}
              size={56}
              className="de-drawer__avatar"
            />
            <div className="de-drawer__profile-text">
              <strong>{displayName}</strong>
              <span>{username}</span>
            </div>
            {userId && (
              <span className="de-drawer__profile-chevron" aria-hidden="true">
                {profileMenuOpen ? '▴' : '▾'}
              </span>
            )}
          </button>
          <button type="button" className="de-drawer__close" aria-label="Cerrar" onClick={onClose}>
            ‹
          </button>
        </div>

        {profileMenuOpen && userId && (
          <div className="de-drawer-user-menu">
            <div className="de-drawer-user-menu__hero">
              <UserAvatar
                name={displayName}
                imageUrl={profile?.imagen}
                size={80}
                className="de-drawer-user-menu__avatar"
              />
              <strong>{displayName}</strong>
              <span>{username}</span>
            </div>
            <nav className="de-drawer-user-menu__nav">
              {PROFILE_MENU_ITEMS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="de-drawer-user-menu__link"
                  onClick={() => goTo(item.path, { openEdit: item.openEdit, scrollSettings: item.scrollSettings })}
                >
                  <span className="de-drawer__link-icon" aria-hidden="true">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}

        {!userId && (
          <button type="button" className="de-drawer__login" onClick={() => goTo('/auth/login')}>
            Iniciar sesión
          </button>
        )}

        <p className="de-drawer__section">PRINCIPAL</p>
        <nav className="de-drawer__nav">
          {PRINCIPAL_ITEMS.map((item) => (
            <button key={item.label} type="button" className="de-drawer__link" onClick={() => goTo(item.path)}>
              <span className={`de-drawer__link-icon de-drawer__link-icon--${item.tint}`} aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <p className="de-drawer__section">SOPORTE</p>
        <nav className="de-drawer__nav">
          {SUPPORT_ITEMS.map((item) => (
            <button key={item.label} type="button" className="de-drawer__link" onClick={() => goTo(item.path)}>
              <span className={`de-drawer__link-icon de-drawer__link-icon--${item.tint}`} aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {userId && (
          <button type="button" className="de-drawer__logout" onClick={handleLogout}>
            <span className="de-drawer__link-icon" aria-hidden="true">↪</span>
            Cerrar sesión
          </button>
        )}
      </aside>
    </>
  );
};

export default SideDrawer;
