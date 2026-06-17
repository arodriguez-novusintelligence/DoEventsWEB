import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  canEditEntity,
  fetchEventDetail,
  invalidateEventsCache,
  invalidateDiscoverCache,
  Loader,
  RootState,
  updateEvent,
  useToast,
} from '@doevents/shared';
import type { EventFormData } from '@lovable/data/eventFormData';
import CreateEventView from '@lovable/components/events/CreateEventView';
import { eventDetailToFormData } from '../lovable-bridge/eventEditBridge';
import { syncEventMediaFromForm } from '../lovable-bridge/createEventBridge';
import { finishPublishAndGoToFeed } from '../lovable-bridge/feedPublishBridge';
import { confirmLeaveWithSave, isJsonDifferent } from '../lib/leaveConfirm';

export const EventEditPage: React.FC = () => {
  const { eventId = '' } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<EventFormData | null>(null);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const detail = await fetchEventDetail(eventId);
        const event = detail?.event;
        if (!event) throw new Error('Evento no encontrado');

        const coAdmins = event.coAdminIds || [];
        if (!canEditEntity(userId, event.userId, coAdmins)) {
          showToast('No tienes permiso para editar este evento', 'error');
          navigate(`/events/${eventId}`, { replace: true });
          return;
        }

        if (!cancelled) {
          const formData = await eventDetailToFormData(detail, detail.images || []);
          setInitialData(formData);
        }
      } catch (err) {
        if (!cancelled) {
          showToast(err instanceof Error ? err.message : 'No se pudo cargar el evento', 'error');
          navigate(-1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [eventId, userId, navigate, showToast]);

  const handleSave = async (data: EventFormData): Promise<string> => {
    if (!userId || !eventId) throw new Error('Sesión inválida');
    await updateEvent(eventId, {
      nombre: data.name,
      descripcion: data.description,
      fechaIni: data.startDate,
      fechaFin: data.endDate,
      horaIni: data.startTime,
      horaFin: data.endTime,
      aforo: data.capacity,
      ciudad: data.location.detectedCity || data.location.customAddress || '',
      direccion: data.location.customAddress || data.location.customName || '',
      skipVenue: true,
    }, userId);
    await syncEventMediaFromForm(eventId, data, userId);
    invalidateEventsCache();
    invalidateDiscoverCache();
    return eventId;
  };

  if (loading || !initialData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <CreateEventView
      mode="edit"
      headerTitle="Editar evento"
      publishLabel="Guardar cambios"
      initialData={initialData}
      initialStep={7}
      onBack={(formData) => {
        const dirty = isJsonDifferent(formData, initialData);
        void confirmLeaveWithSave({
          dirty,
          onLeave: () => navigate(`/events/${eventId}`),
        });
      }}
      onPublish={handleSave}
      onPublished={() => {
        void finishPublishAndGoToFeed(eventId, {
          onNavigate: (state) => {
            showToast('Evento actualizado en el Feed', 'success');
            navigate('/', { replace: true, state });
          },
        });
      }}
    />
  );
};

export default EventEditPage;
