import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  deleteProfileGalleryImage,
  fetchProfileGallery,
  ProfileGalleryImage,
  resolveGalleryDisplayUrl,
  RootState,
  uploadProfileGalleryImages,
  useToast,
} from '@doevents/shared';
import ProfileGallery, {
  GalleryPhotoItem,
  MAX_GALLERY_PHOTOS,
} from '@lovable/components/feed/ProfileGallery';

interface PendingPhoto {
  id: string;
  url: string;
  file: File;
}

export const ProfileGalleryPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedPhotos, setSavedPhotos] = useState<ProfileGalleryImage[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await fetchProfileGallery(userId);
      setSavedPhotos(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al cargar fotos', 'error');
    } finally {
      setLoading(false);
    }
  }, [userId, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const displayPhotos: GalleryPhotoItem[] = useMemo(() => {
    const kept = savedPhotos
      .filter((photo) => !pendingDeleteIds.includes(photo.imageId))
      .map((photo) => ({
        id: photo.imageId,
        url: resolveGalleryDisplayUrl(photo),
      }))
      .filter((photo) => Boolean(photo.url));

    const pending = pendingPhotos.map((photo) => ({
      id: photo.id,
      url: photo.url,
    }));

    return [...kept, ...pending];
  }, [savedPhotos, pendingPhotos, pendingDeleteIds]);

  const hasChanges = pendingPhotos.length > 0 || pendingDeleteIds.length > 0;

  const handleAddFiles = (files: File[]) => {
    const remaining = MAX_GALLERY_PHOTOS - displayPhotos.length;
    if (remaining <= 0) return;

    const toAdd = files.slice(0, remaining);
    setPendingPhotos((prev) => [
      ...prev,
      ...toAdd.map((file) => ({
        id: `pending-${crypto.randomUUID()}`,
        url: URL.createObjectURL(file),
        file,
      })),
    ]);
  };

  const handleRemove = (photoId: string) => {
    if (photoId.startsWith('pending-')) {
      setPendingPhotos((prev) => {
        const target = prev.find((photo) => photo.id === photoId);
        if (target?.url.startsWith('blob:')) URL.revokeObjectURL(target.url);
        return prev.filter((photo) => photo.id !== photoId);
      });
      return;
    }

    setPendingDeleteIds((prev) => (
      prev.includes(photoId) ? prev : [...prev, photoId]
    ));
  };

  const handleSave = async () => {
    if (!userId || !hasChanges) return;
    setSaving(true);
    try {
      if (pendingDeleteIds.length) {
        await Promise.all(
          pendingDeleteIds.map((imageId) => deleteProfileGalleryImage(userId, imageId)),
        );
      }

      if (pendingPhotos.length) {
        await uploadProfileGalleryImages(
          userId,
          pendingPhotos.map((photo) => photo.file),
        );
      }

      pendingPhotos.forEach((photo) => {
        if (photo.url.startsWith('blob:')) URL.revokeObjectURL(photo.url);
      });
      setPendingPhotos([]);
      setPendingDeleteIds([]);
      await load();
      showToast('¡Galería guardada exitosamente!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al guardar la galería', 'error');
    } finally {
      setSaving(false);
    }
  };

  const pendingPhotosRef = React.useRef(pendingPhotos);
  pendingPhotosRef.current = pendingPhotos;

  useEffect(() => () => {
    pendingPhotosRef.current.forEach((photo) => {
      if (photo.url.startsWith('blob:')) URL.revokeObjectURL(photo.url);
    });
  }, []);

  return (
    <ProfileGallery
      onBack={() => navigate('/profile')}
      photos={displayPhotos}
      loading={loading}
      saving={saving}
      hasChanges={hasChanges}
      onAddFiles={handleAddFiles}
      onRemove={handleRemove}
      onSave={handleSave}
    />
  );
};

export default ProfileGalleryPage;
