import { getPersistedOAuthProfilePhoto } from './userDisplayName';
import { isExternalProfileUrl, isSignedS3Url, toPersistentMediaUrl } from './persistentMediaUrl';
import { resolveImageUrl } from './resolveImageUrl';

function looksLikeOwnedProfileMedia(value?: string | null): boolean {
  const raw = String(value || '').trim();
  if (!raw) return false;
  return /profiles\/|fotosPerfil\/|profile-images\/|doevents-profile-media/i.test(raw);
}

/**
 * URL estable para avatares de usuario: prioriza URLs firmadas (bucket privado),
 * resuelve keys S3 y usa foto OAuth persistida solo si no hay avatar propio.
 */
export function resolveUserAvatarUrl(
  url?: string | null,
  userId?: string | null,
): string | undefined {
  const raw = String(url || '').trim();

  if (!raw) {
    return resolveImageUrl(getPersistedOAuthProfilePhoto(userId));
  }

  // Bucket privado: la URL firmada es la única usable.
  if (isSignedS3Url(raw)) {
    return raw;
  }

  if (isExternalProfileUrl(raw)) {
    return raw;
  }

  const persistent = toPersistentMediaUrl(raw);
  const resolved = resolveImageUrl(persistent || raw) || persistent || raw;

  // Si ya hay avatar propio en S3, no volver a la foto de Google/Apple/Facebook.
  if (looksLikeOwnedProfileMedia(raw) || looksLikeOwnedProfileMedia(resolved)) {
    return resolved || raw;
  }

  if (resolved && !isSignedS3Url(resolved)) {
    return resolved;
  }

  const oauth = getPersistedOAuthProfilePhoto(userId);
  if (oauth) return resolveImageUrl(oauth) || oauth;

  return resolved || raw || undefined;
}
