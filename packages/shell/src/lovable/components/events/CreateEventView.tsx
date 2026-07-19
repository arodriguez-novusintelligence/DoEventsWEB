import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, CalendarDays, Loader2 } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import {
  EventFormData,
  initialEventFormData,
  isRefundPolicyConfigured,
  REFUND_POLICY_REQUIRED_MESSAGE,
} from '@lovable/data/eventFormData';
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
import { isPulepFormValid } from '@lovable/lib/pulepColombia';
import { isEventEndBeforeStart, isSalesWindowInvalid, SALES_AFTER_EVENT_MESSAGE } from '@lovable/lib/eventDateValidation';
import type { SeatingFigure } from '@lovable/data/eventFormData';
import { saveLocalWizardDraft } from '../../../lib/wizardDraftBridge';
import { getPersistedPlatformRole } from '@doevents/shared';

interface CreateEventViewProps {
  onBack: (formData: EventFormData) => void;
  onCreated?: (data: EventFormData) => void;
  onPublish?: (data: EventFormData) => Promise<string | void>;
  onPublished?: (eventId: string) => void;
  onDraftSaved?: (formData: EventFormData) => void | Promise<string | void>;
  initialData?: EventFormData;
  initialStep?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  userId?: string;
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
  userId,
  mode = 'create',
  headerTitle,
  publishLabel,
}: CreateEventViewProps) => {
  const [currentStep, setCurrentStep] = useState<StepNum>(initialStep ?? 1);
  const [formData, setFormData] = useState<EventFormData>(initialData ?? initialEventFormData);
  const [showErrors, setShowErrors] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!initialData || hydratedRef.current) return;
    hydratedRef.current = true;
    setFormData(initialData);
    if (initialStep) setCurrentStep(initialStep);
  }, [initialData, initialStep]);

  useEffect(() => {
    if (!userId || mode === 'edit' || !formData.name?.trim()) return;
    const timer = window.setTimeout(() => {
      saveLocalWizardDraft(userId, 'event', { ...formData, wizardStep: currentStep });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [formData, userId, currentStep, mode]);
  const [showPreview, setShowPreview] = useState(false);
  const [showPublishFlow, setShowPublishFlow] = useState(false);
  const [publishedEventId, setPublishedEventId] = useState<string>('');
  const [publishing, setPublishing] = useState(false);
  const publishLock = useRef(false);
  const [editingFromSummary, setEditingFromSummary] = useState(false);
  const autosaveLock = useRef(false);

  const tryAutosave = useCallback(async (data: EventFormData, step: StepNum): Promise<boolean> => {
    if (!data.name?.trim() || autosaveLock.current) return false;
    autosaveLock.current = true;
    try {
      if (mode === 'edit' && onPublish) {
        await onPublish({ ...data, wizardStep: step });
        return true;
      }
      if (!onDraftSaved) return false;
      const eventId = await onDraftSaved({ ...data, wizardStep: step });
      if (eventId) updateForm({ persistedEventId: eventId });
      return true;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : (mode === 'edit' ? 'No se pudo guardar el evento' : 'No se pudo guardar el borrador del evento'),
      );
      return false;
    } finally {
      autosaveLock.current = false;
    }
  }, [mode, onDraftSaved, onPublish]);

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


  useEffect(() => {
    if (!userId) return;
    setFormData((prev) => (
      prev.ownerUserId === userId ? prev : { ...prev, ownerUserId: userId }
    ));
  }, [userId]);

  const updateForm = (
    partial: Partial<EventFormData> | ((prev: EventFormData) => Partial<EventFormData>),
  ) =>
    setFormData((prev) => ({
      ...prev,
      ...(typeof partial === 'function' ? partial(prev) : partial),
    }));

  const isStep1Valid = () => {
    const datesOk = !isEventEndBeforeStart(
      formData.startDate,
      formData.startTime,
      formData.endDate,
      formData.endTime,
    );
    return !!(
      formData.name.trim() &&
      formData.description.trim() &&
      formData.type.trim() &&
      formData.category.trim() &&
      formData.capacity.trim() &&
      formData.startDate.trim() &&
      formData.startTime.trim() &&
      formData.endDate.trim() &&
      formData.endTime.trim() &&
      datesOk &&
      isPulepFormValid(formData)
    );
  };

  const seatingCategoriesMissingPrice = (figures: SeatingFigure[] = []) =>
    figures.filter(
      (f) =>
        f.role === 'category'
        && f.priceEnabled !== false
        && (!f.price || f.price <= 0),
    );

  const isStep2Valid = () => {
    const l = formData.location;
    if (l.mode === 'mine') {
      return !!l.selectedVenueId || !!l.selectedTemplateId;
    }
    const locOk = !!(
      l.customName?.trim()
      && l.customType
      && l.detectedCity?.trim()
      && l.customLat
    );
    const ticketingOk = !!l.ticketingType;
    const gatesOk =
      l.ticketingType === 'with-seating' ? (l.gates?.length ?? 0) > 0 : true;
    const categoriesOk =
      l.ticketingType === 'only-tickets'
        ? (l.ticketCategories?.length ?? 0) > 0
          && (l.ticketCategories ?? []).every(
            (c) => c.name.trim() && c.quantity > 0 && (!c.hasPrice || c.price > 0),
          )
        : true;
    const mapOk =
      l.ticketingType !== 'with-seating'
      || (l.seatingMap?.figures?.some((f) => f.role === 'category') ?? false);
    const pricesOk =
      l.ticketingType !== 'with-seating'
      || seatingCategoriesMissingPrice(l.seatingMap?.figures).length === 0;
    return locOk && ticketingOk && gatesOk && mapOk && pricesOk && categoriesOk;
  };

  const isStep3Valid = () => {
    const gates = formData.location.gates ?? [];
    if (gates.length === 0) return true;
    const ac = formData.accessControl ?? {};
    return gates.every((g) => (ac[g.id]?.length ?? 0) > 0);
  };

  const scrollWizardToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollWizardToTop();
  }, [currentStep, scrollWizardToTop]);

  const isStep4Valid = () =>
    isRefundPolicyConfigured(formData) && !isSalesWindowInvalid(formData);

  const handleContinue = () => {
    if (editingFromSummary) {
      const stepValidators: Partial<Record<StepNum, () => boolean>> = {
        1: isStep1Valid,
        2: isStep2Valid,
        3: isStep3Valid,
        4: isStep4Valid,
      };
      const validate = stepValidators[currentStep];
      if (validate && !validate()) {
        setShowErrors(true);
        const missingPrices = seatingCategoriesMissingPrice(formData.location.seatingMap?.figures);
        const onlyTickets = formData.location.ticketingType === 'only-tickets';
        const missingCategories = onlyTickets && !(formData.location.ticketCategories?.length);
        toast(
          missingPrices.length
            ? `Asigna un precio mayor a cero en: ${missingPrices.map((c) => c.name || 'categoría').join(', ')}`
            : missingCategories
              ? 'Agrega al menos una categoría de boletería.'
              : 'Completa los campos obligatorios antes de guardar.',
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setShowErrors(false);
      setEditingFromSummary(false);
      setCurrentStep(7);
      onCreated?.(formData);
      void (async () => {
        const saved = await tryAutosave(formData, currentStep);
        if (saved) toast('Cambios guardados');
      })();
      return;
    }
    if (currentStep === 1) {
      if (!isStep1Valid()) {
        setShowErrors(true);
        const endBeforeStart = isEventEndBeforeStart(
          formData.startDate,
          formData.startTime,
          formData.endDate,
          formData.endTime,
        );
        toast(
          endBeforeStart
            ? 'La fecha y hora de fin no pueden ser anteriores al inicio del evento.'
            : 'Completa los campos obligatorios para continuar.',
        );
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
        const missingPrices = seatingCategoriesMissingPrice(formData.location.seatingMap?.figures);
        toast(
          missingPrices.length
            ? `Asigna un precio mayor a cero en: ${missingPrices.map((c) => c.name || 'categoría').join(', ')}`
            : formData.location.ticketingType === 'only-tickets'
              && !(formData.location.ticketCategories?.length)
              ? 'Agrega al menos una categoría de boletería.'
              : 'Completa la información del lugar para continuar.',
        );
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
        toast(
          !isRefundPolicyConfigured(formData)
            ? REFUND_POLICY_REQUIRED_MESSAGE
            : isSalesWindowInvalid(formData)
              ? SALES_AFTER_EVENT_MESSAGE
              : 'Completa la configuración de reembolsos y venta.',
        );
        scrollWizardToTop();
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

  const handleStepSelect = (step: StepNum) => {
    if (step === currentStep) return;
    setShowErrors(false);
    if (step === 7) {
      setEditingFromSummary(false);
    } else if (currentStep === 7) {
      setEditingFromSummary(true);
    }
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-secondary pb-32">
      {/* Header — debajo del TopHeader global (menú hamburguesa) */}
      <div className="sticky top-0 z-10 border-b border-border/60 bg-secondary px-4 pb-3 pt-2 shadow-sm">
        <button
          onClick={handleHeaderBack}
          className="flex items-center gap-1 text-sm font-medium text-primary"
        >
          <ChevronLeft className="h-4 w-4" /> Volver
        </button>

        <div className="mt-2 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <CalendarDays className="h-5 w-5 text-primary" />
          </span>
          <h1 className="text-lg font-extrabold text-foreground">
            {headerTitle || (mode === 'edit' ? 'Editar evento' : 'Crear evento')}
          </h1>
          {publishing && <Loader2 className="h-4 w-4 animate-spin text-primary" aria-label="Publicando" />}
        </div>
        {mode === 'edit' && (
          <p className="mt-1 text-xs text-muted-foreground">
            Toca una sección del paso superior para ir directo a editarla.
          </p>
        )}

        {/* Stepper */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto rounded-full border border-border/60 bg-card p-1.5 shadow-sm">
          {STEPS.map((s) => {
            const active = currentStep === s.num;
            const completed = currentStep > s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => handleStepSelect(s.num)}
                aria-current={active ? 'step' : undefined}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : completed
                      ? 'bg-primary/10 text-primary hover:bg-primary/15'
                      : 'text-muted-foreground hover:bg-muted/60'
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
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-center text-xs font-medium text-muted-foreground">
          Paso {currentStep} de {STEPS.length} · {STEPS.find((s) => s.num === currentStep)?.label}
        </p>
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
            viewerUserId={userId}
            platformRole={getPersistedPlatformRole() || undefined}
            onEdit={(step) => { setEditingFromSummary(true); setCurrentStep(step as StepNum); }}
            onSave={async () => {
              const saved = await tryAutosave(formData, 7);
              if (saved) toast('Borrador guardado');
            }}
            onPreview={() => setShowPreview(true)}
            onPublish={async () => {
              if (!onPublish || publishing || publishLock.current) return;
              if (!isStep4Valid()) {
                setShowErrors(true);
                setCurrentStep(4);
                toast(
                  !isRefundPolicyConfigured(formData)
                    ? REFUND_POLICY_REQUIRED_MESSAGE
                    : SALES_AFTER_EVENT_MESSAGE,
                );
                scrollWizardToTop();
                return;
              }
              publishLock.current = true;
              setPublishing(true);
              try {
                const eventId = await onPublish({ ...formData, wizardStep: 7 });
                if (eventId) {
                  setPublishedEventId(eventId);
                  updateForm({ persistedEventId: eventId });
                  onPublished?.(eventId);
                }
              } catch (err) {
                toast.error(
                  err instanceof Error
                    ? err.message
                    : (mode === 'edit' ? 'No se pudo guardar el evento' : 'No se pudo publicar el evento'),
                );
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
              className="w-full rounded-full py-6 text-base font-bold shadow-sm"
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
