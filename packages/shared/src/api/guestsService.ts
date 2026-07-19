import { getAuthToken, getCurrentEnv } from './client';
import type {
  EventGuest,
  EventInvitation,
  FavoriteContact,
  GuestGroup,
  UserInvitationsResponse,
} from '../types/guests';

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

function guestsBase(): string {
  const env = getCurrentEnv();
  return env.endpoints.guestsBase || `${env.apiBaseUrl}/guests`;
}

export async function fetchEventGuests(eventId: string): Promise<EventGuest[]> {
  const response = await fetch(
    `${guestsBase()}/events/${encodeURIComponent(eventId)}/guests`,
    { headers: authHeaders() },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
    throw new Error(body.message || body.error || 'No se pudieron cargar los invitados');
  }
  const body = await response.json() as { guests?: EventGuest[] };
  return body.guests || [];
}

export async function addEventGuest(
  eventId: string,
  input: { name: string; email?: string; phone?: string; userId?: string; favoriteId?: string },
): Promise<string> {
  const response = await fetch(
    `${guestsBase()}/events/${encodeURIComponent(eventId)}/guests`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input),
    },
  );
  const body = await response.json() as { guestId?: string; error?: string; message?: string };
  if (!response.ok) {
    throw new Error(body.message || body.error || 'No se pudo agregar el invitado');
  }
  return body.guestId || '';
}

export async function removeEventGuest(eventId: string, guestId: string): Promise<void> {
  const response = await fetch(
    `${guestsBase()}/events/${encodeURIComponent(eventId)}/guests/${encodeURIComponent(guestId)}`,
    { method: 'DELETE', headers: authHeaders() },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
    throw new Error(body.message || body.error || 'No se pudo eliminar el invitado');
  }
}

export async function sendEventInvitations(
  eventId: string,
  input: {
    invitedBy: string;
    users?: string[];
    favoriteIds?: string[];
    groups?: string[];
    channels?: string[];
    message?: string;
  },
): Promise<{ sent?: number; invitations?: EventInvitation[] }> {
  const favoriteIds = input.favoriteIds?.filter(Boolean) || [];
  const users = input.users?.filter(Boolean) || [];
  const response = await fetch(
    `${guestsBase()}/events/${encodeURIComponent(eventId)}/invitations`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        channels: input.channels?.length
          ? input.channels
          : ['email', 'whatsapp', 'inApp', 'push'],
        ...input,
        favoriteIds,
        users,
      }),
    },
  );
  const body = await response.json() as {
    sent?: number;
    totalInvitations?: number;
    invitations?: EventInvitation[];
    error?: string;
    message?: string;
    unresolvedRefs?: string[];
  };
  if (!response.ok) {
    const detail = body.unresolvedRefs?.length
      ? ` Destinatarios no válidos: ${body.unresolvedRefs.join(', ')}`
      : '';
    throw new Error(body.message || body.error || `No se pudieron enviar las invitaciones${detail}`);
  }
  return {
    ...body,
    sent: body.sent ?? body.totalInvitations ?? body.invitations?.length ?? 0,
  };
}

export async function fetchAllGuestContacts(userId: string): Promise<FavoriteContact[]> {
  const response = await fetch(
    `${guestsBase()}/users/${encodeURIComponent(userId)}/contacts`,
    { headers: authHeaders() },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
    throw new Error(body.message || body.error || 'No se pudieron cargar los contactos');
  }
  const body = await response.json() as { contacts?: FavoriteContact[] };
  return body.contacts || [];
}

export async function fetchFavoriteContacts(userId: string): Promise<FavoriteContact[]> {
  const response = await fetch(
    `${guestsBase()}/users/${encodeURIComponent(userId)}/favorites`,
    { headers: authHeaders() },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
    throw new Error(body.message || body.error || 'No se pudieron cargar los favoritos');
  }
  const body = await response.json() as { favorites?: FavoriteContact[] };
  return body.favorites || [];
}

export async function fetchOtherContacts(userId: string): Promise<FavoriteContact[]> {
  const response = await fetch(
    `${guestsBase()}/users/${encodeURIComponent(userId)}/others`,
    { headers: authHeaders() },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
    throw new Error(body.message || body.error || 'No se pudieron cargar los contactos');
  }
  const body = await response.json() as { others?: FavoriteContact[]; users?: FavoriteContact[] };
  return body.others || body.users || [];
}

export async function fetchGuestGroups(userId: string): Promise<GuestGroup[]> {
  const response = await fetch(
    `${guestsBase()}/users/${encodeURIComponent(userId)}/groups`,
    { headers: authHeaders() },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
    throw new Error(body.message || body.error || 'No se pudieron cargar los grupos');
  }
  const body = await response.json() as { groups?: GuestGroup[] };
  return body.groups || [];
}

export async function updateContact(
  userId: string,
  favoriteId: string,
  input: {
    name?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    phoneIndicative?: string;
    phoneNumber?: string;
    username?: string;
    isFavorite?: boolean;
    groupIds?: string[];
  },
): Promise<void> {
  const response = await fetch(
    `${guestsBase()}/users/${encodeURIComponent(userId)}/favorites/${encodeURIComponent(favoriteId)}`,
    {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(input),
    },
  );
  const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(body.message || body.error || 'No se pudo actualizar el contacto');
  }
}

export async function removeFavoriteContact(userId: string, favoriteId: string): Promise<void> {
  const response = await fetch(
    `${guestsBase()}/users/${encodeURIComponent(userId)}/favorites/${encodeURIComponent(favoriteId)}`,
    { method: 'DELETE', headers: authHeaders() },
  );
  const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(body.message || body.error || 'No se pudo eliminar el contacto');
  }
}

