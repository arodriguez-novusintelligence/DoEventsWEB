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
  useToast,
} from '@doevents/shared';
import type { EventFormData } from '@lovable/data/eventFormData';
import CreateEventView from '@lovable/components/events/CreateEventView';
import { eventDetailToFormData } from '../lovable-bridge/eventEditBridge';
import { updateLovableEventFromEdit } from '../lovable-bridge/createEventBridge';
import { isAccessControlDirty } from '../lovable-bridge/eventLocationDirty';
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
    if (!userId || !eventId || !initialData) throw new Error('Sesión inválida');
    const accessDirty = isAccessControlDirty(data.accessControl, initialData.accessControl);
    const { eventId: savedId } = await updateLovableEventFromEdit(
      eventId,
      data,
      userId,
      {
        skipVenueSync: false,
        includeLayoutUpdate: true,
        persistStaffAccess: accessDirty || Object.values(data.accessControl || {}).some((ids) => ids?.length),
      },
    );
    invalidateEventsCache();
    invalidateDiscoverCache();
    setInitialData(data);
    return savedId;
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
      initialStep={2}
      userId={userId || undefined}
      onBack={(formData) => {
        const dirty = isJsonDifferent(formData, initialData);
        void confirmLeaveWithSave({
          dirty,
          onLeave: () => navigate(`/events/${eventId}`),
        });
      }}
      onPublish={handleSave}
      onPublished={() => {
        showToast('Evento actualizado', 'success');
        navigate(`/events/${eventId}`, { replace: true });
      }}
    />
  );
};

export default EventEditPage;
