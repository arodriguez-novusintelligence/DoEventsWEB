import type { NearbyServiceProvider } from '@doevents/shared';
import { resolveImageUrl } from '@doevents/shared';
import type { ServiceFormData } from '@lovable/data/servicesData';

export interface ServiceProviderProfile {
  userId: string;
  name: string;
  avatarUrl: string;
  username?: string;
  servicesCount: number;
  rating: number;
  reviewCount: number;
  primaryRole: string;
  services: NearbyServiceProvider[];
}

export function nearbyServiceToFormData(service: NearbyServiceProvider): ServiceFormData {
  const sector = service.category || service.role || 'Servicio';
  const activities = service.activities?.[sector] || [];
  const pricing: ServiceFormData['activityPricing'] = {};
  if (service.pricing) {
    Object.entries(service.pricing).forEach(([key, val]) => {
      if (val?.cost != null) {
        pricing[key] = {
          cost: String(val.cost),
          currency: val.currency || 'COP',
        };
      }
    });
  }
  return {
    sectors: service.sectors?.length ? service.sectors : [sector],
    sectorOther: '',
    activities: service.activities || { [sector]: activities },
    activityPricing: pricing,
    pricingDetails: [],
    faqs: [],
    gallery: (service.gallery || []).map((url, i) => ({
      id: `g-${i}`,
      preview: resolveImageUrl(url) || url,
      url,
      kind: 'image' as const,
    })),
    latitude: service.latitude,
    longitude: service.longitude,
    locationCity: service.city,
    coverImageUrl: service.profileImageUrl || service.gallery?.[0],
    serviceId: service.serviceId,
    userId: service.userId,
    status: service.status,
  } as ServiceFormData & { serviceId?: string; userId?: string; status?: string };
}

export function groupServicesByProvider(
  providers: NearbyServiceProvider[],
): ServiceProviderProfile[] {
  const map = new Map<string, NearbyServiceProvider[]>();

  providers.forEach((p) => {
    const uid = p.userId || p.serviceId;
    if (!uid) return;
    const list = map.get(uid) || [];
    list.push(p);
    map.set(uid, list);
  });

  return [...map.entries()].map(([userId, services]) => {
    const first = services[0];
    const ratings = services.map((s) => s.rating || 0).filter((r) => r > 0);
    const avgRating = ratings.length
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : first.rating || 0;
    const reviewCount = services.reduce((sum, s) => sum + (s.reviewCount || 0), 0);
    const displayName = (first as NearbyServiceProvider & { providerDisplayName?: string }).providerDisplayName
      || first.username
      || first.name;
    return {
      userId,
      name: displayName,
      avatarUrl: resolveImageUrl(first.profileImageUrl || first.gallery?.[0]) || '',
      username: first.username,
      servicesCount: services.length,
      rating: Math.round(avgRating * 10) / 10,
      reviewCount,
      primaryRole: first.role || first.category || 'Servicios',
      services,
    };
  });
}
