import React, { useRef } from 'react';

import { useNavigate } from 'react-router-dom';

import { useSelector } from 'react-redux';

import {

  fileToBase64,

  fetchSubscriptionStatus,

  checkCanPublishPlace,

  invalidateVenuesCache,

  invalidateDiscoverCache,

  invalidateProfileHeaderCache,

  isPlaceholderLocation,

  publishRentalPlace,

  syncVenuePromoCodes,

  updateRentalVenue,

  isEphemeralMediaUrl,

  resolveDisplayLocation,

  RootState,

  useToast,

} from '@doevents/shared';

import MyPlacesView from '@lovable/components/places/MyPlacesView';

import type { PlaceFormData } from '@lovable/data/placeData';

import { initialPlaceFormData } from '@lovable/data/placeData';

import { placeFormToPublishInput } from '@lovable/components/places/placeFormHelpers';

import { finishPublishAndGoToFeed } from '../lovable-bridge/feedPublishBridge';

import { confirmLeaveWithSave, isJsonDifferent } from '../lib/leaveConfirm';

import {

  notifyWizardDraftReminder,

  saveLocalWizardDraft,
  loadLocalWizardDraft,
  clearLocalWizardDraft,
} from '../lib/wizardDraftBridge';

import type { AIEventDraft } from '@doevents/shared';



function buildPlaceFormFromDraft(draft: AIEventDraft): PlaceFormData {

  const base = initialPlaceFormData();

  const loc = draft.locationLabel || draft.city || '';

  const [city, department] = loc.split(',').map((part) => part.trim());

  return {

    ...base,

    name: draft.title || base.name,

    city: city || base.city,

    department: department || base.department,

    placeType: typeof draft.venueType === 'string' ? draft.venueType : base.placeType,

    capacity: draft.capacity ? String(draft.capacity) : base.capacity,

  };

}



async function collectMediaPayload(form: PlaceFormData) {

  const imageFiles = form.media.filter((m) => m.kind === 'image' && m.file).map((m) => m.file!);

  const imageUrls = form.media

    .filter((m) => m.kind === 'image' && m.url && !m.file && !m.galleryImageId)

    .map((m) => m.url!)

    .filter((url) => url && !isEphemeralMediaUrl(url));

  const galleryImageImports = form.media

    .filter((m) => !m.file && m.kind === 'image' && m.galleryImageId)

    .map((m) => ({

      imageId: m.galleryImageId,

      key: m.galleryKey,

      url: m.url || m.preview,

    }));

  const videoFiles = form.media.filter((m) => m.kind === 'video' && m.file).map((m) => m.file!);



  const imagesBase64: Array<{ base64: string; fileName: string }> = [];

  for (const file of imageFiles) {

    imagesBase64.push({ base64: await fileToBase64(file), fileName: file.name });

  }

  const videoUrls: string[] = [];

  for (const file of videoFiles) {

    imagesBase64.push({ base64: await fileToBase64(file), fileName: file.name });

    videoUrls.push(file.name);

  }

  return { imagesBase64, imageUrls, galleryImageImports, videoUrls };

}

function placeMediaExtras(media: Awaited<ReturnType<typeof collectMediaPayload>>) {
  return {
    images: media.imagesBase64.length ? media.imagesBase64 : undefined,
    imageUrls: media.imageUrls.length ? media.imageUrls : undefined,
    galleryImageImports: media.galleryImageImports.length ? media.galleryImageImports : undefined,
    videos: media.videoUrls.length ? media.videoUrls : undefined,
  };
}

function resolveFormAddress(form: PlaceFormData): string {

  const resolvedAddress = resolveDisplayLocation({

    address: form.address,

    direccion: form.address,

    ciudad: form.city,

    departamento: form.department,

    locationLabel: form.locationLabel,

    country: form.country,

  });

  return (!form.address.trim() || isPlaceholderLocation(form.address))

    ? (resolvedAddress !== '—' ? resolvedAddress : form.address.trim())

    : form.address.trim();

}



