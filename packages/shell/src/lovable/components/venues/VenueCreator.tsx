import { useState } from 'react';

import { Accordion } from '@lovable/components/ui/accordion';

import { Button } from '@lovable/components/ui/button';

import {

  FileText, MapPinPlus, CalendarDays, RotateCcw, HelpCircle, Ticket,

  ChevronLeft, ChevronRight, Loader2, ClipboardCheck, Check,

} from 'lucide-react';

import { toast } from '@lovable/components/ui/sonner';

import SectionAccordion from './SectionAccordion';

import MainInfoSection from './sections/MainInfoSection';

import LocationSection from './sections/LocationSection';

import PlaceCalendarSection from './sections/PlaceCalendarSection';

import PlacePromoCodesSection from './sections/PlacePromoCodesSection';

import PreferencesRefundSection from './sections/PreferencesRefundSection';

import FAQSection from './sections/FAQSection';

import PlaceSummarySection from './sections/PlaceSummarySection';

import { PlaceFormProvider, usePlaceForm } from '@lovable/components/places/placeFormContext';

import type { PlaceFormData } from '@lovable/data/placeData';



const sections = [

  { id: 'info', icon: FileText, title: 'Información principal', shortTitle: 'Info', component: MainInfoSection },

  { id: 'location', icon: MapPinPlus, title: 'Ubicación y detalle del lugar', shortTitle: 'Ubicación', component: LocationSection },

  { id: 'datetime', icon: CalendarDays, title: 'Calendar planner', shortTitle: 'Calendario', component: PlaceCalendarSection },

  { id: 'promos', icon: Ticket, title: 'Códigos promocionales', shortTitle: 'Códigos', component: PlacePromoCodesSection },

  { id: 'preferences', icon: RotateCcw, title: 'Preferencias y reembolso en reservas', shortTitle: 'Preferencias', component: PreferencesRefundSection },

  { id: 'faq', icon: HelpCircle, title: 'Preguntas frecuentes (FAQ)', shortTitle: 'FAQ', component: FAQSection },

  { id: 'summary', icon: ClipboardCheck, title: 'Resumen', shortTitle: 'Resumen', component: PlaceSummarySection },

];



export interface PublishedVenueDraft {

  id: string;

  name: string;

  link: string;

  address: string;

  type: string;

  capacity: number;

  image: string;

  /** Galería multimedia completa (portada + adicionales). */
  images?: string[];

  sector?: string;

  description?: string;

  status?: string;

}



interface VenueCreatorProps {

  onBack?: (form?: PlaceFormData) => void;

  onPlacePublished?: (form: PlaceFormData) => void | Promise<void>;

  onSaveDraft?: (form: PlaceFormData) => void | Promise<void>;

  initialForm?: PlaceFormData;

  mode?: 'create' | 'edit';

  headerTitle?: string;

  submitLabel?: string;

}



