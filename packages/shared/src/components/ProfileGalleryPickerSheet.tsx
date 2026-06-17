import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchProfileGallery, type ProfileGalleryImage } from '../api/profileMediaService';
import { Loader } from './Loader';
import { toSelectedGalleryImage, type SelectedGalleryImage } from '../lib/galleryMediaUtils';

export interface ProfileGalleryPickerSheetProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onConfirm: (items: SelectedGalleryImage[]) => void;
  mode?: 'single' | 'multiple';
  maxSelect?: number;
  title?: string;
}

export const ProfileGalleryPickerSheet: React.FC<ProfileGalleryPickerSheetProps> = ({
  open,
  onClose,
  userId,
  onConfirm,
  mode = 'multiple',
  maxSelect = 10,
  title = 'Mi Galería de Fotos',
}) => {
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<ProfileGalleryImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProfileGallery(userId);
      setPhotos(data);
    } catch (err) {
      setPhotos([]);
      setError(err instanceof Error ? err.message : 'No se pudo cargar la galería');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
      return;
    }
    void load();
  }, [open, load]);

  const displayPhotos = useMemo(
    () => photos.map(toSelectedGalleryImage).filter((p): p is SelectedGalleryImage => Boolean(p)),
    [photos],
  );

  const togglePhoto = (imageId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(imageId)) {
        next.delete(imageId);
        return next;
      }
      if (mode === 'single') return new Set([imageId]);
      if (next.size >= maxSelect) return next;
      next.add(imageId);
      return next;
    });
  };

  const handleConfirm = () => {
    const picked = displayPhotos.filter((p) => selectedIds.has(p.imageId));
    if (!picked.length) return;
    onConfirm(picked);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="de-sheet-overlay de-sheet-overlay--above-dock" onClick={onClose} role="presentation">
      <div className="de-sheet de-sheet--tall" onClick={(e) => e.stopPropagation()}>
        <header className="de-sheet__header">
          <h2>{title}</h2>
          <button type="button" className="de-sheet__close" onClick={onClose}>×</button>
        </header>
        <div className="de-sheet__body de-form-stack">
          <p className="de-form-hint">
            {mode === 'single'
              ? 'Elige una imagen de tu galería.'
              : `Puedes elegir hasta ${maxSelect} imagen${maxSelect === 1 ? '' : 'es'}.`}
          </p>

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
              <Loader />
            </div>
          )}

          {!loading && error && (
            <p className="de-form-hint" style={{ color: 'var(--destructive)' }}>{error}</p>
          )}

          {!loading && !error && displayPhotos.length === 0 && (
            <div className="de-form-hint" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              Aún no tienes fotos en tu galería. Agrégalas desde tu perfil → Mis Fotos.
            </div>
          )}

          {!loading && displayPhotos.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 8,
              }}
            >
              {displayPhotos.map((photo, index) => {
                const isSelected = selectedIds.has(photo.imageId);
                return (
                  <button
                    key={photo.imageId}
                    type="button"
                    onClick={() => togglePhoto(photo.imageId)}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: isSelected ? '3px solid var(--primary)' : '2px solid transparent',
                      padding: 0,
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                    aria-label={`Foto ${index + 1}`}
                    aria-pressed={isSelected}
                  >
                    <img
                      src={photo.url}
                      alt=""
                      key={photo.url}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {isSelected && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <footer className="de-sheet__footer">
          <button
            type="button"
            className="de-access-btn de-access-btn--primary"
            disabled={selectedIds.size === 0}
            onClick={handleConfirm}
          >
            Usar {selectedIds.size > 0 ? `(${selectedIds.size})` : 'selección'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ProfileGalleryPickerSheet;
