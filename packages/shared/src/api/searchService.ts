import { getAuthToken, getCurrentEnv } from './client';
import { parseFetchResponse, toUserFacingError } from '../lib/apiError';
import { resolveUserAvatarUrl } from '../lib/userAvatarUtils';

export interface SearchUserResult {
  id?: string;
  name?: string;
  email?: string;
  username?: string;
  imagen?: string;
  avatarUrl?: string;
  user?: string;
  nombreCompleto?: string;
  fotoPerfilUrl?: string;
  phone?: string | null;
  phoneNumber?: string | null;
  indicativo?: string | null;
}

function authHeaders(): Record<string, string> {
  const token = (getAuthToken() || '').trim();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) {
    headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
  return headers;
}

export async function searchUsers(query: string): Promise<SearchUserResult[]> {
  const term = query.trim();
  if (!term) return [];

  let response: Response;
  try {
    response = await fetch(
      `${getCurrentEnv().endpoints.searchUsers}?q=${encodeURIComponent(term)}`,
      { headers: authHeaders() },
    );
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la búsqueda de usuarios'));
  }

  const data = await parseFetchResponse<{
    users?: SearchUserResult[];
    data?: SearchUserResult[];
    items?: SearchUserResult[];
  }>(response, 'No se pudo buscar usuarios');

  const list = data.users || data.data || data.items || [];
  return list.map((user) => {
    const raw = user as SearchUserResult & {
      nombre?: string;
      apellido?: string;
      username?: string;
      user?: string;
      userId?: string;
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
    const avatar = resolveUserAvatarUrl(raw.fotoPerfilUrl || user.imagen, raw.id || raw.userId);
    return {
      ...user,
      id: raw.id || raw.userId || '',
      name: displayName || raw.email || 'Usuario',
      username,
      imagen: avatar,
      avatarUrl: avatar,
      phone: raw.phone || raw.phoneNumber || null,
      phoneNumber: raw.phoneNumber || raw.phone || null,
      indicativo: raw.indicativo || null,
    };
  });
}
