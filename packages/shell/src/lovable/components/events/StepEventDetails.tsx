import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { fetchEventTypes, getPreferences, MediaSourcePicker, RootState } from '@doevents/shared';
import {
  CalendarDays,
  Clock,
  ChevronDown,
  Users,
  Image as ImageIcon,
  Video,
  Tag,
  UserPlus,
  X,
  Paperclip,
  Globe,
  Lock,
  MonitorPlay,
  MapPin,
  ChevronUp,
  Sparkles,
  Pencil,
  Loader2,
} from 'lucide-react';
import {
  EventFormData,
  EventHost,
  EVENT_TYPES,
  EVENT_CATEGORIES,
} from '@lovable/data/eventFormData';
import HostPickerModal from './HostPickerModal';
import { toast } from 'sonner';
import {
  isPulepApplicable,
  PULEP_PORTAL_URL,
} from '@lovable/lib/pulepColombia';
import { ExternalLink, ShieldCheck } from 'lucide-react';

interface StepEventDetailsProps {
  formData: EventFormData;
  updateForm: (partial: Partial<EventFormData>) => void;
  showErrors: boolean;
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="mb-1.5 block text-sm font-semibold text-foreground">
    {children}
  </label>
);

const ErrorText = ({ show }: { show: boolean }) =>
  show ? (
    <p className="mt-1 text-xs font-medium text-destructive">
      Este campo es obligatorio
    </p>
  ) : null;

