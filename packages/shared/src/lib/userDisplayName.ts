import type { UserProfile } from '../api/userService';

const DISPLAY_NAME_KEY = 'doevents_user_display_name';
const OAUTH_PHOTO_KEY = 'doevents_oauth_profile_photos';

/** Guarda nombre mostrado tras OAuth (Google/Apple/Facebook). */
export function persistUserDisplayName(name: string): void {
  const trimmed = name.trim();
  if (trimmed) {
    localStorage.setItem(DISPLAY_NAME_KEY, trimmed);
  }
}

export function persistOAuthDisplayName(
  name?: string,
  givenName?: string,
  familyName?: string,
): void {
  const full = (name || [givenName, familyName].filter(Boolean).join(' ')).trim();
  if (full) persistUserDisplayName(full);
}

export function getPersistedUserDisplayName(): string {
  return localStorage.getItem(DISPLAY_NAME_KEY) || '';
}

export function clearPersistedUserDisplayName(): void {
  localStorage.removeItem(DISPLAY_NAME_KEY);
}

export function persistOAuthProfilePhoto(userId: string, photo?: string | null): void {
  const url = String(photo || '').trim();
  if (!userId || !url) return;
  try {
    const store = JSON.parse(localStorage.getItem(OAUTH_PHOTO_KEY) || '{}') as Record<string, string>;
    store[userId] = url;
    localStorage.setItem(OAUTH_PHOTO_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

/** Quita la foto OAuth cacheada de un usuario (p. ej. tras subir avatar propio). */
export function clearPersistedOAuthProfilePhoto(userId?: string | null): void {
  if (!userId) return;
  try {
    const store = JSON.parse(localStorage.getItem(OAUTH_PHOTO_KEY) || '{}') as Record<string, string>;
    if (!(userId in store)) return;
    delete store[userId];
    localStorage.setItem(OAUTH_PHOTO_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

export function getPersistedOAuthProfilePhoto(userId?: string | null): string | undefined {
  if (!userId) return undefined;
  try {
    const store = JSON.parse(localStorage.getItem(OAUTH_PHOTO_KEY) || '{}') as Record<string, string>;
    return store[userId] || undefined;
  } catch {
    return undefined;
  }
}

export function clearPersistedOAuthProfilePhotos(): void {
  localStorage.removeItem(OAUTH_PHOTO_KEY);
}

/** Nombre para UI: perfil API → OAuth guardado → email → vacío (sin "Eventer"). */
export function resolveUserDisplayName(
  profile?: UserProfile | null,
  options?: { email?: string; persisted?: string },
): string {
  const nombre = (profile?.nombre || '').trim();
  const apellido = (profile?.apellido || '').trim();
  const full = [nombre, apellido].filter(Boolean).join(' ').trim();
  if (full) return full;

  const userField = (profile?.username || '').trim();
  if (userField && userField.includes(' ') && !userField.startsWith('@')) {
    return userField;
  }
  if (userField && !userField.startsWith('@')) return userField;

  const persisted = (options?.persisted ?? getPersistedUserDisplayName()).trim();
  if (persisted) return persisted;

  const email = (options?.email || profile?.email || '').trim();
  if (email.includes('@')) {
    const local = email.split('@')[0];
    if (local) return local.charAt(0).toUpperCase() + local.slice(1);
  }

  return '';
}

/** Primer nombre para saludos tipo "Hola María". */
export function resolveUserFirstName(
  profile?: UserProfile | null,
  options?: { email?: string; persisted?: string },
): string {
  const full = resolveUserDisplayName(profile, options);
  if (!full) return '';
  return full.split(/\s+/)[0] || full;
}
