/** ID de orden legible: 10 dígitos consecutivos o derivado estable del UUID. */
export function formatDisplayOrderId(
  orderId: string,
  displayOrderId?: string | null,
): string {
  const raw = String(displayOrderId || '').trim();
  if (/^\d{10}$/.test(raw)) return raw;
  const compact = String(orderId || '').replace(/-/g, '');
  if (!compact) return '0000000000';
  let hash = 0;
  for (let i = 0; i < compact.length; i += 1) {
    hash = (hash * 31 + compact.charCodeAt(i)) >>> 0;
  }
  return String(hash % 10_000_000_000).padStart(10, '0');
}

/** ID de boleta legible: 18 dígitos. */
export function formatDisplayTicketId(
  ticket: {
    display_ticket_id?: string | null;
    qr_code?: string | null;
    qrCodeKey?: string | null;
    ticket_id?: string | null;
    ticketInstanceId?: string | null;
    id?: string | null;
  },
): string {
  const raw = String(ticket.display_ticket_id || '').trim();
  if (/^\d{18}$/.test(raw)) return raw;
  const source = String(
    ticket.qr_code
    || ticket.qrCodeKey
    || ticket.ticket_id
    || ticket.ticketInstanceId
    || ticket.id
    || '',
  ).replace(/\D/g, '');
  if (source.length >= 18) return source.slice(-18);
  if (source.length > 0) return source.padStart(18, '0');
  let hash = 0;
  const seed = JSON.stringify(ticket);
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const ts = Date.now().toString().slice(-10);
  const suffix = String(hash % 100_000_000).padStart(8, '0');
  return `${ts}${suffix}`.slice(-18).padStart(18, '0');
}
