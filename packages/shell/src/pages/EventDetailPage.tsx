import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  buildMapUrl,
  canEditEntity,
  EventDetailResponse,
  extractVenueImageUrls,
  fetchEventDetail,
  fetchUserById,
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
  RootState,
  useToast,
  dispatchEventFavoriteChanged,
  syncEventFavoriteWithFeedPublications,
} from '@doevents/shared';
import InvitationEventDetailView from '@lovable/components/invitations/InvitationEventDetailView';
import type { InvitationEvent } from '@lovable/data/invitationsData';
import { eventDetailToInvitationEvent, type EventDetailViewOptions } from '../lovable-bridge/eventDetailAdapter';
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

  useEffect(() => {
    if (!eventId) return;
    try {
      const raw = localStorage.getItem(`doevents_event_staff_${eventId}`);
      if (raw) setHiredStaff(JSON.parse(raw) as HiredServiceRef[]);
    } catch { /* ignore */ }
  }, [eventId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchEventDetail(eventId);
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (!cancelled) {
          showToast(err instanceof Error ? err.message : 'No se pudo cargar el evento', 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (eventId) load();
    return () => { cancelled = true; };
  }, [eventId, showToast]);

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
        });
      })
      .catch(() => {
        if (!cancelled) setVenueOptions(undefined);
      });
    return () => { cancelled = true; };
  }, [detail?.event?.venueId]);

  useEffect(() => {
    if (!detail) return;
    const enrichPerson = async (
      personKey: 'organizer' | 'host',
      userKey?: string,
      fallbackEmail?: string,
    ) => {
      const person = detail[personKey];
      if (person?.fotoPerfilUrl) return;
      const lookupId = person?.id || userKey;
      if (!lookupId) return;
      try {
        const profile = await fetchUserById(lookupId);
        if (!profile?.imagen) return;
        setDetail((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            [personKey]: {
              ...(prev[personKey] || { name: fallbackEmail || 'Usuario' }),
              id: prev[personKey]?.id || lookupId,
              fotoPerfilUrl: resolveImageUrl(profile.imagen),
              name: prev[personKey]?.name || profile.nombre,
              lastName: prev[personKey]?.lastName || profile.apellido,
            },
          };
        });
      } catch {
        // ignore
      }
    };

    void enrichPerson('organizer', detail.event.userId, detail.event.organizerName);
    void enrichPerson('host', detail.host?.id, detail.event.emailAnf);
  }, [detail?.event?.id, detail?.event?.userId, detail?.host?.id, detail?.organizer?.fotoPerfilUrl, detail?.host?.fotoPerfilUrl]);

  const event = detail?.event;
  const mapUrl = event ? buildMapUrl(event) : null;
  const isOwner = isEntityOwner(userId, event?.userId);
  const canEdit = canEditEntity(userId, event?.userId, event?.coAdminIds);
  const isDraft = event?.estatus === 'inactivo' || event?.estatus === 'draft';
  const canBuy = event?.estatus === 'activo'
    || event?.estatus === 'ejecucion'
    || event?.estatus === 'en_ejecucion';

  const invitationEvent: InvitationEvent | null = useMemo(
    () => (detail ? eventDetailToInvitationEvent(detail, { venue: venueOptions }) : null),
    [detail, venueOptions],
  );

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
      <div className="mx-auto max-w-lg px-4 pt-4 pb-24">
        <button type="button" className="text-primary font-medium" onClick={() => navigate(-1)}>
          ← Atrás
        </button>
        <p className="mt-6 text-center text-muted-foreground">Evento no encontrado.</p>
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
          if (mapUrl) window.open(mapUrl, '_blank', 'noopener,noreferrer');
          else navigate('/map');
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
