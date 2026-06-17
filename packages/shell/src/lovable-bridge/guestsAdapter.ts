import type { EventGuest, FavoriteContact, GuestGroup as ApiGuestGroup } from '@doevents/shared';
import type { SearchUserResult } from '@doevents/shared';
import { resolveImageUrl } from '@doevents/shared';
import type { Guest, GuestGroup } from '@lovable/types/guest';

const GROUP_COLORS = [
  'hsl(142, 71%, 45%)',
  'hsl(217, 91%, 60%)',
  'hsl(25, 95%, 53%)',
  'hsl(280, 65%, 55%)',
  'hsl(340, 75%, 55%)',
];

export function apiGroupToLovable(group: ApiGuestGroup, index: number): GuestGroup {
  const raw = group as ApiGuestGroup & { groupName?: string; color?: string };
  return {
    id: group.groupId,
    name: group.name || raw.groupName || 'Grupo',
    color: raw.color || GROUP_COLORS[index % GROUP_COLORS.length],
    createdAt: new Date(),
  };
}

export function contactToGuest(contact: FavoriteContact & { userId?: string }): Guest {
  const phoneIndicative = contact.phoneIndicative || '';
  const phoneNumber = contact.phoneNumber || '';
  const phone = phoneIndicative || phoneNumber
    ? `${phoneIndicative} ${phoneNumber}`.trim()
    : contact.phone;
  const favoriteId = contact.favoriteId || undefined;
  const platformUserId = contact.invitedUserId
    || (String(contact.originType || '').toUpperCase() === 'REGISTERED'
      ? (contact.userId || undefined)
      : undefined)
    || (!favoriteId && contact.userId ? contact.userId : undefined);
  const guestId = favoriteId || platformUserId || contact.userId || '';
  return {
    id: guestId,
    favoriteId,
    invitedUserId: platformUserId,
    name: contact.name || 'Sin nombre',
    lastName: contact.lastName || '',
    username: contact.username || contact.user,
    email: contact.email?.trim().toLowerCase() || undefined,
    phone,
    phoneIndicative: phoneIndicative || undefined,
    phoneNumber: phoneNumber || undefined,
    avatar: resolveImageUrl(contact.profileImageUrl) || undefined,
    isFavorite: Boolean(contact.isFavorite),
    groupId: contact.groupIds?.[0],
    originType: contact.originType,
    createdAt: new Date(),
  };
}

export function pickSearchUserMatch(query: string, results: SearchUserResult[]): SearchUserResult | null {
  if (!results.length) return null;
  const q = query.replace('@', '').trim().toLowerCase();
  if (!q) return null;
  const usernameOf = (u: SearchUserResult) =>
    (u.username || u.user || '').replace('@', '').trim().toLowerCase();
  return (
    results.find((u) => usernameOf(u) === q)
    || results.find((u) => usernameOf(u).includes(q))
    || results.find((u) => (u.email || '').toLowerCase() === q)
    || results.find((u) => (u.name || '').toLowerCase().includes(q))
    || results[0]
  );
}

export function searchResultsToGuests(results: SearchUserResult[]): Guest[] {
  return results.map(searchUserToGuest).filter((g) => g.id && !g.id.startsWith('search-'));
}

export function searchUserToGuest(user: SearchUserResult): Guest {
  const fullName = user.name || user.nombreCompleto || user.username || 'Usuario';
  const parts = fullName.split(' ').filter(Boolean);
  const name = parts[0] || fullName;
  const lastName = parts.slice(1).join(' ');
  const platformId = user.id || '';
  return {
    id: platformId || `search-${user.username || Date.now()}`,
    invitedUserId: platformId || undefined,
    name,
    lastName,
    username: user.username || user.user,
    email: user.email,
    avatar: resolveImageUrl(user.imagen || user.fotoPerfilUrl) || undefined,
    isFavorite: false,
    originType: platformId ? 'REGISTERED' : undefined,
    createdAt: new Date(),
  };
}

