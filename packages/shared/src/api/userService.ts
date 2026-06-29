import { getAuthToken, getCurrentEnv } from './client';
import { fetchUserEvents } from './eventsService';
import { resolveImageUrl, appendImageCacheBuster } from '../lib/resolveImageUrl';

export interface UserProfile {
  id?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  phone?: string;
  username?: string;
  imagen?: string;
  coverImageUrl?: string;
  bio?: string;
  likesReceivedCount?: number;
  favoritesReceivedCount?: number;
  plan?: string;
  platformRole?: string;
  accountStatus?: string;
  createDate?: string;
  calificacion?: number;
  experiencia?: number;
  ciudad?: string;
  departamento?: string;
  pais?: string;
  direccion?: string;
  documento?: string;
  tipoDocumento?: string;
  accountType?: 'PERSONAL' | 'COMPANY';
  companyName?: string;
  companyWebsite?: string;
  companyIndustry?: string;
  companyDescription?: string;
  isPublicProfile?: boolean;
}

export interface UserStats {
  calificacionPromedio?: number;
  eventosRealizados?: number;
  eventosFinalizados?: number;
  experienciaEventosRealizados?: number;
  totalEventos?: number;
  totalEventosFavoritos?: number;
  totalPostFavoritos?: number;
  totalPublicaciones?: number;
  totalInvitaciones?: number;
  PerfilesFavoritos?: number;
  LugaresFavoritos?: number;
  Invitados?: number;
  UserPlaces?: number;
  UserServices?: number;
  UserInvitations?: number;
}

