import { getAuthToken, getCurrentEnv } from './client';
import { parseFetchResponse, toUserFacingError } from '../lib/apiError';

export interface BlockedUser {
  id: string;
  name?: string;
  username?: string;
  blockedAt?: string | null;
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

function wallBase(): string {
  return `${getCurrentEnv().apiBaseUrl}/wall`;
}

export async function blockUser(clientId: string, blockedUserId: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${wallBase()}/client/block`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        id_cliente: clientId,
        id_usuario_bloqueado: blockedUserId,
        estado: 'bloqueado',
      }),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'el bloqueo del usuario'));
  }
  await parseFetchResponse(response, 'No se pudo bloquear al usuario');
}

export async function unblockUser(clientId: string, blockedUserId: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${wallBase()}/client/block`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        id_cliente: clientId,
        id_usuario_bloqueado: blockedUserId,
        estado: 'desbloqueado',
      }),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'el desbloqueo del usuario'));
  }
  await parseFetchResponse(response, 'No se pudo desbloquear al usuario');
}

export async function fetchBlockedUsers(clientId: string): Promise<BlockedUser[]> {
  let response: Response;
  try {
    response = await fetch(`${wallBase()}/block/${encodeURIComponent(clientId)}`, {
      headers: authHeaders(),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la lista de usuarios bloqueados'));
  }
  const data = await parseFetchResponse<{ users?: BlockedUser[] }>(
    response,
    'No se pudieron cargar los usuarios bloqueados',
  );
  return data.users || [];
}
