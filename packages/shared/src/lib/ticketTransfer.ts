export interface TicketTransferMeta {
  transfer_status?: string;
  ticket_status?: string;
  user_id?: string;
  transferred_to?: {
    user_id?: string;
    user_name?: string;
    transferred_at?: string;
  };
  transferred_from?: {
    user_id?: string;
    user_name?: string;
    transferred_at?: string;
    original_order_id?: string;
  };
}

/** Boleta que el dueño original ya compartió (ya no es usable para él). */
export function isTicketTransferredOut(
  ticket: TicketTransferMeta,
  orderUserId?: string,
): boolean {
  const status = String(ticket.transfer_status || ticket.ticket_status || '').toUpperCase();
  if (status === 'TRANSFERRED') return true;
  const ticketOwner = String(ticket.user_id || '').trim();
  const owner = String(orderUserId || '').trim();
  if (ticketOwner && owner && ticketOwner !== owner) return true;
  return false;
}

/** Boleta recibida por transferencia (usable por el destinatario, con indicador). */
export function isTicketReceivedByTransfer(ticket: TicketTransferMeta): boolean {
  if (isTicketTransferredOut(ticket)) return false;
  return Boolean(ticket.transferred_from?.user_id || ticket.transferred_from?.transferred_at);
}

/** Cualquier boleta involucrada en una transferencia (enviada o recibida). */
export function isTicketTransferMarked(
  ticket: TicketTransferMeta,
  orderUserId?: string,
): boolean {
  return isTicketTransferredOut(ticket, orderUserId) || isTicketReceivedByTransfer(ticket);
}

export function resolveTransferredAt(ticket: TicketTransferMeta): string | undefined {
  return ticket.transferred_to?.transferred_at
    || ticket.transferred_from?.transferred_at;
}

export function resolveTransferredToName(ticket: TicketTransferMeta): string | undefined {
  return ticket.transferred_to?.user_name;
}

export function resolveTransferredFromName(ticket: TicketTransferMeta): string | undefined {
  return ticket.transferred_from?.user_name;
}

export function formatTransferredAt(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const datePart = date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart} - ${timePart}`;
}

/** Tag de transferencia: emisor → receptor · fecha/hora. */
export function buildTransferStampLabel(opts: {
  fromName?: string;
  toName?: string;
  transferredAt?: string;
}): string {
  const fromName = (opts.fromName || '').trim();
  const toName = (opts.toName || '').trim();
  const transferredAt = (opts.transferredAt || '').trim();
  const parties = fromName && toName
    ? `${fromName} → ${toName}`
    : fromName
      ? `de ${fromName}`
      : toName
        ? `a ${toName}`
        : '';
  if (parties && transferredAt) return `Transferida · ${parties} · ${transferredAt}`;
  if (parties) return `Transferida · ${parties}`;
  if (transferredAt) return `Transferida · ${transferredAt}`;
  return 'Transferida';
}
