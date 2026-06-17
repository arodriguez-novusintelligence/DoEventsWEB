import { PRICING_TYPES, CURRENCIES, PricingDetail, ServiceFormData, REFUND_POLICIES, FAQItem, ActivityPricing, SECTOR_ACTIVITIES } from '@lovable/data/servicesData';
import { Checkbox } from '@lovable/components/ui/checkbox';
import { Input } from '@lovable/components/ui/input';
import { Textarea } from '@lovable/components/ui/textarea';
import { Button } from '@lovable/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lovable/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@lovable/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@lovable/components/ui/collapsible';
import { cn } from '@lovable/lib/utils';
import { useState } from 'react';
import { Zap, ClipboardCheck, Plus, Trash2, GripVertical, FileText, HelpCircle, ChevronDown, Briefcase, DollarSign, CalendarDays } from 'lucide-react';
import CalendarPlanner from './CalendarPlanner';

interface StepPricingProps {
  formData: ServiceFormData;
  updateForm: (partial: Partial<ServiceFormData>) => void;
  onNext: () => void;
}

const StepPricing = ({ formData, updateForm, onNext }: StepPricingProps) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    services: true,
    pricing: false,
    calendar: false,
    preferences: false,
    faq: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activityKey = (sector: string, activity: string) => `${sector}::${activity}`;

  const updateActivityPricing = (sector: string, activity: string, partial: Partial<ActivityPricing>) => {
    const key = activityKey(sector, activity);
    const current = formData.activityPricing[key] || { currency: 'COP', cost: '', pricingType: 'Por servicio', description: '' };
    updateForm({
      activityPricing: {
        ...formData.activityPricing,
        [key]: { ...current, ...partial },
      },
    });
  };

  // Get all selected activities
  const allActivities = formData.sectors.flatMap((sector) =>
    (formData.activities[sector] || []).map((act) => ({ sector, activity: act }))
  );

  // Get base price from first activity pricing
  const firstActivity = allActivities.length > 0 ? allActivities[0] : null;
  const firstPricing = firstActivity
    ? formData.activityPricing[activityKey(firstActivity.sector, firstActivity.activity)]
    : null;
  const basePriceCost = firstPricing?.cost || '';
  const basePriceCurrency = firstPricing?.currency === 'USD' ? 'US$' : firstPricing?.currency === 'EUR' ? '€' : '$';

  const hasActivities = allActivities.length > 0;
  const canContinue = hasActivities;

  const SectionHeader = ({
    icon: Icon,
    title,
    sectionKey,
    step,
  }: {
    icon: React.ElementType;
    title: string;
    sectionKey: string;
    step: number;
  }) => (
    <CollapsibleTrigger
      className="flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-4 shadow-sm transition-colors hover:bg-accent/50"
      onClick={() => toggleSection(sectionKey)}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className="flex-1 text-left text-sm font-semibold text-foreground">{title}</span>
      <ChevronDown
        className={cn(
          'h-5 w-5 text-primary transition-transform',
          openSections[sectionKey] && 'rotate-180'
        )}
      />
    </CollapsibleTrigger>
  );

  return (
    <div className="space-y-4">
      {/* 1. Servicios y actividades seleccionados */}
      <Collapsible open={openSections.services}>
        <SectionHeader icon={Briefcase} title="Selecciona el servicio y actividad" sectionKey="services" step={1} />
        <CollapsibleContent className="mt-2 space-y-3 px-1">
          {formData.sectors.length === 0 ? (
            <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-sm">
              No has seleccionado ningún servicio aún. Vuelve al paso anterior.
            </p>
          ) : (
            formData.sectors.map((sector) => {
              const activities = formData.activities[sector] || [];
              return (
                <div key={sector} className="rounded-2xl bg-card p-4 shadow-sm">
                  <h4 className="text-sm font-bold text-foreground">{sector}</h4>
                  {activities.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {activities.map((act) => (
                        <span
                          key={act}
                          className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {act}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">Sin actividades seleccionadas</p>
                  )}
                </div>
              );
            })
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* 2. Precio por servicio y actividad */}
      <Collapsible open={openSections.pricing}>
        <SectionHeader icon={DollarSign} title="Precio por Servicio y actividad" sectionKey="pricing" step={2} />
        <CollapsibleContent className="mt-2 space-y-3 px-1">
          {allActivities.length === 0 ? (
            <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-sm">
              Selecciona servicios y actividades primero.
            </p>
          ) : (
            formData.sectors.map((sector) => {
              const activities = formData.activities[sector] || [];
              if (activities.length === 0) return null;
              return (
                <div key={sector} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="bg-primary/5 px-4 py-3 border-b border-border">
                    <h4 className="text-sm font-bold text-primary">{sector}</h4>
                  </div>
                  <div className="p-4 space-y-4">
                    {activities.map((act) => {
                      const key = activityKey(sector, act);
                      const pricing = formData.activityPricing[key] || {
                        currency: 'COP',
                        cost: '',
                        pricingType: 'Por servicio',
                        description: '',
                      };
                      return (
                        <div key={act} className="rounded-xl border border-border p-3 space-y-3">
                          <h5 className="text-sm font-semibold text-foreground">{act}</h5>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground">Tipo de cobro</label>
                              <Select
                                value={pricing.pricingType}
                                onValueChange={(v) => updateActivityPricing(sector, act, { pricingType: v })}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PRICING_TYPES.map((t) => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Moneda</label>
                              <Select
                                value={pricing.currency}
                                onValueChange={(v) => updateActivityPricing(sector, act, { currency: v })}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CURRENCIES.map((c) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Costo</label>
                            <Input
                              className="mt-1"
                              type="number"
                              placeholder="0"
                              value={pricing.cost}
                              onChange={(e) => updateActivityPricing(sector, act, { cost: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Descripción</label>
                            <Textarea
                              className="mt-1"
                              placeholder="Describe qué incluye este costo"
                              value={pricing.description}
                              onChange={(e) => updateActivityPricing(sector, act, { description: e.target.value })}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* 3. Días disponibles (Calendar Planner) */}
      <Collapsible open={openSections.calendar}>
        <SectionHeader icon={CalendarDays} title="Días disponibles" sectionKey="calendar" step={3} />
        <CollapsibleContent className="mt-2 px-1">
          <CalendarPlanner
            selectedDates={formData.selectedDates}
            onDatesChange={(dates) => updateForm({ selectedDates: dates })}
            blockedDates={formData.blockedDates}
            onBlockedDatesChange={(dates) => updateForm({ blockedDates: dates })}
            startTime={formData.globalStartTime}
            endTime={formData.globalEndTime}
            onStartTimeChange={(t) => updateForm({ globalStartTime: t })}
            onEndTimeChange={(t) => updateForm({ globalEndTime: t })}
            basePriceCost={basePriceCost}
            basePriceCurrency={basePriceCurrency}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* 4. Preferencia y reembolso del servicio */}
      <Collapsible open={openSections.preferences}>
        <SectionHeader icon={FileText} title="Preferencia y reembolso del servicio" sectionKey="preferences" step={4} />
        <CollapsibleContent className="mt-2 px-1">
          <div className="rounded-2xl bg-card p-4 shadow-sm space-y-6">
            {/* Booking preference */}
            <div>
              <h4 className="text-sm font-semibold text-foreground">Preferencias en las reservas</h4>
              <p className="text-xs text-muted-foreground">Configura cómo quieres recibir y aprobar las reservas</p>
              <div className="mt-3 space-y-3">
                <button
                  type="button"
                  onClick={() => updateForm({ bookingPreference: 'instant' })}
                  className={cn(
                    'w-full rounded-xl border p-4 text-left transition-colors flex items-start gap-3',
                    formData.bookingPreference === 'instant'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground'
                  )}
                >
                  <Zap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">Activa la Reserva inmediata</span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Recomendada</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Permite que tus clientes reserven automáticamente.</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => updateForm({ bookingPreference: 'approval' })}
                  className={cn(
                    'w-full rounded-xl border p-4 text-left transition-colors flex items-start gap-3',
                    formData.bookingPreference === 'approval'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground'
                  )}
                >
                  <ClipboardCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <span className="text-sm font-semibold text-foreground">Aprueba todas las reservas</span>
                    <p className="mt-1 text-xs text-muted-foreground">Revisa siempre las solicitudes antes de aprobar.</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Refund policy */}
            <div>
              <h4 className="text-sm font-semibold text-foreground">¿Cuándo pueden solicitar reembolsos?</h4>
              <p className="text-xs text-muted-foreground">Define hasta qué momento pueden cancelar y recibir reembolso.</p>
              <RadioGroup
                value={formData.refundPolicy}
                onValueChange={(v) => updateForm({ refundPolicy: v })}
                className="mt-3 space-y-2"
              >
                {REFUND_POLICIES.map((policy) => (
                  <label key={policy} className="flex items-center gap-3 cursor-pointer">
                    <RadioGroupItem value={policy} />
                    <span className="text-sm text-foreground">{policy}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 5. Preguntas frecuentes (FAQ) */}
      <Collapsible open={openSections.faq}>
        <SectionHeader icon={HelpCircle} title="Preguntas frecuentes (FAQ)" sectionKey="faq" step={5} />
        <CollapsibleContent className="mt-2 px-1">
          <div className="rounded-2xl bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Agrega preguntas y respuestas que los clientes suelen hacer</p>
            <div className="mt-4 space-y-4">
              {formData.faqs.map((faq, i) => (
                <div key={i} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-semibold text-foreground">Pregunta {i + 1}</span>
                    </div>
                    {formData.faqs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = formData.faqs.filter((_, idx) => idx !== i);
                          updateForm({ faqs: next });
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Input
                    placeholder="Ej: ¿Cuál es el horario de check-in?"
                    value={faq.question}
                    onChange={(e) => {
                      const next = formData.faqs.map((f, idx) => idx === i ? { ...f, question: e.target.value } : f);
                      updateForm({ faqs: next });
                    }}
                  />
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground">Respuesta</span>
                    <Textarea
                      className="mt-1"
                      placeholder="Escribe la respuesta aquí..."
                      value={faq.answer}
                      onChange={(e) => {
                        const next = formData.faqs.map((f, idx) => idx === i ? { ...f, answer: e.target.value } : f);
                        updateForm({ faqs: next });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full rounded-full gap-1.5"
              onClick={() => updateForm({ faqs: [...formData.faqs, { question: '', answer: '' }] })}
            >
              <Plus className="h-4 w-4" />
              Agregar pregunta
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Button
        onClick={onNext}
        disabled={!canContinue}
        className="w-full rounded-full py-6 text-base font-semibold"
      >
        Guardar y Continuar
      </Button>
    </div>
  );
};

export default StepPricing;