const CHANNEL_ALIASES: Record<string, string> = {
  mail: 'email',
  email: 'email',
  whatsapp: 'whatsapp',
  sms: 'sms',
  campana: 'inApp',
  inapp: 'inApp',
  push: 'push',
};

export function eventGuestToGuest(eg: EventGuest, index: number): Guest {
  const fullName = (eg.name || 'Invitado').trim();
  const parts = fullName.split(' ').filter(Boolean);
  const id = eg.favoriteId || eg.userId || eg.guestId || `event-guest-${index}`;
  return {
    id,
    favoriteId: eg.favoriteId,
    invitedUserId: eg.userId,
    name: parts[0] || fullName || 'Invitado',
    lastName: parts.slice(1).join(' '),
    email: eg.email,
    phone: eg.phone,
    isFavorite: false,
    createdAt: new Date(),
  };
}

function normalizePhoneDigits(phone?: string, indicative?: string, number?: string): string {
  return (phone || `${indicative || ''}${number || ''}`).replace(/\D/g, '');
}

function guestMatchKeys(g: Guest): string[] {
  const keys: string[] = [];
  if (g.id) keys.push(`id:${g.id}`);
  if (g.favoriteId) keys.push(`fav:${g.favoriteId}`);
  if (g.invitedUserId) keys.push(`uid:${g.invitedUserId}`);
  if (g.email) keys.push(`email:${g.email.toLowerCase()}`);
  const username = g.username?.replace(/^@/, '').trim().toLowerCase();
  if (username) keys.push(`user:${username}`);
  const phone = normalizePhoneDigits(g.phone, g.phoneIndicative, g.phoneNumber);
  if (phone.length >= 7) keys.push(`phone:${phone}`);
  if (g.invitedUserId && g.id && g.invitedUserId !== g.id) {
    keys.push(`id:${g.invitedUserId}`);
  }
  if (!g.invitedUserId && g.id && String(g.originType || '').toUpperCase() === 'REGISTERED') {
    keys.push(`uid:${g.id}`);
  }
  return keys;
}

function contactMatchKeys(contact: FavoriteContact & { userId?: string }): string[] {
  const keys: string[] = [];
  const uid = contact.invitedUserId
    || (String(contact.originType || '').toUpperCase() === 'REGISTERED' ? contact.userId : undefined);
  if (uid) keys.push(`uid:${uid}`);
  if (contact.favoriteId) keys.push(`fav:${contact.favoriteId}`);
  const email = contact.email?.trim().toLowerCase();
  if (email) keys.push(`email:${email}`);
  const phone = normalizePhoneDigits(contact.phone, contact.phoneIndicative, contact.phoneNumber);
  if (phone.length >= 7) keys.push(`phone:${phone}`);
  const username = (contact.username || contact.user || '').replace(/^@/, '').trim().toLowerCase();
  if (username) keys.push(`user:${username}`);
  return keys;
}

export function pickRicherName(a?: string, b?: string): string {
  const na = (a || '').trim();
  const nb = (b || '').trim();
  if (!na || na === 'Sin nombre') return nb && nb !== 'Sin nombre' ? nb : na;
  if (!nb || nb === 'Sin nombre') return na;
  return na.length >= nb.length ? na : nb;
}

export function resolveAmigosGroupId(groups: GuestGroup[]): string | undefined {
  return groups.find((g) => g.name.trim().toLowerCase() === 'amigos')?.id;
}

export function resolveGuestGroupId(
  explicitGroupId: string | undefined,
  groups: GuestGroup[],
): string | undefined {
  if (explicitGroupId) return explicitGroupId;
  return resolveAmigosGroupId(groups);
}

export function resolveGuestFavoriteId(guest: Guest): string {
  return guest.favoriteId || guest.id;
}

function looksLikeTestOrOrphanId(value: string): boolean {
  const v = value.replace(/^@/, '').trim().toLowerCase();
  if (!v) return false;
  if (/^qa[-_]/.test(v)) return true;
  if (/^(test|demo|comm|gust|full)[-_]/.test(v)) return true;
  if (/^[0-9a-f]{6,10}-[0-9a-f]{1,8}$/i.test(v)) return true;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(v)) return true;
  return false;
}

