import type { EventDetailResponse, EventPersonInfo } from '@doevents/shared';

import {

  getPersonDisplayName,

  resolveDisplayEventStatus,

  resolveDisplayLocation,

  resolveImageUrl,

} from '@doevents/shared';

import type { AgendaDay, InvitationEvent, InvitationPerson } from '@lovable/data/invitationsData';



export interface EventDetailViewOptions {

  venue?: {

    name?: string;

    address?: string;

    images?: string[];

  };

}



function initialsFromName(name: string): string {

  return name

    .split(' ')

    .filter(Boolean)

    .map((part) => part[0])

    .join('')

    .slice(0, 2)

    .toUpperCase() || 'DE';

}



function mapPerson(

  person: EventPersonInfo | null | undefined,

  fallbackName: string,

): InvitationPerson {

  const name = getPersonDisplayName(person, fallbackName);

  const avatar = resolveImageUrl(person?.fotoPerfilUrl) || '';

  return {
    name,
    avatar,
    initials: avatar ? undefined : initialsFromName(name),
    rating: Math.min(5, Math.round(person?.calificacionPromedio || person?.calificacion || 0)),
    eventsCount: person?.eventosRealizados || person?.totalEventos || 0,
    experiencePct: Math.round(person?.experiencia || 0),
    userId: person?.id,
  };
}



function refundPolicyText(event: EventDetailResponse['event']): string {

  const policy = event.policies?.find((p) => /reembolso/i.test(p.title || ''));

  if (policy?.description) return policy.description;

  const cat = event.categoriaReembolso;

  if (cat === 'N') return 'Sin reembolsos';

  if (cat === '30') return 'Hasta 30 días antes del inicio del evento.';

  if (cat === '7') return 'Hasta 7 días antes del inicio del evento.';

  if (cat === '1') return 'Hasta 1 día antes del inicio del inicio del evento.';

  return 'Consulta la política de reembolsos del evento.';

}



function formatTimeLabel(value?: string, fallback?: string): string {

  if (fallback?.trim()) return fallback.trim();

  if (!value) return '—';

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {

    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  }

  return value;

}



function mapFromEventDays(detail: EventDetailResponse): AgendaDay[] {

  const days = detail.event.eventDays || [];

  return days.map((day, index) => {

    const date = day.date ? new Date(day.date) : null;

    const dateLabel = date && !Number.isNaN(date.getTime())

      ? date.toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long' })

      : '';

    return {

      dayLabel: day.dayName || `Día ${index + 1}`,

      dateLabel,

      items: (day.activities || []).map((activity) => ({

        startTime: formatTimeLabel(activity.startTime, activity.startTimeDisplay),

        endTime: formatTimeLabel(activity.endTime, activity.endTimeDisplay),

        title: activity.description || 'Actividad',

        responsible: activity.responsible?.displayName

          || activity.responsible?.nombre

          || activity.responsible?.name

          || '—',

      })),

    };

  }).filter((day) => day.items.length > 0);

}



function mapFromItinerary(detail: EventDetailResponse): AgendaDay[] {

  const itinerary = detail.event.itinerary || [];

  if (!itinerary.length) return [];

  return [{

    dayLabel: 'Día 1',

    dateLabel: detail.event.fechaIni || '',

    items: itinerary.map((item) => ({

      startTime: item.time || '—',

      endTime: item.time || '—',

      title: item.title || item.description || 'Actividad',

      responsible: '—',

    })),

  }];

}



function mapAgenda(detail: EventDetailResponse): AgendaDay[] {

  const fromDays = mapFromEventDays(detail);

  if (fromDays.length) return fromDays;

  return mapFromItinerary(detail);

}



function youtubeThumbnailFromUrl(videoUrl?: string): string | undefined {
  const match = videoUrl?.trim().match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i,
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : undefined;
}

function normalizeVideoUrl(video?: string): string | undefined {

  if (!video?.trim()) return undefined;

  const value = video.trim();

  if (/^https?:\/\//i.test(value)) return value;

  if (/^(www\.)?youtube\.com|youtu\.be/i.test(value)) {

    return value.startsWith('http') ? value : `https://${value}`;

  }

  return value;

}



function mapEventState(ev: EventDetailResponse['event']): InvitationEvent['state'] {

  const status = resolveDisplayEventStatus({

    estatus: ev.estatus,

    fechaIni: ev.fechaIni,

    fechaFin: ev.fechaFin,

    horaIni: ev.horaIni,

    horaFin: ev.horaFin,

  });

  return status === 'activo' ? 'activo' : 'inactivo';

}



function ubicacionAsLabel(ubicacion: EventDetailResponse['event']['ubicacion']): string | undefined {
  if (!ubicacion) return undefined;
  if (typeof ubicacion === 'string') return ubicacion;
  return undefined;
}



export function eventDetailToInvitationEvent(

  detail: EventDetailResponse,

  options?: EventDetailViewOptions,

): InvitationEvent {

  const ev = detail.event;

  let images = (detail.images || [])
    .map((url) => resolveImageUrl(url))
    .filter((url): url is string => Boolean(url));

  if (!images.length) {
    const videoThumb = youtubeThumbnailFromUrl(ev.video);
    if (videoThumb) images = [videoThumb];
  }

  const mainImage = images[0] || '';

  const ubicacionLabel = ubicacionAsLabel(ev.ubicacion);

  const venueAddress = options?.venue?.address || resolveDisplayLocation({

    direccion: ev.direccion,

    ciudad: ev.ciudad,

    departamento: ev.departamento,

    pais: ev.pais,

    ubicacion: ubicacionLabel,

    label: ubicacionLabel,

    locationLabel: ubicacionLabel,

  });



  return {

    id: ev.id,

    title: ev.nombre,

    receivedAt: new Date().toISOString(),

    inviter: '',

    status: 'aceptada',

    image: mainImage,

    images: images.length ? images : (mainImage ? [mainImage] : []),

    state: mapEventState(ev),

    startDate: ev.fechaIni || '—',

    endDate: ev.fechaFin || ev.fechaIni || '—',

    startTime: ev.horaIni || '—',

    endTime: ev.horaFin || '—',

    category: detail.category?.preference_name_es

      || detail.category?.Category_ES

      || '—',

    eventClass: ev.clase || detail.eventType?.EventType_ES || '—',

    capacity: Number(ev.aforo || ev.avaliableCapacity || 0),

    venueType: detail.placeType?.PlaceType_ES || ev.tipoLugar || '—',

    description: ev.descripcion || '',

    agenda: mapAgenda(detail) || [],

    venue: {

      name: options?.venue?.name || ev.direccion || ev.ciudad || ev.nombre || 'Lugar del evento',

      address: venueAddress,

      images: options?.venue?.images || [],

    },

    videoUrl: normalizeVideoUrl(ev.video),

    organizer: {
      ...mapPerson(detail.organizer, ev.organizerName || 'Organizador'),
      userId: detail.organizer?.id || ev.userId,
    },

    host: {
      ...mapPerson(detail.host, ev.anfitrioName || 'Anfitrión'),
      userId: detail.host?.id,
    },

    refundPolicy: refundPolicyText(ev),

  };

}

