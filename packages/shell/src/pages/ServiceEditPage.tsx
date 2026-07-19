import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  canEditEntity,
  dedupeMediaUrls,
  ensurePersistentImageUrl,
  fetchServiceById,
  fetchServicePromoCodes,
  invalidateServicesCache,
  isEphemeralMediaUrl,
  Loader,
  pickPersistentGalleryUrl,
  resolveImageUrl,
  RootState,
  toPersistentMediaUrl,
  updateServiceProvider,
  uploadProfileGalleryImages,
  uploadServiceProviderImage,
  syncServicePromoCodes,
  useToast,
} from '@doevents/shared';
import MyServicesView from '@lovable/components/services/MyServicesView';
import type { ServiceFormData } from '@lovable/data/servicesData';
import { apiServiceToForm, buildServiceApiPayload } from '../lovable-bridge/serviceFormMapper';
import { confirmLeaveWithSave, isJsonDifferent } from '../lib/leaveConfirm';

function resolveGalleryItemUrl(item: ServiceFormData['gallery'][number]): string {
  const raw = item.url || item.preview || '';
  if (!raw || raw.startsWith('blob:')) return '';
  return toPersistentMediaUrl(raw) || resolveImageUrl(raw) || raw;
}

function mapUploadedUrls(images: Array<{ signedUrl?: string; publicUrl?: string; url?: string }>): string[] {
  return dedupeMediaUrls(images.map((item) => pickPersistentGalleryUrl(item)).filter(Boolean));
}

export const ServiceEditPage: React.FC = () => {
  const { serviceId = '' } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [loading, setLoading] = useState(true);
  const [initialForm, setInitialForm] = useState<ServiceFormData | null>(null);
  const saveLock = useRef(false);

  useEffect(() => {
    if (!serviceId) return;

    let cancelled = false;

    fetchServiceById(serviceId)
      .then(async (data) => {
        if (cancelled || !data) return;

        if (!canEditEntity(userId, data.userId, data.coAdminIds)) {
          showToast('No tienes permiso para editar este servicio', 'error');
          navigate(`/services/${serviceId}`, { replace: true });
          return;
        }

        const promo = await fetchServicePromoCodes(serviceId).catch(() => null);
        if (cancelled) return;
        setInitialForm({
          ...apiServiceToForm(data),
          promoCodes: promo?.batches?.length ? promo.batches : [],
        });
      })
      .catch(() => {
        if (!cancelled) showToast('No se pudo cargar el servicio', 'error');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [serviceId, userId, navigate, showToast]);

  const handleSave = async (form: ServiceFormData) => {
    if (saveLock.current) return;
    if (!userId || !serviceId) {
      showToast('Debes iniciar sesión', 'error');
      throw new Error('no-auth');
    }

    saveLock.current = true;
    try {
      let imageUrl = form.coverImageUrl;
      let profileImageGalleryImageId: string | undefined;
      let profileImageGalleryKey: string | undefined;

      if (form.coverImageFile) {
        imageUrl = await uploadServiceProviderImage(userId, form.coverImageFile);
      } else if (form.coverGalleryImageId || form.coverGalleryKey) {
        profileImageGalleryImageId = form.coverGalleryImageId;
        profileImageGalleryKey = form.coverGalleryKey;
        imageUrl = form.coverImageUrl;
      } else if (imageUrl) {
        const persistent = toPersistentMediaUrl(imageUrl) || resolveImageUrl(imageUrl);
        if (persistent && !isEphemeralMediaUrl(persistent)) {
          imageUrl = persistent;
        } else {
          imageUrl = await ensurePersistentImageUrl(userId, imageUrl, uploadServiceProviderImage) || imageUrl;
        }
      }

      if (!imageUrl && !profileImageGalleryImageId && !profileImageGalleryKey) {
        showToast('Debes tener una foto del servicio', 'error');
        throw new Error('no-image');
      }

      const galleryFiles = form.gallery.filter((item) => item.file).map((item) => item.file!);
      const keptGallery = dedupeMediaUrls(
        form.gallery
          .filter((item) => !item.file && !item.galleryImageId)
          .map(resolveGalleryItemUrl)
          .filter(Boolean),
      ).filter((url) => url !== imageUrl);

      let extraGallery = keptGallery;
      if (galleryFiles.length) {
        const uploaded = await uploadProfileGalleryImages(userId, galleryFiles);
        extraGallery = dedupeMediaUrls([...keptGallery, ...mapUploadedUrls(uploaded)])
          .filter((url) => url !== imageUrl);
      }

      const payload = buildServiceApiPayload(form, userId, {
        profileImageUrl: imageUrl,
        profileImageGalleryImageId,
        profileImageGalleryKey,
        galleryUrls: extraGallery,
      });

      await updateServiceProvider(serviceId, userId, payload);

      if (form.promoCodes?.length) {
        try {
          await syncServicePromoCodes(serviceId, form.promoCodes);
        } catch (promoErr) {
          showToast(
            promoErr instanceof Error ? promoErr.message : 'El servicio se guardó, pero falló la sincronización de códigos promo',
            'error',
          );
        }
      }

      invalidateServicesCache();
      showToast('Servicio actualizado', 'success');
      navigate(`/users/${userId}/services`, { replace: true });
    } catch (err) {
      if (err instanceof Error && err.message !== 'no-auth' && err.message !== 'no-image') {
        showToast(err.message || 'No se pudo guardar el servicio', 'error');
      }
      throw err;
    } finally {
      saveLock.current = false;
    }
  };

  const handleBack = (form?: ServiceFormData) => {
    const myServicesPath = userId ? `/users/${userId}/services` : '/profile';
    if (!initialForm) {
      navigate(myServicesPath);
      return;
    }
    void confirmLeaveWithSave({
      dirty: form ? isJsonDifferent(form, initialForm) : false,
      onLeave: () => navigate(myServicesPath),
    });
  };

  if (loading || !initialForm) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <MyServicesView
      onBack={handleBack}
      onServicePublished={handleSave}
      initialForm={initialForm}
      mode="edit"
      submitLabel="Guardar cambios"
    />
  );
};

export default ServiceEditPage;