export function isJunkTestGuest(g: Guest): boolean {
  const name = (g.name || '').trim();
  const lastName = (g.lastName || '').trim();
  const fullDisplay = `${name} ${lastName}`.trim().toLowerCase();
  const noRealName = !name
    || name === 'Sin nombre'
    || fullDisplay === 'sin nombre'
    || (name === 'Invitado' && !lastName);

  if (!noRealName) return false;

  const candidates = [g.username, g.invitedUserId, g.id, g.favoriteId]
    .filter(Boolean)
    .map((s) => String(s));

  if (candidates.some(looksLikeTestOrOrphanId)) return true;

  if (!g.email?.trim() && !g.phone?.trim() && candidates.length > 0) return true;

  return false;
}

function pickSingleGroupIds(
  existing?: string[],
  incoming?: string[],
  preferIncoming = false,
): string[] {
  const inc = (incoming || []).filter(Boolean);
  const ext = (existing || []).filter(Boolean);
  if (preferIncoming && inc.length) return [inc[0]];
  if (ext.length && !inc.length) return [ext[0]];
  if (inc.length) return [inc[0]];
  return [];
}

function unionFindDedupe<T>(
  items: T[],
  getKeys: (item: T) => string[],
  mergeItems: (a: T, b: T) => T,
): T[] {
  if (!items.length) return [];
  const parent = items.map((_, i) => i);
  const find = (i: number): number => {
    if (parent[i] !== i) parent[i] = find(parent[i]);
    return parent[i];
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };

  const keyToIndex = new Map<string, number>();
  items.forEach((item, i) => {
    getKeys(item).forEach((key) => {
      const prev = keyToIndex.get(key);
      if (prev !== undefined) union(prev, i);
      else keyToIndex.set(key, i);
    });
  });

  const groups = new Map<number, T[]>();
  items.forEach((item, i) => {
    const root = find(i);
    const bucket = groups.get(root) || [];
    bucket.push(item);
    groups.set(root, bucket);
  });

  return Array.from(groups.values()).map((group) =>
    group.reduce((acc, item) => mergeItems(acc, item)),
  );
}

function normalizeGuestEmail(email?: string): string | undefined {
  const normalized = email?.trim().toLowerCase();
  return normalized || undefined;
}

export function contactsRepresentSamePerson(
  a: FavoriteContact & { userId?: string },
  b: FavoriteContact & { userId?: string },
): boolean {
  const keysA = contactMatchKeys(a);
  const keysB = contactMatchKeys(b);
  return keysA.some((k) => keysB.includes(k));
}

export function findMatchingGuestByEmail(guests: Guest[], email: string): Guest | undefined {
  const normalized = normalizeGuestEmail(email);
  if (!normalized) return undefined;
  return findMatchingGuest(guests, { email: normalized });
}

export function findMatchingGuest(guests: Guest[], probe: Partial<Guest>): Guest | undefined {
  const probeEmail = normalizeGuestEmail(probe.email);
  const keys = guestMatchKeys({
    id: '',
    name: '',
    lastName: '',
    isFavorite: false,
    createdAt: new Date(),
    ...probe,
    email: probeEmail,
  });
  if (!keys.length) return undefined;
  return guests.find((g) => guestMatchKeys(g).some((k) => keys.includes(k)));
}

export function guestProbeFromCreateRequest(data: {
  name: string;
  lastName?: string;
  email?: string;
  username?: string;
  phone?: string;
  phoneIndicative?: string;
  phoneNumber?: string;
  invitedUserId?: string;
}): Partial<Guest> {
  const phoneIndicative = data.phoneIndicative || '+57';
  const phoneNumber = data.phoneNumber || '';
  const phone = phoneNumber
    ? `${phoneIndicative.replace(/\D/g, '')}${phoneNumber.replace(/\D/g, '')}`
    : data.phone;
  return {
    invitedUserId: data.invitedUserId,
    name: data.name,
    lastName: data.lastName,
    email: normalizeGuestEmail(data.email),
    username: data.username,
    phone,
    phoneIndicative,
    phoneNumber,
  };
}

