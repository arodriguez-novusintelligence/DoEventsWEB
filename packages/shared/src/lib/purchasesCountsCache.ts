const CACHE_KEY = 'doevents_purchases_counts_v1';

/** TTL del cache de contadores en Mis Compras (10 minutos). */
export const PURCHASES_COUNTS_CACHE_TTL_MS = 10 * 60 * 1000;

export interface PurchaseCountsSnapshot {
  ticketCount: number;
  venueCount: number;
  serviceCount: number;
  cachedAt: number;
}

export interface PurchaseCounts {
  ticketCount: number;
  venueCount: number;
  serviceCount: number;
}

export interface HydratedPurchaseCounts {
  counts: PurchaseCounts;
  isFresh: boolean;
  hasSnapshot: boolean;
}

interface PurchaseCountsStore {
  users: Record<string, PurchaseCountsSnapshot>;
}

function readStore(): PurchaseCountsStore {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { users: {} };
    return JSON.parse(raw) as PurchaseCountsStore;
  } catch {
    return { users: {} };
  }
}

function writeStore(store: PurchaseCountsStore): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

export function isPurchaseCountsCacheFresh(cachedAt: number): boolean {
  return cachedAt > 0 && Date.now() - cachedAt < PURCHASES_COUNTS_CACHE_TTL_MS;
}

export function hydratePurchaseCounts(userId: string): HydratedPurchaseCounts {
  const empty: PurchaseCounts = { ticketCount: 0, venueCount: 0, serviceCount: 0 };
  if (!userId) {
    return { counts: empty, isFresh: false, hasSnapshot: false };
  }
  const entry = readStore().users[userId];
  if (!entry) {
    return { counts: empty, isFresh: false, hasSnapshot: false };
  }
  return {
    counts: {
      ticketCount: entry.ticketCount,
      venueCount: entry.venueCount,
      serviceCount: entry.serviceCount,
    },
    isFresh: isPurchaseCountsCacheFresh(entry.cachedAt),
    hasSnapshot: true,
  };
}

export function getCachedPurchaseCounts(userId: string): PurchaseCountsSnapshot | null {
  const hydrated = hydratePurchaseCounts(userId);
  if (!hydrated.hasSnapshot || !hydrated.isFresh) return null;
  const entry = readStore().users[userId];
  return entry ?? null;
}

/** Último snapshot guardado (aunque haya expirado), para mostrar algo mientras revalida. */
export function getStalePurchaseCounts(userId: string): PurchaseCountsSnapshot | null {
  if (!userId) return null;
  return readStore().users[userId] ?? null;
}

export function setCachedPurchaseCounts(userId: string, counts: PurchaseCounts): void {
  if (!userId) return;
  const store = readStore();
  store.users[userId] = {
    ticketCount: counts.ticketCount,
    venueCount: counts.venueCount,
    serviceCount: counts.serviceCount,
    cachedAt: Date.now(),
  };
  writeStore(store);
}

/** Ajusta contadores en cache (compra/reserva) sin borrar el snapshot. */
export function adjustPurchaseCountsCache(
  userId: string,
  delta: Partial<PurchaseCounts>,
): void {
  if (!userId) return;
  const store = readStore();
  const base = store.users[userId] ?? {
    ticketCount: 0,
    venueCount: 0,
    serviceCount: 0,
    cachedAt: 0,
  };
  store.users[userId] = {
    ticketCount: Math.max(0, base.ticketCount + (delta.ticketCount ?? 0)),
    venueCount: Math.max(0, base.venueCount + (delta.venueCount ?? 0)),
    serviceCount: Math.max(0, base.serviceCount + (delta.serviceCount ?? 0)),
    cachedAt: Date.now(),
  };
  writeStore(store);
}

/**
 * Marca el cache como vencido pero conserva los números visibles.
 * La próxima visita revalida en segundo plano sin mostrar "…".
 */
export function invalidatePurchaseCountsCache(userId?: string): void {
  const store = readStore();
  if (!userId) {
    Object.values(store.users).forEach((entry) => {
      entry.cachedAt = 0;
    });
    writeStore(store);
    return;
  }
  const entry = store.users[userId];
  if (entry) {
    entry.cachedAt = 0;
    writeStore(store);
  }
}
