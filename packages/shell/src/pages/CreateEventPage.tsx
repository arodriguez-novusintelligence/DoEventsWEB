import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  fetchEventDetail,
  Loader,
  RootState,
  useToast,
  type AIEventDraft,
} from '@doevents/shared';
import type { EventFormData } from '@lovable/data/eventFormData';
import { initialEventFormData } from '@lovable/data/eventFormData';
import CreateEventView from '@lovable/components/events/CreateEventView';
import { publishLovableEvent, saveLovableEventDraft } from '../lovable-bridge/createEventBridge';
import { applyVenueToEventLocation } from '../lovable-bridge/eventVenueBridge';
import { finishPublishAndGoToFeed } from '../lovable-bridge/feedPublishBridge';
import { confirmLeaveWithSave, isJsonDifferent } from '../lib/leaveConfirm';
import {
  clearLocalWizardDraft,
  notifyWizardDraftReminder,
  saveLocalWizardDraft,
} from '../lib/wizardDraftBridge';
import { eventDetailToFormData } from '../lovable-bridge/eventEditBridge';

function parseDraftDateHint(hint?: string): { startDate?: string; startTime?: string } {
  if (!hint) return {};
  const lower = hint.toLowerCase();
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (/mañana|manana/.test(lower)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return { startDate: toIso(d) };
  }
  if (/hoy/.test(lower)) return { startDate: toIso(today) };

  const iso = hint.match(/(\d{4}-\d{2}-\d{2})/);
  if (iso) return { startDate: iso[1] };

  const time = hint.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.?\s*m\.?|p\.?\s*m\.?)?/i);
  if (time) {
    let hour = Number(time[1]);
    const minutes = time[2] ? Number(time[2]) : 0;
    const mer = (time[3] || '').toLowerCase();
    if (mer.startsWith('p') && hour < 12) hour += 12;
    if (mer.startsWith('a') && hour === 12) hour = 0;
    return { startTime: `${pad(hour)}:${pad(minutes)}` };
  }
  return {};
}