function mergeGuestRecords(a: Guest, b: Guest): Guest {
  const merged = {
    ...a,
    ...b,
    id: a.favoriteId || b.favoriteId || a.invitedUserId || b.invitedUserId || a.id || b.id,
    favoriteId: a.favoriteId || b.favoriteId,
    invitedUserId: a.invitedUserId || b.invitedUserId,
    name: pickRicherName(a.name, b.name),
    lastName: pickRicherName(a.lastName, b.lastName) || a.lastName || b.lastName,
    username: a.username || b.username,
    email: normalizeGuestEmail(a.email) || normalizeGuestEmail(b.email),
    phone: a.phone || b.phone,
    phoneIndicative: a.phoneIndicative || b.phoneIndicative,
    phoneNumber: a.phoneNumber || b.phoneNumber,
    avatar: a.avatar || b.avatar,
    isFavorite: a.isFavorite || b.isFavorite,
    groupId: a.groupId || b.groupId,
    originType: a.originType || b.originType,
  };
  return merged;
}

function mergeContactRecords(
  existing: FavoriteContact & { userId?: string },
  incoming: FavoriteContact & { userId?: string },
): FavoriteContact & { userId?: string } {
  const preferIncomingGroup = Boolean(incoming.groupIds?.filter(Boolean).length);
  return {
    ...existing,
    ...incoming,
    favoriteId: existing.favoriteId || incoming.favoriteId,
    invitedUserId: existing.invitedUserId || incoming.invitedUserId,
    name: pickRicherName(existing.name, incoming.name),
    lastName: pickRicherName(existing.lastName, incoming.lastName) || existing.lastName || incoming.lastName,
    email: existing.email || incoming.email,
    username: existing.username || incoming.username || existing.user || incoming.user,
    user: existing.user || incoming.user || existing.username || incoming.username,
    phone: existing.phone || incoming.phone,
    phoneIndicative: existing.phoneIndicative || incoming.phoneIndicative,
    phoneNumber: existing.phoneNumber || incoming.phoneNumber,
    profileImageUrl: existing.profileImageUrl || incoming.profileImageUrl,
    isFavorite: Boolean(existing.isFavorite || incoming.isFavorite),
    groupIds: pickSingleGroupIds(existing.groupIds, incoming.groupIds, preferIncomingGroup),
    originType: existing.originType || incoming.originType,
  };
}

/** Unifica contactos repetidos (mismo usuario, email, teléfono o @username). */
export function dedupeFavoriteContacts(
  contacts: (FavoriteContact & { userId?: string })[],
): (FavoriteContact & { userId?: string })[] {
  const normalized = contacts.map((contact) => ({
    ...contact,
    email: contact.email?.trim().toLowerCase() || contact.email,
  }));
  return unionFindDedupe(
    normalized,
    contactMatchKeys,
    mergeContactRecords,
  ).map((c) => ({
    ...c,
    groupIds: pickSingleGroupIds(c.groupIds),
  }));
}

/** Unifica invitados repetidos en la lista visible. */
export function dedupeGuests(guests: Guest[]): Guest[] {
  return unionFindDedupe(guests, guestMatchKeys, mergeGuestRecords);
}

function eventGuestMatchKeys(eg: EventGuest): string[] {
  const keys: string[] = [];
  if (eg.guestId) keys.push(`id:${eg.guestId}`);
  if (eg.favoriteId) keys.push(`fav:${eg.favoriteId}`);
  if (eg.userId) keys.push(`uid:${eg.userId}`);
  if (eg.email) keys.push(`email:${eg.email.toLowerCase()}`);
  return keys;
}

