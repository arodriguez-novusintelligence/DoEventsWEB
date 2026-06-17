import { getAuthToken, getCurrentEnv } from './client';

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

export interface EventMediaEntry {
  publicUrl: string;
  s3Key?: string;
  isVideo?: boolean;
  previewUrl?: string;
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm|m4v|avi)(\?|$)/i.test(url);
}

async function requestUploadUrls(eventId: string, files: File[]) {
  const base = `${getCurrentEnv().apiBaseUrl}/images`;
  const uploadRes = await fetch(`${base}/createUploadUrls`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      eventId,
      files: files.map((file) => ({
        fileName: file.name || (file.type.startsWith('video/') ? 'video.mp4' : 'image.jpg'),
        contentType: file.type || (file.name?.match(/\.(mp4|mov|webm)$/i) ? 'video/mp4' : 'image/jpeg'),
      })),
    }),
  });
  const uploadBody = await uploadRes.json().catch(() => ({})) as {
    uploads?: Array<{ uploadUrl: string; publicUrl?: string; s3Key?: string; contentType?: string }>;
    files?: Array<{ uploadUrl: string; publicUrl?: string; s3Key?: string; contentType?: string }>;
    message?: string;
    error?: string;
  };
  const uploads = uploadBody.uploads || uploadBody.files || [];
  if (!uploadRes.ok || uploads.length === 0) {
    throw new Error(uploadBody.message || uploadBody.error || 'No se pudo preparar la subida de archivos');
  }
  return uploads;
}

async function putFilesToS3(files: File[], uploads: Array<{ uploadUrl: string; contentType?: string }>) {
  await Promise.all(
    files.map(async (file, index) => {
      const entry = uploads[index];
      if (!entry?.uploadUrl) throw new Error(`No hay URL de subida para ${file.name}`);
      const contentType = file.type
        || entry.contentType
        || (file.name?.match(/\.(mp4|mov|webm)$/i) ? 'video/mp4' : 'image/jpeg');
      try {
        const putRes = await fetch(entry.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': contentType },
          body: file,
        });
        if (!putRes.ok) {
          throw new Error(`No se pudo subir ${file.name} (HTTP ${putRes.status})`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (/failed|network|cors/i.test(message)) {
          throw new Error(
            `Error de red al subir ${file.name}. Verifica la conexión o intenta con una imagen más pequeña.`,
          );
        }
        throw err instanceof Error ? err : new Error(message);
      }
    }),
  );
}

export async function fetchEventMedia(eventId: string): Promise<EventMediaEntry[]> {
  const base = `${getCurrentEnv().apiBaseUrl}/images`;
  try {
    const res = await fetch(`${base}/getImageByIdToUpdate/${encodeURIComponent(eventId)}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    const items = await res.json() as Array<{
      imagenesCargadas?: string[];
      s3Keys?: string[];
    }>;
    const record = items[0];
    if (!record) return [];
    const urls = record.imagenesCargadas || [];
    const keys = record.s3Keys || [];
    return urls.map((publicUrl, index) => ({
      publicUrl,
      s3Key: keys[index],
      isVideo: isVideoUrl(publicUrl),
      previewUrl: publicUrl,
    }));
  } catch {
    return [];
  }
}

export async function saveEventMedia(
  eventId: string,
  media: EventMediaEntry[],
  userId: string,
): Promise<void> {
  const base = `${getCurrentEnv().apiBaseUrl}/images`;
  const list_image = media.map((entry, index) => ({
    nombreImagen: `media-${index}`,
    s3Key: entry.s3Key,
    publicUrl: entry.publicUrl,
  }));
  const res = await fetch(`${base}/updateImages/${encodeURIComponent(eventId)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({
      id_evento: eventId,
      id_user: userId,
      list_image,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string; error?: string };
    throw new Error(err.message || err.error || 'No se pudo guardar el multimedia del evento');
  }
}

export async function uploadEventMediaBatch(
  eventId: string,
  files: File[],
  userId: string,
  existing: EventMediaEntry[] = [],
): Promise<EventMediaEntry[]> {
  if (!files.length) return existing;
  const uploads = await requestUploadUrls(eventId, files);
  await putFilesToS3(files, uploads);
  const uploaded = uploads.map((entry, index) => ({
    publicUrl: entry.publicUrl || entry.s3Key || '',
    s3Key: entry.s3Key,
    isVideo: (files[index]?.type || '').startsWith('video/') || isVideoUrl(entry.publicUrl || ''),
    previewUrl: URL.createObjectURL(files[index]),
  }));
  const merged = [...existing, ...uploaded];
  await saveEventMedia(eventId, merged, userId);
  return merged;
}

/** Compatibilidad con flujo de creación: sube un archivo y lo agrega a la galería del evento. */
export async function uploadEventImage(eventId: string, file: File, userId?: string): Promise<string> {
  const existing = await fetchEventMedia(eventId);
  const merged = await uploadEventMediaBatch(eventId, [file], userId || 'system', existing);
  const last = merged[merged.length - 1];
  return last?.publicUrl || '';
}
