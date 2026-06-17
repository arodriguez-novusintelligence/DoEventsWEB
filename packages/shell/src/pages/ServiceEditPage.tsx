import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  canEditEntity,
  dedupeMediaUrls,
  ensurePersistentImageUrl,
  fetchServiceById,
  invalidateServicesCache,
  Loader,
  pickPersistentGalleryUrl,
  RootState,
  updateServiceProvider,
  uploadProfileGalleryImages,
  uploadServiceProviderImage,
  useToast,
} from '@doevents/shared';
import MyServicesView from '@lovable/components/services/MyServicesView';
import type { ServiceFormData } from '@lovable/data/servicesData';
import { apiServiceToForm } from '../lovable-bridge/serviceFormMapper';
import { finishPublishAndGoToFeed } from '../lovable-bridge/feedPublishBridge';
import { confirmLeaveWithSave, isJsonDifferent } from '../lib/leaveConfirm';

function resolveGalleryItemUrl(item: ServiceFormData['gallery'][number]): string {
  if (item.url) return item.url;
  if (item.preview && !item.preview.startsWith('blob:')) return item.preview;
  return '';
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

  useEffect(() => {
    if (!serviceId) return;

    let cancelled = false;

    fetchServiceById(serviceId)
      .then((data) => {
        if (cancelled || !data) return;

        if (!canEditEntity(userId, data.userId, data.coAdminIds)) {
          showToast('No tienes permiso para editar este servicio', 'error');
          navigate(`/services/${serviceId}`, { replace: true });
          return;
        }

        setInitialForm(apiServiceToForm(data));
      })
      .catch(() => {
        if (!cancelled) showToast('No se pudo cargar el servicio', 'error');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [serviceId, userId, navigate, showToast]);

  const handleSave = async (form: ServiceFormData) => {
    if (!userId || !serviceId) {
      showToast('Debes iniciar sesión', 'error');
      throw new Error('no-auth');
    }

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
      imageUrl = await ensurePersistentImageUrl(userId, imageUrl, uploadServiceProviderImage) || imageUrl;
    }

    if (!imageUrl && !profileImageGalleryImageId && !profileImageGalleryKey) {
      showToast('Debes tener una foto del servicio', 'error');
      throw new Error('no-image');
    }

    const galleryFiles = [
      ...form.gallery.filter((item) => item.file).map((item) => item.file!),
    ];
    const galleryImportImageIds = form.gallery
      .map((item) => item.galleryImageId)
      .filter((id): id is string => Boolean(id));

    const ephemeralUrls = form.gallery
      .filter((item) => !item.file && !item.galleryImageId && (item.url || item.preview))
      .map((item) => item.url || item.preview)
      .filter((url): url is string => Boolean(url && !url.startsWith('blob:')));

    for (const url of ephemeralUrls) {
      try {
        const file = await (await import('@doevents/shared')).galleryImageUrlToFile(url, 'service-gallery.jpg');
        galleryFiles.push(file);
      } catch {
        /* keep persistent url in keptGallery */
      }
    }

    const keptGallery = dedupeMediaUrls(
      form.gallery
        .filter((item) => !item.file && !ephemeralUrls.includes(item.url || item.preview || ''))
        .map(resolveGalleryItemUrl)
        .filter(Boolean),
    ).filter((url) => url !== imageUrl);

    let extraGallery = keptGallery;
    if (galleryFiles.length) {
      const uploaded = await uploadProfileGalleryImages(userId, galleryFiles);
      extraGallery = dedupeMediaUrls([...keptGallery, ...mapUploadedUrls(uploaded)])
        .filter((url) => url !== imageUrl);
    }

    const gallery = dedupeMediaUrls([imageUrl, ...extraGallery]);

    const sector = form.sectors[0] || form.sectorOther || 'Servicio';
    const pricing: Record<string, { cost: string; currency: string }> = {};
    Object.entries(form.activityPricing).forEach(([key, val]) => {
      if (val?.cost) pricing[key] = { cost: val.cost, currency: val.currency || 'COP' };
    });

    const activityList = form.sectors.flatMap((s) => form.activities[s] || []).join(', ');
    const description = form.pricingDetails?.[0]?.description
      || form.faqs?.find((f) => f.answer)?.answer
      || `Servicios de ${sector}: ${activityList || 'varias actividades'}`;

    await updateServiceProvider(serviceId, userId, {
      name: sector,
      category: sector,
      role: sector,
      description,
      ...(profileImageGalleryImageId || profileImageGalleryKey
        ? { profileImageGalleryImageId, profileImageGalleryKey }
        : { profileImageUrl: imageUrl }),
      gallery,
      galleryImportImageIds,
      sectors: form.sectors,
      activities: form.activities,
      pricing,
      latitude: form.latitude,
      longitude: form.longitude,
      city: form.locationCity,
    });

    invalidateServicesCache();
    showToast('Servicio actualizado', 'success');
    invalidateServicesCache();
    await finishPublishAndGoToFeed(serviceId, {
      title: sector,
      onNavigate: (state) => navigate('/', { replace: true, state }),
    });
  };

  const handleBack = (form?: ServiceFormData) => {
    if (!initialForm) {
      navigate(`/services/${serviceId}`);
      return;
    }
    void confirmLeaveWithSave({
      dirty: form ? isJsonDifferent(form, initialForm) : false,
      onLeave: () => navigate(`/services/${serviceId}`),
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
