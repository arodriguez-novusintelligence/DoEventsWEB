import { ServiceFormData, DAYS_FULL } from '@lovable/data/servicesData';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@lovable/components/ui/collapsible';
import {
  ChevronUp, Briefcase, Clock, DollarSign, CalendarDays,
  FileText, HelpCircle, Save, ShieldCheck, Pencil, MapPin, Camera, Eye, Megaphone, Ticket,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { SECTION_ORDER } from './StepUnified';

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  variant = 'primary',
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'soft';
}) => (
  <button type="button" onClick={onClick} className="flex flex-1 flex-col items-center gap-2">
    <div
      className={`flex h-14 w-14 items-center justify-center rounded-full shadow-md transition-transform active:scale-95 ${
        variant === 'primary' ? 'bg-primary text-primary-foreground' : 'bg-primary/80 text-primary-foreground'
      }`}
    >
      <Icon className="h-6 w-6" />
    </div>
    <span className="text-xs font-medium text-foreground">{label}</span>
  </button>
);

interface ServiceSummaryProps {
  formData: ServiceFormData;
  onPublish: () => void;
  onSaveDraft: () => void;
  onEdit?: () => void;
  onEditStep?: (index: number) => void;
  onPreview?: () => void;
  isEditing?: boolean;
}

const ServiceSummary = ({ formData, onPublish, onSaveDraft, onEdit, onEditStep, onPreview, isEditing }: ServiceSummaryProps) => {
  const [photoOpen, setPhotoOpen] = useState(true);
  const [servicesOpen, setServicesOpen] = useState(true);
  const [pricingOpen, setPricingOpen] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(true);
  const [locationOpen, setLocationOpen] = useState(true);
  const [promoOpen, setPromoOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);

  const sectionIndex = (key: (typeof SECTION_ORDER)[number]) => SECTION_ORDER.indexOf(key);

function summarizeBlockedDates(dates: string[]): string[] {
  if (!dates.length) return ['Todos los días disponibles'];
  const sorted = [...dates].sort();
  if (sorted.length > 20) {
    return [`${sorted.length} días bloqueados — edita el calendario para ver el detalle`];
  }
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  const nextDay = (iso: string) => {
    const d = new Date(`${iso}T12:00:00`);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };
  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    if (current === nextDay(prev)) {
      prev = current;
      continue;
    }
    ranges.push(start === prev ? start : `${start} — ${prev}`);
    start = current;
    prev = current;
  }
  ranges.push(start === prev ? start : `${start} — ${prev}`);
  return ranges;
}

  const EditButton = ({ stepKey }: { stepKey: (typeof SECTION_ORDER)[number] }) =>
    onEditStep ? (
      <button
        type="button"
        onClick={() => onEditStep(sectionIndex(stepKey))}
        className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <Pencil className="h-3.5 w-3.5" /> Editar
      </button>
    ) : null;

  const activityKey = (sector: string, activity: string) => `${sector}::${activity}`;
  const sortedBlocked = [...formData.blockedDates].sort();
  const availabilitySummary = summarizeBlockedDates(sortedBlocked);

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

      <Collapsible open={photoOpen} onOpenChange={setPhotoOpen}>
        <SectionToggle
          icon={Camera}
          title="Foto del servicio"
          open={photoOpen}
          onToggle={() => setPhotoOpen(!photoOpen)}
        />
        <CollapsibleContent className="mt-2 rounded-xl bg-card p-4 shadow-sm">
          {formData.servicePhoto || formData.coverImageUrl || formData.coverImagePreview ? (
            <div className="aspect-[4/3] overflow-hidden rounded-xl bg-accent/40">
              <img
                src={formData.servicePhoto || formData.coverImageUrl || formData.coverImagePreview}
                alt="Foto del servicio"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Sin foto principal</p>
          )}
          <EditButton stepKey="photo" />
        </CollapsibleContent>
      </Collapsible>

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
          <EditButton stepKey="sectors" />
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
          <EditButton stepKey="pricing" />
        </CollapsibleContent>
      </Collapsible>

      {/* Schedule */}
      <Collapsible open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <SectionToggle
          icon={CalendarDays}
          title="Disponibilidad"
          open={scheduleOpen}
          onToggle={() => setScheduleOpen(!scheduleOpen)}
          badge={sortedBlocked.length ? `${sortedBlocked.length} bloqueado(s)` : 'Todos los días'}
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
              <p className="text-xs font-medium text-muted-foreground">Disponibilidad</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {availabilitySummary.map((line) => (
                  <span key={line} className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-accent-foreground">
                    {line}
                  </span>
                ))}
              </div>
            </div>
            {sortedBlocked.length > 0 && (
              <div>
                <p className="text-xs font-medium text-destructive">Días bloqueados ({sortedBlocked.length})</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {sortedBlocked.length <= 6
                    ? sortedBlocked.join(', ')
                    : `${sortedBlocked.slice(0, 3).join(', ')} … y ${sortedBlocked.length - 3} más`}
                </p>
              </div>
            )}
          </div>
          <EditButton stepKey="calendar" />
        </CollapsibleContent>
      </Collapsible>

      {(formData.locationCity || formData.locationLabel) && (
        <Collapsible open={locationOpen} onOpenChange={setLocationOpen}>
          <SectionToggle
            icon={MapPin}
            title="Ubicación"
            open={locationOpen}
            onToggle={() => setLocationOpen(!locationOpen)}
          />
          <CollapsibleContent className="mt-2 rounded-xl bg-card p-4 shadow-sm space-y-2">
            {formData.locationCity && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Ciudad</p>
                <p className="text-sm font-semibold text-foreground">{formData.locationCity}</p>
              </div>
            )}
            {formData.locationLabel && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Dirección o referencia</p>
                <p className="text-sm text-foreground">{formData.locationLabel}</p>
              </div>
            )}
            <EditButton stepKey="location" />
          </CollapsibleContent>
        </Collapsible>
      )}

      <Collapsible open={promoOpen} onOpenChange={setPromoOpen}>
        <SectionToggle
          icon={Ticket}
          title="Códigos promocionales"
          open={promoOpen}
          onToggle={() => setPromoOpen(!promoOpen)}
          badge={(formData.promoCodes?.length ?? 0) > 0 ? `${formData.promoCodes!.length} lote(s)` : 'Inactivo'}
        />
        <CollapsibleContent className="mt-2 space-y-2 rounded-xl bg-card p-4 shadow-sm">
          {(formData.promoCodes?.length ?? 0) > 0 ? (
            formData.promoCodes!.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">{b.currency} $ {b.value.toLocaleString()}</p>
                  {b.description && <p className="text-xs italic text-muted-foreground">{b.description}</p>}
                </div>
                <span className="text-sm font-bold text-primary">x {b.quantity}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">Sin códigos configurados</p>
          )}
          <EditButton stepKey="promo" />
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
          <EditButton stepKey="preferences" />
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
            <EditButton stepKey="faq" />
          </CollapsibleContent>
        </Collapsible>
      )}

      <div className="pt-4">
        {isEditing ? (
          <div className="flex items-start justify-around gap-2 pt-2">
            <ActionButton icon={Pencil} label="Editar" onClick={onEdit} variant="soft" />
            <ActionButton icon={Megaphone} label="Re-publicar" onClick={onPublish} variant="primary" />
          </div>
        ) : (
          <div className="flex items-start justify-around gap-2 pt-2">
            <ActionButton
              icon={Eye}
              label="Previsualizar"
              onClick={() => (onPreview ? onPreview() : toast.info('Previsualización próximamente'))}
              variant="soft"
            />
            <ActionButton icon={Save} label="Guardar" onClick={onSaveDraft} variant="primary" />
            <ActionButton icon={Megaphone} label="Publicar" onClick={onPublish} variant="soft" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceSummary;
