import { getAuthToken, getCurrentEnv } from './client';

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

export interface StaffAssignment {
  eventId: string;
  eventName?: string;
  venueId?: string;
  venueName?: string;
  gateId?: string;
  gateName?: string;
  assignedAt?: string;
  event?: {
    fechaInicio?: string;
    fechaFin?: string;
    direccion?: string;
    estatus?: string;
  };
  eventOwner?: {
    name?: string;
    lastName?: string;
    email?: string;
    fotoPerfil?: string;
    userId?: string;
  };
}

export interface OrganizerEventStaffSummary {
  eventId: string;
  eventName?: string;
  gateCount?: number;
  assignedCount?: number;
  event?: {
    fechaInicio?: string;
    direccion?: string;
    estatus?: string;
  };
}

export async function fetchStaffAssignments(userId: string): Promise<StaffAssignment[]> {
  try {
    const response = await fetch(
      `${getCurrentEnv().apiBaseUrl}/staff-access/staff/${encodeURIComponent(userId)}`,
      { headers: authHeaders() },
    );
    if (!response.ok) return [];
    const body = await response.json() as { assignments?: StaffAssignment[] };
    return body.assignments || [];
  } catch {
    return [];
  }
}

function mapOrganizerStaffEvent(raw: Record<string, unknown>): OrganizerEventStaffSummary {
  const event = (raw.event || {}) as Record<string, unknown>;
  const venue = (raw.venue || {}) as Record<string, unknown>;
  return {
    eventId: String(raw.eventId || ''),
    eventName: String(event.nombre || event.name || ''),
    gateCount: Number(raw.gateCount || 0),
    assignedCount: Number(raw.assignedCount || 0),
    event: {
      fechaInicio: String(event.fechaIni || event.fecha_ini || ''),
      direccion: String(event.direccion || venue.direccion || event.ciudad || ''),
      estatus: String(event.estatus || event.status || 'activo'),
    },
  };
}

export interface SaveStaffAssignmentsInput {
  eventId: string;
  eventName?: string;
  venueId: string;
  venueName?: string;
  accessControl: Array<{
    gateId: string;
    gateName?: string;
    assignedUsers: string[];
  }>;
}

export async function saveStaffAssignments(input: SaveStaffAssignmentsInput): Promise<void> {
  const response = await fetch(
    `${getCurrentEnv().apiBaseUrl}/staff-access/assignments`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input),
    },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string; error?: string };
    throw new Error(body.message || body.error || 'No se pudo guardar el control de acceso');
  }
}

export async function fetchOrganizerStaffSummary(userId: string): Promise<OrganizerEventStaffSummary[]> {
  try {
    const response = await fetch(
      `${getCurrentEnv().apiBaseUrl}/staff-access/admin/events-summary?userId=${encodeURIComponent(userId)}`,
      { headers: authHeaders() },
    );
    if (!response.ok) return [];
    const body = await response.json() as { events?: Array<Record<string, unknown>> };
    return (body.events || []).map(mapOrganizerStaffEvent).filter((e) => e.eventId);
  } catch {
    return [];
  }
}
