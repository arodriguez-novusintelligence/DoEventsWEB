import { parseEventDate } from './eventDateUtils';

export type DisplayEventStatus =
  | 'activo'
  | 'inactivo'
  | 'finalizado'
  | 'reagendado'
  | 'cancelado';

function applyTimeToDate(base: Date, time?: string, endOfDay = false): Date {
  const result = new Date(base);
  if (time?.trim()) {
    const [hours, minutes] = time.split(':').map((part) => Number(part));
    if (Number.isFinite(hours)) {
      result.setHours(hours, Number.isFinite(minutes) ? minutes : 0, 0, 0);
      return result;
    }
  }
  if (endOfDay) {
    result.setHours(23, 59, 59, 999);
  } else {
    result.setHours(0, 0, 0, 0);
  }
  return result;
}

export function isEventInProgress(input: {
  fechaIni?: string;
  fechaFin?: string;
  horaIni?: string;
  horaFin?: string;
}): boolean {
  const startDate = parseEventDate(input.fechaIni);
  const endDate = parseEventDate(input.fechaFin || input.fechaIni);
  if (!startDate || !endDate) return false;

  const start = applyTimeToDate(startDate, input.horaIni);
  const end = applyTimeToDate(endDate, input.horaFin, !input.horaFin);
  const now = new Date();
  return now >= start && now <= end;
}

export function isEventPast(input: {
  fechaIni?: string;
  fechaFin?: string;
  horaFin?: string;
}): boolean {
  const endDate = parseEventDate(input.fechaFin || input.fechaIni);
  if (!endDate) return false;
  const end = applyTimeToDate(endDate, input.horaFin, !input.horaFin);
  return end < new Date();
}

export function resolveDisplayEventStatus(input: {
  estatus?: string;
  fechaIni?: string;
  fechaFin?: string;
  horaIni?: string;
  horaFin?: string;
}): DisplayEventStatus {
  const normalized = String(input.estatus || '').toLowerCase().trim();
  if (['deleted', 'eliminado'].includes(normalized) || String(input.estatus || '').toUpperCase() === 'DELETED') {
    return 'cancelado';
  }
  if (['cancelado', 'cancelled', 'canceled'].includes(normalized)) return 'cancelado';
  if (['reagendado', 'rescheduled'].includes(normalized)) return 'reagendado';
  if (['inactivo', 'inactive', 'draft'].includes(normalized)) return 'inactivo';
  if (['finalizado', 'finished', 'completed'].includes(normalized)) return 'finalizado';

  if (isEventPast(input)) return 'finalizado';

  if (['en_ejecucion', 'en ejecucion', 'ejecucion'].includes(normalized) || isEventInProgress(input)) {
    return 'activo';
  }

  if (['activo', 'active', 'published'].includes(normalized)) return 'activo';
  return normalized ? 'inactivo' : 'activo';
}

export function canEditEventByStatus(
  status: DisplayEventStatus,
  input?: { fechaIni?: string; fechaFin?: string; horaIni?: string; horaFin?: string },
): boolean {
  if (status !== 'activo') return false;
  if (input && isEventInProgress(input)) return false;
  return true;
}

export function canDuplicateEventByStatus(status: DisplayEventStatus): boolean {
  return ['finalizado', 'reagendado', 'cancelado', 'inactivo', 'activo'].includes(status);
}

export function mapDiscoverEventBadge(input: {
  estatus?: string;
  fechaIni?: string;
  fechaFin?: string;
  horaIni?: string;
  horaFin?: string;
}): string {
  const status = resolveDisplayEventStatus(input);
  if (input.estatus === 'draft' || input.estatus === 'inactivo' && status === 'inactivo') {
    return 'borrador';
  }
  if (status === 'finalizado') return 'finalizado';
  if (status === 'inactivo') return 'inactivo';
  return 'activo';
}
