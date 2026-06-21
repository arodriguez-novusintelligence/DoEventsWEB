import { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
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
  ChevronDown, Briefcase, ListChecks, DollarSign, CalendarDays, Camera, User,
  MapPin, Crosshair, Video, X, Loader2,
} from 'lucide-react';
import { resolveDisplayLocation, resolveManualUserLocation, resolveUserLocation, MediaSourcePicker, RootState } from '@doevents/shared';
import { newWizardId } from '@doevents/shared';
import CalendarPlanner from './CalendarPlanner';

export const SECTION_ORDER = ['sectors', 'activities', 'pricing', 'location', 'calendar', 'preferences', 'faq'];

interface StepUnifiedProps {
  formData: ServiceFormData;
  updateForm: (partial: Partial<ServiceFormData>) => void;
  onNext: () => void;
  activeSectionIndex: number;
  onSectionChange: (index: number) => void;
  defaultProfileImageUrl?: string;
  editMode?: boolean;
}

const StepUnified = ({
  formData,
  updateForm,
  onNext,
  activeSectionIndex,
  onSectionChange,
  defaultProfileImageUrl,
  editMode = false,
}: StepUnifiedProps) => {
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [showOtherSector, setShowOtherSector] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => (
    editMode
      ? Object.fromEntries(SECTION_ORDER.map((k) => [k, true]))
      : {
        sectors: true,
        activities: false,
        pricing: false,
        location: false,
        calendar: false,
        preferences: false,
        faq: false,
      }
  ));
  const [locating, setLocating] = useState(false);

  const sectionOrder = SECTION_ORDER;

  const openNextSection = (currentKey: string) => {
    const idx = sectionOrder.indexOf(currentKey);
    if (editMode) {
      if (idx < sectionOrder.length - 1) {
        const nextKey = sectionOrder[idx + 1];
        setOpenSections((prev) => ({ ...prev, [nextKey]: true }));
        onSectionChange(idx + 1);
      }
      return;
    }
    if (idx < sectionOrder.length - 1) {
      const nextKey = sectionOrder[idx + 1];
      setOpenSections((prev) => ({ ...prev, [currentKey]: false, [nextKey]: true }));
      onSectionChange(idx + 1);
    } else {
      onNext();
    }
  };

  const toggleSection = (key: string) => {
    const isOpening = !openSections[key];
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
    if (isOpening) {
      onSectionChange(sectionOrder.indexOf(key));
    }
  };

  // --- Sector logic ---
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

  const sectionValidationMessage = (currentKey: string): string | null => {
    switch (currentKey) {
      case 'sectors':
        return formData.sectors.length > 0 ? null : 'Selecciona al menos un sector de servicio.';
      case 'activities': {
        const hasActivities = formData.sectors.some(
          (sector) => (formData.activities[sector] || []).length > 0,
        );
        return hasActivities ? null : 'Selecciona al menos una actividad en tus sectores.';
      }
      case 'pricing': {
        if (!allActivities.length) return 'Configura el precio de tus actividades.';
        const missingPrice = allActivities.some(({ sector, activity }) => {
          const pricing = formData.activityPricing[activityKey(sector, activity)];
          return !pricing?.cost || Number(pricing.cost) <= 0;
        });
        return missingPrice ? 'Indica un precio válido para cada actividad.' : null;
      }
      case 'location':
        return formData.latitude != null && formData.longitude != null
          ? null
          : 'Configura la ubicación del servicio (busca en mapa o usa tu ubicación).';
      case 'calendar':
        return formData.selectedDates.length > 0
          ? null
          : 'Selecciona al menos un día disponible para tu servicio.';
      case 'preferences':
        return formData.refundPolicy.trim() ? null : 'Selecciona una política de reembolso.';
      default:
        return null;
    }
  };

  const guardedOpenNextSection = (currentKey: string) => {
    const validationMessage = sectionValidationMessage(currentKey);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }
    openNextSection(currentKey);
  };

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
  const coverPreview = formData.coverImagePreview || formData.coverImageUrl;

  const handlePhotoFile = (file: File | null) => {
    if (!file) return;
    if (formData.coverImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(formData.coverImagePreview);
    }
    const preview = URL.createObjectURL(file);
    updateForm({
      coverImageFile: file,
      coverImagePreview: preview,
      coverImageUrl: undefined,
      coverGalleryImageId: undefined,
      coverGalleryKey: undefined,
    });
  };

  const useProfilePhoto = () => {
    if (!defaultProfileImageUrl) return;
    if (formData.coverImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(formData.coverImagePreview);
    }
    updateForm({
      coverImageUrl: defaultProfileImageUrl,
      coverImagePreview: defaultProfileImageUrl,
      coverImageFile: null,
    });
  };

  const addGalleryFiles = (files: FileList | null, kind: 'image' | 'video') => {
    if (!files?.length) return;
    const next = [...formData.gallery];
    Array.from(files).forEach((file) => {
      next.push({
        id: newWizardId(),
        preview: URL.createObjectURL(file),
        file,
        kind,
      });
    });
    updateForm({ gallery: next.slice(0, 10) });
  };

  const addGalleryUrls = (items: Array<{ url: string; imageId?: string; key?: string }>) => {
    if (!items.length) return;
    const next = [...formData.gallery];
    items.forEach((item) => {
      next.push({
        id: newWizardId(),
        preview: item.url,
        url: item.url,
        galleryImageId: item.imageId,
        galleryKey: item.key,
        kind: 'image',
      });
    });
    updateForm({ gallery: next.slice(0, 10) });
  };

  const applyCoverFromGallery = (item: { imageId: string; url: string; key?: string }) => {
    if (formData.coverImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(formData.coverImagePreview);
    }
    updateForm({
      coverImageUrl: item.url,
      coverImagePreview: item.url,
      coverImageFile: null,
      coverGalleryImageId: item.imageId,
      coverGalleryKey: item.key,
    });
  };

  const removeGalleryItem = (id: string) => {
    const item = formData.gallery.find((g) => g.id === id);
    if (item?.preview.startsWith('blob:')) URL.revokeObjectURL(item.preview);
    updateForm({ gallery: formData.gallery.filter((g) => g.id !== id) });
  };

  const applyDeviceLocation = async () => {
    setLocating(true);
    try {
      const loc = await resolveUserLocation({ prompt: true, force: true });
      if (!loc) return;
      const locationLabel = resolveDisplayLocation({
        label: loc.label,
        locationLabel: loc.label,
        ciudad: loc.city,
        departamento: loc.departamento,
      });
      updateForm({
        latitude: loc.lat,
        longitude: loc.lng,
        locationCity: loc.city,
        locationLabel: locationLabel !== '—' ? locationLabel : `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`,
      });
    } finally {
      setLocating(false);
    }
  };

  const searchServiceLocation = async () => {
    const query = formData.locationLabel?.trim();
    if (!query) return;
    setLocating(true);
    try {
      const loc = await resolveManualUserLocation(query);
      if (!loc) return;
      const locationLabel = resolveDisplayLocation({
        label: loc.label,
        locationLabel: loc.label,
        ciudad: loc.city,
        departamento: loc.departamento,
      });
      updateForm({
        latitude: loc.lat,
        longitude: loc.lng,
        locationCity: loc.city,
        locationLabel: locationLabel !== '—' ? locationLabel : query,
      });
    } finally {
      setLocating(false);
    }
  };

  // --- Shared section header ---
  const SectionHeader = ({
    icon: Icon,
    title,
    sectionKey,
  }: {
    icon: React.ElementType;
    title: string;
    sectionKey: string;
  }) => (
    <CollapsibleTrigger
      className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-4 shadow-sm transition-colors hover:bg-accent/50"
      onClick={() => toggleSection(sectionKey)}
      aria-expanded={openSections[sectionKey]}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className="flex-1 text-left text-sm font-extrabold text-foreground">{title}</span>
      <ChevronDown
        className={cn('h-5 w-5 text-primary transition-transform', openSections[sectionKey] && 'rotate-180')}
      />
    </CollapsibleTrigger>
  );

  return (
    <div className="space-y-4">
      {/* Section progress */}
      <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
        <div className="flex items-center justify-between text-xs font-extrabold text-muted-foreground mb-2">
          <span>Progreso del servicio</span>
          <span className="text-primary">{activeSectionIndex + 1} / {sectionOrder.length}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((activeSectionIndex + 1) / sectionOrder.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-sm border border-border/60">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
            <Camera className="h-5 w-5 text-primary" />
          </span>
          <h3 className="text-sm font-extrabold text-foreground">Foto del servicio <span className="text-destructive">*</span></h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Sube una foto tuya o de tu trabajo. Es obligatoria para publicar el servicio.
        </p>
        <div className="relative mx-auto h-40 w-full max-w-xs overflow-hidden rounded-2xl bg-muted">
          {coverPreview ? (
            <img src={coverPreview} alt="Vista previa" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <Camera className="h-7 w-7 text-primary" />
              </div>
              <span className="text-xs font-extrabold text-foreground">Sin foto</span>
            </div>
          )}
        </div>
        <div className="mt-3 space-y-2">
          <MediaSourcePicker
            userId={userId}
            variant="lovable"
            multiple={false}
            maxCount={1}
            currentCount={coverPreview ? 1 : 0}
            galleryMode="single"
            deviceLabel="Subir foto"
            galleryLabel="Mi galería"
            onFiles={(files) => handlePhotoFile(files[0] || null)}
            onGallerySelect={(items) => {
              const first = items[0];
              if (first) applyCoverFromGallery(first);
            }}
          />
          {defaultProfileImageUrl && (
            <button
              type="button"
              onClick={useProfilePhoto}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-border/60 px-4 py-2.5 text-sm font-extrabold text-foreground shadow-sm hover:bg-muted/60"
            >
              <User className="h-4 w-4" />
              Usar mi foto de perfil
            </button>
          )}
        </div>
        <div className="mt-4">
          <p className="mb-2 text-xs font-extrabold text-foreground">Galería multimedia (fotos y videos)</p>
          <div className="grid grid-cols-4 gap-2">
            {formData.gallery.map((item) => (
              <div key={item.id} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                {item.kind === 'video' ? (
                  <video src={item.preview} className="h-full w-full object-cover" muted />
                ) : (
                  <img src={item.preview} alt="" className="h-full w-full object-cover" />
                )}
                <button type="button" onClick={() => removeGalleryItem(item.id)} className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {formData.gallery.length < 10 && (
              <>
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/30 text-primary">
                  <Video className="h-4 w-4" />
                  <input type="file" accept="video/*" multiple className="sr-only" onChange={(e) => addGalleryFiles(e.target.files, 'video')} />
                </label>
              </>
            )}
          </div>
          {formData.gallery.length < 10 && (
            <MediaSourcePicker
              userId={userId}
              variant="lovable"
              multiple
              maxCount={10}
              currentCount={formData.gallery.length}
              deviceLabel="Agregar fotos"
              galleryLabel="Desde mi galería"
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onFiles={(files) => {
                const list = new DataTransfer();
                files.forEach((file) => list.items.add(file));
                addGalleryFiles(list.files, 'image');
              }}
              onGallerySelect={(items) => addGalleryUrls(items)}
            />
          )}
        </div>
      </div>

      {/* 1. Tipo de servicio */}
      <Collapsible open={openSections.sectors}>
        <SectionHeader icon={Briefcase} title="¿Qué tipo de servicio(s) prestas?" sectionKey="sectors" />
        <CollapsibleContent className="mt-2 px-1">
          <div className="rounded-2xl bg-card p-4 shadow-sm border border-border/60">
            <div className="flex flex-wrap gap-2">
              {SERVICE_SECTORS.map((sector) => (
                <button
                  key={sector}
                  onClick={() => toggleSector(sector)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-extrabold transition-colors',
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
          {!editMode && (
            <Button onClick={() => guardedOpenNextSection('sectors')} className="mt-4 w-full rounded-full py-5 text-sm font-extrabold shadow-sm">
              Guardar y Continuar
            </Button>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* 2. Actividades */}
      <Collapsible open={openSections.activities}>
        <SectionHeader icon={ListChecks} title="Selecciona las actividades" sectionKey="activities" />
        <CollapsibleContent className="mt-2 space-y-3 px-1">
          {!hasSectors ? (
            <div className="rounded-2xl border border-dashed border-primary/25 bg-card p-6 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <Briefcase className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm font-extrabold text-foreground">
                Selecciona al menos un servicio primero
              </p>
            </div>
          ) : (
            formData.sectors.map((sector) => {
              const activities = SECTOR_ACTIVITIES[sector] || [];
              if (activities.length === 0) return null;
              const selectedActivities = formData.activities[sector] || [];
              const otherText = formData.activityOthers[sector] || '';
              return (
                <div key={sector} className="rounded-2xl bg-card p-4 shadow-sm border border-border/60">
                  <h4 className="mb-3 text-base font-extrabold text-foreground">{sector}</h4>
                  <div className="flex flex-wrap gap-2">
                    {activities.map((act) => (
                      <button
                        key={act}
                        onClick={() => toggleActivity(sector, act)}
                        className={cn(
                          'rounded-full px-4 py-2 text-sm font-extrabold transition-colors',
                          selectedActivities.includes(act)
                            ? 'bg-primary text-primary-foreground font-extrabold'
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
          {!editMode && (
            <Button onClick={() => guardedOpenNextSection('activities')} className="mt-4 w-full rounded-full py-5 text-sm font-extrabold shadow-sm">
              Guardar y Continuar
            </Button>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* 3. Precio por actividad */}
      <Collapsible open={openSections.pricing}>
        <SectionHeader icon={DollarSign} title="Precio por Servicio y actividad" sectionKey="pricing" />
        <CollapsibleContent className="mt-2 space-y-3 px-1">
          {allActivities.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-primary/25 bg-card p-6 text-center shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <DollarSign className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm font-extrabold text-foreground">Selecciona servicios y actividades primero.</p>
            </div>
          ) : (
            formData.sectors.map((sector) => {
              const activities = formData.activities[sector] || [];
              if (activities.length === 0) return null;
              return (
                <div key={sector} className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
                  <div className="bg-primary/5 px-4 py-3 border-b border-border/60">
                    <h4 className="text-sm font-extrabold text-primary">{sector}</h4>
                  </div>
                  <div className="p-4 space-y-4">
                    {activities.map((act) => {
                      const key = activityKey(sector, act);
                      const pricing = formData.activityPricing[key] || {
                        currency: 'COP', cost: '', pricingType: 'Por servicio', description: '',
                      };
                      return (
                        <div key={act} className="rounded-xl border border-border/60 p-3 space-y-3 shadow-sm">
                          <h5 className="text-sm font-extrabold text-foreground">{act}</h5>
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
          {!editMode && (
            <Button onClick={() => guardedOpenNextSection('pricing')} className="mt-4 w-full rounded-full py-5 text-sm font-extrabold shadow-sm">
              Guardar y Continuar
            </Button>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Ubicación del servicio (mapa y búsqueda cercana) */}
      <Collapsible open={openSections.location}>
        <SectionHeader icon={MapPin} title="Ubicación de tu servicio" sectionKey="location" />
        <CollapsibleContent className="mt-2 space-y-3 px-1">
          <div className="rounded-2xl bg-card p-4 shadow-sm border border-border/60 space-y-3">
            <Input
              placeholder="Ciudad o dirección para aparecer en el mapa"
              value={formData.locationLabel || ''}
              onChange={(e) => updateForm({ locationLabel: e.target.value })}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" className="flex-1 rounded-full font-extrabold shadow-sm" disabled={locating} onClick={() => void applyDeviceLocation()}>
                {locating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crosshair className="mr-2 h-4 w-4" />}
                Usar mi ubicación
              </Button>
              <Button type="button" variant="outline" className="flex-1 rounded-full font-extrabold shadow-sm" disabled={locating} onClick={() => void searchServiceLocation()}>
                {locating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                Buscar en mapa
              </Button>
            </div>
            {formData.latitude != null && formData.longitude != null && (
              <p className="text-xs text-muted-foreground">
                {formData.locationCity || formData.locationLabel} · {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
              </p>
            )}
          </div>
          {!editMode && (
            <Button onClick={() => guardedOpenNextSection('location')} className="mt-4 w-full rounded-full py-5 text-sm font-extrabold shadow-sm">
              Guardar y Continuar
            </Button>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Días disponibles */}
      <Collapsible open={openSections.calendar}>
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
          {!editMode && (
            <Button onClick={() => guardedOpenNextSection('calendar')} className="mt-4 w-full rounded-full py-5 text-sm font-extrabold shadow-sm">
              Guardar y Continuar
            </Button>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* 5. Preferencia y reembolso */}
      <Collapsible open={openSections.preferences}>
        <SectionHeader icon={FileText} title="Preferencia y reembolso del servicio" sectionKey="preferences" />
        <CollapsibleContent className="mt-2 px-1">
          <div className="rounded-2xl bg-card p-4 shadow-sm border border-border/60 space-y-6">
            <div>
              <h4 className="text-sm font-extrabold text-foreground">Preferencias en las reservas</h4>
              <p className="text-xs text-muted-foreground">Configura cómo quieres recibir y aprobar las reservas</p>
              <div className="mt-3 space-y-3">
                <button
                  type="button"
                  onClick={() => updateForm({ bookingPreference: 'instant' })}
                  className={cn(
                    'w-full rounded-xl border p-4 text-left transition-colors flex items-start gap-3',
                    formData.bookingPreference === 'instant' ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-muted-foreground'
                  )}
                >
                  <Zap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-foreground">Activa la Reserva inmediata</span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary">Recomendada</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Permite que tus clientes reserven automáticamente.</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => updateForm({ bookingPreference: 'approval' })}
                  className={cn(
                    'w-full rounded-xl border p-4 text-left transition-colors flex items-start gap-3',
                    formData.bookingPreference === 'approval' ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-muted-foreground'
                  )}
                >
                  <ClipboardCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <span className="text-sm font-extrabold text-foreground">Aprueba todas las reservas</span>
                    <p className="mt-1 text-xs text-muted-foreground">Revisa siempre las solicitudes antes de aprobar.</p>
                  </div>
                </button>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-foreground">¿Cuándo pueden solicitar reembolsos?</h4>
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
          {!editMode && (
            <Button onClick={() => guardedOpenNextSection('preferences')} className="mt-4 w-full rounded-full py-5 text-sm font-extrabold shadow-sm">
              Guardar y Continuar
            </Button>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* 6. FAQ */}
      <Collapsible open={openSections.faq}>
        <SectionHeader icon={HelpCircle} title="Preguntas frecuentes (FAQ)" sectionKey="faq" />
        <CollapsibleContent className="mt-2 px-1">
          <div className="rounded-2xl bg-card p-4 shadow-sm border border-border/60">
            <p className="text-xs text-muted-foreground">Agrega preguntas y respuestas que los clientes suelen hacer</p>
            <div className="mt-4 space-y-4">
              {formData.faqs.map((faq, i) => (
                <div key={i} className="rounded-xl border border-border/60 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-extrabold text-foreground">Pregunta {i + 1}</span>
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
            <Button variant="outline" className="mt-4 w-full rounded-full gap-1.5 font-extrabold shadow-sm" onClick={() => updateForm({ faqs: [...formData.faqs, { question: '', answer: '' }] })}>
              <Plus className="h-4 w-4" />
              Agregar pregunta
            </Button>
          </div>
          {!editMode && (
            <Button onClick={() => guardedOpenNextSection('faq')} className="mt-4 w-full rounded-full py-5 text-sm font-extrabold shadow-sm">
              Guardar y Continuar
            </Button>
          )}
        </CollapsibleContent>
      </Collapsible>

    </div>
  );
};

export default StepUnified;
