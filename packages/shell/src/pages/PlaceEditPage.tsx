import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  canEditEntity,
  extractVenueImageUrls,
  dedupeMediaUrls,
  fileToBase64,
  galleryImageUrlToFile,
  getVenueById,
  invalidateVenuesCache,
  isEphemeralMediaUrl,
  isPlaceholderLocation,
  Loader,
  newWizardId,
  resolveDisplayLocation,
  resolveImageUrl,
  RootState,
  updateRentalVenue,
  updateVenueLayout,
  useToast,
  venueDetailToWizardState,
} from '@doevents/shared';
import type { WizardFloor, WizardGate } from '@doevents/shared';
import MyPlacesView from '@lovable/components/places/MyPlacesView';
import type { PlaceFormData } from '@lovable/data/placeData';
import { initialPlaceFormData } from '@lovable/data/placeData';
import { finishPublishAndGoToFeed } from '../lovable-bridge/feedPublishBridge';
import { confirmLeaveWithSave, isJsonDifferent } from '../lib/leaveConfirm';
import { parseVenueAmenities } from '../lovable-bridge/venuesAdapter';
import { placeFormToPublishInput } from '@lovable/components/places/placeFormHelpers';

function venueToForm(venue: Record<string, unknown>): PlaceFormData {
  const wizard = venueDetailToWizardState(venue as Parameters<typeof venueDetailToWizardState>[0]);
  const meta = parseVenueAmenities(String(venue.amenities || ''));
  const images = extractVenueImageUrls(venue);
  const videos = meta.videos || [];
  const placeType = String(venue.tags || venue.type || '');
  const isKnownType = [
    'Salón de eventos', 'Recinto', 'Salón comunal', 'Finca', 'Chalet', 'Retiro',
    'Teatro', 'Estadio', 'Hotel', 'Restaurante', 'Bodega', 'Casa campestre', 'Otro',
  ].includes(placeType);
  const locationLabel = resolveDisplayLocation({
    address: String(venue.address || ''),
    city: String(venue.city || ''),
    departamento: String(venue.department || ''),
    country: String(venue.country || ''),
  });

  return {
    ...initialPlaceFormData(),
    name: String(venue.name || ''),
    placeType: isKnownType ? placeType : placeType ? 'Otro' : '',
    placeTypeOther: isKnownType ? '' : placeType,
    description: String(venue.description || ''),
    media: [
      ...images.map((url) => ({
        id: newWizardId(),
        preview: resolveImageUrl(url) || url,
        url,
        kind: 'image' as const,
      })),
      ...videos.map((url) => ({
        id: newWizardId(),
        preview: resolveImageUrl(url) || url,
        url,
        kind: 'video' as const,
      })),
    ],
    address: String(venue.address || ''),
    city: String(venue.city || ''),
    department: String(venue.department || ''),
    country: String(venue.country || 'Colombia'),
    latitude: venue.latitude != null ? String(venue.latitude) : '',
    longitude: venue.longitude != null ? String(venue.longitude) : '',
    locationLabel: locationLabel !== '—' ? locationLabel : '',
    hasSeating: wizard.hasSeating,
    floors: wizard.floors,
    gates: wizard.gates,
    capacity: String(venue.capacity || ''),
    hasParking: Boolean(meta.parking),
    features: meta.features || [],
    pricing: {
      perDay: meta.pricing?.perDay || '',
      perMultiDay: meta.pricing?.perMultiDay || '',
      perWeek: meta.pricing?.perWeek || '',
      perMonth: meta.pricing?.perMonth || '',
      currency: meta.pricing?.currency || 'COP',
    },
    selectedDates: meta.availability?.selectedDates || [],
    blockedDates: meta.availability?.blockedDates || [],
    globalStartTime: meta.availability?.globalStartTime || '08:00',
    globalEndTime: meta.availability?.globalEndTime || '22:00',
    bookingPreference: meta.bookingPreference || 'instant',
    refundPolicy: meta.refundPolicy || '',
    directions: meta.directions || '',
    nearbyReferencesText: (meta.nearbyReferences || [])
      .map((r) => [r.name, r.type, r.distance].filter(Boolean).join(' | '))
      .join('\n'),
    neighborhood: meta.neighborhood || '',
    facilities: meta.facilities || [],
    allowedEventTypes: meta.allowedEventTypes || [],
    accessibility: meta.accessibility || [],
    security: meta.security || [],
    hostRole: (meta.hostRole === 'dueno' || meta.hostRole === 'admin') ? meta.hostRole : '',
    addonServices: meta.addonServices || [],
    faqs: (meta.faqs || []).map((f, i) => ({
      id: f.id || `faq-${i}`,
      question: f.question || '',
      answer: f.answer || '',
    })),
    acceptedConditions: true,
  };
}

function seatingLayoutSnapshot(
  hasSeating: boolean,
  floors: WizardFloor[],
  gates: WizardGate[],
): string {
  return JSON.stringify({ hasSeating, floors, gates });
}

function hasReliableSeatingLayout(floors: WizardFloor[]): boolean {
  return floors.some((floor) => floor.categories.length > 0);
}

