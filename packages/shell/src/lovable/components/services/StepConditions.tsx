import { ServiceFormData } from '@lovable/data/servicesData';
import { Button } from '@lovable/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@lovable/components/ui/collapsible';
import { ChevronUp, Briefcase, Clock } from 'lucide-react';
import { useState } from 'react';

interface StepConditionsProps {
  formData: ServiceFormData;
  updateForm: (partial: Partial<ServiceFormData>) => void;
  onFinish: () => void;
}

const StepConditions = ({ formData, updateForm, onFinish }: StepConditionsProps) => {
  const [servicesOpen, setServicesOpen] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(true);

  const sortedDates = [...formData.selectedDates].sort();

  return (
    <div className="space-y-6">
      {/* Summary: My Services */}
      <Collapsible open={servicesOpen} onOpenChange={setServicesOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">Mis servicios</span>
          </div>
          <ChevronUp className={`h-5 w-5 text-primary transition-transform ${servicesOpen ? '' : 'rotate-180'}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 rounded-xl bg-card p-4 shadow-sm">
          {formData.sectors.map((sector) => {
            const activities = formData.activities[sector] || [];
            return (
              <div key={sector} className="mb-4 border-b border-border pb-4 last:mb-0 last:border-0 last:pb-0">
                <h4 className="text-sm font-semibold italic text-primary">{sector}</h4>
                {activities.map((act) => (
                  <div key={act} className="mt-2">
                    <p className="text-sm font-semibold text-foreground">{act}</p>
                  </div>
                ))}
                {formData.activityOthers[sector] && (
                  <p className="mt-1 text-xs text-muted-foreground">Otro: {formData.activityOthers[sector]}</p>
                )}
              </div>
            );
          })}

          {/* Pricing summary */}
          {formData.pricingDetails.length > 0 && (
            <div className="mt-2 space-y-1">
              {formData.pricingDetails.map((d) => (
                <div key={d.type} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{d.type}</span>
                  <span className="font-semibold text-foreground">
                    {d.currency} {Number(d.cost || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" className="mt-4 w-full rounded-full border-primary text-primary">
            Editar mis servicios
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* Summary: Schedule */}
      <Collapsible open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">Horario de disponibilidad</span>
          </div>
          <ChevronUp className={`h-5 w-5 text-primary transition-transform ${scheduleOpen ? '' : 'rotate-180'}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 rounded-xl bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Horario: </span>
            {formData.globalStartTime} — {formData.globalEndTime}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Días seleccionados: </span>
            {sortedDates.length} día(s)
          </p>
          {sortedDates.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {sortedDates.map((d) => (
                <span key={d} className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                  {d}
                </span>
              ))}
            </div>
          )}
          <Button variant="outline" className="mt-4 w-full rounded-full border-primary text-primary">
            Editar horario
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* Payment conditions */}
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <h3 className="mb-3 text-base font-bold text-foreground">Condiciones de pago</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          ¡Hola! Una vez alguien reserve o pague tus servicios, la plataforma garantiza que se te haga el pago por
          cada uno de los servicios contratados. Ten en cuenta que te llegará una notificación la cual debe ser
          aceptada o rechazada, esto define el trato en las fechas y condiciones propuestas para la prestación del
          servicio o servicios que ofreces (el contrato no se cierra hasta que aceptes el trato). Si es rechazada, se
          hará la devolución del dinero. El pago total de tus servicios se depositará en la cuenta bancaria que nos
          informes cuatro días hábiles después de la fecha de prestación del servicio. Si incumples en la prestación
          del servicio pactado haremos la devolución total del dinero al contratista (ver penalidades en términos y
          condiciones).
        </p>
      </div>

      <Button
        onClick={() => {
          updateForm({ acceptedConditions: true });
          onFinish();
        }}
        className="w-full rounded-full py-6 text-base font-semibold"
      >
        Acepto condiciones de pago
      </Button>
    </div>
  );
};

export default StepConditions;
