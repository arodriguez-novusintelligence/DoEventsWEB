/** Parsea fechas de evento (YYYYMMDD, DD/MM/YYYY, ISO). */
export function parseEventDate(fechaIni?: string): Date | null {
  if (!fechaIni) return null;
  const raw = fechaIni.trim();
  if (/^\d{8}$/.test(raw)) {
    const y = Number(raw.slice(0, 4));
    const m = Number(raw.slice(4, 6)) - 1;
    const d = Number(raw.slice(6, 8));
    const dt = new Date(y, m, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [dd, mm, yyyy] = raw.split('/').map(Number);
    const dt = new Date(yyyy, mm - 1, dd);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(raw);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function isEventThisWeek(fechaIni?: string): boolean {
  const date = parseEventDate(fechaIni);
  if (!date) return true;
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return date >= start && date < end;
}

export function parseAttendeeCount(value?: string | number | null): number {
  if (value == null) return 0;
  const n = typeof value === 'number' ? value : Number(String(value).replace(/\D/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function formatShortEventDate(fechaIni?: string): string {
  const date = parseEventDate(fechaIni);
  if (!date) return fechaIni || '';
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

/** Convierte YYYYMMDD, DD/MM/YYYY o YYYY-MM-DD a YYYYMMDD. */
export function toApiEventDate(value?: string): string {
  if (!value) return '';
  const raw = value.trim();
  if (/^\d{8}$/.test(raw)) return raw;
  const slash = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash) return `${slash[3]}${slash[2]}${slash[1]}`;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}${iso[2]}${iso[3]}`;
  return raw.replace(/\D/g, '').slice(0, 8);
}

/** Convierte YYYYMMDD o DD/MM/YYYY a YYYY-MM-DD para inputs type="date". */
export function apiDateToInputDate(value?: string): string {
  if (!value) return '';
  const raw = value.trim();
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [dd, mm, yyyy] = raw.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return '';
}

function applyScheduleTime(base: Date, time?: string, endOfDay = false): Date {
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

/** Valida que el inicio del evento sea futuro y que fin >= inicio. */
export function isEventScheduleInFuture(input: {
  fechaIni?: string;
  fechaFin?: string;
  horaIni?: string;
  horaFin?: string;
}): boolean {
  const startDate = parseEventDate(input.fechaIni);
  const endDate = parseEventDate(input.fechaFin || input.fechaIni);
  if (!startDate || !endDate) return false;

  const start = applyScheduleTime(startDate, input.horaIni);
  const end = applyScheduleTime(endDate, input.horaFin, !input.horaFin);
  const now = new Date();
  return start > now && end >= start;
}

export function suggestFutureDuplicateDates(input?: {
  fechaIni?: string;
  fechaFin?: string;
  horaIni?: string;
  horaFin?: string;
}): { startDate: string; endDate: string; startTime: string; endTime: string } {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const startTime = input?.horaIni || '18:00';
  const endTime = input?.horaFin || input?.horaIni || '22:00';
  const proposedStart = apiDateToInputDate(input?.fechaIni) || toIso(tomorrow);
  const proposedEnd = apiDateToInputDate(input?.fechaFin || input?.fechaIni) || proposedStart;

  const future = isEventScheduleInFuture({
    fechaIni: proposedStart,
    fechaFin: proposedEnd,
    horaIni: startTime,
    horaFin: endTime,
  });

  return {
    startDate: future ? proposedStart : toIso(tomorrow),
    endDate: future ? proposedEnd : toIso(tomorrow),
    startTime,
    endTime,
  };
}