export async function addManualContact(
  userId: string,
  input: {
    name: string;
    lastName?: string;
    email?: string;
    phone?: string;
    phoneIndicative?: string;
    phoneNumber?: string;
    username?: string;
    isFavorite?: boolean;
    groupIds?: string[];
  },
): Promise<{ favoriteId: string }> {
  const response = await fetch(
    `${guestsBase()}/users/${encodeURIComponent(userId)}/users`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        ...input,
        user: input.username,
        originType: 'MANUAL',
      }),
    },
  );
  const body = await response.json() as { favoriteId?: string; error?: string; message?: string };
  if (!response.ok) {
    throw new Error(body.message || body.error || 'No se pudo agregar el contacto');
  }
  return { favoriteId: body.favoriteId || '' };
}

export async function addRegisteredUserToFavorites(
  userId: string,
  targetUserId: string,
): Promise<{ favoriteId?: string }> {
  const batch = await addRegisteredUsersToFavorites(userId, [targetUserId]);
  return { favoriteId: batch.results.find((r) => r.targetUserId === targetUserId)?.favoriteId };
}

/** Agrega varios usuarios de plataforma a favoritos/invitados en una sola llamada. */
export async function addRegisteredUsersToFavorites(
  userId: string,
  targetUserIds: string[],
): Promise<{
  results: { favoriteId?: string; targetUserId?: string; success?: boolean }[];
  failed: { targetUserId?: string; error?: string }[];
}> {
  const ids = [...new Set(targetUserIds.map((id) => String(id || '').trim()).filter(Boolean))];
  if (!ids.length) return { results: [], failed: [] };

  const response = await fetch(
    `${guestsBase()}/users/${encodeURIComponent(userId)}/favorites`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(
        ids.length === 1
          ? { targetUserId: ids[0] }
          : { targetUserIds: ids },
      ),
    },
  );
  const body = await response.json().catch(() => ({})) as {
    error?: string;
    message?: string;
    results?: { favoriteId?: string; targetUserId?: string; success?: boolean }[];
    errors?: { targetUserId?: string; error?: string }[];
  };
  if (!response.ok && response.status !== 207) {
    throw new Error(body.message || body.error || 'No se pudo agregar a favoritos');
  }
  return {
    results: body.results || [],
    failed: body.errors || [],
  };
}

export async function toggleContactFavorite(
  userId: string,
  favoriteId: string,
  isFavorite: boolean,
): Promise<void> {
  const response = await fetch(
    `${guestsBase()}/users/${encodeURIComponent(userId)}/users/${encodeURIComponent(favoriteId)}/favorite`,
    {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ isFavorite }),
    },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
    throw new Error(body.message || body.error || 'No se pudo actualizar el favorito');
  }
}

export async function createGuestGroup(
  userId: string,
  input: { name: string; description?: string; favoriteIds?: string[]; color?: string; order?: number },
): Promise<{ groupId: string }> {
  const response = await fetch(
    `${guestsBase()}/users/${encodeURIComponent(userId)}/groups`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input),
    },
  );
  const body = await response.json() as { groupId?: string; error?: string; message?: string };
  if (!response.ok) {
    throw new Error(body.message || body.error || 'No se pudo crear el grupo');
  }
  return { groupId: body.groupId || '' };
}

export async function updateGuestGroup(
  userId: string,
  groupId: string,
  input: { name?: string; color?: string; order?: number },
): Promise<void> {
  const response = await fetch(
    `${guestsBase()}/users/${encodeURIComponent(userId)}/groups/${encodeURIComponent(groupId)}`,
    {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(input),
    },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
    throw new Error(body.message || body.error || 'No se pudo actualizar el grupo');
  }
}

export async function deleteGuestGroup(userId: string, groupId: string): Promise<void> {
  const response = await fetch(
    `${guestsBase()}/users/${encodeURIComponent(userId)}/groups/${encodeURIComponent(groupId)}`,
    { method: 'DELETE', headers: authHeaders() },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
    throw new Error(body.message || body.error || 'No se pudo eliminar el grupo');
  }
}

export async function fetchEventInvitations(eventId: string): Promise<EventInvitation[]> {
  const response = await fetch(
    `${guestsBase()}/events/${encodeURIComponent(eventId)}/invitations`,
    { headers: authHeaders() },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error || 'No se pudieron cargar las invitaciones del evento');
  }
  const body = await response.json() as { invitations?: EventInvitation[] };
  return body.invitations || [];
}

export async function updateEventInvitationStatus(
  eventId: string,
  invitationId: string,
  status: 'accepted' | 'rejected' | 'pending',
): Promise<void> {
  const response = await fetch(
    `${guestsBase()}/events/${encodeURIComponent(eventId)}/invitations/${encodeURIComponent(invitationId)}`,
    {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
    throw new Error(body.message || body.error || 'No se pudo actualizar la invitación');
  }
}

export async function fetchUserInvitations(userId: string): Promise<UserInvitationsResponse> {
  const env = getCurrentEnv();
  const response = await fetch(
    `${env.endpoints.userInvitations}/users/${encodeURIComponent(userId)}/invitations?limit=50`,
    { headers: authHeaders() },
  );
  if (!response.ok) {
    throw new Error('No se pudieron cargar tus invitaciones');
  }
  const body = await response.json() as UserInvitationsResponse;
  return {
    invitations: body.invitations || [],
    stats: body.stats,
    nextCursor: body.nextCursor,
  };
}

export async function respondToUserInvitation(
  eventId: string,
  invitationId: string,
  status: 'accepted' | 'rejected',
): Promise<void> {
  await updateEventInvitationStatus(eventId, invitationId, status);
}
