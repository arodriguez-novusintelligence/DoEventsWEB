import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import { EventFormData, initialEventFormData } from '@lovable/data/eventFormData';
import StepEventDetails from './StepEventDetails';
import StepEventLocation from './StepEventLocation';
import StepAccessControl from './StepAccessControl';
import StepRefundPolicy from './StepRefundPolicy';
import StepFaqs from './StepFaqs';
import StepAgenda from './StepAgenda';
import StepEventSummary from './StepEventSummary';
import EventPreviewModal from './EventPreviewModal';
import PublishFlowModal from './PublishFlowModal';
import { toast } from 'sonner';

interface CreateEventViewProps {
  onBack: (formData: EventFormData) => void;
  onCreated?: (data: EventFormData) => void;
  onPublish?: (data: EventFormData) => Promise<string | void>;
  onPublished?: (eventId: string) => void;
  onDraftSaved?: (formData: EventFormData) => void | Promise<string | void>;
  initialData?: EventFormData;
  initialStep?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  mode?: 'create' | 'edit';
  headerTitle?: string;
  publishLabel?: string;
}

type StepNum = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const STEPS: { num: StepNum; label: string }[] = [
  { num: 1, label: 'Detalles' },
  { num: 2, label: 'Lugar' },
  { num: 3, label: 'Accesos' },
  { num: 4, label: 'Reembolsos' },
  { num: 5, label: 'FAQs' },
  { num: 6, label: 'Agenda' },
  { num: 7, label: 'Resumen' },
];