export const PlacePublishPage: React.FC = () => {

  const navigate = useNavigate();

  const { showToast } = useToast();

  const userId = useSelector((s: RootState) => s.auth.idUser);

  const publishLock = useRef(false);

  const baseline = initialPlaceFormData();

  const [initialForm, setInitialForm] = React.useState<PlaceFormData | undefined>();

  const [persistedVenueId, setPersistedVenueId] = React.useState<string | undefined>();



  React.useEffect(() => {

    try {

      const raw = sessionStorage.getItem('doevents.ai-venue-draft');

      if (!raw) return;

      const draft = JSON.parse(raw) as AIEventDraft;

      setInitialForm(buildPlaceFormFromDraft(draft));

      sessionStorage.removeItem('doevents.ai-venue-draft');

      showToast('Borrador del asistente IA cargado', 'success');

    } catch {

      /* ignore malformed draft */

    }

  }, [showToast]);

  React.useEffect(() => {
    if (!userId || initialForm) return;
    const draft = loadLocalWizardDraft<PlaceFormData | { form: PlaceFormData; venueId?: string }>(userId, 'venue');
    const form = draft && typeof draft === 'object' && 'form' in draft
      ? draft.form
      : (draft as PlaceFormData | null);
    const venueId = draft && typeof draft === 'object' && 'venueId' in draft
      ? draft.venueId
      : undefined;
    if (!form?.name?.trim()) return;
    setInitialForm(form);
    if (venueId) setPersistedVenueId(venueId);
    showToast('Reanudamos tu borrador local de lugar', 'success');
  }, [userId, initialForm, showToast]);



  const savePlaceDraft = async (form: PlaceFormData) => {

    if (!userId || !form.name.trim()) throw new Error('Nombre requerido');

    const media = await collectMediaPayload(form);

    const payload = placeFormToPublishInput(form, {

      ownerUserId: userId,

      ...placeMediaExtras(media),

      status: 'draft',

    });

    payload.address = resolveFormAddress(form);

    if (persistedVenueId) {

      await updateRentalVenue(persistedVenueId, { ...payload, userId, venueId: persistedVenueId });

      return persistedVenueId;

    }

    const result = await publishRentalPlace(payload);

    const venueId = result.venueId || result.id;

    if (!venueId) throw new Error('No se recibió ID del borrador');

    setPersistedVenueId(venueId);

    saveLocalWizardDraft(userId, 'venue', { form, venueId });

    await notifyWizardDraftReminder({

      userId,

      kind: 'venue',

      entityId: venueId,

      title: form.name.trim(),

    });

    return venueId;

  };



  const handlePublished = async (form: PlaceFormData) => {

    if (publishLock.current) return;

    if (!userId) {

      showToast('Debes iniciar sesión', 'error');

      throw new Error('no-auth');

    }

    publishLock.current = true;

    try {

      const sub = await fetchSubscriptionStatus(userId).catch(() => null);

      const check = checkCanPublishPlace(sub?.plan, sub?.platformRole, sub?.usage);

      if (!check.allowed) {

        showToast(check.reason || 'Límite del plan alcanzado', 'error');

        throw new Error(check.reason || 'plan-limit');

      }



      const media = await collectMediaPayload(form);
      const payload = placeFormToPublishInput(form, {
        ownerUserId: userId,
        ...placeMediaExtras(media),
        status: 'active',
      });

      payload.address = resolveFormAddress(form);



      const result = await publishRentalPlace(payload);

      invalidateVenuesCache();
      invalidateDiscoverCache();
      if (userId) invalidateProfileHeaderCache(userId);

      const venueId = result.venueId || result.id;

      if (!venueId) throw new Error('No se recibió el ID del lugar');

      if (media.galleryImageImports.length) {
        try {
          await updateRentalVenue(venueId, { userId, galleryImageImports: media.galleryImageImports });
        } catch {
          showToast('Lugar publicado. Algunas imágenes de galería no se sincronizaron.', 'error');
        }
      }

      if (form.promoCodes?.length) {
        try {
          await syncVenuePromoCodes(venueId, form.promoCodes);
        } catch {
          showToast('Lugar publicado. Los códigos promo no se sincronizaron.', 'error');
        }
      }

      showToast('¡Lugar publicado en el Feed!', 'success');

      if (userId) clearLocalWizardDraft(userId, 'place');

      await finishPublishAndGoToFeed(venueId, {
        title: form.name.trim(),
        kind: 'venue',
        navigate,
      });

    } finally {

      publishLock.current = false;

    }

  };



  const handleBack = (form?: PlaceFormData) => {

    void confirmLeaveWithSave({

      dirty: form ? isJsonDifferent(form, baseline) : false,

      canSaveDraft: Boolean(form?.name?.trim()),

      onSaveDraft: form ? () => savePlaceDraft(form) : undefined,

      onLeave: () => navigate('/'),

    });

  };



  return (

    <MyPlacesView

      onBack={handleBack}

      onSaveDraft={savePlaceDraft}

      initialForm={initialForm}

      onPlacePublished={handlePublished}

    />

  );

};



export default PlacePublishPage;

