import { getAuthToken, getCurrentEnv } from './client';
import { extractApiMessage, toUserFacingError } from '../lib/apiError';
import { isEphemeralMediaUrl, pickPersistentGalleryUrl, toPersistentMediaUrl } from '../lib/persistentMediaUrl';
import { resolveGalleryDisplayUrl } from '../lib/galleryMediaUtils';
import { resolveImageUrl } from '../lib/resolveImageUrl';
import { prepareCoverImageForUpload, prepareProfileAvatarForUpload } from '../lib/imageUtils';

export interface ProfileGalleryImage {
  imageId: string;
  url?: string;
  signedUrl?: string;
  publicUrl?: string;
  key?: string;
}

export interface UpdateUserProfileInput {
  id: string;
  email?: string;
  name?: string;
  lastName?: string;
  user?: string;
  description?: string;
  phone?: string;
  fotoPerfilBase64?: string;
  ciudad?: string;
  departamento?: string;
  pais?: string;
  direccion?: string;
  documento?: string;
  tipoDocumento?: string;
  accountType?: 'PERSONAL' | 'COMPANY';
  companyName?: string;
  companyWebsite?: string;
  companyIndustry?: string;
  companyDescription?: string;
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

function profileBase(): string {
  return getCurrentEnv().endpoints.profileImages;
}

async function putBlobToPresignedUrl(url: string, body: Blob, contentType: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`S3 respondió ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error(
      'No se pudo subir la imagen al almacenamiento. Verifica tu conexión e intenta de nuevo.',
    ));
    xhr.send(body);
  });
}

function resolveCoverUrlFromSaveBody(
  saveBody: {
    coverImageSignedUrl?: string;
    coverImageUrl?: string;
    profileCover?: { signedUrl?: string; url?: string; publicUrl?: string };
  },
  fallback?: string,
): string {
  return saveBody.coverImageSignedUrl
    || saveBody.coverImageUrl
    || saveBody.profileCover?.signedUrl
    || saveBody.profileCover?.url
    || saveBody.profileCover?.publicUrl
    || fallback
    || '';
}

export async function updateUserProfile(input: UpdateUserProfileInput): Promise<void> {
  const response = await fetch(getCurrentEnv().endpoints.updateUser, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      id: input.id,
      email: input.email,
      name: input.name,
      lastName: input.lastName,
      user: input.user,
      description: input.description,
      phone: input.phone,
      fotoPerfilBase64: input.fotoPerfilBase64,
      ciudad: input.ciudad,
      departamento: input.departamento,
      pais: input.pais,
      direccion: input.direccion,
      documento: input.documento,
      tipoDocumento: input.tipoDocumento,
      accountType: input.accountType,
      companyName: input.companyName,
      companyWebsite: input.companyWebsite,
      companyIndustry: input.companyIndustry,
      companyDescription: input.companyDescription,
    }),
  });

  const body = await response.json().catch(() => ({})) as { statusDesc?: string; statusMessage?: string; message?: string };
  if (!response.ok) {
    throw new Error(body.statusDesc || body.statusMessage || body.message || 'No se pudo actualizar el perfil');
  }
}

function resolveGalleryItemUrl(item: ProfileGalleryImage): string {
  return resolveGalleryDisplayUrl(item);
}

export async function fetchProfileGallery(userId: string): Promise<ProfileGalleryImage[]> {
  const response = await fetch(`${profileBase()}/${encodeURIComponent(userId)}/profile-images`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('No se pudo cargar la galería');
  const data = await response.json() as { profileGallery?: ProfileGalleryImage[] };
  return (data.profileGallery || []).map((item) => ({
    ...item,
    url: resolveGalleryItemUrl(item),
  }));
}

export async function uploadProfileGalleryImages(
  userId: string,
  files: File[],
): Promise<ProfileGalleryImage[]> {
  if (!files.length) return [];

  const uploadMeta = await fetch(`${profileBase()}/${encodeURIComponent(userId)}/profile-images/upload-urls`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      files: files.map((file) => ({
        fileName: file.name,
        contentType: file.type || 'image/jpeg',
      })),
    }),
  });

  const uploadBody = await uploadMeta.json() as {
    files?: Array<{ imageId: string; uploadUrl: string; key: string; publicUrl?: string; signedUrl?: string; contentType?: string }>;
    error?: string;
  };
  if (!uploadMeta.ok || !uploadBody.files?.length) {
    throw new Error(uploadBody.error || 'No se pudo preparar la subida');
  }

  await Promise.all(
    uploadBody.files.map(async (entry, index) => {
      const file = files[index];
      await putBlobToPresignedUrl(
        entry.uploadUrl,
        file,
        file.type || entry.contentType || 'image/jpeg',
      );
    }),
  );

  const saveResponse = await fetch(`${profileBase()}/${encodeURIComponent(userId)}/profile-images`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({
      images: uploadBody.files.map((entry) => ({
        imageId: entry.imageId,
        key: entry.key,
        publicUrl: entry.publicUrl,
      })),
    }),
  });

  const saveBody = await saveResponse.json() as { profileGallery?: ProfileGalleryImage[]; error?: string };
  if (!saveResponse.ok) {
    throw new Error(saveBody.error || 'No se pudo guardar la galería');
  }

  const uploadedIds = new Set(uploadBody.files.map((entry) => entry.imageId));
  const fromSave = (saveBody.profileGallery || []).filter((item) => uploadedIds.has(item.imageId));
  const source = fromSave.length ? fromSave : uploadBody.files.map((entry) => ({
    imageId: entry.imageId,
    key: entry.key,
    publicUrl: entry.publicUrl,
    signedUrl: entry.signedUrl,
    url: entry.publicUrl || entry.signedUrl,
  }));

  return source.map((item) => {
    const resolvedUrl = resolveGalleryItemUrl(item);
    return {
      ...item,
      url: resolvedUrl,
      publicUrl: item.publicUrl || resolvedUrl,
    };
  });
}

export async function deleteProfileGalleryImage(userId: string, imageId: string): Promise<void> {
  const response = await fetch(
    `${profileBase()}/${encodeURIComponent(userId)}/profile-images/${encodeURIComponent(imageId)}`,
    { method: 'DELETE', headers: authHeaders() },
  );
  if (!response.ok) throw new Error('No se pudo eliminar la imagen');
}

export async function uploadProfileAvatar(userId: string, file: File): Promise<string> {
  const prepared = await prepareProfileAvatarForUpload(file);
  const contentType = prepared.type || 'image/jpeg';

  let uploadMeta: Response;
  try {
    uploadMeta = await fetch(`${profileBase()}/${encodeURIComponent(userId)}/avatar/upload-url`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        fileName: prepared.name || 'avatar.jpg',
        contentType,
      }),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la subida de foto de perfil'));
  }

  const uploadBody = await uploadMeta.json().catch(() => ({})) as {
    uploadUrl?: string;
    key?: string;
    publicUrl?: string;
    signedUrl?: string;
    error?: string;
  };

  if (!uploadMeta.ok || !uploadBody.uploadUrl || !uploadBody.key) {
    throw new Error(uploadBody.error || extractApiMessage(uploadBody, 'No se pudo preparar la subida de avatar'));
  }

  try {
    await putBlobToPresignedUrl(uploadBody.uploadUrl, prepared, contentType);
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la subida de foto de perfil'));
  }

  const saveResponse = await fetch(`${profileBase()}/${encodeURIComponent(userId)}/avatar`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({
      key: uploadBody.key,
      publicUrl: uploadBody.publicUrl,
    }),
  });

  const saveBody = await saveResponse.json().catch(() => ({})) as {
    fotoPerfilSignedUrl?: string;
    publicUrl?: string;
    error?: string;
  };

  if (!saveResponse.ok) {
    throw new Error(saveBody.error || extractApiMessage(saveBody, 'No se pudo guardar la foto de perfil'));
  }

  return resolveImageUrl(uploadBody.publicUrl)
    || resolveImageUrl(saveBody.publicUrl)
    || resolveImageUrl(saveBody.fotoPerfilSignedUrl)
    || saveBody.fotoPerfilSignedUrl
    || saveBody.publicUrl
    || uploadBody.publicUrl
    || uploadBody.signedUrl
    || '';
}

export async function setProfileAvatarFromGallery(
  userId: string,
  input: { imageId?: string; key?: string },
): Promise<string> {
  const response = await fetch(`${profileBase()}/${encodeURIComponent(userId)}/avatar`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ ...input, copyFromGallery: true }),
  });
  const body = await response.json().catch(() => ({})) as {
    fotoPerfilSignedUrl?: string;
    publicUrl?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(body.error || 'No se pudo usar la imagen de la galería como avatar');
  }
  return resolveImageUrl(body.fotoPerfilSignedUrl)
    || resolveImageUrl(body.publicUrl)
    || body.fotoPerfilSignedUrl
    || body.publicUrl
    || '';
}

export async function setProfileCoverFromGallery(
  userId: string,
  input: { imageId?: string; key?: string },
): Promise<string> {
  const response = await fetch(`${profileBase()}/${encodeURIComponent(userId)}/cover`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ ...input, copyFromGallery: true }),
  });
  const body = await response.json().catch(() => ({})) as {
    coverImageSignedUrl?: string;
    coverImageUrl?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(body.error || 'No se pudo usar la imagen de la galería como portada');
  }
  return resolveCoverUrlFromSaveBody(body);
}

export async function uploadProfileCover(userId: string, file: File): Promise<string> {
  const prepared = await prepareCoverImageForUpload(file);
  const contentType = prepared.type || 'image/jpeg';
  const fileName = prepared.name || 'cover.jpg';

  const uploadMeta = await fetch(`${profileBase()}/${encodeURIComponent(userId)}/cover/upload-url`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      fileName,
      contentType,
    }),
  });

  const uploadBody = await uploadMeta.json() as {
    uploadUrl?: string;
    key?: string;
    publicUrl?: string;
    signedUrl?: string;
    error?: string;
  };

  if (!uploadMeta.ok || !uploadBody.uploadUrl || !uploadBody.key) {
    throw new Error(uploadBody.error || 'No se pudo preparar la subida de portada');
  }

  try {
    await putBlobToPresignedUrl(uploadBody.uploadUrl, prepared, contentType);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de red';
    throw new Error(`No se pudo subir la portada (${msg}). Intenta de nuevo en unos segundos.`);
  }

  const saveResponse = await fetch(`${profileBase()}/${encodeURIComponent(userId)}/cover`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({
      key: uploadBody.key,
      publicUrl: uploadBody.publicUrl,
    }),
  });

  const saveBody = await saveResponse.json() as {
    coverImageSignedUrl?: string;
    coverImageUrl?: string;
    profileCover?: { signedUrl?: string; url?: string; publicUrl?: string };
    error?: string;
  };

  if (!saveResponse.ok) {
    throw new Error(saveBody.error || 'No se pudo guardar la portada');
  }

  const coverUrl = resolveCoverUrlFromSaveBody(saveBody, uploadBody.publicUrl);
  if (!coverUrl) {
    throw new Error('Portada guardada pero no se recibió URL de visualización');
  }
  return resolveImageUrl(uploadBody.publicUrl)
    || resolveImageUrl(coverUrl)
    || coverUrl;
}

/** Sube una imagen de portada para un servicio (reutiliza galería de perfil). */
export async function uploadServiceProviderImage(userId: string, file: File): Promise<string> {
  const saved = await uploadProfileGalleryImages(userId, [file]);
  const latest = saved[saved.length - 1];
  const url = pickPersistentGalleryUrl(latest) || latest?.publicUrl || '';
  if (!url) throw new Error('No se recibió URL permanente de la imagen subida');
  return url;
}

export function normalizeMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    return `${parsed.origin}${parsed.pathname}`.toLowerCase();
  } catch {
    return trimmed.split('?')[0].toLowerCase();
  }
}

export function dedupeMediaUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  return urls
    .map((url) => toPersistentMediaUrl(url) || url)
    .filter((url) => url && !isEphemeralMediaUrl(url))
    .filter((url) => {
    const key = normalizeMediaUrl(url);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });
}
