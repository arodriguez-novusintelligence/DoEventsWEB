import { getAuthToken, getCurrentEnv } from './client';
import type { AccessLogEntry, AccessStats, QrValidationResult, TicketScanResult } from '../types/access';

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

function ordersBase(): string {
  return `${getCurrentEnv().apiBaseUrl}/orders`;
}

export async function validateTicketQr(qrCode: string, eventId: string): Promise<QrValidationResult> {
  const response = await fetch(`${ordersBase()}/tickets/qr/validate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ qrCode, eventID: eventId }),
  });
  const body = await response.json() as QrValidationResult & { message?: string };
  if (!response.ok) {
    return { valid: false, message: body.message || 'QR inválido' };
  }
  return {
    valid: body.valid ?? true,
    message: body.message,
    ticket_id: body.ticket_id,
    category: body.category,
    seat_code: body.seat_code,
  };
}

export async function scanTicketFromQr(qrCode: string, eventId: string): Promise<TicketScanResult> {
  const validation = await validateTicketQr(qrCode, eventId);
  if (!validation.valid) {
    throw new Error(validation.message || 'QR inválido');
  }
  const ticketId = validation.ticket_id || qrCode;
  return scanTicketAccess(ticketId);
}

export async function scanTicketAccess(ticketId: string): Promise<TicketScanResult> {
  const response = await fetch(`${ordersBase()}/tickets/scan`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ticket_id: ticketId }),
  });
  const body = await response.json() as {
    scanTicket?: TicketScanResult;
    message?: string;
    code?: string;
    status?: string;
    ticket_id?: string;
  };
  if (!response.ok) {
    throw new Error(body.message || body.code || 'Acceso denegado');
  }
  return body.scanTicket || body;
}

export async function fetchAccessStats(): Promise<AccessStats> {
  const response = await fetch(`${ordersBase()}/access/stats`, { headers: authHeaders() });
  if (!response.ok) {
    return { totalAccesses: 0 };
  }
  return response.json() as Promise<AccessStats>;
}

export async function fetchAccessLogsByTicket(ticketId: string): Promise<AccessLogEntry[]> {
  const response = await fetch(`${ordersBase()}/access/logs`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ticketID: ticketId }),
  });
  if (!response.ok) {
    return [];
  }
  const body = await response.json();
  return Array.isArray(body) ? body : body?.items || [];
}
