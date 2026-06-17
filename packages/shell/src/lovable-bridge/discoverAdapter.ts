import type { FeedEventItem } from '@doevents/shared';
import { mapDiscoverEventBadge, resolveDisplayLocation, resolveEventImageUrl, resolveImageUrl } from '@doevents/shared';

function isVideoMedia(url?: string | null): boolean {
  return Boolean(url && /\.(mp4|mov|webm|m4v|avi)(\?|$)/i.test(url));
}

function resolveEventCover(event: { imagen?: string; video?: string; videoUrl?: string }) {
  const rawVideo = event.video || event.videoUrl;
  const rawImage = event.imagen;
  if (isVideoMedia(rawImage)) {
    return { videoUrl: resolveImageUrl(rawImage), isVideo: true, image: '' };
  }
  if (rawVideo && !isVideoMedia(rawImage)) {
    return {
      videoUrl: resolveImageUrl(rawVideo) || rawVideo,
      isVideo: isVideoMedia(rawVideo),
      image: resolveEventImageUrl(rawImage),
    };
  }
  if (isVideoMedia(rawVideo)) {
    return { videoUrl: resolveImageUrl(rawVideo), isVideo: true, image: resolveEventImageUrl(rawImage) };
  }
  return { image: resolveEventImageUrl(rawImage), isVideo: false, videoUrl: undefined };
}

export interface DiscoverEventItem {
  id: string;
  image: string;
  videoUrl?: string;
  isVideo?: boolean;
  title: string;
  date: string;
  location: string;
  description?: string;
  category?: string;
  status?: string;
}

export interface DiscoverServiceItem {
  id: string;
  userId?: string;
  name: string;
  role: string;
  rating: number;
  handle: string;
  description: string;
  image: string;
}

export function feedEventToDiscoverItem(event: FeedEventItem | {
  id?: string;
  nombre?: string;
  fechaIni?: string;
  fechaFin?: string;
  horaIni?: string;
  horaFin?: string;
  descripcion?: string;
  tipoEvento?: string;
  Categoria?: string;
  estatus?: string;
  imagen?: string;
  direccion?: string;
  ciudad?: string;
}): DiscoverEventItem {
  const raw = event as FeedEventItem & { estatus?: string; fechaFin?: string; horaIni?: string; horaFin?: string };
  const status = mapDiscoverEventBadge({
    estatus: raw.estatus,
    fechaIni: event.fechaIni,
    fechaFin: raw.fechaFin,
    horaIni: raw.horaIni,
    horaFin: raw.horaFin,
  });
  const media = resolveEventCover(event as { imagen?: string; video?: string; videoUrl?: string });
  return {
    id: event.id || '',
    ...media,
    title: event.nombre || 'Evento',
    date: event.fechaIni || '—',
    location: resolveDisplayLocation({
      direccion: event.direccion,
      ciudad: event.ciudad,
      departamento: (event as { departamento?: string }).departamento,
    }),
    description: event.descripcion || event.tipoEvento,
    category: raw.Categoria || event.tipoEvento,
    status,
  };
}

interface SearchUserResult {
  id?: string;
  name?: string;
  nombreCompleto?: string;
  username?: string;
  user?: string;
  imagen?: string;
  fotoPerfilUrl?: string;
}

export function searchUserToServiceItem(user: SearchUserResult, role = 'Profesional'): DiscoverServiceItem {
  const name = user.name || user.nombreCompleto || user.username || 'Profesional';
  const username = user.username || user.user || '';
  return {
    id: user.id || username,
    userId: user.id,
    name,
    role,
    rating: 4.8,
    handle: username ? `@${username}` : '',
    description: `Servicios profesionales de ${name}`,
    image: resolveImageUrl(user.imagen || user.fotoPerfilUrl) || '',
  };
}
