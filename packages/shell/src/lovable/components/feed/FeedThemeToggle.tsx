import { Sparkles, RotateCcw, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'feed_theme_v1';

export const useFeedTheme = () => {
  const [theme, setTheme] = useState<'default' | 'gold' | 'black'>(() => {
    if (typeof window === 'undefined') return 'default';
    return (localStorage.getItem(STORAGE_KEY) as 'gold' | 'black' | 'default') || 'default';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.removeAttribute('data-feed-theme');

    if (theme === 'gold') root.setAttribute('data-feed-theme', 'gold');
    if (theme === 'black') root.setAttribute('data-feed-theme', 'black');
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  return { theme, setTheme };
};

const FeedThemeToggle = () => {
  const { theme, setTheme } = useFeedTheme();

  const nextTheme = (): 'default' | 'gold' | 'black' => {
    if (theme === 'default') return 'gold';
    if (theme === 'gold') return 'black';
    return 'default';
  };

  const themeConfig = {
    default: {
      label: 'Dorado',
      icon: Sparkles,
      className:
        'bg-gradient-to-r from-amber-300 to-yellow-500 text-amber-950 hover:from-amber-400 hover:to-yellow-600',
      title: 'Activar tema dorado',
    },
    gold: {
      label: 'Negro',
      icon: Moon,
      className:
        'bg-gradient-to-r from-neutral-700 to-neutral-900 text-neutral-100 hover:from-neutral-800 hover:to-black',
      title: 'Activar tema negro',
    },
    black: {
      label: 'Revertir',
      icon: RotateCcw,
      className: 'bg-white/90 text-neutral-800 hover:bg-white',
      title: 'Volver al tema por defecto',
    },
  };

  const config = themeConfig[theme];
  const Icon = config.icon;
  return (
    <button
      onClick={() => setTheme(nextTheme())}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${config.className}`}
      title={config.title}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </button>
  );
};

export default FeedThemeToggle;