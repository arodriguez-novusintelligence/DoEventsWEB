import { useState, useEffect, type ReactNode } from 'react';
import { SERVICE_SECTORS, SECTOR_ACTIVITIES, PRICING_TYPES, CURRENCIES, REFUND_POLICIES, ServiceFormData, ActivityPricing } from '@lovable/data/servicesData';
import { Checkbox } from '@lovable/components/ui/checkbox';
import { Input } from '@lovable/components/ui/input';
import { Textarea } from '@lovable/components/ui/textarea';
import { Button } from '@lovable/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lovable/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@lovable/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@lovable/components/ui/collapsible';
import { cn } from '@lovable/lib/utils';
import {
  Zap, ClipboardCheck, Plus, Trash2, GripVertical, FileText, HelpCircle,
  ChevronDown, Briefcase, ListChecks, DollarSign, CalendarDays, Camera, User, Video, X, MapPin, Ticket,
} from 'lucide-react';
import CalendarPlanner from './CalendarPlanner';
import ServiceLocationSection from './sections/ServiceLocationSection';
import ServicePromoCodesSection from './sections/ServicePromoCodesSection';

export const SECTION_ORDER = ['photo', 'location', 'sectors', 'activities', 'pricing', 'calendar', 'promo', 'preferences', 'faq'] as const;

export const SECTION_SHORT_LABELS: Record<(typeof SECTION_ORDER)[number], string> = {
  photo: 'Foto',
  location: 'Ubicación',
  sectors: 'Tipo',
  activities: 'Actividades',
  pricing: 'Precio',
  calendar: 'Días',
  promo: 'Códigos',
  preferences: 'Preferencias',
  faq: 'FAQ',
};

export const SECTION_LABELS = SECTION_SHORT_LABELS;

export function isSectionComplete(key: (typeof SECTION_ORDER)[number], f: ServiceFormData): boolean {
  switch (key) {
    case 'photo':
      return Boolean(f.servicePhoto || f.coverImageUrl || f.coverImagePreview);
    case 'location':
      return Boolean(f.latitude && f.longitude);
    case 'sectors':
      return f.sectors.length > 0;
    case 'activities':
      return f.sectors.some((s) => (f.activities[s] || []).length > 0);
    case 'pricing': {
      const keys = f.sectors.flatMap((s) => (f.activities[s] || []).map((a) => `${s}::${a}`));
      if (!keys.length) return false;
      return keys.every((k) => {
        const p = f.activityPricing[k];
        return Boolean(p?.cost && Number(p.cost) > 0);
      });
    }
    case 'calendar':
      return true;
    case 'promo':
      if (!f.promoEnabled) return true;
      return (f.promoCodes?.length ?? 0) > 0;
    case 'preferences':
      return Boolean(f.refundPolicy && f.bookingPreference);
    case 'faq':
      return true;
    default:
      return false;
  }
}

export function areAllSectionsComplete(f: ServiceFormData): boolean {
  return SECTION_ORDER.every((k) => isSectionComplete(k, f));
}

interface StepUnifiedProps {
  formData: ServiceFormData;
  updateForm: (partial: Partial<ServiceFormData>) => void;
  onNext: () => void;
  activeSectionIndex: number;
  onSectionChange: (index: number) => void;
  defaultProfileImageUrl?: string;
  editMode?: boolean;
}

