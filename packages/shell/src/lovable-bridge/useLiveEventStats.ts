import { useEffect, useRef, useState } from 'react';
import type { EventChatRoom } from '@lovable/data/chatData';
import {
  buildResolvedStatsKey,
  cacheResolvedStats,
  getResolvedStats,
} from './resolvedStatsCache';

const DEFAULT_REFRESH_MS = 30_000;
const BACKGROUND_REFRESH_MS = 60_000;

export function useLiveEventStats<T>(
  event: EventChatRoom,
  resolver: (room: EventChatRoom) => Promise<T>,
  empty: T,
  refreshMs = DEFAULT_REFRESH_MS,
  cacheScope?: string,
): { data: T; loading: boolean; loadError: string | null; reload: () => void } {
  const eventId = event.eventId || event.id || '';
  const resolvedKey = cacheScope && eventId ? buildResolvedStatsKey(eventId, cacheScope) : '';

  const [data, setData] = useState<T>(empty);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const visibleRef = useRef(typeof document === 'undefined' ? true : document.visibilityState === 'visible');
  // Callers often pass `getEmptyX(event)` inline → new object every render.
  // Keeping `empty` out of effect deps avoids infinite reload loops on UI
  // interactions (e.g. expanding a refund row).
  const emptyRef = useRef(empty);
  emptyRef.current = empty;
  const eventRef = useRef(event);
  eventRef.current = event;
  const resolverRef = useRef(resolver);
  resolverRef.current = resolver;

  useEffect(() => {
    let cancelled = false;
    const cached = resolvedKey ? getResolvedStats<T>(resolvedKey, true) : null;
    const hadCache = Boolean(cached);

    if (cached) {
      setData(cached);
      setLoading(false);
    } else {
      setData(emptyRef.current);
      setLoading(true);
    }

    const run = async (isBackground = false) => {
      if (!isBackground && !cached) {
        if (!cancelled) setLoading(true);
      }

      try {
        const next = await resolverRef.current(eventRef.current);
        if (!cancelled) {
          if (resolvedKey) cacheResolvedStats(resolvedKey, next);
          setData(next);
          setLoadError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          const fallback = resolvedKey ? getResolvedStats<T>(resolvedKey, true) : null;
          if (fallback) {
            setData(fallback);
            setLoadError(null);
          } else {
            setLoadError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
          }
          setLoading(false);
        }
      }
    };

    void run(hadCache);

    const intervalMs = hadCache ? BACKGROUND_REFRESH_MS : refreshMs;
    const timer = window.setInterval(() => {
      if (visibleRef.current) void run(true);
    }, intervalMs);

    const onVisibility = () => {
      visibleRef.current = document.visibilityState === 'visible';
      if (visibleRef.current) void run(true);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [event.eventId, event.id, event.eventName, refreshMs, reloadToken, resolvedKey]);

  return {
    data,
    loading,
    loadError,
    reload: () => setReloadToken((t) => t + 1),
  };
}
