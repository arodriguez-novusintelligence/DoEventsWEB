import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@lovable/lib/utils';

const FEED_THEME_STORAGE_KEY = 'feed_theme_v1';

type FeedTheme = 'light' | 'dark';

const readStoredTheme = (): FeedTheme => {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(FEED_THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    /* ignore */
  }
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

const applyTheme = (theme: FeedTheme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try {
    localStorage.setItem(FEED_THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
};

interface FeedThemeToggleProps {
  className?: string;
}

const FeedThemeToggle = ({ className }: FeedThemeToggleProps) => {
  const [theme, setTheme] = useState<FeedTheme>(() => readStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 ring-1 ring-primary-foreground/20 backdrop-blur transition-colors hover:bg-primary-foreground/25',
        className,
      )}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-primary-foreground" />
      ) : (
        <Moon className="h-4 w-4 text-primary-foreground" />
      )}
    </button>
  );
};

export default FeedThemeToggle;
