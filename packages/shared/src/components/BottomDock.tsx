import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BOTTOM_NAV_ITEMS } from './BottomNav';
import { TabIcon } from './icons/TabIcons';

export const BottomDock: React.FC = () => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const lastScrollY = useRef(0);
  const rafId = useRef<number | null>(null);

  const options = [
    { label: 'Crear evento', action: () => navigate('/events/create') },
    { label: 'Publicar lugar', action: () => navigate('/places/publish') },
    { label: 'Agregar publicación', action: () => window.dispatchEvent(new Event('de-open-create-post')) },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (rafId.current) return;
      rafId.current = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollY.current;
        const tolerance = 8;

        if (delta > tolerance && currentScrollY > 60) {
          if (visible && !leaving) {
            setLeaving(true);
            window.setTimeout(() => {
              setVisible(false);
              setLeaving(false);
            }, 300);
          }
        } else if (delta < -tolerance) {
          if (!visible && !leaving) {
            setVisible(true);
            setLeaving(false);
          }
        }

        lastScrollY.current = currentScrollY;
        rafId.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [visible, leaving]);

  if (!visible && !leaving) return null;

  const navAnimClass = leaving ? 'de-bottom-dock__nav--leaving' : 'de-bottom-dock__nav--entering';
  const fabAnimClass = leaving ? 'de-bottom-dock__fab--leaving' : 'de-bottom-dock__fab--entering';

  return (
    <>
      {expanded && (
        <button
          type="button"
          className="de-fab-overlay"
          aria-label="Cerrar menú"
          onClick={() => setExpanded(false)}
        />
      )}
      <div className="de-bottom-dock">
        {expanded && (
          <div className="de-bottom-dock__options">
            {options.map((option) => (
              <button
                key={option.label}
                type="button"
                className="de-fab-option"
                onClick={() => {
                  setExpanded(false);
                  option.action();
                }}
              >
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
        <nav className={`de-bottom-dock__nav ${navAnimClass}`} aria-label="Navegación principal">
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
                      color={isActive ? '#FFFFFF' : 'rgba(255,255,255,0.8)'}
                      size={20}
                    />
                  </span>
                  <span className="de-bottom-nav__label">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          className={`de-bottom-dock__fab ${fabAnimClass}`}
          aria-label={expanded ? 'Cerrar' : 'Crear'}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '×' : '+'}
        </button>
      </div>
    </>
  );
};

export default BottomDock;
