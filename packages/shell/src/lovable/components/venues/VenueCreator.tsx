import { useState } from 'react';
import { Accordion } from '@lovable/components/ui/accordion';
import { Button } from '@lovable/components/ui/button';
import {
  FileText, MapPinPlus, CalendarDays, RotateCcw, HelpCircle,
  ChevronLeft, ChevronUp, Save, Send,
} from 'lucide-react';
import { toast } from '@lovable/components/ui/sonner';
import ProgressIndicator from './ProgressIndicator';
import SectionAccordion from './SectionAccordion';
import MainInfoSection from './sections/MainInfoSection';
import LocationSection from './sections/LocationSection';
import PlaceCalendarSection from './sections/PlaceCalendarSection';
import PreferencesRefundSection from './sections/PreferencesRefundSection';
import FAQSection from './sections/FAQSection';
import { PlaceFormProvider, usePlaceForm } from '@lovable/components/places/placeFormContext';
import type { PlaceFormData } from '@lovable/data/placeData';
import EditPageToolbar from '../../../components/EditPageToolbar';

const sections = [
  { id: 'info', icon: FileText, title: 'Información principal', component: MainInfoSection },
  { id: 'location', icon: MapPinPlus, title: 'Ubicación y detalle del lugar', component: LocationSection },
  { id: 'datetime', icon: CalendarDays, title: 'Calendar planner', component: PlaceCalendarSection },
  { id: 'preferences', icon: RotateCcw, title: 'Preferencias y reembolso en reservas', component: PreferencesRefundSection },
  { id: 'faq', icon: HelpCircle, title: 'Preguntas frecuentes (FAQ)', component: FAQSection },
];

export interface PublishedVenueDraft {
  id: string;
  name: string;
  link: string;
  address: string;
  type: string;
  capacity: number;
  image: string;
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
    form, completedCount, canPublish, publishing, handlePublish, missingRequiredFields,
  } = usePlaceForm();
  const [openSections, setOpenSections] = useState<string[]>(['info']);
  const [showActions, setShowActions] = useState(false);
  const totalSteps = sections.length;

  const handleSaveDraft = async () => {
    if (!form.name.trim()) {
      toast.error('Escribe al menos el nombre del lugar para guardar borrador');
      return;
    }
    setShowActions(false);
    try {
      await onSaveDraft?.(form);
      toast.success('Borrador guardado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar el borrador');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="shrink-0 rounded-full" onClick={() => onBack?.(form)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-extrabold text-primary truncate">
                {headerTitle || (mode === 'edit' ? 'Editar lugar' : 'Mi Lugar de Eventos')}
              </h1>
              {mode !== 'edit' && (
                <p className="text-xs text-muted-foreground truncate">
                  {completedCount} de {totalSteps} secciones completadas
                </p>
              )}
            </div>
          </div>
        </div>
        {mode !== 'edit' && (
          <div className="border-t border-border bg-secondary/30">
            <div className="container max-w-3xl mx-auto">
              <ProgressIndicator
                currentStep={Math.min(completedCount + 1, totalSteps)}
                totalSteps={totalSteps}
              />
            </div>
          </div>
        )}
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-6">
        <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="space-y-3">
          {sections.map((section) => {
            const SectionComponent = section.component;
            return (
              <SectionAccordion
                key={section.id}
                value={section.id}
                icon={section.icon}
                title={section.title}
                titleHighlight=""
              >
                <SectionComponent />
              </SectionAccordion>
            );
          })}
        </Accordion>
      </main>

      {mode === 'edit' ? (
        <EditPageToolbar
          saving={publishing}
          dirty
          onSave={() => void handlePublish()}
          saveLabel={submitLabel || 'Guardar cambios'}
        />
      ) : (
        <div className="fixed bottom-6 right-6 z-50">
          {showActions && (
            <div className="absolute bottom-16 right-0 bg-card rounded-xl shadow-lg border border-border p-2 space-y-1 min-w-[200px]">
              {onSaveDraft && (
                <Button variant="ghost" className="w-full justify-start" onClick={() => void handleSaveDraft()}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar borrador
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start text-primary"
                disabled={!canPublish || publishing}
                onClick={() => {
                  setShowActions(false);
                  if (missingRequiredFields.length) {
                    toast.error(`Completa: ${missingRequiredFields.join(', ')}`);
                    return;
                  }
                  void handlePublish();
                }}
              >
                <Send className="w-4 h-4 mr-2" />
                {publishing ? 'Publicando…' : (submitLabel || 'Publicar lugar')}
              </Button>
            </div>
          )}
          <Button onClick={() => setShowActions(!showActions)} className="floating-action-button">
            Acciones
            <ChevronUp className={`w-4 h-4 transition-transform ${showActions ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      )}
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
