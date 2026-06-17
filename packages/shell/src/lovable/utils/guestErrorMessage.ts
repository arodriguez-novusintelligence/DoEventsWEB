/** Extrae mensaje legible de errores de API/red para mostrar al usuario. */
export function guestErrorMessage(err: unknown, fallback = 'Intenta de nuevo'): string {
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  if (typeof err === 'string' && err.trim()) return err.trim();
  if (err && typeof err === 'object') {
    const o = err as Record<string, unknown>;
    const msg = o.message || o.error || o.description;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
  }
  return fallback;
}