function VenueCreatorBody({

  onBack,

  onSaveDraft,

  mode = 'create',

  headerTitle,

  submitLabel,

}: Omit<VenueCreatorProps, 'onPlacePublished' | 'initialForm'>) {

  const {

    form, canPublish, publishing, handlePublish, missingRequiredFields,

  } = usePlaceForm();

  const [currentStep, setCurrentStep] = useState(0);

  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const [openSections, setOpenSections] = useState<string[]>(['info']);

  const totalSteps = sections.length;

  const isLast = currentStep === totalSteps - 1;

  const activeSectionId = openSections[openSections.length - 1] || sections[0].id;



  const goToStep = (idx: number) => {

    setCurrentStep(idx);

    window.scrollTo({ top: 0, behavior: 'smooth' });

  };



  const handleNext = () => {

    setCompleted((prev) => new Set(prev).add(currentStep));

    if (!isLast) {

      goToStep(currentStep + 1);

      toast.success('Sección guardada');

    }

  };



  const handleSaveDraft = async () => {

    if (!form.name.trim()) {

      toast.error('Escribe al menos el nombre del lugar para guardar borrador');

      return;

    }

    try {

      await onSaveDraft?.(form);

      toast.success('Borrador guardado');

    } catch (err) {

      toast.error(err instanceof Error ? err.message : 'No se pudo guardar el borrador');

    }

  };



  const handleSubmit = () => {

    if (missingRequiredFields.length) {

      toast.error(`Completa: ${missingRequiredFields.join(', ')}`);

      return;

    }

    void handlePublish();

  };



  const handlePreview = () => {

    toast.info('La previsualización estará disponible después de publicar el borrador.');

  };



  const jumpToSection = (sectionId: string) => {

    setOpenSections([sectionId]);

    requestAnimationFrame(() => {

      document.getElementById(`venue-section-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    });

  };



  const publishButtonLabel = publishing

    ? (mode === 'edit' ? 'Guardando…' : 'Publicando…')

    : (submitLabel || (mode === 'edit' ? 'Guardar cambios' : 'Publicar lugar'));



  if (mode === 'create') {

    const CurrentComponent = sections[currentStep].component;



    return (

      <div className="mx-auto min-h-screen max-w-lg bg-secondary pb-44">

        <div className="sticky top-0 z-10 bg-secondary px-4 pb-3 pt-4">

          <button

            type="button"

            onClick={() => onBack?.(form)}

            className="flex items-center gap-1 text-sm font-medium text-primary"

          >

            <ChevronLeft className="h-4 w-4" /> Volver

          </button>



          <h1 className="mt-2 text-lg font-bold text-primary">

            {headerTitle || 'Publicar lugar'}

          </h1>



          <div className="no-scrollbar mt-3 flex items-center gap-1.5 overflow-x-auto rounded-full bg-card p-1.5 shadow-sm">

            {sections.map((s, i) => {

              const isCurrent = i === currentStep;

              const isDone = completed.has(i) || i < currentStep;

              const clickable = isDone || isCurrent;

              return (

                <button

                  key={s.id}

                  type="button"

                  onClick={() => (clickable ? goToStep(i) : undefined)}

                  disabled={!clickable}

                  aria-current={isCurrent ? 'step' : undefined}

                  className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors ${

                    isCurrent

                      ? 'bg-primary text-primary-foreground shadow-sm'

                      : isDone

                      ? 'text-primary hover:bg-primary/10'

                      : 'text-muted-foreground'

                  } ${clickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}

                >

                  <span

                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${

                      isCurrent

                        ? 'bg-primary-foreground/20 text-primary-foreground'

                        : isDone

                        ? 'bg-primary/15 text-primary'

                        : 'bg-muted text-muted-foreground'

                    }`}

                  >

                    {isDone && !isCurrent ? <Check className="h-2.5 w-2.5" /> : i + 1}

                  </span>

                  <span className="whitespace-nowrap">{s.shortTitle}</span>

                </button>

              );

            })}

          </div>

        </div>



        <div className="px-4 pt-2">

          {isLast ? (

            <PlaceSummarySection

              onEditStep={goToStep}

              onPreview={handlePreview}

              onSaveDraft={() => void handleSaveDraft()}

              onPublish={handleSubmit}

            />

          ) : (

            <CurrentComponent />

          )}



          {!isLast && (

            <div className="mt-6 pb-6">

              <Button

                type="button"

                onClick={handleNext}

                className="w-full rounded-full py-6 text-base font-bold shadow-lg"

              >

                Guardar y Continuar

                <ChevronRight className="ml-1 h-4 w-4 shrink-0" />

              </Button>

            </div>

          )}

        </div>

      </div>

    );

  }



  return (

    <div className="mx-auto min-h-screen max-w-lg bg-secondary pb-10">

      <header className="sticky top-0 z-10 border-b border-border/60 bg-secondary px-4 pb-3 pt-2 shadow-sm">

        <button

          type="button"

          onClick={() => onBack?.(form)}

          className="flex items-center gap-1 text-sm font-medium text-primary"

        >

          <ChevronLeft className="h-4 w-4" /> Volver

        </button>



        <h1 className="mt-2 text-lg font-extrabold text-foreground">

          {headerTitle || 'Editar lugar'}

        </h1>

        <p className="mt-1 text-xs text-muted-foreground">

          Toca una sección para abrirla y editar. Guarda al final con el botón inferior.

        </p>

        {publishing && <Loader2 className="mt-2 h-4 w-4 animate-spin text-primary" aria-label="Guardando" />}



        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto rounded-full border border-border/60 bg-card p-1.5 shadow-sm">

          {sections.filter((s) => s.id !== 'summary').map((section) => {

            const active = activeSectionId === section.id;

            return (

              <button

                key={section.id}

                type="button"

                onClick={() => jumpToSection(section.id)}

                aria-current={active ? 'step' : undefined}

                className={`flex flex-shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors ${

                  active

                    ? 'bg-primary text-primary-foreground shadow-sm'

                    : 'text-muted-foreground hover:bg-muted/60'

                }`}

              >

                {section.shortTitle}

              </button>

            );

          })}

        </div>

      </header>



      <main className="px-4 py-4">

        <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="space-y-3">

          {sections.filter((s) => s.id !== 'summary').map((section) => {

            const SectionComponent = section.component;

            return (

              <div key={section.id} id={`venue-section-${section.id}`}>

                <SectionAccordion

                  value={section.id}

                  icon={section.icon}

                  title={section.title}

                  titleHighlight=""

                >

                  <SectionComponent />

                </SectionAccordion>

              </div>

            );

          })}

        </Accordion>



        <div className="mt-8 pb-6">

          <Button

            type="button"

            className="h-12 w-full rounded-full text-base font-bold shadow-sm"

            disabled={(!canPublish && mode !== 'edit') || publishing}

            onClick={handleSubmit}

          >

            {publishButtonLabel}

          </Button>

        </div>

      </main>

    </div>

  );

}



const VenueCreator = ({

  onBack,

  onPlacePublished,

  onSaveDraft,

  initialForm,

  mode = 'create',

  headerTitle,

  submitLabel,

}: VenueCreatorProps = {}) => (

  <PlaceFormProvider

    initialForm={initialForm}

    mode={mode}

    onPlacePublished={onPlacePublished}

  >

    <VenueCreatorBody

      onBack={onBack}

      onSaveDraft={onSaveDraft}

      mode={mode}

      headerTitle={headerTitle}

      submitLabel={submitLabel}

    />

  </PlaceFormProvider>

);



export default VenueCreator;

