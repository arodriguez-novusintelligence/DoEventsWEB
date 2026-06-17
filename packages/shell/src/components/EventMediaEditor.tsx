import React, { useEffect, useState } from 'react';
import {
  EventMediaEntry,
  fetchEventMedia,
  galleryImageUrlToFile,
  mediaPreviewUrl,
  MediaSourcePicker,
  saveEventMedia,
  uploadEventMediaBatch,
  useToast,
} from '@doevents/shared';

export interface EventMediaEditorProps {
  eventId: string;
  userId: string;
  onUpdated?: (media: EventMediaEntry[]) => void;
}

export const EventMediaEditor: React.FC<EventMediaEditorProps> = ({
  eventId,
  userId,
  onUpdated,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [media, setMedia] = useState<EventMediaEntry[]>([]);
  const [mediaVersion, setMediaVersion] = useState(() => Date.now());

  const refreshMedia = async () => {
    const items = await fetchEventMedia(eventId);
    setMedia(items);
    setMediaVersion(Date.now());
    onUpdated?.(items);
    return items;
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchEventMedia(eventId)
      .then((items) => {
        if (!cancelled) {
          setMedia(items);
          setMediaVersion(Date.now());
        }
      })
      .catch(() => {
        if (!cancelled) setMedia([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [eventId]);

  const handleFiles = async (files: FileList | File[] | null) => {
    const list = files instanceof FileList ? Array.from(files) : (files || []);
    if (!list.length) return;
    setSaving(true);
    try {
      const uploaded = await uploadEventMediaBatch(
        eventId,
        list,
        userId,
        media,
      );
      setMedia(uploaded);
      setMediaVersion(Date.now());
      onUpdated?.(uploaded);
      showToast('Multimedia actualizado', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo subir el archivo', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleGalleryImages = async (urls: string[]) => {
    if (!urls.length) return;
    try {
      const files = await Promise.all(
        urls.map((url, index) => galleryImageUrlToFile(url, `gallery-event-${index + 1}.jpg`)),
      );
      await handleFiles(files);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo usar la imagen de la galería', 'error');
    }
  };

  const setAsCover = async (index: number) => {
    if (index <= 0) return;
    const reordered = [media[index], ...media.filter((_, i) => i !== index)];
    setSaving(true);
    try {
      await saveEventMedia(eventId, reordered, userId);
      await refreshMedia();
      showToast('Foto de perfil del evento actualizada', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo actualizar la portada', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeMedia = async (index: number) => {
    const next = media.filter((_, i) => i !== index);
    setSaving(true);
    try {
      await saveEventMedia(eventId, next, userId);
      await refreshMedia();
      showToast('Archivo eliminado', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo eliminar el archivo', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="de-event-media-editor">
      <header className="de-event-media-editor__header">
        <div>
          <h3>Multimedia del evento</h3>
          <p>La primera imagen es la foto de perfil del evento (chat, mapa y listados).</p>
        </div>
        <MediaSourcePicker
          userId={userId}
          multiple
          maxCount={20}
          currentCount={media.length}
          accept="image/*,video/*"
          disabled={saving}
          deviceLabel={saving ? 'Guardando…' : '+ Agregar fotos o videos'}
          galleryLabel="Mi galería"
          onFiles={(files) => { void handleFiles(files); }}
          onGallerySelect={(items) => { void handleGalleryImages(items.map((item) => item.url)); }}
        />
      </header>

      {loading ? (
        <p className="de-event-media-editor__hint">Cargando galería…</p>
      ) : media.length === 0 ? (
        <p className="de-event-media-editor__hint">Aún no hay fotos ni videos. Sube la imagen principal del evento.</p>
      ) : (
        <div className="de-event-media-editor__grid">
          {media.map((item, index) => (
            <article key={`${item.publicUrl}-${index}`} className="de-event-media-editor__card">
              {item.isVideo ? (
                <video src={item.previewUrl || item.publicUrl} controls className="de-event-media-editor__media" />
              ) : (
                <img
                  src={mediaPreviewUrl(item.previewUrl || item.publicUrl, mediaVersion)}
                  alt=""
                  className="de-event-media-editor__media"
                />
              )}
              <div className="de-event-media-editor__card-actions">
                {index === 0 ? (
                  <span className="de-event-media-editor__badge">Foto de perfil</span>
                ) : (
                  <button type="button" disabled={saving} onClick={() => setAsCover(index)}>
                    Usar como perfil
                  </button>
                )}
                <button type="button" disabled={saving} onClick={() => removeMedia(index)}>
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default EventMediaEditor;
