import { useEffect, useState } from 'react';
import type { EventChatRoom } from '@lovable/data/chatData';

const DEFAULT_REFRESH_MS = 30_000;

export function useLiveEventStats<T>(
  event: EventChatRoom,
  resolver: (room: EventChatRoom) => Promise<T>,
  empty: T,
  refreshMs = DEFAULT_REFRESH_MS,
): { data: T; loading: boolean } {
  const [data, setData] = useState<T>(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const next = await resolver(event);
      if (!cancelled) {
        setData(next);
        setLoading(false);
      }
    };
    setLoading(true);
    void run();
    const timer = window.setInterval(() => { void run(); }, refreshMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [event.eventId, event.id, event.eventName, resolver, refreshMs]);

  return { data, loading };
}
