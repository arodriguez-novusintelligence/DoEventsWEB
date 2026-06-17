import { getAuthToken, getCurrentEnv } from './client';
import type { CoAdminEntityType } from '../lib/coAdmin';

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

function wallBase(): string {
  const env = getCurrentEnv();
  return `${env.apiBaseUrl}/wall/v1/feed`;
}

function venueItemBase(): string {
  return `${getCurrentEnv().apiBaseUrl}/venues/venues`;
}

function servicesBase(): string {
  const env = getCurrentEnv();
  return env.endpoints.servicesBase || `${env.apiBaseUrl}/services`;
}

export async function assignCoAdmin(input: {
  entityType: CoAdminEntityType;
  entityId: string;
  ownerUserId: string;
  coAdminUserId: string;
}): Promise<string[]> {
  const { entityType, entityId, ownerUserId, coAdminUserId } = input;
  let url = '';

  switch (entityType) {
    case 'EVENT':
      url = `${getCurrentEnv().apiBaseUrl}/events/events/${encodeURIComponent(entityId)}/co-admins`;
      break;
    case 'VENUE':
      url = `${venueItemBase()}/${encodeURIComponent(entityId)}/co-admins`;
      break;
    case 'SERVICE':
      url = `${servicesBase()}/${encodeURIComponent(entityId)}/co-admins`;
      break;
    case 'PUBLICATION':
      url = `${wallBase()}/publications/${encodeURIComponent(entityId)}/co-admins`;
      break;
    default:
      throw new Error('Tipo de entidad no soportado');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ownerUserId, coAdminUserId }),
  });

  const body = await response.json().catch(() => ({})) as {
    coAdminIds?: string[];
    error?: string | { message?: string };
    message?: string;
  };

  if (!response.ok) {
    const errMsg = typeof body.error === 'string'
      ? body.error
      : body.error?.message || body.message || 'No se pudo asignar co-administrador';
    throw new Error(errMsg);
  }

  return body.coAdminIds || [];
}
