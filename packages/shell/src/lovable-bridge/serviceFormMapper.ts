import {
  dedupeMediaUrls,
  normalizeMediaUrl,
  resolveDisplayLocation,
  resolveImageUrl,
  type NearbyServiceProvider,
} from '@doevents/shared';
import type { ServiceFormData } from '@lovable/data/servicesData';
import { initialFormData } from '@lovable/data/servicesData';
function mapActivityPricing(service: NearbyServiceProvider) {
  const sector = service.sectors?.[0] || service.category || service.role || 'Servicio';
  const pricing: ServiceFormData['activityPricing'] = {};

  Object.entries(service.pricing || {}).forEach(([key, val]) => {
    const entry = {
      cost: String(val?.cost ?? ''),
      currency: val?.currency || service.currency || 'COP',
      pricingType: 'por evento',
      description: '',
    };
    pricing[key] = entry;
    if (!key.includes('::')) {
      pricing[`${sector}::${key}`] = entry;
    }
  });

  return pricing;
}

function mapGallery(service: NearbyServiceProvider, cover?: string) {
  const coverKey = cover ? normalizeMediaUrl(cover) : '';
  const seen = new Set<string>();
  const urls = (service.gallery || [])
    .map((url) => resolveImageUrl(url) || url)
    .filter((url) => {
      if (!url) return false;
      const key = normalizeMediaUrl(url);
      if (coverKey && key === coverKey) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return urls.map((url, i) => ({
    id: `g-${i}`,
    preview: url,
    url,
    kind: 'image' as const,
  }));
}

export function buildServiceApiPayload(
  form: ServiceFormData,
  userId: string,
  options: {
    profileImageUrl?: string;
    profileImageGalleryImageId?: string;
    profileImageGalleryKey?: string;
    galleryUrls: string[];
  },
) {
  const sector = form.sectors[0] || form.sectorOther || 'Servicio';
  const activityList = form.sectors.flatMap((s) => form.activities[s] || []);
  const primaryActivity = activityList[0] || '';
  const pricing: Record<string, { cost: string; currency: string }> = {};
  Object.entries(form.activityPricing).forEach(([key, val]) => {
    if (val?.cost) pricing[key] = { cost: val.cost, currency: val.currency || 'COP' };
  });
  const description = form.pricingDetails?.[0]?.description
    || form.faqs?.find((f) => f.answer)?.answer
    || `Servicios de ${sector}: ${activityList.join(', ') || 'varias actividades'}`;
  const city = resolveDisplayLocation({
    city: form.locationCity,
    label: form.locationLabel,
    locationLabel: form.locationLabel,
  });

  return {
    userId,
    name: primaryActivity || sector,
    category: sector,
    role: primaryActivity || sector,
    description,
    ...(options.profileImageGalleryImageId || options.profileImageGalleryKey
      ? {
          profileImageGalleryImageId: options.profileImageGalleryImageId,
          profileImageGalleryKey: options.profileImageGalleryKey,
          profileImageUrl: options.profileImageUrl,
        }
      : { profileImageUrl: options.profileImageUrl }),
    gallery: dedupeMediaUrls([
      ...(options.profileImageUrl ? [options.profileImageUrl] : []),
      ...options.galleryUrls.filter(Boolean),
    ]),
    galleryImportImageIds: form.gallery
      .map((item) => item.galleryImageId)
      .filter((id): id is string => Boolean(id)),
    sectors: form.sectors,
    activities: form.activities,
    pricing,
    latitude: form.latitude,
    longitude: form.longitude,
    city: city !== '—' ? city : form.locationCity,
  };
}

export function apiServiceToForm(service: NearbyServiceProvider): ServiceFormData {
  const sector = service.sectors?.[0] || service.category || service.role || 'Servicio';
  const cover = resolveImageUrl(service.profileImageUrl || service.gallery?.[0]);

  return {
    ...initialFormData,
    sectors: service.sectors?.length ? service.sectors : [sector],
    sectorOther: '',
    activities: service.activities || { [sector]: [] },
    activityPricing: mapActivityPricing(service),
    latitude: service.latitude,
    longitude: service.longitude,
    locationCity: service.city,
    locationLabel: resolveDisplayLocation({ city: service.city }),
    refundPolicy: '',
    faqs: [{ question: 'Sobre el servicio', answer: service.description || '' }],
    coverImageUrl: cover,
    coverImagePreview: cover,
    gallery: mapGallery(service, cover),
  };
}

export function serviceDisplayName(service: NearbyServiceProvider): string {
  return service.name || service.sectors?.[0] || service.category || 'Servicio';
}

export function serviceCoverUrl(service: NearbyServiceProvider): string | undefined {
  return resolveImageUrl(service.profileImageUrl || service.gallery?.[0]);
}

function capitalizeLabel(value: string): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Etiqueta legible: "Entretenimiento - Grupo vallenato" */
export function serviceActivityLabel(service: NearbyServiceProvider): string {
  const sectorRaw = service.sectors?.[0] || service.category || service.role || 'Servicio';
  const sector = capitalizeLabel(sectorRaw);
  const activities = Object.values(service.activities || {})
    .flat()
    .map((item) => String(item || '').trim())
    .filter(Boolean);
  const primary = activities[0] || service.role || '';
  if (!primary || primary.toLowerCase() === sectorRaw.toLowerCase()) {
    return sector;
  }
  return `${sector} - ${capitalizeLabel(primary)}`;
}
