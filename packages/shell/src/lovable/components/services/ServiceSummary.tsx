import { ServiceFormData, DAYS_FULL } from '@lovable/data/servicesData';
import { Button } from '@lovable/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@lovable/components/ui/collapsible';
import {
  ChevronUp, Briefcase, Clock, DollarSign, CalendarDays,
  FileText, HelpCircle, Save, Send, ShieldCheck, Pencil,
} from 'lucide-react';
import { useState } from 'react';

interface ServiceSummaryProps {
  formData: ServiceFormData;
  onPublish: () => void;
  onSaveDraft: () => void;
  onEdit?: () => void;
  isEditing?: boolean;
}

const ServiceSummary = ({ formData, onPublish, onSaveDraft, onEdit, isEditing }: ServiceSummaryProps) => {
  const [servicesOpen, setServicesOpen] = useState(true);
  const [pricingOpen, setPricingOpen] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(true);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);

  const activityKey = (sector: string, activity: string) => `${sector}::${activity}`;
  const sortedDates = [...formData.selectedDates].sort();
  const sortedBlocked = [...formData.blockedDates].sort();

  // Calculate total cost (sum of all activity prices)
  const allActivities = formData.sectors.flatMap((sector) =>
    (formData.activities[sector] || []).map((act) => ({ sector, activity: act }))
  );

  const totalBySector: Record<string, { activities: { name: string; cost: number; currency: string; pricingType: string; description: string }[] }> = {};
  let grandTotal = 0;

  allActivities.forEach(({ sector, activity }) => {
    const p = formData.activityPricing[activityKey(sector, activity)];
    const cost = p ? Number(p.cost || 0) : 0;
    grandTotal += cost;
    if (!totalBySector[sector]) totalBySector[sector] = { activities: [] };
    totalBySector[sector].activities.push({
      name: activity,
      cost,
      currency: p?.currency || 'COP',
      pricingType: p?.pricingType || 'Por servicio',
      description: p?.description || '',
    });
  });

  const SectionToggle = ({
    icon: Icon,
    title,
    open,
    onToggle,
    badge,
  }: {
    icon: React.ElementType;
    title: string;
    open: boolean;
    onToggle: () => void;
    badge?: string;
  }) => (
    <CollapsibleTrigger
      className="flex w-full items-center justify-between rounded-xl bg-card p-4 shadow-sm"
      onClick={onToggle}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground">{title}</span>
        {badge && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{badge}</span>
        )}
      </div>
      <ChevronUp className={`h-5 w-5 text-primary transition-transform ${open ? '' : 'rotate-180'}`} />
    </CollapsibleTrigger>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card p-5 shadow-sm text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Resumen de tus servicios</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisa toda la información antes de publicar
        </p>
      </div>

      {/* Services & Activities */}
      <Collapsible open={servicesOpen} onOpenChange={setServicesOpen}>
        <SectionToggle
          icon={Briefcase}
          title="Servicios y actividades"
          open={servicesOpen}
          onToggle={() => setServicesOpen(!servicesOpen)}
          badge={`${formData.sectors.length} sector(es)`}
        />
        <CollapsibleContent className="mt-2 rounded-xl bg-card p-4 shadow-sm">
          {formData.sectors.map((sector) => {
            const activities = formData.activities[sector] || [];
            return (
              <div key={sector} className="mb-4 border-b border-border pb-4 last:mb-0 last:border-0 last:pb-0">
                <h4 className="text-sm font-bold text-primary">{sector}</h4>
                {activities.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {activities.map((act) => (
                      <span key={act} className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                        {act}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">Sin actividades seleccionadas</p>
                )}
                {formData.activityOthers[sector] && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">Otro:</span> {formData.activityOthers[sector]}
                  </p>
                )}
              </div>
            );
          })}
          {formData.sectorOther && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Sector adicional:</span> {formData.sectorOther}
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Pricing breakdown */}
      <Collapsible open={pricingOpen} onOpenChange={setPricingOpen}>
        <SectionToggle
          icon={DollarSign}
          title="Precios por actividad"
          open={pricingOpen}
          onToggle={() => setPricingOpen(!pricingOpen)}
          badge={`${allActivities.length} actividad(es)`}
        />
        <CollapsibleContent className="mt-2 rounded-xl bg-card p-4 shadow-sm">
          {Object.entries(totalBySector).map(([sector, data]) => (
            <div key={sector} className="mb-4 border-b border-border pb-4 last:mb-0 last:border-0 last:pb-0">
              <h4 className="text-sm font-bold text-primary">{sector}</h4>
              <div className="mt-2 space-y-2">
                {data.activities.map((act) => (
                  <div key={act.name} className="rounded-lg bg-secondary/50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{act.name}</span>
                      <span className="text-sm font-bold text-foreground">
                        {act.currency} {act.cost.toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{act.pricingType}</p>
                    {act.description && (
                      <p className="mt-1 text-xs text-muted-foreground italic">{act.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {/* Grand total */}
          <div className="mt-2 flex items-center justify-between rounded-lg bg-primary/5 p-3">
            <span className="text-sm font-bold text-foreground">Total estimado</span>
            <span className="text-base font-bold text-primary">
              COP {grandTotal.toLocaleString()}
            </span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Schedule */}
      <Collapsible open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <SectionToggle
          icon={CalendarDays}
          title="Disponibilidad"
          open={scheduleOpen}
          onToggle={() => setScheduleOpen(!scheduleOpen)}
          badge={`${sortedDates.length} día(s)`}
        />
        <CollapsibleContent className="mt-2 rounded-xl bg-card p-4 shadow-sm">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Horario</p>
              <p className="text-sm font-semibold text-foreground">
                {formData.globalStartTime} — {formData.globalEndTime}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Días disponibles ({sortedDates.length})</p>
              {sortedDates.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {sortedDates.map((d) => (
                    <span key={d} className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-accent-foreground">
                      {d}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">Ningún día seleccionado</p>
              )}
            </div>
            {sortedBlocked.length > 0 && (
              <div>
                <p className="text-xs font-medium text-destructive">Días bloqueados ({sortedBlocked.length})</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {sortedBlocked.map((d) => (
                    <span key={d} className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] text-destructive">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Preferences */}
      <Collapsible open={prefsOpen} onOpenChange={setPrefsOpen}>
        <SectionToggle
          icon={FileText}
          title="Preferencias y reembolso"
          open={prefsOpen}
          onToggle={() => setPrefsOpen(!prefsOpen)}
        />
        <CollapsibleContent className="mt-2 rounded-xl bg-card p-4 shadow-sm space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Tipo de reserva</p>
            <p className="text-sm font-semibold text-foreground">
              {formData.bookingPreference === 'instant' ? '⚡ Reserva inmediata' : '✅ Aprobación manual'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Política de reembolso</p>
            <p className="text-sm font-semibold text-foreground">
              {formData.refundPolicy || 'No definida'}
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* FAQ */}
      {formData.faqs.some((f) => f.question.trim()) && (
        <Collapsible open={faqOpen} onOpenChange={setFaqOpen}>
          <SectionToggle
            icon={HelpCircle}
            title="Preguntas frecuentes"
            open={faqOpen}
            onToggle={() => setFaqOpen(!faqOpen)}
            badge={`${formData.faqs.filter((f) => f.question.trim()).length}`}
          />
          <CollapsibleContent className="mt-2 rounded-xl bg-card p-4 shadow-sm space-y-3">
            {formData.faqs
              .filter((f) => f.question.trim())
              .map((faq, i) => (
                <div key={i} className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-sm font-semibold text-foreground">{faq.question}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Action buttons */}
      <div className="space-y-3 pt-2">
        {isEditing ? (
          <>
            <Button
              onClick={onEdit}
              className="w-full rounded-full py-6 text-base font-semibold gap-2"
            >
              <Pencil className="h-4 w-4" />
              Editar servicios
            </Button>
            <Button
              onClick={onPublish}
              variant="outline"
              className="w-full rounded-full py-6 text-base font-semibold border-primary text-primary gap-2"
            >
              <Send className="h-4 w-4" />
              Re-publicar servicios
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={onPublish}
              className="w-full rounded-full py-6 text-base font-semibold gap-2"
            >
              <Send className="h-4 w-4" />
              Publicar servicios
            </Button>
            <Button
              onClick={onSaveDraft}
              variant="outline"
              className="w-full rounded-full py-6 text-base font-semibold border-primary text-primary gap-2"
            >
              <Save className="h-4 w-4" />
              Guardar borrador
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ServiceSummary;
