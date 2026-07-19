import type { OrganizerEventStaffSummary, StaffAssignment, UserEventItem } from '@doevents/shared';
import { isEventInProgress, resolveDisplayEventStatus, resolveDisplayLocation } from '@doevents/shared';

export type AccessEventStatus =
  | 'activo'
  | 'en_ejecucion'
  | 'inactivo'
  | 'finalizado'
  | 'cancelado';

export interface AccessEventView {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: AccessEventStatus;
  doors: number;
  staff: number;
  assigned?: boolean;
  assignedGate?: string;
  organizer?: {
    id?: string;
    name?: string;
    email?: string;
    avatar?: string;
  };
}

function eventFieldsFromUserEvent(event: UserEventItem) {
  return {
    estatus: event.estatus,
    fechaIni: event.fechaIni,
    fechaFin: event.fechaFin,
    horaIni: event.horaIni,
    horaFin: event.horaFin,
  };
}

function eventFieldsFromStaffEvent(event?: {
  fechaInicio?: string;
  fechaFin?: string;
  estatus?: string;
}) {
  return {
    estatus: event?.estatus,
    fechaIni: event?.fechaInicio,
    fechaFin: event?.fechaFin,
  };
}

export function resolveAccessEventStatus(fields: {
  estatus?: string;
  fechaIni?: string;
  fechaFin?: string;
  horaIni?: string;
  horaFin?: string;
}): AccessEventStatus {
  const display = resolveDisplayEventStatus(fields);
  if (display === 'cancelado') return 'cancelado';
  if (display === 'finalizado') return 'finalizado';
  if (display === 'inactivo') return 'inactivo';
  if (isEventInProgress(fields)) return 'en_ejecucion';
  return 'activo';
}

export function isAccessControlEnabled(status: AccessEventStatus): boolean {
  return status === 'activo' || status === 'en_ejecucion';
}

function formatDate(value?: string): string {
  if (!value) return '—';
  if (/^\d{8}$/.test(value)) {
    return `${value.slice(6, 8)}/${value.slice(4, 6)}/${value.slice(0, 4)}`;
  }
  return value;
}

export function userEventsToAccessEvents(events: UserEventItem[]): AccessEventView[] {
  return events.map((event) => ({
    id: event.id,
    title: event.nombre,
    date: formatDate(event.fechaIni),
    time: event.horaIni || '—',
    location: resolveDisplayLocation({
      direccion: event.direccion,
      ciudad: event.ciudad,
      departamento: event.departamento,
    }),
    status: resolveAccessEventStatus(eventFieldsFromUserEvent(event)),
    doors: 0,
    staff: 0,
    assigned: false,
  })).filter((e) => e.id);
}

export function mergeOrganizerStaffSummary(
  events: UserEventItem[],
  summary: OrganizerEventStaffSummary[],
): AccessEventView[] {
  const summaryMap = new Map(summary.map((s) => [s.eventId, s]));
  return userEventsToAccessEvents(events).map((eventView) => {
    const s = summaryMap.get(eventView.id);
    const source = events.find((item) => item.id === eventView.id);
    if (!s) return eventView;
    const fields = {
      ...eventFieldsFromUserEvent(source || {} as UserEventItem),
      ...eventFieldsFromStaffEvent(s.event),
    };
    return {
      ...eventView,
      doors: s.gateCount ?? 0,
      staff: s.assignedCount ?? 0,
      date: s.event?.fechaInicio ? formatDate(s.event.fechaInicio) : eventView.date,
      location: resolveDisplayLocation({
        direccion: s.event?.direccion || source?.direccion,
        ciudad: source?.ciudad,
        departamento: source?.departamento,
      }),
      status: resolveAccessEventStatus(fields),
    };
  });
}

export function staffAssignmentsToAccessEvents(assignments: StaffAssignment[]): AccessEventView[] {
  return assignments.map((a) => ({
    id: a.eventId,
    title: a.eventName || 'Evento asignado',
    date: a.event?.fechaInicio ? formatDate(a.event.fechaInicio) : '—',
    time: '—',
    location: resolveDisplayLocation({
      direccion: a.event?.direccion,
      ubicacion: a.venueName,
    }),
    status: resolveAccessEventStatus(eventFieldsFromStaffEvent(a.event)),
    doors: 1,
    staff: 1,
    assigned: true,
    assignedGate: a.gateName || undefined,
    organizer: a.eventOwner ? {
      id: a.eventOwner.userId,
      name: [a.eventOwner.name, a.eventOwner.lastName].filter(Boolean).join(' ') || 'Organizador',
      email: a.eventOwner.email,
      avatar: a.eventOwner.fotoPerfil,
    } : undefined,
  }));
}