const StepEventDetails = ({
  formData,
  updateForm,
  showErrors,
}: StepEventDetailsProps) => {
  const [tagInput, setTagInput] = useState('');
  const [showMaterial, setShowMaterial] = useState(false);
  const [showHostPicker, setShowHostPicker] = useState(false);
  const [eventTypes, setEventTypes] = useState<Array<{ id: string; label: string }>>(
    EVENT_TYPES.map((t) => ({ id: t, label: t })),
  );
  const [categories, setCategories] = useState<Array<{ id: string; label: string }>>(
    EVENT_CATEGORIES.map((c) => ({ id: c, label: c })),
  );
  const [loadingMeta, setLoadingMeta] = useState(true);

  useEffect(() => {
    setLoadingMeta(true);
    void getPreferences()
      .then((res) => {
        const opts = (res.data || []).map((p) => ({ id: String(p.id), label: p.name })).filter((o) => o.label);
        if (opts.length) setCategories(opts);
      })
      .catch(() => undefined);
    void fetchEventTypes()
      .then((types) => {
        const opts = types.map((t) => ({
          id: String(t.id || t.nombre || t.name || ''),
          label: t.nombre || t.name || '',
        })).filter((o) => o.label);
        if (opts.length) setEventTypes(opts);
      })
      .catch(() => undefined)
      .finally(() => setLoadingMeta(false));
  }, []);

  const categoryLabel =
    categories.find((c) => c.id === formData.category)?.label ?? formData.category;
  const typeLabel =
    eventTypes.find((t) => t.id === formData.type)?.label ?? formData.type;
  const pulepApplies = isPulepApplicable(categoryLabel, typeLabel);

  useEffect(() => {
    if (formData.pulepRequired !== pulepApplies) {
      updateForm({ pulepRequired: pulepApplies });
    }
    if (!pulepApplies && (formData.pulepProducerType || formData.pulepRegistrationNumber)) {
      updateForm({
        pulepProducerType: '',
        pulepRegistrationNumber: '',
        pulepAcknowledged: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulepApplies]);

  const pulepErr =
    showErrors &&
    pulepApplies &&
    !(
      formData.pulepProducerType &&
      formData.pulepRegistrationNumber?.trim().length >= 5 &&
      formData.pulepAcknowledged
    );

  const inputBase =
    'w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors';

  const errorBorder = 'border-destructive focus:border-destructive focus:ring-destructive/20';

  const handleAddTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (!t) return;
    if (formData.tags.includes(t)) {
      setTagInput('');
      return;
    }
    updateForm({ tags: [...formData.tags, t] });
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) =>
    updateForm({ tags: formData.tags.filter((t) => t !== tag) });

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = 15 - formData.images.length;
    const accepted = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      toast('Máximo 15 imágenes. Se agregaron las primeras disponibles.');
    }
    Promise.all(
      accepted.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          })
      )
    ).then((urls) => updateForm({ images: [...formData.images, ...urls] }));
  };

  const handleRemoveImage = (idx: number) =>
    updateForm({ images: formData.images.filter((_, i) => i !== idx) });

  const addGalleryImages = (urls: string[]) => {
    if (!urls.length) return;
    const remaining = 15 - formData.images.length;
    const next = urls.slice(0, remaining);
    if (next.length) updateForm({ images: [...formData.images, ...next] });
  };

  const userId = useSelector((s: RootState) => s.auth.idUser);

  const handleAddHost = (host: EventHost) => {
    if (formData.hosts.some((h) => h.id === host.id)) {
      toast('Este anfitrión ya está agregado.');
      return;
    }
    updateForm({ hosts: [...formData.hosts, host] });
    toast.success(`${host.name} agregado como anfitrión`);
    setShowHostPicker(false);
  };

  const handleRemoveHost = (id: string) =>
    updateForm({ hosts: formData.hosts.filter((h) => h.id !== id) });

  const err = (val: string) => showErrors && !val.trim();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-primary">
          <CalendarDays className="h-5 w-5" />
          Detalles del evento
          {loadingMeta && <Loader2 className="h-4 w-4 animate-spin" aria-label="Cargando catálogos" />}
        </h2>
        <p className="mt-1 text-sm text-foreground">
          Cuéntanos sobre tu evento: nombre, descripción y fechas.{' '}
          <span className="text-muted-foreground">(Obligatorio)</span>
        </p>
      </div>

      {/* Main card */}
      <div className="space-y-4 rounded-2xl bg-card p-4 shadow-sm">
        {/* Nombre */}
        <div>
          <Label>Nombre del evento</Label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateForm({ name: e.target.value })}
            placeholder="Ej. Concierto de verano"
            className={`${inputBase} ${err(formData.name) ? errorBorder : ''}`}
          />
          <ErrorText show={err(formData.name)} />
        </div>

        {/* Descripción */}
        <div>
          <Label>Descripción</Label>
          <textarea
            value={formData.description}
            onChange={(e) => updateForm({ description: e.target.value })}
            placeholder="Ingresa una breve descripción del evento"
            rows={3}
            className={`${inputBase} resize-none ${
              err(formData.description) ? errorBorder : ''
            }`}
          />
          <ErrorText show={err(formData.description)} />
        </div>

        {/* Tipo y Categoría */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Tipo de evento</Label>
            <div className="relative">
              <select
                value={formData.type}
                onChange={(e) => updateForm({ type: e.target.value })}
                className={`${inputBase} appearance-none pr-9 ${
                  err(formData.type) ? errorBorder : ''
                } ${!formData.type ? 'text-muted-foreground' : ''}`}
              >
                <option value="">Selecciona</option>
                {eventTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            </div>
            <ErrorText show={err(formData.type)} />
          </div>
          <div>
            <Label>Categoría</Label>
            <div className="relative">
              <select
                value={formData.category}
                onChange={(e) => updateForm({ category: e.target.value })}
                className={`${inputBase} appearance-none pr-9 ${
                  err(formData.category) ? errorBorder : ''
                } ${!formData.category ? 'text-muted-foreground' : ''}`}
              >
                <option value="">Selecciona</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            </div>
            <ErrorText show={err(formData.category)} />
          </div>
        </div>

        {/* Aforo */}
        <div>
          <Label>Número de aforo de personas</Label>
          <div className="relative">
            <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="number"
              min={1}
              value={formData.capacity}
              onChange={(e) => updateForm({ capacity: e.target.value })}
              placeholder="Ingresa el número máximo de personas"
              className={`${inputBase} pl-9 ${
                err(formData.capacity) ? errorBorder : ''
              }`}
            />
          </div>
          <ErrorText show={err(formData.capacity)} />
        </div>

        {pulepApplies && (
          <div
            className={`space-y-4 rounded-2xl border bg-card p-4 shadow-sm ${
              pulepErr ? 'border-destructive' : 'border-primary/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-primary">Cumplimiento PULEP (Colombia)</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Espectáculo de artes escénicas — Ley 1493. Registra tu evento en el portal PULEP
                  antes de publicar boletas.
                </p>
                <a
                  href={PULEP_PORTAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  Ir a pulep.mincultura.gov.co
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div>
              <Label>Tipo de productor</Label>
              <div className="relative">
                <select
                  value={formData.pulepProducerType ?? ''}
                  onChange={(e) =>
                    updateForm({
                      pulepProducerType: e.target.value as '' | 'permanente' | 'ocasional',
                    })
                  }
                  className={`${inputBase} appearance-none pr-9 ${
                    pulepErr && !formData.pulepProducerType ? errorBorder : ''
                  }`}
                >
                  <option value="">Selecciona</option>
                  <option value="permanente">Productor permanente</option>
                  <option value="ocasional">Productor ocasional</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              </div>
            </div>

            <div>
              <Label>Número de registro PULEP</Label>
              <input
                type="text"
                value={formData.pulepRegistrationNumber ?? ''}
                onChange={(e) => updateForm({ pulepRegistrationNumber: e.target.value })}
                placeholder="Ej. REG-2026-000123"
                className={`${inputBase} ${
                  pulepErr && !(formData.pulepRegistrationNumber?.trim().length >= 5)
                    ? errorBorder
                    : ''
                }`}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Número asignado al inscribir el evento en PULEP (mínimo 5 caracteres).
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-3">
              <input
                type="checkbox"
                checked={!!formData.pulepAcknowledged}
                onChange={(e) => updateForm({ pulepAcknowledged: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-xs text-foreground">
                Confirmo que este evento cumple con la Ley 1493 y está registrado o en trámite
                en PULEP según corresponda.
              </span>
            </label>
            {pulepErr && (
              <p className="text-xs font-medium text-destructive">
                Completa los datos PULEP para continuar.
              </p>
            )}
          </div>
        )}

        {/* Fechas y horas */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Fecha inicio</Label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => updateForm({ startDate: e.target.value })}
                className={`${inputBase} pl-9 ${
                  err(formData.startDate) ? errorBorder : ''
                }`}
              />
            </div>
            <ErrorText show={err(formData.startDate)} />
          </div>
          <div>
            <Label>Hora inicio</Label>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => updateForm({ startTime: e.target.value })}
                className={`${inputBase} pl-9 ${
                  err(formData.startTime) ? errorBorder : ''
                }`}
              />
            </div>
            <ErrorText show={err(formData.startTime)} />
          </div>
          <div>
            <Label>Fecha fin</Label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => updateForm({ endDate: e.target.value })}
                className={`${inputBase} pl-9 ${
                  err(formData.endDate) ? errorBorder : ''
                }`}
              />
            </div>
            <ErrorText show={err(formData.endDate)} />
          </div>
          <div>
            <Label>Hora fin</Label>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => updateForm({ endTime: e.target.value })}
                className={`${inputBase} pl-9 ${
                  err(formData.endTime) ? errorBorder : ''
                }`}
              />
            </div>
            <ErrorText show={err(formData.endTime)} />
          </div>
        </div>

        {/* Modalidad */}
        <div>
          <Label>¿Cómo va a ser el evento?</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: 'presencial', label: 'Presencial', icon: MapPin },
              { v: 'virtual', label: 'Virtual', icon: MonitorPlay },
            ].map(({ v, label, icon: Icon }) => {
              const active = formData.modality === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => updateForm({ modality: v as any })}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-all ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clase de evento */}
        <div>
          <Label>Clase de evento</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: 'public', label: 'Público', icon: Globe },
              { v: 'private', label: 'Privado', icon: Lock },
            ].map(({ v, label, icon: Icon }) => {
              const active = formData.eventClass === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => updateForm({ eventClass: v as any })}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-all ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Material publicitario (opcional) */}
      <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowMaterial((s) => !s)}
          className="flex w-full items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                Material publicitario
              </p>
              <p className="text-xs text-muted-foreground">
                Opcional · imágenes, video, etiquetas y anfitriones
              </p>
            </div>
          </div>
          {showMaterial ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {showMaterial && (
          <div className="space-y-5 border-t border-border p-4">
            {/* Imágenes */}
            <div>
              <p className="text-sm font-semibold text-foreground">
                Imágenes <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                La primera imagen seleccionada será la portada de tu evento
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {formData.images.map((src, i) => (
                  <div key={i} className="relative">
                    <img
                      src={src}
                      alt={`Imagen ${i + 1}`}
                      className={`h-20 w-20 rounded-xl object-cover ${
                        i === 0 ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
                      aria-label="Quitar imagen"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                        Portada
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <MediaSourcePicker
                userId={userId}
                variant="lovable"
                multiple
                maxCount={15}
                currentCount={formData.images.length}
                deviceLabel="Subir imágenes"
                galleryLabel="Mi galería"
                className="mt-3 flex flex-col gap-2 sm:flex-row"
                disabled={formData.images.length >= 15}
                onFiles={(files) => {
                  const list = new DataTransfer();
                  files.forEach((file) => list.items.add(file));
                  handleFiles(list.files);
                }}
                onGallerySelect={(items) => addGalleryImages(items.map((item) => item.url))}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Máximo 15 fotos · formato jpg, jpeg, png, pdf
              </p>
            </div>

            {/* Video */}
            <div>
              <Label>
                <span className="flex items-center gap-1.5">
                  <Video className="h-4 w-4 text-primary" /> Videos <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                </span>
              </Label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => updateForm({ videoUrl: e.target.value })}
                placeholder="https://youtu.be/..."
                className={inputBase}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Agrega un enlace de video de Youtube o Vimeo para mostrar el
                ambiente de su evento.
              </p>
            </div>

            {/* Etiquetas */}
            <div>
              <Label>
                <span className="flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-primary" /> Etiquetas <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                </span>
              </Label>
              <p className="mb-2 text-xs text-muted-foreground">
                Mejore la visibilidad de su evento agregando etiquetas
                relevantes al tema.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="#ballet"
                  className={inputBase}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="shrink-0 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Añadir
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/20"
                        aria-label={`Quitar ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Anfitriones */}
            <div>
              <Label>
                <span className="flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 text-primary" /> Anfitriones <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                </span>
              </Label>

              {formData.hosts.length > 0 && (
                <div className="mb-3 space-y-3">
                  {formData.hosts.map((h) => (
                    <div
                      key={h.id}
                      className="rounded-2xl border border-border bg-background p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-sm font-bold text-primary">
                          {h.avatar ? (
                            <img src={h.avatar} alt={h.name} className="h-full w-full object-cover" />
                          ) : (
                            h.initials || h.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-foreground">
                            {h.name}
                          </p>
                          {h.username && (
                            <p className="truncate text-xs text-primary">{h.username}</p>
                          )}
                          {h.email && (
                            <p className="truncate text-xs text-muted-foreground">{h.email}</p>
                          )}
                          {h.phone && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {h.countryCode || '+57'} {h.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            handleRemoveHost(h.id);
                            setShowHostPicker(true);
                          }}
                          className="flex items-center gap-1.5 text-primary hover:underline"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Cambiar anfitrión
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveHost(h.id)}
                          className="flex items-center gap-1.5 text-primary hover:underline"
                        >
                          Quitar anfitrión <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowHostPicker(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/5"
              >
                Agregar anfitrión <UserPlus className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <HostPickerModal
        open={showHostPicker}
        onClose={() => setShowHostPicker(false)}
        onAdd={handleAddHost}
        existingIds={formData.hosts.map((h) => h.id)}
      />
    </div>
  );
};

export default StepEventDetails;