function enrichGuestFromEvent(guest: Guest, eg: EventGuest): Guest {
  const fullName = (eg.name || '').trim();
  const parts = fullName.split(' ').filter(Boolean);
  const nameFromEvent = parts[0] || '';
  const lastNameFromEvent = parts.slice(1).join(' ');
  const hasRealName = guest.name && guest.name !== 'Sin nombre';
  return {
    ...guest,
    name: hasRealName ? guest.name : (nameFromEvent || guest.name || 'Invitado'),
    lastName: guest.lastName || lastNameFromEvent,
    email: guest.email || eg.email,
    phone: guest.phone || eg.phone,
    favoriteId: guest.favoriteId || eg.favoriteId,
    invitedUserId: guest.invitedUserId || eg.userId,
  };
}

/** Conserva invitados optimistas y enriquece nombres si el GET aún no los trae. */
export function mergeEventGuestLists(loaded: EventGuest[], optimistic: EventGuest[]): EventGuest[] {
  const merged = loaded.map((g) => ({ ...g }));
  const indexByKey = new Map<string, number>();
  merged.forEach((g, i) => eventGuestMatchKeys(g).forEach((k) => indexByKey.set(k, i)));

  optimistic.forEach((opt) => {
    const keys = eventGuestMatchKeys(opt);
    const existingIdx = keys.map((k) => indexByKey.get(k)).find((i) => i !== undefined);
    if (existingIdx !== undefined) {
      const existing = merged[existingIdx];
      merged[existingIdx] = {
        ...existing,
        name: (opt.name && opt.name.trim()) || existing.name,
        email: opt.email || existing.email,
        phone: opt.phone || existing.phone,
        userId: opt.userId || existing.userId,
        favoriteId: opt.favoriteId || existing.favoriteId,
        guestId: opt.guestId || existing.guestId,
      };
      return;
    }
    merged.push(opt);
    const i = merged.length - 1;
    keys.forEach((k) => indexByKey.set(k, i));
  });
  return merged;
}

/** Une contactos del usuario con invitados del evento y recién agregados en la sesión. */
export function mergeGuestsForInvite(
  contacts: Guest[],
  eventGuests: EventGuest[],
  sessionGuests: Guest[] = [],
): Guest[] {
  const merged: Guest[] = contacts.map((g) => ({ ...g }));
  const seen = new Set<string>();
  contacts.forEach((g) => guestMatchKeys(g).forEach((k) => seen.add(k)));

  eventGuests.forEach((eg, index) => {
    const keys = eventGuestMatchKeys(eg);
    const existingIdx = merged.findIndex((g) => guestMatchKeys(g).some((k) => keys.includes(k)));
    if (existingIdx >= 0) {
      const enriched = enrichGuestFromEvent(merged[existingIdx], eg);
      merged[existingIdx] = enriched;
      guestMatchKeys(enriched).forEach((k) => seen.add(k));
      return;
    }
    if (keys.some((k) => seen.has(k))) return;
    const guest = eventGuestToGuest(eg, index);
    keys.forEach((k) => seen.add(k));
    guestMatchKeys(guest).forEach((k) => seen.add(k));
    merged.push(guest);
  });

  sessionGuests.forEach((sg) => {
    const keys = guestMatchKeys(sg);
    const existingIdx = merged.findIndex((g) => guestMatchKeys(g).some((k) => keys.includes(k)));
    if (existingIdx >= 0) {
      const existing = merged[existingIdx];
      merged[existingIdx] = {
        ...existing,
        ...sg,
        id: existing.id,
        favoriteId: sg.favoriteId || existing.favoriteId,
        invitedUserId: sg.invitedUserId || existing.invitedUserId,
        name: (sg.name && sg.name !== 'Sin nombre' ? sg.name : existing.name) || sg.name,
        lastName: sg.lastName || existing.lastName,
        username: sg.username || existing.username,
        email: sg.email || existing.email,
        avatar: sg.avatar || existing.avatar,
        originType: sg.originType || existing.originType,
      };
    } else {
      merged.push(sg);
    }
    guestMatchKeys(merged[existingIdx >= 0 ? existingIdx : merged.length - 1]).forEach((k) => seen.add(k));
  });

  return merged;
}

