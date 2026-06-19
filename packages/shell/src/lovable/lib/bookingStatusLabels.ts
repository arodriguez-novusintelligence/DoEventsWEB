const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  active: 'Activa',
  completed: 'Completada',
  cancelled: 'Cancelada',
  canceled: 'Cancelada',
  rejected: 'Rechazada',
  paid: 'Pagada',
  unpaid: 'Sin pagar',
};

export function formatBookingStatus(status?: string): string {
  if (!status) return '—';
  const key = status.toLowerCase().replace(/\s+/g, '_');
  return BOOKING_STATUS_LABELS[key] || status.charAt(0).toUpperCase() + status.slice(1);
}
