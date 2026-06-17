import type { PublishRentalPlaceInput } from '@doevents/shared';
import { facilidadesDetailed } from '@lovable/data/facilidadesOptions';
import type { PlaceFormData } from '@lovable/data/placeData';

const facilityLabelById = Object.fromEntries(
  facilidadesDetailed.map((f) => [f.id, f.label]),
);

export function facilityLabels(form: PlaceFormData): string[] {
  return form.facilities
    .map((f) => {
      const label = facilityLabelById[f.id];
      if (!label) return '';
      return f.count > 1 ? `${label} (×${f.count})` : label;
    })
    .filter(Boolean);
}

export function mergedFeatureLabels(form: PlaceFormData): string[] {
  const fromFacilities = facilityLabels(form);
  const fromEvents = form.allowedEventTypes;
  const fromAccessibility = form.accessibility;
  const fromSecurity = form.security;
  return [...new Set([
    ...form.features,
    ...fromFacilities,
    ...fromEvents,
    ...fromAccessibility,
    ...fromSecurity,
  ])];
}

export function placeFormToPublishInput(
  form: PlaceFormData,
  extras: {
    ownerUserId: string;
    images?: PublishRentalPlaceInput['images'];
    imageUrls?: string[];
    galleryImageImports?: PublishRentalPlaceInput['galleryImageImports'];
    videos?: string[];
    status?: 'active' | 'draft';
  },
): PublishRentalPlaceInput {
  const placeType = form.placeType === 'Otro' ? form.placeTypeOther : form.placeType;
  const capacity = form.hasSeating
    ? form.floors.reduce(
      (sum, floor) => sum + floor.categories.reduce(
        (cSum, cat) => cSum + (cat.seats?.length || cat.rows * cat.seatsPerRow || 0),
        0,
      ),
      0,
    )
    : Number(form.capacity) || 0;

  return {
    name: form.name.trim(),
    ownerUserId: extras.ownerUserId,
    hasSeating: form.hasSeating,
    capacity: capacity || 100,
    placeType,
    address: form.address.trim(),
    city: form.city.trim(),
    department: form.department.trim(),
    country: form.country,
    description: form.description.trim(),
    latitude: form.latitude ? Number(form.latitude) : null,
    longitude: form.longitude ? Number(form.longitude) : null,
    parking: form.hasParking,
    features: mergedFeatureLabels(form),
    facilities: form.facilities,
    allowedEventTypes: form.allowedEventTypes,
    accessibility: form.accessibility,
    security: form.security,
    hostRole: form.hostRole,
    faqs: form.faqs.filter((f) => f.question.trim()),
    neighborhood: form.neighborhood.trim(),
    pricing: form.pricing,
    videos: extras.videos,
    images: extras.images,
    imageUrls: extras.imageUrls,
    galleryImageImports: extras.galleryImageImports,
    selectedDates: form.selectedDates,
    blockedDates: form.blockedDates,
    globalStartTime: form.globalStartTime,
    globalEndTime: form.globalEndTime,
    bookingPreference: form.bookingPreference,
    refundPolicy: form.refundPolicy,
    directions: form.directions.trim(),
    nearbyReferences: form.nearbyReferencesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, type, distance] = line.split('|').map((part) => part.trim());
        return {
          name: name || line,
          type: type || 'Punto de referencia',
          distance: distance || '—',
        };
      }),
    addonServices: form.addonServices
      .filter((s) => s.name.trim())
      .map((s) => ({
        id: s.id,
        name: s.name.trim(),
        description: (s.description || s.name).trim(),
        price: Math.round(Number(s.price) || 0),
        unit: (s.unit === 'día' || s.unit === 'dia') ? 'día' as const : 'evento' as const,
      })),
    gates: form.gates,
    floors: form.floors,
    status: extras.status,
  };
}
