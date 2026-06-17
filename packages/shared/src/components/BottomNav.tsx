import React from 'react';
import { NavLink } from 'react-router-dom';
import { Colors } from '../theme';
import { TabIcon, TabIconName } from './icons/TabIcons';

export interface BottomNavItem {
  to: string;
  label: string;
  icon: TabIconName;
  end?: boolean;
}

export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { to: '/', label: 'Feed', icon: 'feed', end: true },
  { to: '/events', label: 'Descubre', icon: 'events' },
  { to: '/map', label: 'Mapa', icon: 'map' },
  { to: '/profile', label: 'Perfil', icon: 'profile' },
];

export const BottomNav: React.FC = () => (
  <nav className="de-bottom-nav" aria-label="Navegación principal">
    {BOTTOM_NAV_ITEMS.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        className={({ isActive }) =>
          `de-bottom-nav__item${isActive ? ' de-bottom-nav__item--active' : ''}`
        }
      >
        {({ isActive }) => (
          <>
            <span className="de-bottom-nav__icon">
              <TabIcon
                name={item.icon}
                color={isActive ? Colors.NightBlue_600 : Colors.TexColor}
                size={24}
              />
            </span>
            <span
              className="de-bottom-nav__label"
              style={{ color: Colors.Blanco }}
            >
              {item.label}
            </span>
          </>
        )}
      </NavLink>
    ))}
  </nav>
);