export interface ServiceComment {
  id: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  authorName: string;
  eventName?: string;
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

export function formatTenure(createDate?: string): string | null {
  if (!createDate) return null;
  const start = new Date(createDate);
  if (Number.isNaN(start.getTime())) return null;
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 1) return 'Nuevo';
  if (months < 12) return `${months} mes${months === 1 ? '' : 'es'}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (rest === 0) return `${years} año${years === 1 ? '' : 's'}`;
  return `${years} año${years === 1 ? '' : 's'} ${rest} m`;
}

export function getExperienceLabel(eventsCount: number): string {
  if (eventsCount >= 15) return 'Eventos 15+';
  if (eventsCount >= 10) return 'Eventos 10+';
  if (eventsCount >= 5) return 'Eventos 5+';
  if (eventsCount >= 1) return `Eventos ${eventsCount}`;
  return 'Sin eventos';
}

export function getExperienceSegment(eventsCount: number): number {
  if (eventsCount >= 15) return 4;
  if (eventsCount >= 10) return 3;
  if (eventsCount >= 5) return 2;
  if (eventsCount >= 1) return 1;
  return 0;
}

export async function fetchUserById(userId: string): Promise<UserProfile | null> {
  const env = getCurrentEnv();
  try {
    const response = await fetch(`${env.endpoints.getUser}/${encodeURIComponent(userId)}`, {
      headers: authHeaders(),
    });

    if (!response.ok) return null;
    const data = await response.json();
  const raw = (
    (data?.data && typeof data.data === 'object' ? data.data : null)
    || (data?.id || data?.email ? data : null)
  ) as Record<string, string | number | undefined>;

  if (!raw || typeof raw !== 'object') return null;

  let nombre = (raw.name || raw.nombre) as string | undefined;
  let apellido = (raw.lastName || raw.apellido) as string | undefined;
  if (!nombre && !apellido) {
    const userStr = String(raw.user || '').trim();
    if (userStr && !userStr.includes('@')) {
      const parts = userStr.split(/\s+/);
      nombre = parts[0];
      apellido = parts.slice(1).join(' ') || undefined;
    }
  }

  return {
    id: raw.id as string | undefined,
    nombre,
    apellido,
    email: raw.email as string | undefined,
    phone: raw.phone as string | undefined,
    username: (raw.user || raw.username) as string | undefined,
    imagen: appendImageCacheBuster(
      resolveImageUrl(raw.fotoPerfilUrl as string | undefined)
        || resolveImageUrl(
          (raw.fotoPerfilSignedUrl || raw.fotoPerfilUrl || raw.imagen) as string | undefined,
        ),
      (raw.fotoPerfilUpdatedAt || raw.updatedAt) as string | number | undefined,
    ),
    coverImageUrl: appendImageCacheBuster(
      resolveImageUrl(raw.coverImagePublicUrl as string | undefined)
        || resolveImageUrl(
          (raw.profileCover as { key?: string; url?: string } | undefined)?.key
            || (raw.profileCover as { key?: string; url?: string } | undefined)?.url,
        )
        || resolveImageUrl(
          (raw.coverImageSignedUrl || raw.coverImageUrl || raw.coverImagePublicUrl) as string | undefined,
        ),
      (raw.profileCoverUpdatedAt || raw.coverUpdatedAt || raw.updatedAt) as string | number | undefined,
    ),
    bio: (raw.description || raw.bio) as string | undefined,
    likesReceivedCount: Number(raw.likesReceivedCount || 0),
    favoritesReceivedCount: Number(raw.favoritesReceivedCount || 0),
    plan: raw.plan as string | undefined,
    platformRole: (raw.platformRole || raw.role) as string | undefined,
    accountStatus: (raw.accountStatus || raw.status) as string | undefined,
    createDate: raw.createDate as string | undefined,
    calificacion: Number(raw.calificacion || 0),
    experiencia: Number(raw.experiencia || 0),
    ciudad: (raw.ciudad || raw.city) as string | undefined,
    departamento: (raw.departamento || raw.state) as string | undefined,
    pais: (raw.pais || raw.country) as string | undefined,
    direccion: (raw.direccion || raw.address) as string | undefined,
    documento: raw.documento as string | undefined,
    tipoDocumento: (raw.tipoDocumento || raw.documentType) as string | undefined,
    isPublicProfile: raw.isPublicProfile === undefined || raw.isPublicProfile === null
      ? true
      : String(raw.isPublicProfile).toLowerCase() !== 'false',
  };
  } catch {
    return null;
  }
}

export async function fetchUserStats(userId: string): Promise<UserStats | null> {
  const env = getCurrentEnv();
  try {
    const response = await fetch(`${env.endpoints.getUserStats}/${encodeURIComponent(userId)}`, {
      headers: authHeaders(),
    });
    if (!response.ok) return null;
    return await response.json() as UserStats;
  } catch {
    return null;
  }
}

export async function fetchUserServiceComments(userId: string, limit = 20): Promise<ServiceComment[]> {
  const env = getCurrentEnv();
  try {
    const mine = await fetchUserEvents(userId).catch(() => ({ data: { datosEvento: [] } }));
    const events = (mine.data?.datosEvento || []).slice(0, 8);
    const comments: ServiceComment[] = [];

    await Promise.all(
      events.map(async (event) => {
        if (!event.id) return;
        const response = await fetch(
          `${env.endpoints.eventCalifications}/${encodeURIComponent(event.id)}/califications?limit=10`,
          { headers: authHeaders() },
        );
        if (!response.ok) return;
        const body = await response.json() as {
          califications?: Array<{
            id?: string;
            rating?: number;
            comment?: string;
            createdAt?: string;
            user?: { name?: string };
          }>;
        };
        (body.califications || []).forEach((item) => {
          if (!item.comment && !item.rating) return;
          comments.push({
            id: item.id || `${event.id}-${comments.length}`,
            rating: Number(item.rating || 0),
            comment: item.comment,
            createdAt: item.createdAt,
            authorName: item.user?.name || 'Usuario',
            eventName: event.nombre,
          });
        });
      }),
    );

    return comments
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function updateUserPlan(userId: string, plan: 'free' | 'pro'): Promise<void> {
  const env = getCurrentEnv();
  const response = await fetch(env.endpoints.updateUser, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id: userId, plan }),
  });
  const body = await response.json().catch(() => ({})) as { statusDesc?: string; message?: string };
  if (!response.ok) {
    throw new Error(body.statusDesc || body.message || 'No se pudo actualizar el plan');
  }
}

export async function updateProfileVisibility(userId: string, isPublicProfile: boolean): Promise<void> {
  const env = getCurrentEnv();
  const response = await fetch(env.endpoints.updateProfileVisibility, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ id: userId, isPublicProfile }),
  });
  const body = await response.json().catch(() => ({})) as { statusDesc?: string; statusMessage?: string };
  if (!response.ok) {
    throw new Error(body.statusDesc || body.statusMessage || 'No se pudo actualizar la visibilidad');
  }
}

export {
  updateUserProfile,
  uploadProfileAvatar,
  uploadProfileCover,
  fileToBase64,
} from './profileMediaService';
export type { UpdateUserProfileInput } from './profileMediaService';
