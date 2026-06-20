import { useEffect, useState } from 'react';
import type { EventChatRoom } from '@lovable/data/chatData';

const DEFAULT_REFRESH_MS = 30_000;

export function useLiveEventStats<T>(
  event: EventChatRoom,
  resolver: (room: EventChatRoom) => Promise<T>,
  empty: T,
  refreshMs = DEFAULT_REFRESH_MS,
): { data: T; loading: boolean; loadError: string | null; reload: () => void } {
  const [data, setData] = useState<T>(empty);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const next = await resolver(event);
        if (!cancelled) {
          setData(next);
          setLoadError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
          setLoading(false);
        }
      }
    };
    setLoading(true);
    void run();
    const timer = window.setInterval(() => { void run(); }, refreshMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [event.eventId, event.id, event.eventName, resolver, refreshMs, reloadToken]);

  return {
    data,
    loading,
    loadError,
    reload: () => setReloadToken((t) => t + 1),
  };
}
