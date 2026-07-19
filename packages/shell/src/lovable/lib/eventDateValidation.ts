/** Compara inicio y fin del evento (fecha + hora). */
export function eventDateTimeMs(date: string, time: string): number {
  if (!date?.trim() || !time?.trim()) return NaN;
  return new Date(`${date}T${time}`).getTime();
}

export const SALES_AFTER_EVENT_MESSAGE =
  'La fecha no debe ser mayor a la del inicio del evento creado';

export function isEventEndBeforeStart(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
): boolean {
  const start = eventDateTimeMs(startDate, startTime);
  const end = eventDateTimeMs(endDate, endTime);
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  return end < start;
}

/** Ventana de venta posterior al fin del evento (paso 4). */
export function isSalesWindowAfterEventEnd(form: {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  salesStartDate?: string;
  salesStartTime?: string;
  salesEndDate?: string;
  salesEndTime?: string;
}): boolean {
  const eventEnd = eventDateTimeMs(form.endDate, form.endTime);
  if (Number.isNaN(eventEnd)) return false;

  const salesStart = eventDateTimeMs(form.salesStartDate ?? '', form.salesStartTime ?? '');
  const salesEnd = eventDateTimeMs(form.salesEndDate ?? '', form.salesEndTime ?? '');

  if (!Number.isNaN(salesStart) && salesStart > eventEnd) return true;
  if (!Number.isNaN(salesEnd) && salesEnd > eventEnd) return true;
  return false;
}

export function isSalesEndBeforeSalesStart(form: {
  salesStartDate?: string;
  salesStartTime?: string;
  salesEndDate?: string;
  salesEndTime?: string;
}): boolean {
  const start = eventDateTimeMs(form.salesStartDate ?? '', form.salesStartTime ?? '');
  const end = eventDateTimeMs(form.salesEndDate ?? '', form.salesEndTime ?? '');
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  return end < start;
}

export function isSalesWindowInvalid(form: {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  salesStartDate?: string;
  salesStartTime?: string;
  salesEndDate?: string;
  salesEndTime?: string;
}): boolean {
  return (
    isSalesWindowAfterEventEnd(form)
    || isSalesEndBeforeSalesStart(form)
  );
}
