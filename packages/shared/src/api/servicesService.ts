import { getAuthToken, getCurrentEnv } from './client';
import { toUserFacingError } from '../lib/apiError';
import { resolveImageUrl } from '../lib/resolveImageUrl';
import {
  buildNearbyServicesCacheKey,
  cacheNearbyServices,
  cacheUserServices,
  getCachedNearbyServices,
  getCachedUserServicesEntry,
  SERVICES_CACHE_FRESH_MS,
} from '../lib/servicesCache';
import { revalidateOnce } from '../lib/wallCacheRevalidate';

export interface NearbyServiceProvider {
  serviceId: string;
  userId: string;
  coAdminIds?: string[];
  name: string;
  role: string;
  category: string;
  description: string;
  rating: number;
  reviewCount?: number;
  username?: string;
  profileImageUrl?: string;
  profileImageGalleryImageId?: string;
  profileImageGalleryKey?: string;
  gallery?: string[];
  galleryImportImageIds?: string[];
  sectors?: string[];
  activities?: Record<string, string[]>;
  pricing?: Record<string, { cost?: string | number; currency?: string }>;
  minPrice?: number;
  currency?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  providerDisplayName?: string;
  likeCount?: number;
  status?: string;
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

function normalizeServiceGallery(gallery: unknown): string[] {
  if (Array.isArray(gallery)) return gallery.map(String).filter(Boolean);
  if (typeof gallery === 'string' && gallery.trim()) {
    return gallery.trim().split(/\s+/).filter(Boolean);
  }
  return [];
}

function servicesBase(): string {
  const env = getCurrentEnv();
  return env.endpoints.servicesBase || `${env.apiBaseUrl}/services`;
}

export function mapNearbyServicesToVenueAddons(
  services: NearbyServiceProvider[],
): import('../data/venueAddonServices').VenueAddonService[] {
  return services
    .map((service) => {
      const firstPrice = Object.values(service.pricing || {})[0];
      const price = Math.round(Number(service.minPrice || firstPrice?.cost || 0));
      const imageUrl = resolveImageUrl(service.profileImageUrl || service.gallery?.[0]);
      const category = service.category || service.role || '';
      const description = service.description?.trim()
        || (category ? `${category} · Servicio profesional` : 'Servicio publicado en DoEvents');
      return {
        id: service.serviceId,
        name: service.name || service.category || 'Servicio',
        description,
        price: Number.isFinite(price) ? price : 0,
        unit: 'evento' as const,
        imageUrl: imageUrl || undefined,
        distanceKm: service.distanceKm,
      };
    })
    .filter((item) => item.id && item.name);
}

/** Servicios publicados activos: cercanos al lugar primero y el resto del catálogo. */
export async function fetchPublishedServicesForVenue(
  latitude?: number,
  longitude?: number,
  options?: { limit?: number; forceNetwork?: boolean },
): Promise<NearbyServiceProvider[]> {
  const lat = Number.isFinite(latitude) ? Number(latitude) : 4.6097;
  const lng = Number.isFinite(longitude) ? Number(longitude) : -74.0817;
  const limit = Math.min(options?.limit ?? 50, 50);
  return fetchNearbyServices(lat, lng, 10_000, limit, options);
}

/** Busca servicios publicados por nombre, rol, categoría o descripción. */
export async function searchServices(query: string, limit = 40): Promise<NearbyServiceProvider[]> {
  const term = query.trim().toLowerCase();
  if (!term) return [];

  let catalog: NearbyServiceProvider[];
  try {
    catalog = await fetchPublishedServicesForVenue(undefined, undefined, {
      limit: 50,
      forceNetwork: true,
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la búsqueda de servicios'));
  }

  return catalog
    .filter((service) => {
      const haystack = [
        service.name,
        service.role,
        service.category,
        service.description,
        service.username,
        service.providerDisplayName,
        service.city,
        ...(service.sectors || []),
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(term);
    })
    .slice(0, limit);
}

export async function fetchNearbyServices(
  latitude: number,
  longitude: number,
  maxDistanceKm = 25,
  limit = 20,
  options?: { forceNetwork?: boolean },
): Promise<NearbyServiceProvider[]> {
  const cacheKey = buildNearbyServicesCacheKey(latitude, longitude, maxDistanceKm, limit);
  if (!options?.forceNetwork) {
    const cached = getCachedNearbyServices(cacheKey, true);
    if (cached) return cached;
  }

  const { getStoredUserId } = await import('./authService');
  const viewerId = getStoredUserId();
  const response = await fetch(`${servicesBase()}/nearby`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      latitude,
      longitude,
      maxDistanceKm,
      limit,
      viewerId: viewerId || undefined,
      userId: viewerId || undefined,
    }),
  });

  if (!response.ok) {
    throw new Error('No se pudieron cargar los servicios cercanos');
  }

  const body = await response.json() as {
    services?: NearbyServiceProvider[];
    items?: NearbyServiceProvider[];
  };

  const services = (body.services || body.items || [])
    .filter((s) => s.serviceId && !/^sp-\d+$/i.test(s.serviceId))
    .map((s) => {
    const gallery = normalizeServiceGallery(s.gallery);
    const raw = s.profileImageUrl || gallery[0];
    return {
      ...s,
      gallery,
      profileImageUrl: resolveImageUrl(raw) || raw,
    };
  });
  const { filterByOwnerPrivacy } = await import('../lib/privacyVisibility');
  const visible = await filterByOwnerPrivacy(services, (s) => s.userId, viewerId);
  cacheNearbyServices(cacheKey, visible);
  return visible;
}

export async function fetchServicesByUserId(
  userId: string,
  options?: { forceNetwork?: boolean; includeInactive?: boolean },
): Promise<NearbyServiceProvider[]> {
  const cacheKey = options?.includeInactive ? `${userId}:all` : userId;
  const cachedEntry = getCachedUserServicesEntry(cacheKey, true);

  if (cachedEntry && !options?.forceNetwork) {
    const age = Date.now() - cachedEntry.cachedAt;
    if (age >= SERVICES_CACHE_FRESH_MS) {
      void revalidateOnce(`user-services:${cacheKey}`, async () => {
        const fresh = await requestServicesByUserId(userId, options?.includeInactive);
        cacheUserServices(cacheKey, fresh);
      });
    }
    return cachedEntry.data;
  }

  try {
    const services = await requestServicesByUserId(userId, options?.includeInactive);
    cacheUserServices(cacheKey, services);
    return services;
  } catch (err) {
    if (cachedEntry) return cachedEntry.data;
    throw err;
  }
}

async function requestServicesByUserId(
  userId: string,
  includeInactive = false,
): Promise<NearbyServiceProvider[]> {
  const query = includeInactive ? '?includeInactive=true' : '';
  const response = await fetch(
    `${servicesBase()}/users/${encodeURIComponent(userId)}${query}`,
    { headers: authHeaders() },
  );
  if (!response.ok) {
    throw new Error('No se pudieron cargar los servicios del usuario');
  }
  const body = await response.json() as {
    services?: NearbyServiceProvider[];
    items?: NearbyServiceProvider[];
    count?: number;
  };
  return (body.services || body.items || []).map((s) => {
    const gallery = normalizeServiceGallery(s.gallery);
    const raw = s.profileImageUrl || gallery[0];
    return {
      ...s,
      gallery,
      profileImageUrl: resolveImageUrl(raw) || raw,
    };
  });
}

export interface ServiceCategory {
  id: string;
  label: string;
  icon?: string;
}

export async function fetchServiceCategories(): Promise<ServiceCategory[]> {
  const response = await fetch(`${servicesBase()}/categories`, { headers: authHeaders() });
  if (!response.ok) return [];
  const body = await response.json() as { categories?: ServiceCategory[] };
  return body.categories || [];
}

export async function createServiceProvider(input: {
  userId: string;
  name: string;
  category: string;
  role?: string;
  description: string;
  profileImageUrl?: string;
  profileImageGalleryImageId?: string;
  profileImageGalleryKey?: string;
  gallery?: string[];
  galleryImportImageIds?: string[];
  sectors?: string[];
  activities?: Record<string, string[]>;
  pricing?: Record<string, { cost?: string | number; currency?: string }>;
  latitude?: number;
  longitude?: number;
  city?: string;
  username?: string;
}): Promise<NearbyServiceProvider> {
  const response = await fetch(`${servicesBase()}/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const body = await response.json() as { service?: NearbyServiceProvider; error?: string };
  if (!response.ok) throw new Error(body.error || 'No se pudo crear el servicio');
  if (!body.service) throw new Error('Respuesta inválida al crear servicio');
  return {
    ...body.service,
    profileImageUrl: resolveImageUrl(body.service.profileImageUrl) || body.service.profileImageUrl,
  };
}

export async function rateServiceProvider(input: {
  serviceId: string;
  userId: string;
  rating: number;
  comment?: string;
}): Promise<{ rating: number; reviewCount: number }> {
  const response = await fetch(
    `${servicesBase()}/${encodeURIComponent(input.serviceId)}/rate`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input),
    },
  );
  const body = await response.json() as { rating?: number; reviewCount?: number; error?: string };
  if (!response.ok) throw new Error(body.error || 'No se pudo calificar el servicio');
  return { rating: body.rating || input.rating, reviewCount: body.reviewCount || 1 };
}

export async function updateServiceProvider(
  serviceId: string,
  userId: string,
  payload: Partial<{
    name: string;
    description: string;
    role: string;
    category: string;
    profileImageUrl: string;
    profileImageGalleryImageId?: string;
    profileImageGalleryKey?: string;
    gallery: string[];
    galleryImportImageIds?: string[];
    sectors: string[];
    activities: Record<string, string[]>;
    pricing: Record<string, { cost?: string | number; currency?: string }>;
    latitude: number;
    longitude: number;
    city: string;
  }>,
): Promise<NearbyServiceProvider> {
  const response = await fetch(
    `${servicesBase()}/${encodeURIComponent(serviceId)}`,
    {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ userId, ...payload }),
    },
  );
  const body = await response.json() as { service?: NearbyServiceProvider; error?: string };
  if (!response.ok) throw new Error(body.error || 'No se pudo actualizar el servicio');
  if (!body.service) throw new Error('Respuesta inválida al actualizar servicio');
  return {
    ...body.service,
    profileImageUrl: resolveImageUrl(body.service.profileImageUrl) || body.service.profileImageUrl,
  };
}

export async function deleteServiceProvider(serviceId: string, userId: string): Promise<void> {
  const response = await fetch(
    `${servicesBase()}/${encodeURIComponent(serviceId)}`,
    {
      method: 'DELETE',
      headers: authHeaders(),
      body: JSON.stringify({ userId }),
    },
  );
  const body = await response.json() as { error?: string };
  if (!response.ok) {
    throw new Error(body.error || 'No se pudo eliminar el servicio');
  }
}

export async function fetchServiceById(serviceId: string): Promise<NearbyServiceProvider | null> {
  const response = await fetch(
    `${servicesBase()}/${encodeURIComponent(serviceId)}`,
    { headers: authHeaders() },
  );
  if (!response.ok) return null;
  const body = await response.json() as { service?: NearbyServiceProvider };
  const s = body.service;
  if (!s) return null;
  const raw = s.profileImageUrl || s.gallery?.[0];
  return {
    ...s,
    profileImageUrl: resolveImageUrl(raw) || raw,
    gallery: (s.gallery || []).map((url) => resolveImageUrl(url) || url),
  };
}

export async function likeService(
  serviceId: string,
  userId: string,
  like = true,
): Promise<{ liked: boolean; likeCount: number }> {
  const response = await fetch(
    `${servicesBase()}/${encodeURIComponent(serviceId)}/like`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ userId, like }),
    },
  );
  const body = await response.json().catch(() => ({})) as {
    liked?: boolean;
    likeCount?: number;
    error?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(body.error || body.message || 'No se pudo actualizar el me gusta');
  }
  return { liked: Boolean(body.liked), likeCount: Number(body.likeCount || 0) };
}

export async function fetchServiceLikedByUser(
  serviceId: string,
  userId: string,
): Promise<boolean> {
  const response = await fetch(
    `${servicesBase()}/${encodeURIComponent(serviceId)}/like/user/${encodeURIComponent(userId)}`,
    { headers: authHeaders() },
  );
  const body = await response.json().catch(() => ({})) as { liked?: boolean };
  if (!response.ok) return false;
  return Boolean(body.liked);
}

export async function fetchLikedServiceIds(
  userId: string,
  serviceIds: string[],
): Promise<Set<string>> {
  const unique = [...new Set(serviceIds.filter(Boolean))];
  if (!unique.length || !userId) return new Set();
  const results = await Promise.all(
    unique.map(async (id) => {
      const liked = await fetchServiceLikedByUser(id, userId).catch(() => false);
      return liked ? id : null;
    }),
  );
  return new Set(results.filter(Boolean) as string[]);
}