const StepUnified = ({ formData, updateForm, onNext, activeSectionIndex, onSectionChange, defaultProfileImageUrl, editMode = false }: StepUnifiedProps) => {
  const [showOtherSector, setShowOtherSector] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    photo: true,
    location: false,
    sectors: false,
    activities: false,
    pricing: false,
    calendar: false,
    promo: false,
    preferences: false,
    faq: false,
  });

  const sectionOrder = SECTION_ORDER;

  useEffect(() => {
    const key = sectionOrder[activeSectionIndex];
    if (!key) return;
    setOpenSections((prev) => {
      const next: Record<string, boolean> = {};
      sectionOrder.forEach((k) => { next[k] = k === key; });
      return next;
    });
    requestAnimationFrame(() => {
      document.getElementById(`service-section-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [activeSectionIndex]);

  const handleSectionOpenChange = (sectionKey: string, open: boolean) => {
    if (open) {
      const idx = sectionOrder.indexOf(sectionKey);
      if (idx >= 0) onSectionChange(idx);
      setOpenSections(() => Object.fromEntries(sectionOrder.map((k) => [k, k === sectionKey])));
      return;
    }
    setOpenSections((prev) => ({ ...prev, [sectionKey]: false }));
  };

  const openNextSection = (currentKey: string) => {
    const idx = sectionOrder.indexOf(currentKey);
    if (idx < sectionOrder.length - 1) {
      const nextKey = sectionOrder[idx + 1];
      handleSectionOpenChange(nextKey, true);
    } else {
      onNext();
    }
  };

  const toggleSector = (sector: string) => {
    const next = formData.sectors.includes(sector)
      ? formData.sectors.filter((s) => s !== sector)
      : [...formData.sectors, sector];
    updateForm({ sectors: next });
  };

  const toggleActivity = (sector: string, activity: string) => {
    const current = formData.activities[sector] || [];
    const next = current.includes(activity)
      ? current.filter((a) => a !== activity)
      : [...current, activity];
    updateForm({ activities: { ...formData.activities, [sector]: next } });
  };

  // --- Pricing logic ---
  const activityKey = (sector: string, activity: string) => `${sector}::${activity}`;

  const updateActivityPricing = (sector: string, activity: string, partial: Partial<ActivityPricing>) => {
    const key = activityKey(sector, activity);
    const current = formData.activityPricing[key] || { currency: 'COP', cost: '', pricingType: 'Por servicio', description: '' };
    updateForm({
      activityPricing: { ...formData.activityPricing, [key]: { ...current, ...partial } },
    });
  };

  const allActivities = formData.sectors.flatMap((sector) =>
    (formData.activities[sector] || []).map((act) => ({ sector, activity: act }))
  );

  // Get highest price from all activity pricing
  const highestPricing = allActivities.reduce<{ cost: string; currency: string } | null>((best, { sector, activity }) => {
    const p = formData.activityPricing[activityKey(sector, activity)];
    if (!p || !p.cost) return best;
    const num = Number(p.cost);
    if (!best || num > Number(best.cost)) return { cost: p.cost, currency: p.currency };
    return best;
  }, null);
  const basePriceCost = highestPricing?.cost || '';
  const basePriceCurrency = highestPricing?.currency === 'USD' ? 'US$' : highestPricing?.currency === 'EUR' ? '€' : '$';

  const hasSectors = formData.sectors.length > 0;
  const canContinue = hasSectors;

  const renderContinueButton = (sectionKey: (typeof SECTION_ORDER)[number]) => {
    if (editMode) return null;
    return (
      <Button
        onClick={() => openNextSection(sectionKey)}
        disabled={!isSectionComplete(sectionKey, formData)}
        className="mt-4 w-full rounded-full py-5 text-sm font-semibold disabled:opacity-50"
      >
        Guardar y Continuar
      </Button>
    );
  };

  const wrapSection = (sectionKey: string, content: ReactNode) => (
    <div id={`service-section-${sectionKey}`}>{content}</div>
  );

  // --- Shared section header ---
  const SectionHeader = ({
    icon: Icon,
    title,
    sectionKey,
  }: {
    icon: React.ElementType;
    title: string;
    sectionKey: string;
  }) => {
    const done = isSectionComplete(sectionKey as (typeof SECTION_ORDER)[number], formData);
    return (
    <CollapsibleTrigger
      className="flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-4 shadow-sm transition-colors hover:bg-accent/50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className="flex-1 text-left text-sm font-semibold text-foreground">{title}</span>
      {done && !openSections[sectionKey] && (
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">✓</span>
      )}
      <ChevronDown
        className={cn('h-5 w-5 text-primary transition-transform', openSections[sectionKey] && 'rotate-180')}
      />
    </CollapsibleTrigger>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Foto del servicio */}
      {wrapSection('photo', (
      <Collapsible open={openSections.photo} onOpenChange={(open) => handleSectionOpenChange('photo', open)}>
        <SectionHeader icon={Camera} title="Foto del servicio *" sectionKey="photo" />
        <CollapsibleContent className="mt-2 px-1">
          <div className="rounded-2xl bg-card p-4 shadow-sm space-y-4">
            <p className="text-xs text-muted-foreground">
              Sube una foto tuya o de tu trabajo. Es obligatoria para publicar el servicio.
            </p>
            <div className="flex items-center justify-center rounded-2xl bg-accent/40 aspect-[4/3] overflow-hidden">
              {formData.servicePhoto ? (
                <img src={formData.servicePhoto} alt="Foto del servicio" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Camera className="h-10 w-10" />
                  <span className="text-sm">Sin foto</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-primary bg-primary/5 px-4 py-3 text-sm font-semibold text-primary">
                <Camera className="h-4 w-4" />
                Subir foto
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const preview = URL.createObjectURL(file);
                      updateForm({
                        servicePhoto: preview,
                        coverImageFile: file,
                        coverImageUrl: preview,
                        coverImagePreview: preview,
                      });
                    }
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => updateForm({
                  servicePhoto: defaultProfileImageUrl || '/placeholder.svg',
                  coverImageUrl: defaultProfileImageUrl || '/placeholder.svg',
                  coverImagePreview: defaultProfileImageUrl || '/placeholder.svg',
                  coverImageFile: undefined,
                })}
                className="flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground"
              >
                <User className="h-4 w-4" />
                Usar mi foto de perfil
              </button>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Galería multimedia (fotos y videos)</h4>
              <div className="grid grid-cols-4 gap-2">
                {(formData.galleryMedia || []).map((m, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-border bg-accent/30">
                    {m.type === 'photo' ? (
                      <img src={m.url} alt={`media-${i}`} className="h-full w-full object-cover" />
                    ) : (
                      <video src={m.url} className="h-full w-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => updateForm({ galleryMedia: (formData.galleryMedia || []).filter((_, idx) => idx !== i) })}
                      className="absolute right-1 top-1 rounded-full bg-background/80 p-1 text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border border-dashed border-border text-primary">
                  <Camera className="h-5 w-5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) updateForm({ galleryMedia: [...(formData.galleryMedia || []), { type: 'photo', url: URL.createObjectURL(file) }] });
                    }}
                  />
                </label>
                <label className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border border-dashed border-border text-primary">
                  <Video className="h-5 w-5" />
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) updateForm({ galleryMedia: [...(formData.galleryMedia || []), { type: 'video', url: URL.createObjectURL(file) }] });
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
          {renderContinueButton('photo')}
        </CollapsibleContent>
      </Collapsible>
      ))}

      {/* 2. Ubicación del servicio */}
      {wrapSection('location', (
      <Collapsible open={openSections.location} onOpenChange={(open) => handleSectionOpenChange('location', open)}>
        <SectionHeader icon={MapPin} title="Ubicación del servicio *" sectionKey="location" />
        <CollapsibleContent className="mt-2 px-1">
          <ServiceLocationSection formData={formData} updateForm={updateForm} />
          {renderContinueButton('location')}
        </CollapsibleContent>
      </Collapsible>
      ))}

      {/* 3. Tipo de servicio */}
      {wrapSection('sectors', (
      <Collapsible open={openSections.sectors} onOpenChange={(open) => handleSectionOpenChange('sectors', open)}>
        <SectionHeader icon={Briefcase} title="¿Qué tipo de servicio(s) prestas?" sectionKey="sectors" />
        <CollapsibleContent className="mt-2 px-1">
          <div className="rounded-2xl bg-card p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {SERVICE_SECTORS.map((sector) => (
                <button
                  key={sector}
                  onClick={() => toggleSector(sector)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    formData.sectors.includes(sector)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-accent text-accent-foreground'
                  )}
                >
                  {sector}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Checkbox checked={showOtherSector} onCheckedChange={(v) => setShowOtherSector(!!v)} />
              <span className="text-sm text-foreground">Otro. ¿Cuál?</span>
            </div>
            {showOtherSector && (
              <Input
                className="mt-2"
                placeholder="Describe tu sector"
                value={formData.sectorOther}
                onChange={(e) => updateForm({ sectorOther: e.target.value })}
              />
            )}
          </div>
          {renderContinueButton('sectors')}
        </CollapsibleContent>
      </Collapsible>
      ))}

      {/* 3. Actividades */}
      {wrapSection('activities', (
      <Collapsible open={openSections.activities} onOpenChange={(open) => handleSectionOpenChange('activities', open)}>
        <SectionHeader icon={ListChecks} title="Selecciona las actividades" sectionKey="activities" />
        <CollapsibleContent className="mt-2 space-y-3 px-1">
          {!hasSectors ? (
            <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-sm">
              Selecciona al menos un servicio primero.
            </p>
          ) : (
            formData.sectors.map((sector) => {
              const activities = SECTOR_ACTIVITIES[sector] || [];
              if (activities.length === 0) return null;
              const selectedActivities = formData.activities[sector] || [];
              const otherText = formData.activityOthers[sector] || '';
              return (
                <div key={sector} className="rounded-2xl bg-card p-4 shadow-sm">
                  <h4 className="mb-3 text-base font-semibold text-foreground">{sector}</h4>
                  <div className="flex flex-wrap gap-2">
                    {activities.map((act) => (
                      <button
                        key={act}
                        onClick={() => toggleActivity(sector, act)}
                        className={cn(
                          'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                          selectedActivities.includes(act)
                            ? 'bg-primary text-primary-foreground font-semibold'
                            : 'bg-accent text-accent-foreground'
                        )}
                      >
                        {act}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Checkbox
                      checked={!!otherText}
                      onCheckedChange={(v) => {
                        if (!v) updateForm({ activityOthers: { ...formData.activityOthers, [sector]: '' } });
                      }}
                    />
                    <span className="text-sm text-foreground">Otro. ¿Cuál?</span>
                  </div>
                  <Input
                    className="mt-2"
                    placeholder="Describe la actividad"
                    value={otherText}
                    onChange={(e) =>
                      updateForm({ activityOthers: { ...formData.activityOthers, [sector]: e.target.value } })
                    }
                  />
                </div>
              );
            })
          )}
          {renderContinueButton('activities')}
        </CollapsibleContent>
      </Collapsible>
      ))}

      {/* 4. Precio por actividad */}
      {wrapSection('pricing', (
      <Collapsible open={openSections.pricing} onOpenChange={(open) => handleSectionOpenChange('pricing', open)}>
        <SectionHeader icon={DollarSign} title="Precio por Servicio y actividad" sectionKey="pricing" />
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
                        currency: 'COP', cost: '', pricingType: 'Por servicio', description: '',
                      };
                      return (
                        <div key={act} className="rounded-xl border border-border p-3 space-y-3">
                          <h5 className="text-sm font-semibold text-foreground">{act}</h5>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground">Tipo de cobro</label>
                              <Select value={pricing.pricingType} onValueChange={(v) => updateActivityPricing(sector, act, { pricingType: v })}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>{PRICING_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Moneda</label>
                              <Select value={pricing.currency} onValueChange={(v) => updateActivityPricing(sector, act, { currency: v })}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Costo</label>
                            <Input className="mt-1" type="number" placeholder="0" value={pricing.cost} onChange={(e) => updateActivityPricing(sector, act, { cost: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Descripción</label>
                            <Textarea className="mt-1" placeholder="Describe qué incluye este costo" value={pricing.description} onChange={(e) => updateActivityPricing(sector, act, { description: e.target.value })} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
          {renderContinueButton('pricing')}
        </CollapsibleContent>
      </Collapsible>
      ))}

      {/* 5. Días disponibles */}
      {wrapSection('calendar', (
      <Collapsible open={openSections.calendar} onOpenChange={(open) => handleSectionOpenChange('calendar', open)}>
        <SectionHeader icon={CalendarDays} title="Días disponibles" sectionKey="calendar" />
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
          {renderContinueButton('calendar')}
        </CollapsibleContent>
      </Collapsible>
      ))}

      {/* 7. Códigos promocionales */}
      {wrapSection('promo', (
      <Collapsible open={openSections.promo} onOpenChange={(open) => handleSectionOpenChange('promo', open)}>
        <SectionHeader icon={Ticket} title="Códigos promocionales" sectionKey="promo" />
        <CollapsibleContent className="mt-2 px-1">
          <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
            <ServicePromoCodesSection formData={formData} updateForm={updateForm} />
          </div>
          {renderContinueButton('promo')}
        </CollapsibleContent>
      </Collapsible>
      ))}

      {/* 8. Preferencia y reembolso */}
      {wrapSection('preferences', (
      <Collapsible open={openSections.preferences} onOpenChange={(open) => handleSectionOpenChange('preferences', open)}>
        <SectionHeader icon={FileText} title="Preferencia y reembolso del servicio" sectionKey="preferences" />
        <CollapsibleContent className="mt-2 px-1">
          <div className="rounded-2xl bg-card p-4 shadow-sm space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Preferencias en las reservas</h4>
              <p className="text-xs text-muted-foreground">Configura cómo quieres recibir y aprobar las reservas</p>
              <div className="mt-3 space-y-3">
                <button
                  type="button"
                  onClick={() => updateForm({ bookingPreference: 'instant' })}
                  className={cn(
                    'w-full rounded-xl border p-4 text-left transition-colors flex items-start gap-3',
                    formData.bookingPreference === 'instant' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
                  )}
                >
                  <Zap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">Activa la Reserva inmediata</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Permite que tus clientes reserven automáticamente.</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => updateForm({ bookingPreference: 'approval' })}
                  className={cn(
                    'w-full rounded-xl border p-4 text-left transition-colors flex items-start gap-3',
                    formData.bookingPreference === 'approval' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
                  )}
                >
                  <ClipboardCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">Aprueba todas las reservas</span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Recomendada</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Revisa siempre las solicitudes antes de aprobar.</p>
                  </div>
                </button>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">¿Cuándo pueden solicitar reembolsos?</h4>
              <p className="text-xs text-muted-foreground">Define hasta qué momento pueden cancelar y recibir reembolso.</p>
              <RadioGroup value={formData.refundPolicy} onValueChange={(v) => updateForm({ refundPolicy: v })} className="mt-3 space-y-2">
                {REFUND_POLICIES.map((policy) => (
                  <label key={policy} className="flex items-center gap-3 cursor-pointer">
                    <RadioGroupItem value={policy} />
                    <span className="text-sm text-foreground">{policy}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </div>
          {renderContinueButton('preferences')}
        </CollapsibleContent>
      </Collapsible>
      ))}


      {/* 7. FAQ */}
      {wrapSection('faq', (
      <Collapsible open={openSections.faq} onOpenChange={(open) => handleSectionOpenChange('faq', open)}>
        <SectionHeader icon={HelpCircle} title="Preguntas frecuentes (FAQ)" sectionKey="faq" />
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
                      <button type="button" onClick={() => updateForm({ faqs: formData.faqs.filter((_, idx) => idx !== i) })} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Input placeholder="Ej: ¿Cuál es el horario de check-in?" value={faq.question} onChange={(e) => { const next = formData.faqs.map((f, idx) => idx === i ? { ...f, question: e.target.value } : f); updateForm({ faqs: next }); }} />
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground">Respuesta</span>
                    <Textarea className="mt-1" placeholder="Escribe la respuesta aquí..." value={faq.answer} onChange={(e) => { const next = formData.faqs.map((f, idx) => idx === i ? { ...f, answer: e.target.value } : f); updateForm({ faqs: next }); }} />
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-4 w-full rounded-full gap-1.5" onClick={() => updateForm({ faqs: [...formData.faqs, { question: '', answer: '' }] })}>
              <Plus className="h-4 w-4" />
              Agregar pregunta
            </Button>
          </div>
          {renderContinueButton('faq')}
        </CollapsibleContent>
      </Collapsible>
      ))}

    </div>
  );
};

export default StepUnified;