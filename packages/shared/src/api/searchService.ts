import { getAuthToken, getCurrentEnv } from './client';
import { parseFetchResponse, toUserFacingError } from '../lib/apiError';
import { resolveImageUrl } from '../lib/resolveImageUrl';

export interface SearchUserResult {
  id?: string;
  name?: string;
  email?: string;
  username?: string;
  imagen?: string;
  user?: string;
  nombreCompleto?: string;
  fotoPerfilUrl?: string;
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

export async function searchUsers(query: string): Promise<SearchUserResult[]> {
  let response: Response;
  try {
    response = await fetch(
      `${getCurrentEnv().endpoints.searchUsers}?q=${encodeURIComponent(query)}`,
      { headers: authHeaders() },
    );
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la búsqueda de usuarios'));
  }
  const data = await parseFetchResponse<{
    users?: SearchUserResult[];
    data?: SearchUserResult[];
  }>(response, 'No se pudo buscar usuarios');
  const list = data.users || data.data || [];
  return list.map((user) => {
    const raw = user as SearchUserResult & {
      nombre?: string;
      apellido?: string;
      username?: string;
      user?: string;
    };
    const handleRaw = (raw.username || raw.user || '').replace(/^@/, '').trim();
    const handleLooksLikeName = handleRaw.includes(' ');
    const emailLocal = (raw.email || '').split('@')[0]?.trim() || '';
    const username = handleLooksLikeName
      ? (emailLocal || handleRaw.replace(/\s+/g, '').toLowerCase())
      : handleRaw;
    const displayName = raw.nombreCompleto?.trim()
      || [raw.nombre, raw.apellido].filter(Boolean).join(' ').trim()
      || (handleLooksLikeName ? handleRaw : '')
      || raw.name?.trim()
      || username
      || '';
    return {
      ...user,
      id: raw.id || (user as { userId?: string }).userId || '',
      name: displayName || raw.email || 'Usuario',
      username,
      imagen: resolveImageUrl(raw.fotoPerfilUrl || user.imagen),
    };
  });
}
