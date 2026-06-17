import { LayoutGrid, Compass, Map, User, Plus } from 'lucide-react';
import { cn } from '@lovable/lib/utils';
import { useState, useEffect, useRef } from 'react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCreate?: () => void;
  forceHidden?: boolean;
}

const BottomNav = ({ activeTab, onTabChange, onCreate, forceHidden }: BottomNavProps) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const lastScrollY = useRef(0);
  const rafId = useRef<number | null>(null);

  const tabs = [
    { id: 'wall', label: 'Feed', icon: LayoutGrid },
    { id: 'eventos', label: 'Descubre', icon: Compass },
    { id: 'mapa', label: 'Mapa', icon: Map },
    { id: 'perfil', label: 'Perfil', icon: User },
  ];

  useEffect(() => {
    const enterTimer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(enterTimer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (rafId.current) return;
      rafId.current = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollY.current;
        const tolerance = 8;

        if (delta > tolerance && currentScrollY > 60) {
          // Scrolling down – hide
          if (visible && !leaving) {
            setLeaving(true);
            setTimeout(() => {
              setVisible(false);
              setLeaving(false);
            }, 300);
          }
        } else if (delta < -tolerance) {
          // Scrolling up – show
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


  if (forceHidden || (!visible && !leaving)) return null;

  return (
    <div className="safe-area-bottom pointer-events-none fixed bottom-4 left-0 right-0 z-30 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-[420px] items-center gap-3">
        {/* Floating pill nav */}
        <nav
          className={cn(
            'flex flex-1 items-center justify-around gap-1 rounded-full bg-primary px-2 py-2 shadow-xl',
            leaving ? 'animate-float-nav-out' : 'animate-float-nav-in'
          )}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 transition-all duration-200',
                  active
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'text-primary-foreground/80 hover:text-primary-foreground'
                )}
              >
                <tab.icon className="h-5 w-5" strokeWidth={2} />
                <span className="text-[11px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Floating + button */}
        {onCreate && (
          <button
            onClick={onCreate}
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-all hover:shadow-2xl hover:scale-105 active:scale-95',
              leaving ? 'animate-fab-out' : 'animate-fab-in'
            )}
            aria-label="Crear"
          >
            <Plus className="h-7 w-7" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
};

export default BottomNav;