const CreateEventView = ({
  onBack,
  onCreated,
  onPublish,
  onPublished,
  onDraftSaved,
  initialData,
  initialStep,
  mode = 'create',
  headerTitle,
  publishLabel,
}: CreateEventViewProps) => {
  const [currentStep, setCurrentStep] = useState<StepNum>(initialStep ?? 1);
  const [formData, setFormData] = useState<EventFormData>(initialData ?? initialEventFormData);
  const [showErrors, setShowErrors] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPublishFlow, setShowPublishFlow] = useState(false);
  const [publishedEventId, setPublishedEventId] = useState<string>('');
  const [publishing, setPublishing] = useState(false);
  const publishLock = useRef(false);
  const [editingFromSummary, setEditingFromSummary] = useState(false);
  const autosaveLock = useRef(false);

  const tryAutosave = useCallback(async (data: EventFormData, step: StepNum) => {
    if (!onDraftSaved || !data.name?.trim() || autosaveLock.current) return;
    autosaveLock.current = true;
    try {
      const eventId = await onDraftSaved({ ...data, wizardStep: step });
      if (eventId) updateForm({ persistedEventId: eventId });
    } finally {
      autosaveLock.current = false;
    }
  }, [onDraftSaved]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (formData.name?.trim()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [formData.name]);


  const updateForm = (
    partial: Partial<EventFormData> | ((prev: EventFormData) => Partial<EventFormData>),
  ) =>
    setFormData((prev) => ({
      ...prev,
      ...(typeof partial === 'function' ? partial(prev) : partial),
    }));

  const isStep1Valid = () =>
    !!(
      formData.name.trim() &&
      formData.description.trim() &&
      formData.type.trim() &&
      formData.category.trim() &&
      formData.capacity.trim() &&
      formData.startDate.trim() &&
      formData.startTime.trim() &&
      formData.endDate.trim() &&
      formData.endTime.trim()
    );

  const isStep2Valid = () => {
    const l = formData.location;
    if (l.mode === 'mine') {
      return !!l.selectedVenueId || !!l.selectedTemplateId;
    }
    const locOk = !!(l.customName?.trim() && l.customType && l.customLat);
    const ticketingOk = !!l.ticketingType;
    const gatesOk =
      l.ticketingType === 'with-seating' ? (l.gates?.length ?? 0) > 0 : true;
    const mapOk =
      l.ticketingType !== 'with-seating'
      || (l.seatingMap?.figures?.some((f) => f.role === 'category') ?? false);
    return locOk && ticketingOk && gatesOk && mapOk;
  };

  const isStep3Valid = () => {
    const gates = formData.location.gates ?? [];
    if (gates.length === 0) return true;
    const ac = formData.accessControl ?? {};
    return gates.every((g) => (ac[g.id]?.length ?? 0) > 0);
  };

  const isStep4Valid = () => !!formData.refundPolicy;

  const handleContinue = () => {
    if (editingFromSummary) {
      setShowErrors(false);
      setEditingFromSummary(false);
      setCurrentStep(7);
      onCreated?.(formData);
      toast('Cambios guardados');
      return;
    }
    if (currentStep === 1) {
      if (!isStep1Valid()) {
        setShowErrors(true);
        toast('Completa los campos obligatorios para continuar.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setShowErrors(false);
      setCurrentStep(2);
      onCreated?.(formData);
      void tryAutosave(formData, 2);
      return;
    }
    if (currentStep === 2) {
      if (!isStep2Valid()) {
        setShowErrors(true);
        toast('Completa la información del lugar para continuar.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setShowErrors(false);
      setCurrentStep(3);
      void tryAutosave(formData, 3);
      return;
    }
    if (currentStep === 3) {
      if (!isStep3Valid()) {
        setShowErrors(true);
        toast('Asigna al menos una persona por puerta para continuar.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setShowErrors(false);
      setCurrentStep(4);
      void tryAutosave(formData, 4);
      return;
    }
    if (currentStep === 4) {
      if (!isStep4Valid()) {
        setShowErrors(true);
        toast('Selecciona una política de reembolso para continuar.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setShowErrors(false);
      setCurrentStep(5);
      void tryAutosave(formData, 5);
      return;
    }
    if (currentStep === 5) {
      setCurrentStep(6);
      void tryAutosave(formData, 6);
      return;
    }
    if (currentStep === 6) {
      setCurrentStep(7);
      void tryAutosave(formData, 7);
      return;
    }
  };

  const handleHeaderBack = () => {
    if (currentStep === 1 && !editingFromSummary) {
      onBack(formData);
    } else if (editingFromSummary) {
      setShowErrors(false);
      setEditingFromSummary(false);
      setCurrentStep(7);
    } else {
      setShowErrors(false);
      setCurrentStep((currentStep - 1) as StepNum);
    }
  };

  const continueLabel = editingFromSummary
    ? 'Guardar y volver al resumen'
    : currentStep === 5 || currentStep === 6
      ? 'Continuar'
      : 'Guardar y Continuar';

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-secondary pb-32">
      {/* Header — debajo del TopHeader global (menú hamburguesa) */}
      <div className="sticky top-0 z-10 bg-secondary px-4 pb-3 pt-2">
        <button
          onClick={handleHeaderBack}
          className="flex items-center gap-1 text-sm font-medium text-primary"
        >
          <ChevronLeft className="h-4 w-4" /> Volver
        </button>

        {/* Stepper */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto rounded-full bg-card p-1.5 shadow-sm">
          {STEPS.map((s) => {
            const active = currentStep === s.num;
            const completed = currentStep > s.num;
            return (
              <div
                key={s.num}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : completed
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground'
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                    active
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : completed
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {completed ? '✓' : s.num}
                </span>
                <span className="whitespace-nowrap">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-2">
        {currentStep === 1 && (
          <StepEventDetails
            formData={formData}
            updateForm={updateForm}
            showErrors={showErrors}
          />
        )}
        {currentStep === 2 && (
          <StepEventLocation
            formData={formData}
            updateForm={updateForm}
            showErrors={showErrors}
          />
        )}
        {currentStep === 3 && (
          <StepAccessControl formData={formData} updateForm={updateForm} />
        )}
        {currentStep === 4 && (
          <StepRefundPolicy
            formData={formData}
            updateForm={updateForm}
            showErrors={showErrors}
          />
        )}
        {currentStep === 5 && (
          <StepFaqs formData={formData} updateForm={updateForm} />
        )}
        {currentStep === 6 && (
          <StepAgenda formData={formData} updateForm={updateForm} />
        )}
        {currentStep === 7 && (
          <StepEventSummary
            formData={formData}
            onEdit={(step) => { setEditingFromSummary(true); setCurrentStep(step as StepNum); }}
            onSave={() => {
              void tryAutosave(formData, 7);
              toast('Borrador guardado');
            }}
            onPreview={() => setShowPreview(true)}
            onPublish={async () => {
              if (!onPublish || publishing || publishLock.current) return;
              publishLock.current = true;
              setPublishing(true);
              try {
                const eventId = await onPublish({ ...formData, wizardStep: 7 });
                if (eventId) {
                  setPublishedEventId(eventId);
                  updateForm({ persistedEventId: eventId });
                  if (mode === 'edit') {
                    onPublished?.(eventId);
                  } else {
                    setShowPublishFlow(true);
                  }
                }
              } catch {
                toast.error(mode === 'edit' ? 'No se pudo guardar el evento' : 'No se pudo publicar el evento');
              } finally {
                publishLock.current = false;
                setPublishing(false);
              }
            }}
            publishing={publishing}
            publishLabel={publishLabel || (mode === 'edit' ? 'Guardar cambios' : 'Publicar')}
          />
        )}

        <PublishFlowModal
          open={showPublishFlow}
          eventId={publishedEventId}
          onClose={() => setShowPublishFlow(false)}
          onFinalize={() => {
            toast.success('¡Evento publicado!');
            if (publishedEventId) onPublished?.(publishedEventId);
            else onBack(formData);
          }}
        />

        {/* Footer CTA — inline at end of content */}
        {currentStep < 7 && (
          <div className="mt-6 pb-6">
            <Button
              onClick={handleContinue}
              className="w-full rounded-full py-6 text-base font-bold shadow-lg"
            >
              {continueLabel}
            </Button>
          </div>
        )}
      </div>

      <EventPreviewModal open={showPreview} onClose={() => setShowPreview(false)} data={formData} />
    </div>
  );
};

export default CreateEventView;
