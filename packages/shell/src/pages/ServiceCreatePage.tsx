import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  createServiceProvider,
  dedupeMediaUrls,
  ensurePersistentImageUrl,
  fetchSubscriptionStatus,
  checkCanPublishService,
  fetchUserById,
  getStoredUserLocation,
  resolveDisplayLocation,
  resolveImageUrl,
  RootState,
  uploadServiceProviderImage,
  uploadProfileGalleryImages,
  useToast,
} from '@doevents/shared';
import MyServicesView from '@lovable/components/services/MyServicesView';
import type { ServiceFormData } from '@lovable/data/servicesData';
import { initialFormData } from '@lovable/data/servicesData';
import { finishPublishAndGoToFeed } from '../lovable-bridge/feedPublishBridge';
import { confirmLeaveWithSave, isJsonDifferent } from '../lib/leaveConfirm';
import { saveLocalWizardDraft } from '../lib/wizardDraftBridge';
import type { AIEventDraft } from '@doevents/shared';

function buildServiceFormFromDraft(draft: AIEventDraft): ServiceFormData {
  const sector = draft.sector || draft.categories?.[0] || 'Catering';
  const rawActivity = draft.keywords?.[0] || draft.role || 'chef';
  const activity = rawActivity.charAt(0).toUpperCase() + rawActivity.slice(1);
  const activityKey = `${sector}::${activity}`;
  const location = draft.locationLabel || draft.city || '';
  return {
    ...initialFormData,
    locationCity: location.split(',')[0]?.trim() || location,
    locationLabel: location,
    sectors: [sector],
    activities: { [sector]: [activity] },
    ...(draft.price ? {
      activityPricing: {
        [activityKey]: { cost: String(draft.price), currency: 'COP' },
      },
    } : {}),
  };
}

function formToApiPayload(
  form: ServiceFormData,
  userId: string,
  profileImageUrl: string | undefined,
  galleryUrls: string[],
) {
  const stored = getStoredUserLocation();
  const loc = form.latitude != null && form.longitude != null
    ? { lat: form.latitude, lng: form.longitude, city: form.locationCity }
    : stored;
  const sector = form.sectors[0] || form.sectorOther || 'Servicio';
  const pricing: Record<string, { cost: string; currency: string }> = {};
  Object.entries(form.activityPricing).forEach(([key, val]) => {
    if (val?.cost) pricing[key] = { cost: val.cost, currency: val.currency || 'COP' };
  });
  const activityList = form.sectors.flatMap((s) => form.activities[s] || []).join(', ');
  const description = form.pricingDetails?.[0]?.description
    || form.faqs?.find((f) => f.answer)?.answer
    || `Servicios de ${sector}: ${activityList || 'varias actividades'}`;

  const city = resolveDisplayLocation({
    city: form.locationCity || loc?.city,
    label: form.locationLabel,
    locationLabel: form.locationLabel,
  });

  return {
    userId,
    name: sector,
    category: sector,
    role: sector,
    description,
    ...(form.coverGalleryImageId || form.coverGalleryKey
      ? {
          profileImageGalleryImageId: form.coverGalleryImageId,
          profileImageGalleryKey: form.coverGalleryKey,
        }
      : { profileImageUrl }),
    gallery: dedupeMediaUrls([...(profileImageUrl ? [profileImageUrl] : []), ...galleryUrls.filter(Boolean)]),
    galleryImportImageIds: form.gallery
      .map((item) => item.galleryImageId)
      .filter((id): id is string => Boolean(id)),
    sectors: form.sectors,
    activities: form.activities,
    pricing,
    latitude: loc?.lat,
    longitude: loc?.lng,
    city: city !== '—' ? city : loc?.city,
  };
}

export const ServiceCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const publishLock = useRef(false);
  const [profileImageUrl, setProfileImageUrl] = React.useState<string | undefined>();
  const [initialForm, setInitialForm] = React.useState<ServiceFormData | undefined>();

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('doevents.ai-service-draft');
      if (!raw) return;
      const draft = JSON.parse(raw) as AIEventDraft;
      setInitialForm(buildServiceFormFromDraft(draft));
      sessionStorage.removeItem('doevents.ai-service-draft');
      showToast('Borrador del asistente IA cargado', 'success');
    } catch {
      /* ignore malformed draft */
    }
  }, [showToast]);

  React.useEffect(() => {
    if (!userId) return;
    fetchUserById(userId)
      .then((user) => {
        const url = resolveImageUrl(user?.imagen || user?.fotoPerfilUrl);
        if (url) setProfileImageUrl(url);
      })
      .catch(() => undefined);
  }, [userId]);

  const handlePublished = async (form: ServiceFormData) => {
    if (publishLock.current) return;
    if (!userId) {
      showToast('Debes iniciar sesión', 'error');
      throw new Error('no-auth');
    }
    publishLock.current = true;
    try {
      const sub = await fetchSubscriptionStatus(userId).catch(() => null);
      const check = checkCanPublishService(sub?.plan, sub?.platformRole, sub?.usage);
      if (!check.allowed) {
        showToast(check.reason || 'Límite del plan alcanzado', 'error');
        throw new Error(check.reason || 'plan-limit');
      }

      let imageUrl = form.coverImageUrl;
      if (form.coverImageFile) {
        imageUrl = await uploadServiceProviderImage(userId, form.coverImageFile);
      } else if (!form.coverGalleryImageId && !form.coverGalleryKey && imageUrl) {
        imageUrl = await ensurePersistentImageUrl(userId, imageUrl, uploadServiceProviderImage) || imageUrl;
      }

      if (!imageUrl && !form.coverGalleryImageId && !form.coverGalleryKey) {
        showToast('Debes subir una foto del servicio', 'error');
        throw new Error('no-image');
      }

      const galleryFiles = form.gallery.filter((g) => g.file).map((g) => g.file!);
      const keptGalleryUrls = dedupeMediaUrls(
        form.gallery
          .filter((g) => !g.galleryImageId)
          .map((g) => g.url || g.preview)
          .filter((url) => url && !url.startsWith('blob:')),
      );
      let galleryUrls: string[] = keptGalleryUrls;
      if (galleryFiles.length) {
        const uploaded = await uploadProfileGalleryImages(userId, galleryFiles);
        galleryUrls = dedupeMediaUrls([
          ...keptGalleryUrls,
          ...uploaded.map((u) => u.url || u.publicUrl || '').filter(Boolean),
        ]);
      }

      const service = await createServiceProvider(formToApiPayload(form, userId, imageUrl, galleryUrls));
      showToast('¡Servicio publicado en el Feed!', 'success');
      await finishPublishAndGoToFeed(service.serviceId, {
        title: form.sectors[0] || form.sectorOther || 'Servicio',
        onNavigate: (state) => navigate('/', { replace: true, state }),
      });
    } finally {
      publishLock.current = false;
    }
  };

  const handleBack = (form: ServiceFormData) => {
    void confirmLeaveWithSave({
      dirty: isJsonDifferent(form, initialForm ?? initialFormData),
      canSaveDraft: Boolean(form.sectors.length),
      onSaveDraft: async () => {
        if (!userId) throw new Error('no-auth');
        saveLocalWizardDraft(userId, 'service', form);
      },
      onLeave: () => navigate('/'),
    });
  };

  return (
    <MyServicesView
      onBack={handleBack}
      defaultProfileImageUrl={profileImageUrl}
      initialForm={initialForm}
      onServicePublished={handlePublished}
    />
  );
};

export default ServiceCreatePage;
