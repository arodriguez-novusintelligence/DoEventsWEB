import { Sparkles, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'feed_theme_v1';

export const useFeedTheme = () => {
  const [theme, setTheme] = useState<'default' | 'gold'>(() => {
    if (typeof window === 'undefined') return 'default';
    return (localStorage.getItem(STORAGE_KEY) as 'gold' | 'default') || 'default';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'gold') root.setAttribute('data-feed-theme', 'gold');
    else root.removeAttribute('data-feed-theme');
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  return { theme, setTheme };
};

const FeedThemeToggle = () => {
  const { theme, setTheme } = useFeedTheme();
  const isGold = theme === 'gold';
  return (
    <button
      onClick={() => setTheme(isGold ? 'default' : 'gold')}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
        isGold
          ? 'bg-white/90 text-amber-700 hover:bg-white'
          : 'bg-gradient-to-r from-amber-300 to-yellow-500 text-amber-950 hover:from-amber-400 hover:to-yellow-600'
      }`}
      title={isGold ? 'Revertir tema' : 'Activar tema dorado'}
    >
      {isGold ? <RotateCcw className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
      {isGold ? 'Revertir' : 'Dorado'}
    </button>
  );
};

export default FeedThemeToggle;