export const PlaceEditPage: React.FC = () => {
  const { venueId = '' } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [loading, setLoading] = useState(true);
  const [initialForm, setInitialForm] = useState<PlaceFormData | null>(null);
  const [ownerUserId, setOwnerUserId] = useState('');

  useEffect(() => {
    if (!venueId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const venue = await getVenueById(venueId) as Record<string, unknown> & {
          ownerUserId?: string;
          coAdminIds?: string[];
        };
        if (!canEditEntity(userId, venue.ownerUserId, venue.coAdminIds)) {
          showToast('No tienes permiso para editar este lugar', 'error');
          navigate(`/places/${venueId}`, { replace: true });
          return;
        }
        if (!cancelled) {
          setOwnerUserId(String(venue.ownerUserId || ''));
          setInitialForm(venueToForm(venue));
        }
      } catch (err) {
        if (!cancelled) {
          showToast(err instanceof Error ? err.message : 'No se pudo cargar el lugar', 'error');
          navigate(-1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [venueId, userId, navigate, showToast]);

  const handleSave = async (form: PlaceFormData) => {
    if (!userId || !venueId || !initialForm) {
      showToast('Debes iniciar sesión', 'error');
      throw new Error('no-auth');
    }

    const imageFiles = form.media.filter((m) => m.kind === 'image' && m.file).map((m) => m.file!);
    const videoFiles = form.media.filter((m) => m.kind === 'video' && m.file).map((m) => m.file!);
    const existingUrls = form.media
      .filter((m) => !m.file && (m.url || (!m.file && m.preview && !m.preview.startsWith('blob:'))))
      .map((m) => m.url || m.preview)
      .filter((url) => url && !url.startsWith('blob:') && !isEphemeralMediaUrl(url));

    let imageUrls: string[] = dedupeMediaUrls([...new Set(existingUrls)]);
    const imagesBase64: Array<{ base64: string; fileName: string }> = [];
    for (const file of imageFiles) {
      const base64 = await fileToBase64(file);
      imagesBase64.push({ base64, fileName: file.name });
    }
    for (const file of videoFiles) {
      const base64 = await fileToBase64(file);
      imagesBase64.push({ base64, fileName: file.name });
    }

    const galleryImageImports = form.media
      .filter((m) => !m.file && m.kind === 'image' && m.galleryImageId)
      .map((m) => ({
        imageId: m.galleryImageId,
        key: m.galleryKey,
        url: m.url || m.preview,
      }));

    const galleryImports = form.media.filter(
      (m) => !m.file && m.kind === 'image' && (m.url || m.preview) && isEphemeralMediaUrl(m.url || m.preview) && !m.galleryImageId,
    );
    for (const item of galleryImports) {
      try {
        const file = await galleryImageUrlToFile(item.url || item.preview, 'venue-image.jpg');
        imagesBase64.push({ base64: await fileToBase64(file), fileName: file.name });
      } catch {
        /* skip broken gallery import */
      }
    }

    const preservedImageUrls = imageUrls.length
      ? imageUrls
      : initialForm.media.map((m) => m.url).filter(Boolean) as string[];

    const listing = placeFormToPublishInput(form, {
      ownerUserId: userId,
      images: imagesBase64.length ? imagesBase64 : undefined,
      imageUrls: preservedImageUrls.length ? preservedImageUrls : undefined,
      galleryImageImports: galleryImageImports.length ? galleryImageImports : undefined,
    });
    const {
      ownerUserId: _owner, gates: _g, floors: _f, status: _s, ...updatePayload
    } = listing;

    const resolvedAddress = resolveDisplayLocation({
      address: form.address,
      direccion: form.address,
      ciudad: form.city,
      departamento: form.department,
      locationLabel: form.locationLabel,
      country: form.country,
    });
    updatePayload.address = (!form.address.trim() || isPlaceholderLocation(form.address))
      ? (resolvedAddress !== '—' ? resolvedAddress : form.address.trim())
      : form.address.trim();

    await updateRentalVenue(venueId, { userId, ...updatePayload });

    const layoutChanged = seatingLayoutSnapshot(form.hasSeating, form.floors, form.gates)
      !== seatingLayoutSnapshot(initialForm.hasSeating, initialForm.floors, initialForm.gates);
    const canUpdateLayout = form.hasSeating
      && layoutChanged
      && hasReliableSeatingLayout(initialForm.floors);

    if (canUpdateLayout) {
      await updateVenueLayout(venueId, {
        userId,
        hasSeating: form.hasSeating,
        floors: form.floors,
        gates: form.gates,
      });
    }

    invalidateVenuesCache();
    showToast('Lugar actualizado', 'success');
    invalidateVenuesCache();
    await finishPublishAndGoToFeed(venueId, {
      title: form.name.trim(),
      onNavigate: (state) => navigate('/', { replace: true, state }),
    });
  };

  const handleBack = (form?: PlaceFormData) => {
    if (!initialForm) {
      navigate(`/places/${venueId}`);
      return;
    }
    void confirmLeaveWithSave({
      dirty: form ? isJsonDifferent(form, initialForm) : false,
      onLeave: () => navigate(`/places/${venueId}`),
    });
  };

  if (loading || !initialForm) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <MyPlacesView
      onBack={handleBack}
      onPlacePublished={handleSave}
      initialForm={initialForm}
      mode="edit"
      headerTitle="Editar lugar"
      submitLabel="Guardar cambios"
      ownerUserId={ownerUserId}
    />
  );
};

export default PlaceEditPage;