export function guestFromAddedMeta(
  meta: {
    favoriteId?: string;
    platformUserId?: string;
    name?: string;
    email?: string;
    phone?: string;
  },
  source?: Guest,
  guestId?: string,
): Guest {
  const parts = (meta.name || '').trim().split(' ').filter(Boolean);
  const name = source?.name || parts[0] || 'Invitado';
  const lastName = source?.lastName || parts.slice(1).join(' ');
  const id = source?.favoriteId || meta.favoriteId || source?.id || meta.platformUserId || guestId || '';
  return {
    id,
    favoriteId: meta.favoriteId || source?.favoriteId,
    invitedUserId: meta.platformUserId || source?.invitedUserId || (source?.id && source.originType === 'REGISTERED' ? source.id : undefined),
    name,
    lastName,
    username: source?.username,
    email: meta.email || source?.email,
    phone: meta.phone || source?.phone,
    phoneIndicative: source?.phoneIndicative,
    phoneNumber: source?.phoneNumber,
    avatar: source?.avatar,
    isFavorite: source?.isFavorite ?? false,
    groupId: source?.groupId,
    originType: source?.originType || (meta.platformUserId ? 'REGISTERED' : undefined),
    createdAt: source?.createdAt || new Date(),
  };
}

/** Resuelve ids de la lista unificada para registros recién agregados al evento. */
export function resolveInviteGuestIds(
  contacts: Guest[],
  eventGuests: EventGuest[],
  addedRecords: EventGuest[],
  sessionGuests: Guest[] = [],
): string[] {
  const merged = mergeGuestsForInvite(contacts, eventGuests, sessionGuests);
  const ids = new Set<string>();
  addedRecords.forEach((record) => {
    const keys = eventGuestMatchKeys(record);
    merged.forEach((guest) => {
      if (guestMatchKeys(guest).some((key) => keys.includes(key))) {
        ids.add(guest.id);
      }
    });
  });
  return Array.from(ids);
}

/** Alinea ids seleccionados con la lista unificada tras deduplicar o recargar. */
export function syncGuestIdsToInviteList(list: Guest[], ids: string[]): string[] {
  const resolved = new Set<string>();
  for (const rawId of ids) {
    const match = list.find((g) => g.id === rawId)
      || list.find((g) => guestMatchKeys(g).some((k) => k === `id:${rawId}` || k === `uid:${rawId}` || k === `fav:${rawId}`));
    if (match) resolved.add(match.id);
  }
  return Array.from(resolved);
}

/** Arma favoriteIds, users y canales para invitaciones con notificaciones in-app/push. */
export function buildEventInvitationPayload(
  selectedGuests: Guest[],
  uiChannels: string[],
): {
  favoriteIds: string[];
  users: string[];
  channels: string[];
  hasRegisteredRecipients: boolean;
} {
  const favoriteIds = new Set<string>();
  const users = new Set<string>();

  selectedGuests.forEach((g) => {
    const favId = g.favoriteId || g.id;
    if (favId) favoriteIds.add(favId);

    const platformUserId = g.invitedUserId
      || (String(g.originType || '').toUpperCase() === 'REGISTERED' && g.id && !g.id.startsWith('search-')
        ? g.id
        : null);
    if (platformUserId) users.add(platformUserId);
  });

  const hasRegisteredRecipients = users.size > 0
    || selectedGuests.some((g) => Boolean(g.invitedUserId)
      || String(g.originType || '').toUpperCase() === 'REGISTERED');

  const channels = new Set(
    uiChannels.map((c) => CHANNEL_ALIASES[String(c).toLowerCase()] || c),
  );

  if (hasRegisteredRecipients) {
    channels.add('inApp');
    channels.add('push');
  }
  if (!channels.size) {
    channels.add('inApp');
    channels.add('push');
    channels.add('email');
  }

  return {
    favoriteIds: Array.from(favoriteIds),
    users: Array.from(users),
    channels: Array.from(channels),
    hasRegisteredRecipients,
  };
}
