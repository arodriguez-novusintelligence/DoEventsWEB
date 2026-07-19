import type { ProfileGalleryImage } from '../api/profileMediaService';
import { isEphemeralMediaUrl, isSignedS3Url, toPersistentMediaUrl } from './persistentMediaUrl';
import { appendImageCacheBuster, resolveImageUrl } from './resolveImageUrl';

export interface SelectedGalleryImage {
  imageId: string;
  url: string;
  key?: string;
}

/** URL usable en `<img src>`: en QA el bucket es privado, hay que conservar URLs firmadas. */
export function resolveGalleryDisplayUrl(item: {
  signedUrl?: string;
  publicUrl?: string;
  url?: string;
  key?: string;
}): string {
  const signed = String(item.signedUrl || '').trim();
  if (signed && isSignedS3Url(signed)) return signed;

  const rawUrl = String(item.url || '').trim();
  if (rawUrl && isSignedS3Url(rawUrl)) return rawUrl;

  return resolveImageUrl(item.publicUrl)
    || resolveImageUrl(item.key)
    || resolveImageUrl(item.url)
    || '';
}

export function toSelectedGalleryImage(item: ProfileGalleryImage): SelectedGalleryImage | null {
  const url = resolveGalleryDisplayUrl(item);
  if (!url) return null;
  return { imageId: item.imageId, url, key: item.key };
}

export async function galleryImageUrlToFile(url: string, fileName = 'gallery-image.jpg'): Promise<File> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('No se pudo cargar la imagen de la galería');
  const blob = await response.blob();
  const type = blob.type || 'image/jpeg';
  const ext = type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  return new File([blob], fileName.replace(/\.[^.]+$/, '') + `.${ext}`, { type });
}

/** URL estable para `<img>` tras guardar (evita caché del navegador). */
export function mediaPreviewUrl(url?: string | null, version?: string | number): string {
  if (!url) return '';
  return appendImageCacheBuster(url, version ?? Date.now()) || url;
}

/** Re-sube imágenes de galería (URLs firmadas) al bucket de la entidad. */
export async function ensurePersistentImageUrl(
  userId: string,
  url: string | undefined,
  upload: (uid: string, file: File) => Promise<string>,
): Promise<string | undefined> {
  const raw = String(url || '').trim();
  if (!raw) return undefined;
  const persistent = toPersistentMediaUrl(raw);
  if (persistent && !isEphemeralMediaUrl(persistent)) {
    return persistent;
  }
  const file = await galleryImageUrlToFile(raw, 'gallery-import.jpg');
  return upload(userId, file);
}
