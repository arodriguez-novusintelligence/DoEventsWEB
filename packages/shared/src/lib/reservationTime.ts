/** Convierte timestamps de expiración a milisegundos (el backend usa segundos Unix). */
export function normalizeExpiresAtTs(value?: number | null): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return value < 1_000_000_000_000 ? value * 1000 : value;
}

export function resolveOrderExpiresAtTs(order?: {
  expires_at_ts?: number;
  expired_at_ts?: number;
  expires_at?: string;
  order_ttl?: number;
} | null): number | null {
  if (!order) return null;
  const raw = order.expires_at_ts ?? order.expired_at_ts ?? order.order_ttl ?? null;
  if (raw != null) return normalizeExpiresAtTs(raw);
  if (order.expires_at) {
    const parsed = new Date(order.expires_at).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
