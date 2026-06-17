import { useCallback, useEffect, useState } from 'react';
import { normalizeExpiresAtTs } from './reservationTime';

const STORAGE_PREFIX = 'doevents_reservation_';

export interface StoredReservation {
  orderId: string;
  eventId: string;
  userId: string;
  expiresAtTs: number;
  expiresAtIso?: string;
  totalAmount?: number;
  ticketCount?: number;
}

export function reservationStorageKey(eventId: string, userId: string): string {
  return `${STORAGE_PREFIX}${eventId}_${userId}`;
}

export function loadStoredReservation(eventId: string, userId: string): StoredReservation | null {
  try {
    const raw = localStorage.getItem(reservationStorageKey(eventId, userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredReservation;
    if (!parsed.orderId || !parsed.expiresAtTs) return null;
    const expiresMs = normalizeExpiresAtTs(parsed.expiresAtTs) ?? parsed.expiresAtTs;
    if (expiresMs <= Date.now()) {
      localStorage.removeItem(reservationStorageKey(eventId, userId));
      return null;
    }
    return { ...parsed, expiresAtTs: expiresMs };
  } catch {
    return null;
  }
}

export function saveStoredReservation(reservation: StoredReservation): void {
  const expiresAtTs = normalizeExpiresAtTs(reservation.expiresAtTs) ?? reservation.expiresAtTs;
  localStorage.setItem(
    reservationStorageKey(reservation.eventId, reservation.userId),
    JSON.stringify({ ...reservation, expiresAtTs }),
  );
}

export function clearStoredReservation(eventId: string, userId: string): void {
  localStorage.removeItem(reservationStorageKey(eventId, userId));
}

export function listStoredReservationsForUser(userId: string): StoredReservation[] {
  const results: StoredReservation[] = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key?.startsWith(STORAGE_PREFIX) || !key.endsWith(`_${userId}`)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as StoredReservation;
      if (!parsed.orderId || !parsed.expiresAtTs) continue;
      const expiresMs = normalizeExpiresAtTs(parsed.expiresAtTs) ?? parsed.expiresAtTs;
      if (expiresMs <= Date.now()) {
        localStorage.removeItem(key);
        continue;
      }
      results.push({ ...parsed, expiresAtTs: expiresMs });
    }
  } catch {
    return results;
  }
  return results;
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function useReservationTimer(expiresAtTs?: number | null) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const expiresMs = normalizeExpiresAtTs(expiresAtTs ?? null);

  useEffect(() => {
    if (!expiresMs) {
      setRemainingMs(null);
      return undefined;
    }
    const tick = () => {
      const diff = expiresMs - Date.now();
      setRemainingMs(diff > 0 ? diff : 0);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresMs]);

  const isExpired = remainingMs !== null && remainingMs <= 0;
  const label = remainingMs !== null ? formatCountdown(remainingMs) : null;

  const clear = useCallback((eventId: string, userId: string) => {
    clearStoredReservation(eventId, userId);
    setRemainingMs(null);
  }, []);

  return { remainingMs, label, isExpired, clear };
}