function buildFormFromDraft(draft: AIEventDraft): Partial<EventFormData> {
  const dates = parseDraftDateHint(draft.dateHint);
  const serviceNames = (draft.services || []).map((s) => s.name).filter(Boolean);
  const descriptionParts = [
    draft.summary,
    serviceNames.length ? `Servicios sugeridos: ${serviceNames.join(', ')}` : '',
    draft.timeHint ? `Horario: ${draft.timeHint}` : '',
  ].filter(Boolean);

  return {
    name: draft.title || initialEventFormData.name,
    description: descriptionParts.join('\n'),
    capacity: draft.capacity ? String(draft.capacity) : initialEventFormData.capacity,
    startDate: dates.startDate || initialEventFormData.startDate,
    startTime: draft.timeHint || dates.startTime || initialEventFormData.startTime,
    eventClass: draft.isPrivate ? 'private' : initialEventFormData.eventClass,
    tags: serviceNames.filter(Boolean).slice(0, 5) as string[],
    location: {
      ...initialEventFormData.location,
      detectedCity: draft.city || initialEventFormData.location.detectedCity,
      selectedVenueId: draft.venueId || draft.venue?.id || initialEventFormData.location.selectedVenueId,
      mode: (draft.venueId || draft.venue?.id) ? 'mine' : initialEventFormData.location.mode,
      venueOwnership: (draft.venueId || draft.venue?.id) ? 'thirdParty' : initialEventFormData.location.venueOwnership,
    },
  };
}

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const venueIdParam = searchParams.get('venueId');
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const resumeEventId = searchParams.get('resume');
  const [publishing, setPublishing] = useState(false);
  const publishLock = useRef(false);
  const [initialData, setInitialData] = useState<EventFormData | null>(
    venueIdParam ? null : initialEventFormData,
  );
  const [initialStep, setInitialStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | undefined>(undefined);
  const draftLoaded = useRef(false);

  useEffect(() => {
    if (venueIdParam || draftLoaded.current) return;
    try {
      const raw = sessionStorage.getItem('doevents.ai-event-draft');
      if (!raw) return;
      draftLoaded.current = true;
      const draft = JSON.parse(raw) as AIEventDraft;
      const patch = buildFormFromDraft(draft);
      const targetVenueId = draft.venueId || draft.venue?.id;

      if (targetVenueId) {
        applyVenueToEventLocation(String(targetVenueId), 'thirdParty')
          .then((locationPatch) => {
            setInitialData({
              ...initialEventFormData,
              ...patch,
              location: {
                ...initialEventFormData.location,
                ...patch.location,
                ...locationPatch,
                mode: 'mine',
                venueOwnership: 'thirdParty',
                selectedVenueId: String(targetVenueId),
              },
            });
            setInitialStep(2);
            sessionStorage.removeItem('doevents.ai-event-draft');
            showToast('Borrador del asistente IA cargado', 'success');
          })
          .catch(() => {
            setInitialData({ ...initialEventFormData, ...patch } as EventFormData);
            setInitialStep(1);
            sessionStorage.removeItem('doevents.ai-event-draft');
            showToast('Borrador cargado (revisa la ubicación)', 'success');
          });
        return;
      }

      sessionStorage.removeItem('doevents.ai-event-draft');
      setInitialData({ ...initialEventFormData, ...patch } as EventFormData);
      setInitialStep(1);
      showToast('Borrador del asistente IA cargado', 'success');
    } catch {
      /* ignore malformed draft */
    }
  }, [venueIdParam, showToast]);

  useEffect(() => {
    if (venueIdParam || draftLoaded.current || resumeEventId) return;
    if (!userId) return;
    try {
      const raw = localStorage.getItem(`doevents.wizard-draft.event.${userId}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { data?: EventFormData };
      if (!parsed.data?.name?.trim()) return;
      draftLoaded.current = true;
      setInitialData({
        ...initialEventFormData,
        ...parsed.data,
        persistedEventId: parsed.data.persistedEventId,
      });
      if (parsed.data.wizardStep) {
        setInitialStep(Math.min(7, Math.max(1, parsed.data.wizardStep)) as 1 | 2 | 3 | 4 | 5 | 6 | 7);
      }
      showToast('Reanudamos tu borrador local de evento', 'success');
    } catch { /* ignore */ }
  }, [userId, venueIdParam, resumeEventId, showToast]);

  useEffect(() => {
    if (!resumeEventId || draftLoaded.current) return;
    draftLoaded.current = true;
    let cancelled = false;
    fetchEventDetail(resumeEventId)
      .then(async (detail) => {
        if (cancelled || !detail?.event) return;
        const form = await eventDetailToFormData(detail, detail.images || []);
        setInitialData({
          ...form,
          persistedEventId: resumeEventId,
        });
        showToast('Borrador de evento cargado', 'success');
      })
      .catch(() => {
        if (!cancelled) showToast('No se pudo cargar el borrador', 'error');
      });
    return () => { cancelled = true; };
  }, [resumeEventId, showToast]);

  const handleDraftSave = async (formData: EventFormData): Promise<string> => {
    if (!userId) throw new Error('no-auth');
    const eventId = await saveLovableEventDraft(
      { ...formData, persistedEventId: formData.persistedEventId },
      userId,
    );
    saveLocalWizardDraft(userId, 'event', { ...formData, persistedEventId: eventId });
    setInitialData((prev) => (prev ? { ...prev, ...formData, persistedEventId: eventId } : prev));
    await notifyWizardDraftReminder({
      userId,
      kind: 'event',
      entityId: eventId,
      title: formData.name.trim(),
    });
    return eventId;
  };

  useEffect(() => {
    if (!venueIdParam) return;
    let cancelled = false;
    applyVenueToEventLocation(venueIdParam, 'own')
      .then((locationPatch) => {
        if (cancelled) return;
        setInitialData({
          ...initialEventFormData,
          location: {
            ...initialEventFormData.location,
            ...locationPatch,
            mode: 'mine',
            venueOwnership: 'own',
          },
        });
        setInitialStep(2);
      })
      .catch((err) => {
        if (!cancelled) {
          showToast(err instanceof Error ? err.message : 'No se pudo cargar el lugar', 'error');
          setInitialData(initialEventFormData);
        }
      });
    return () => { cancelled = true; };
  }, [venueIdParam, showToast]);

  const handlePublish = async (data: EventFormData): Promise<string | void> => {
    if (!userId) {
      showToast('Debes iniciar sesión para crear eventos', 'error');
      navigate('/auth/login');
      return;
    }
    if (publishLock.current || publishing) return;
    publishLock.current = true;
    setPublishing(true);
    try {
      const eventId = await publishLovableEvent(
        { ...data, persistedEventId: data.persistedEventId },
        userId,
      );
      if (userId) clearLocalWizardDraft(userId, 'event');
      return eventId;
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al publicar el evento', 'error');
      throw err;
    } finally {
      publishLock.current = false;
      setPublishing(false);
    }
  };

  const handleBack = (formData: EventFormData) => {
    const dirty = isJsonDifferent(formData, initialData ?? initialEventFormData);
    const canSaveDraft = Boolean(formData.name?.trim());
    void confirmLeaveWithSave({
      dirty,
      canSaveDraft,
      onSaveDraft: async () => {
        if (!userId) throw new Error('no-auth');
        await saveLovableEventDraft({ ...formData, persistedEventId: formData.persistedEventId }, userId);
        showToast('Borrador guardado en Mis Eventos', 'success');
      },
      onLeave: () => navigate('/'),
    });
  };

  if (!initialData) {
    return (
      <div className="de-page-content flex min-h-[50vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <>
      {publishing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="flex items-center rounded-2xl bg-card px-6 py-4 shadow-xl">
            <Loader />
            <p className="ml-3 text-sm text-muted-foreground">Publicando evento…</p>
          </div>
        </div>
      )}
      <CreateEventView
        onBack={handleBack}
        onDraftSaved={handleDraftSave}
        onPublish={handlePublish}
        onPublished={(eventId) => {
          void finishPublishAndGoToFeed(eventId, {
            onNavigate: () => {
              showToast('¡Evento publicado!', 'success');
              navigate(`/events/published?eventId=${eventId}`, { replace: true });
            },
          });
        }}
        initialData={initialData}
        initialStep={initialStep}
      />
    </>
  );
};

export default CreateEventPage;
