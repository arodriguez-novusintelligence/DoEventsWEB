import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  canEditEntity,
  EventDetailResponse,
  extractVenueImageUrls,
  fetchEventDetail,
  fetchPublicationById,
  fetchUserById,
  getUserByEmail,
  fetchUserStats,
  getCurrentEnv,
  getVenueById,
  invalidateDiscoverCache,
  invalidateEventsCache,
  isEntityOwner,
  likeEvent,
  Loader,
  publishEvent,
  repostPublication,
  resolveImageUrl,
  resolvePublicationDetailPath,
  RootState,
  useToast,
  dispatchEventFavoriteChanged,
  syncEventFavoriteWithFeedPublications,
} from '@doevents/shared';
import InvitationEventDetailView from '@lovable/components/invitations/InvitationEventDetailView';
import type { InvitationEvent } from '@lovable/data/invitationsData';
import { eventDetailToInvitationEvent, buildMinimalInvitationEvent, type EventDetailViewOptions } from '../lovable-bridge/eventDetailAdapter';
import EventStaffSection, { type HiredServiceRef } from '../components/EventStaffSection';
import EventMediaEditor from '../components/EventMediaEditor';

export interface EventDetailPageProps {
  initialExpanded?: boolean;
}

export const EventDetailPage: React.FC<EventDetailPageProps> = () => {
  const { eventId = '' } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<EventDetailResponse | null>(null);
  const [venueOptions, setVenueOptions] = useState<EventDetailViewOptions['venue']>();
  const [publishing, setPublishing] = useState(false);
  const [liking, setLiking] = useState(false);
  const [hiredStaff, setHiredStaff] = useState<HiredServiceRef[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!eventId) return;
    try {
      const raw = localStorage.getItem(`doevents_event_staff_${eventId}`);
      if (raw) setHiredStaff(JSON.parse(raw) as HiredServiceRef[]);
    } catch { /* ignore */ }
  }, [eventId]);

  const invalidEventId = !eventId || /^pub_/i.test(eventId);

  useEffect(() => {
    if (!eventId || !/^pub_/i.test(eventId)) return;
    let cancelled = false;

    const redirectFromPublication = async () => {
      const publication = await fetchPublicationById(eventId, userId || undefined);
      if (cancelled || !publication) return;
      const targetPath = resolvePublicationDetailPath(publication);
      if (targetPath && targetPath !== `/events/${eventId}`) {
        navigate(targetPath, { replace: true });
      }
    };

    void redirectFromPublication();
    return () => { cancelled = true; };
  }, [eventId, navigate, userId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!eventId || invalidEventId) {
        setDetail(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await fetchEventDetail(eventId);
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (!cancelled) {
          setDetail(null);
          showToast(err instanceof Error ? err.message : 'No se pudo cargar el evento', 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [eventId, invalidEventId, showToast, reloadKey]);

  useEffect(() => {
    const venueId = detail?.event?.venueId;
    if (!venueId) {
      setVenueOptions(undefined);
      return;
    }
    let cancelled = false;
    getVenueById(venueId)
      .then((venue) => {
        if (cancelled) return;
        const images = extractVenueImageUrls(venue as Record<string, unknown>)
          .map((url) => resolveImageUrl(url) || url)
          .filter(Boolean);
        setVenueOptions({
          name: venue.name,
          address: venue.address || undefined,
          images,
          latitude: venue.latitude != null ? Number(venue.latitude) : undefined,
          longitude: venue.longitude != null ? Number(venue.longitude) : undefined,
        });
      })
      .catch(() => {
        if (!cancelled) setVenueOptions(undefined);
      });
    return () => { cancelled = true; };
  }, [detail?.event?.venueId]);

  useEffect(() => {
    if (!detail) return;
    let cancelled = false;

    const enrichPerson = async (
      personKey: 'organizer' | 'host',
      userKey?: string,
      fallbackName?: string,
    ) => {
      const person = detail[personKey];
      let lookupId = person?.id || userKey;
      if (!lookupId && person?.email) {
        const users = await getUserByEmail(person.email).catch(() => []);
        lookupId = users[0]?.id;
      }
      if (!lookupId) return;
      try {
        const [profile, stats] = await Promise.all([
          fetchUserById(lookupId).catch(() => null),
          fetchUserStats(lookupId).catch(() => null),
        ]);
        if (cancelled) return;
        setDetail((prev) => {
          if (!prev) return prev;
          const current = prev[personKey] || { name: fallbackName || 'Usuario' };
          const numberOrUndefined = (value: unknown): number | undefined => {
            const number = Number(value);
            return Number.isFinite(number) ? number : undefined;
          };
          const firstNumber = (...values: unknown[]): number => {
            for (const value of values) {
              const number = numberOrUndefined(value);
              if (number !== undefined) return number;
            }
            return 0;
          };
          const eventsCount = firstNumber(
            current.eventosRealizados,
            stats?.eventosRealizados,
            stats?.eventosFinalizados,
            current.totalEventos,
            stats?.totalEventos,
          );
          const rating = firstNumber(
            current.calificacionPromedio,
            current.calificacion,
            stats?.calificacionPromedio,
            profile?.calificacion,
          );
          const completedEvents = numberOrUndefined(stats?.experienciaEventosRealizados);
          const currentExperience = numberOrUndefined(current.experiencia)
            ?? numberOrUndefined(profile?.experiencia);
          // getUserStats entrega eventos realizados; el detalle usa porcentaje
          // sobre el umbral histórico de 15 eventos.
          const experience = completedEvents !== undefined
            ? Math.min(100, Math.round((completedEvents / 15) * 100))
            : (currentExperience ?? Math.min(100, Math.round((eventsCount / 15) * 100)));
          return {
            ...prev,
            [personKey]: {
              ...current,
              id: current.id || profile?.id || lookupId,
              name: current.name || profile?.nombre || fallbackName || 'Usuario',
              lastName: current.lastName || profile?.apellido,
              fotoPerfilUrl: current.fotoPerfilUrl
                || profile?.imagen,
              calificacion: rating,
              calificacionPromedio: rating,
              eventosRealizados: eventsCount,
              totalEventos: eventsCount,
              experiencia: experience,
            },
          };
        });
      } catch {
        // ignore
      }
    };

    void enrichPerson('organizer', detail.event.userId, detail.event.organizerName);
    void enrichPerson(
      'host',
      detail.host?.id,
      detail.event.anfitrioName,
    );

    return () => { cancelled = true; };
  }, [detail?.event?.id, detail?.event?.userId, detail?.host?.id]);

  const event = detail?.event;
  const isOwner = isEntityOwner(userId, event?.userId);
  const canEdit = canEditEntity(userId, event?.userId, event?.coAdminIds);
  const isDraft = event?.estatus === 'inactivo' || event?.estatus === 'draft';
  const canBuy = event?.estatus === 'activo'
    || event?.estatus === 'ejecucion'
    || event?.estatus === 'en_ejecucion';

  const invitationEvent: InvitationEvent | null = useMemo(() => {
    if (!detail?.event) return null;
    try {
      return eventDetailToInvitationEvent(detail, { venue: venueOptions });
    } catch {
      return buildMinimalInvitationEvent(detail);
    }
  }, [detail, venueOptions]);

  const handlePublish = async () => {
    if (!eventId) return;
    setPublishing(true);
    try {
      await publishEvent(eventId);
      showToast('Evento publicado', 'success');
      setDetail(await fetchEventDetail(eventId));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al publicar', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handleShare = async () => {
    if (!eventId) return;
    const url = `${getCurrentEnv().webBaseUrl}/events/${eventId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: event?.nombre || 'Evento', url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('Enlace copiado al portapapeles', 'success');
      }
    } catch {
      // usuario canceló o falló share nativo
    }
  };

  const handleLike = async () => {
    if (!userId || !eventId) {
      showToast('Inicia sesión para guardar favoritos', 'error');
      return;
    }
    setLiking(true);
    try {
      await likeEvent(userId, eventId);
      await syncEventFavoriteWithFeedPublications(eventId, true, false);
      dispatchEventFavoriteChanged(eventId, true, false);
      showToast('Evento agregado a favoritos', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al marcar favorito', 'error');
    } finally {
      setLiking(false);
    }
  };

  const handleReply = async () => {
    if (!userId) {
      showToast('Inicia sesión para compartir en el Feed', 'error');
      return;
    }
    if (!eventId || !event) return;
    try {
      await repostPublication(eventId, {
        title: '',
        opinion: '',
        visibility: 'PUBLIC',
      });
      showToast('Evento reposteado en tu Feed', 'success');
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo repostear en el Feed';
      if (/reposteaste|already reposted/i.test(message)) {
        showToast('Ya reposteaste este evento', 'error');
        return;
      }
      if (/FEED_REPOST_LIMIT|límite de republicaciones/i.test(message)) {
        showToast('Alcanzaste el límite de republicaciones para este evento', 'error');
        return;
      }
      if (/FEED_REPOST_COOLDOWN|esperar.*día/i.test(message)) {
        showToast(message, 'error');
        return;
      }
      showToast(message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  if (!detail || !event || !invitationEvent) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col px-4 pt-4 pb-24">
        <button type="button" className="text-primary font-medium" onClick={() => navigate(-1)}>
          ← Atrás
        </button>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-base font-semibold text-foreground">
            {invalidEventId ? 'Enlace de evento inválido' : 'Evento no encontrado'}
          </p>
          <p className="text-sm text-muted-foreground">
            {invalidEventId
              ? 'Abre el evento desde el feed o Mis eventos para ver su detalle.'
              : 'No pudimos cargar el detalle. Comprueba tu conexión e inténtalo de nuevo.'}
          </p>
          {!invalidEventId && (
            <button
              type="button"
              className="mt-2 rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Reintentar
            </button>
          )}
          <button
            type="button"
            className="mt-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
            onClick={() => navigate(invalidEventId ? '/' : '/events')}
          >
            {invalidEventId ? 'Ir al feed' : 'Ver eventos'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg pb-52">
      <InvitationEventDetailView
        event={invitationEvent}
        onBack={() => navigate(-1)}
        onChat={() => navigate(`/chat?eventId=${eventId}`)}
        onShare={handleShare}
        onLike={handleLike}
        onReply={handleReply}
        canPurchase={canBuy}
        onPurchase={() => navigate(`/events/${eventId}/checkout`)}
        onPublish={isOwner && isDraft ? handlePublish : undefined}
        publishing={publishing || liking}
        onMapClick={() => {
          navigate(`/map?event=${encodeURIComponent(eventId)}&returnTo=${encodeURIComponent(`/events/${eventId}`)}`);
        }}
        onSuccess={() => showToast('Compra realizada', 'success')}
        contentBottomPadding="pb-0"
        servicesSection={
          <EventStaffSection
            eventId={eventId}
            isOwner={isOwner}
            userId={userId || undefined}
            hired={hiredStaff}
            onHiredChange={setHiredStaff}
          />
        }
      />
      {canEdit && userId && (
        <div className="px-4 pb-4 space-y-4">
          <EventMediaEditor
            eventId={eventId}
            userId={userId}
            onUpdated={() => {
              invalidateDiscoverCache();
              invalidateEventsCache();
              void fetchEventDetail(eventId).then((data) => { if (data) setDetail(data); });
            }}
          />
          <button
            type="button"
            onClick={() => navigate(`/events/${eventId}/edit`)}
            className="w-full rounded-full border border-primary py-3 text-sm font-semibold text-primary"
          >
            Editar evento
          </button>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
