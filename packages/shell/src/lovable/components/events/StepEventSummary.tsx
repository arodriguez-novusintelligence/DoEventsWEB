import { useState } from 'react';
import {
  FileText, MapPin, ShieldCheck, Calendar, HelpCircle, Clock,
  ChevronDown, ChevronUp, Save, Eye, Megaphone, Menu, Pencil, ExternalLink, Home, Loader2,
} from 'lucide-react';
import { EventFormData, REFUND_POLICY_OPTIONS, SEATING_CURRENCIES } from '@lovable/data/eventFormData';
import { PULEP_PORTAL_URL } from '@lovable/lib/pulepColombia';
import { SeatingPreview } from './StepEventLocation';

interface StepEventSummaryProps {
  formData: EventFormData;
  onEdit?: (step: number) => void;
  onSave: () => void;
  onPreview: () => void;
  onPublish: () => void;
  publishing?: boolean;
  publishLabel?: string;
}

type SectionKey =
  | 'main' | 'location' | 'access' | 'date' | 'faqs' | 'agenda';

interface SectionDef { key: SectionKey; label: string; icon: any; editStep: number; }

const SECTIONS: SectionDef[] = [
  { key: 'main', label: 'Información principal', icon: FileText, editStep: 1 },
  { key: 'location', label: 'Ubicación y detalle del lugar', icon: MapPin, editStep: 2 },
  { key: 'access', label: 'Control de acceso', icon: ShieldCheck, editStep: 3 },
  { key: 'date', label: 'Fecha y reembolsos', icon: Calendar, editStep: 4 },
  { key: 'faqs', label: 'Preguntas frecuentes (FAQ)', icon: HelpCircle, editStep: 5 },
  { key: 'agenda', label: 'Agenda del evento', icon: Clock, editStep: 6 },
];

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
    {children}
  </span>
);

const Field = ({ label, value }: { label: React.ReactNode; value?: React.ReactNode }) => (
  <div>
    <div className="text-xs text-muted-foreground">{label}</div>
    <p className="mt-0.5 text-sm font-bold text-foreground break-words">{value || '—'}</p>
  </div>
);

function resolveVideoEmbedUrl(url: string): string | null {
  const raw = url.trim();
  if (!raw) return null;
  const ytMatch = raw.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}


const StepEventSummary = ({ formData, onEdit, onSave, onPreview, onPublish, publishing, publishLabel = 'Publicar' }: StepEventSummaryProps) => {

  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    main: true, location: true, access: false,
    date: false, faqs: false, agenda: false,
  });
  const [fabOpen, setFabOpen] = useState(false);

  const toggle = (k: SectionKey) => setOpen((s) => ({ ...s, [k]: !s[k] }));

  const refundLabel = formData.refundPolicy
    ? REFUND_POLICY_OPTIONS.find((o) => o.value === formData.refundPolicy)?.label
    : null;

  const renderBody = (k: SectionKey) => {
    switch (k) {
      case 'main': {
        const organizer = formData.hosts.find((h) => h.role === 'organizer') ?? formData.hosts[0];
        const anfitrion = formData.hosts.find((h) => h.role === 'host') ?? formData.hosts[1];
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Field label="Nombre del evento" value={formData.name} />
              <Field label="Tipo" value={formData.type} />
              <Field label="Categoría" value={formData.category} />
              <Field label="Clase" value={formData.eventClass === 'public' ? 'Público' : 'Privado'} />
              <Field label="Modalidad" value={formData.modality === 'presencial' ? 'Presencial' : 'Virtual'} />
              <Field label="Aforo" value={formData.capacity} />
              <Field
                label={<span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />Fecha de inicio</span> }
                value={formData.startDate}
              />
              <Field
                label={<span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />Hora de inicio</span> }
                value={formData.startTime}
              />
              <Field
                label={<span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />Fecha de finalización</span> }
                value={formData.endDate}
              />
              <Field
                label={<span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />Hora de finalización</span> }
                value={formData.endTime}
              />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Descripción del evento</p>
              <p className="mt-0.5 text-sm text-foreground whitespace-pre-wrap break-words">
                {formData.description || '—'}
              </p>
            </div>

            {formData.images.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-primary">Material publicitario del evento</p>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {formData.images.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`Material ${i + 1}`}
                      className="aspect-square w-full rounded-xl object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            {formData.videoUrl && (
              <div>
                <p className="text-sm font-semibold text-primary">Video del evento</p>
                {resolveVideoEmbedUrl(formData.videoUrl) ? (
                  <div className="mt-2 overflow-hidden rounded-xl border border-border">
                    <iframe
                      title="Video del evento"
                      src={resolveVideoEmbedUrl(formData.videoUrl) || ''}
                      className="aspect-video w-full"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : null}
                <a
                  href={formData.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background"
                >
                  Ver video <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-foreground">#Tags</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {formData.tags.length === 0
                  ? <span className="text-xs text-muted-foreground">Sin tags</span>
                  : formData.tags.map((t, i) => <Tag key={i}>#{t}</Tag>)}
              </div>
            </div>

            {organizer && (
              <div>
                <p className="text-sm font-bold text-primary">Organizador</p>
                <div className="mt-2 space-y-2">
                  <Field label="Nombre" value={organizer.name} />
                  <Field label="Correo electrónico" value={organizer.email} />
                  <Field
                    label="Número de teléfono principal"
                    value={organizer.phone ? `${organizer.countryCode ?? ''} ${organizer.phone}`.trim() : ''}
                  />
                </div>
              </div>
            )}

            {anfitrion && anfitrion.id !== organizer?.id && (
              <div>
                <p className="text-sm font-bold text-primary">Anfitrión</p>
                <div className="mt-2 space-y-2">
                  <Field label="Nombre" value={anfitrion.name} />
                  <Field label="Correo electrónico" value={anfitrion.email} />
                  <Field
                    label="Número de teléfono principal"
                    value={anfitrion.phone ? `${anfitrion.countryCode ?? ''} ${anfitrion.phone}`.trim() : ''}
                  />
                </div>
              </div>
            )}

            {formData.pulepRequired && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                <div>
                  <p className="text-sm font-bold text-primary">Cumplimiento PULEP (Colombia)</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ley 1493 — artes escénicas.{' '}
                    <a
                      href={PULEP_PORTAL_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-primary underline-offset-2 hover:underline"
                    >
                      Portal PULEP
                    </a>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field
                    label="Tipo de productor"
                    value={
                      formData.pulepProducerType === 'permanente'
                        ? 'Permanente'
                        : formData.pulepProducerType === 'ocasional'
                          ? 'Ocasional'
                          : '—'
                    }
                  />
                  <Field label="Número de registro PULEP" value={formData.pulepRegistrationNumber} />
                </div>
                <Field
                  label="Confirmación"
                  value={formData.pulepAcknowledged ? 'Registro verificado por el organizador' : 'Pendiente de confirmación'}
                />
              </div>
            )}

            {onEdit && (
              <button
                onClick={() => onEdit(1)}
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary px-4 py-3 text-sm font-bold text-primary"
              >
                <Pencil className="h-4 w-4" />
                Editar información
              </button>
            )}
          </div>
        );
      }

      case 'location': {
        const l = formData.location;
        const figures = l.seatingMap?.figures ?? [];
        const ticketCategories = figures.filter((f) => f.role === 'category' && f.priceEnabled);
        const floors = Array.from(new Set(figures.map((f) => f.floor ?? 1))).sort();
        const mapQuery = encodeURIComponent(
          l.customLat && l.customLng
            ? `${l.customLat},${l.customLng}`
            : (l.customAddress || l.detectedCity || ''),
        );
        const mapsEmbed = mapQuery
          ? `https://www.google.com/maps?q=${mapQuery}&output=embed`
          : null;
        const mapsLink = mapQuery
          ? `https://www.google.com/maps?q=${mapQuery}`
          : null;
        return (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-xl bg-secondary/40 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Home className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{l.customName || '—'}</p>
                {formData.capacity && (
                  <p className="text-xs text-muted-foreground">Lugar con capacidad para {formData.capacity} personas</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-primary">Tipo de lugar</p>
              <p className="mt-1 text-sm text-foreground">{l.customType || '—'}</p>
            </div>

            {(l.customImages?.length ?? 0) > 0 && (
              <div>
                <p className="text-sm font-bold text-primary">Imágenes del lugar</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {l.customImages!.map((src, i) => (
                    <img key={i} src={src} alt={`Lugar ${i + 1}`} className="h-20 w-20 rounded-lg object-cover" />
                  ))}
                </div>
              </div>
            )}

            {mapsEmbed && (
              <div>
                <p className="inline-flex items-center gap-1 text-sm font-bold text-foreground">
                  <MapPin className="h-4 w-4 text-primary" /> Ubicación en Google Maps
                </p>
                <div className="mt-2 overflow-hidden rounded-xl border border-border">
                  <iframe
                    title="Mapa"
                    src={mapsEmbed}
                    className="h-44 w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <p className="flex-1 text-xs text-muted-foreground">{l.customAddress || l.detectedCity}</p>
                  {mapsLink && (
                    <a
                      href={mapsLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
                    >
                      Abrir en Maps <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {ticketCategories.length > 0 && (
              <div>
                <p className="text-sm font-bold text-primary">Categorías de boletas</p>
                <div className="mt-2 space-y-2">
                  {ticketCategories.map((cat) => {
                    const currency = cat.currency && SEATING_CURRENCIES.includes(cat.currency)
                      ? cat.currency
                      : 'COP';
                    const priceLabel = typeof cat.price === 'number' && cat.price > 0
                      ? new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency,
                        maximumFractionDigits: 0,
                      }).format(cat.price)
                      : '—';
                    return (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="truncate text-sm font-semibold text-foreground">{cat.name}</span>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-primary">{priceLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {figures.length > 0 && (
              <div>
                <p className="text-sm font-bold text-foreground">Mapa de silletería</p>
                {floors.map((fl) => (
                  <div key={fl} className="mt-2">
                    <div className="mb-2 flex justify-center">
                      <span className="inline-flex items-center rounded-full border-2 border-primary px-3 py-1 text-xs font-bold text-primary">
                        Piso {fl}
                      </span>
                    </div>
                    <SeatingPreview figures={figures.filter((f) => (f.floor ?? 1) === fl)} />
                  </div>
                ))}
              </div>
            )}

            {onEdit && (
              <button
                onClick={() => onEdit(2)}
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary px-4 py-3 text-sm font-bold text-primary"
              >
                <Pencil className="h-4 w-4" />
                Editar información
              </button>
            )}
          </div>
        );
      }
      case 'access': {
        const ac = formData.accessControl ?? {};
        const gates = formData.location.gates ?? [];
        if (gates.length === 0) {
          return (
            <div className="space-y-3">
              <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                  <ShieldCheck className="h-7 w-7 text-primary" />
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">Sin control de acceso</p>
                <p className="mt-1 text-xs text-muted-foreground">Configura puertas en el paso de ubicación del lugar.</p>
              </div>
              {onEdit && (
                <button
                  onClick={() => onEdit(3)}
                  className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary px-4 py-3 text-sm font-bold text-primary"
                >
                  <Pencil className="h-4 w-4" />
                  Editar información
                </button>
              )}
            </div>
          );
        }
        return (
          <div className="space-y-3">
            {gates.map((g) => {
              const userIds = ac[g.id] ?? [];
              return (
                <div key={g.id} className="rounded-2xl border border-border bg-card p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{userIds.length} asignado{userIds.length === 1 ? '' : 's'}</p>
                    </div>
                  </div>
                  {userIds.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {userIds.map((uid) => {
                        const u = (formData.hosts ?? []).find((h) => h.id === uid);
                        if (!u) {
                          return (
                            <div key={uid} className="flex items-center gap-3 rounded-xl bg-secondary/60 p-2.5">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                                ?
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-foreground">Usuario asignado</p>
                                <p className="truncate text-xs text-muted-foreground">{uid}</p>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={uid} className="flex items-center gap-3 rounded-xl bg-secondary/60 p-2.5">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                                {u.initials || u.name.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-foreground">{u.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                              {u.phone && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {u.countryCode ? `${u.countryCode}` : ''}{u.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {onEdit && (
              <button
                onClick={() => onEdit(3)}
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary px-4 py-3 text-sm font-bold text-primary"
              >
                <Pencil className="h-4 w-4" />
                Editar información
              </button>
            )}
          </div>
        );
      }
      case 'date': {
        const fmtDate = (d?: string) => {
          if (!d) return '—';
          const [y, m, day] = d.split('-');
          return y && m && day ? `${day}/${m}/${y}` : d;
        };
        const fmtTime = (t?: string) => {
          if (!t) return '—';
          const [hh, mm] = t.split(':').map(Number);
          if (isNaN(hh)) return t;
          const period = hh >= 12 ? 'P.M' : 'A.M';
          const h12 = ((hh + 11) % 12) + 1;
          return `${String(h12).padStart(2, '0')}:${String(mm ?? 0).padStart(2, '0')} ${period}`;
        };
        return (
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-bold text-primary">Fecha y hora venta de boletería</h4>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4">
                <Field
                  label={<span className="inline-flex items-center gap-1">Fecha de inicio <Calendar className="h-3 w-3 text-primary" /></span>}
                  value={fmtDate(formData.salesStartDate)}
                />
                <Field
                  label={<span className="inline-flex items-center gap-1">Hora de inicio <Clock className="h-3 w-3 text-primary" /></span>}
                  value={fmtTime(formData.salesStartTime)}
                />
                <Field
                  label={<span className="inline-flex items-center gap-1">Fecha de finalización <Calendar className="h-3 w-3 text-primary" /></span>}
                  value={fmtDate(formData.salesEndDate)}
                />
                <Field
                  label={<span className="inline-flex items-center gap-1">Hora de finalización <Clock className="h-3 w-3 text-primary" /></span>}
                  value={fmtTime(formData.salesEndTime)}
                />
              </div>
            </div>

            <div className="h-px bg-border" />

            <div>
              <h4 className="text-sm font-bold text-primary">Política de reembolso</h4>
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">Política de reembolso</p>
                <p className="mt-0.5 text-sm font-bold text-foreground break-words">{refundLabel || '—'}</p>
              </div>
            </div>

            {onEdit && (
              <button
                onClick={() => onEdit(4)}
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary px-4 py-3 text-sm font-bold text-primary"
              >
                <Pencil className="h-4 w-4" />
                Editar información
              </button>
            )}
          </div>
        );
      }
      case 'faqs': {
        const EditBtn = onEdit ? (
          <button
            onClick={() => onEdit(5)}
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary px-4 py-3 text-sm font-bold text-primary"
          >
            <Pencil className="h-4 w-4" />
            Editar información
          </button>
        ) : null;
        if (formData.faqs.length === 0) {
          return (
            <div className="space-y-3">
              <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                  <HelpCircle className="h-7 w-7 text-primary" />
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">Sin preguntas frecuentes</p>
                <p className="mt-1 text-xs text-muted-foreground">Agrega FAQs en el paso correspondiente del wizard.</p>
              </div>
              {EditBtn}
            </div>
          );
        }
        return (
          <div className="space-y-4">
            {formData.faqs.map((f) => (
              <div key={f.id}>
                <p className="text-sm font-bold text-foreground break-words">{f.question}</p>
                {f.answer && (
                  <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap break-words">{f.answer}</p>
                )}
              </div>
            ))}
            {EditBtn}
          </div>
        );
      }
      case 'agenda': {
        const EditBtn = onEdit ? (
          <button
            onClick={() => onEdit(6)}
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary px-4 py-3 text-sm font-bold text-primary"
          >
            <Pencil className="h-4 w-4" />
            Editar información
          </button>
        ) : null;
        if (formData.agenda.length === 0) {
          return (
            <div className="space-y-3">
              <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                  <Clock className="h-7 w-7 text-primary" />
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">Sin agenda configurada</p>
                <p className="mt-1 text-xs text-muted-foreground">Define días y actividades en el paso de agenda.</p>
              </div>
              {EditBtn}
            </div>
          );
        }
        const fmtDate = (d?: string) => {
          if (!d) return '';
          const [y, m, day] = d.split('-');
          return y && m && day ? `${day}/${m}/${y}` : d;
        };
        return (
          <div className="space-y-4">
            {formData.agenda.map((d, i) => (
              <div key={d.id} className="rounded-2xl border border-border bg-card p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">
                      {d.name || `Día ${i + 1}`}
                    </p>
                    {d.date && <p className="text-xs text-muted-foreground">{fmtDate(d.date)}</p>}
                  </div>
                </div>
                {d.activities.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">Sin actividades.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {d.activities.map((a) => (
                      <div key={a.id} className="rounded-xl bg-secondary/60 p-2.5">
                        <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                          <Clock className="h-3 w-3" />
                          {a.startTime}{a.endTime ? ` - ${a.endTime}` : ''}
                        </div>
                        <p className="mt-0.5 text-sm font-bold text-foreground break-words">
                          {a.description || '—'}
                        </p>
                        {a.responsible?.name && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Responsable: {a.responsible.name}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {EditBtn}
          </div>
        );
      }
    }
  };

  return (
    <div className="relative pb-24">
      <h2 className="flex items-center gap-2 text-xl font-extrabold text-primary">
        <FileText className="h-5 w-5" /> Resumen del evento
      </h2>

      <div className="mt-4 space-y-3">
        {SECTIONS.map(({ key, label, icon: Icon }) => {
          const isOpen = open[key];
          return (
            <div key={key} className="rounded-2xl border border-border bg-card shadow-sm">
              <button
                onClick={() => toggle(key)}
                className="flex w-full items-center gap-3 px-4 py-4 text-left"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-2 ring-primary/20">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
                {isOpen
                  ? <ChevronUp className="h-4 w-4 text-primary" />
                  : <ChevronDown className="h-4 w-4 text-primary" />}
              </button>
              {isOpen && <div className="border-t border-border/60 px-4 py-3">{renderBody(key)}</div>}
            </div>
          );
        })}
      </div>

      {/* Floating Acciones */}
      <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-6 z-30 flex flex-col items-end gap-3">
        {fabOpen && (
          <div className="flex flex-col items-end gap-3">
            <button
              onClick={() => { setFabOpen(false); onSave(); }}
              className="flex items-center gap-2 rounded-full bg-card px-3 py-2 shadow-md"
            >
              <span className="text-sm font-semibold text-foreground">Guardar</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Save className="h-4 w-4" />
              </span>
            </button>
            <button
              onClick={() => { setFabOpen(false); onPreview(); }}
              className="flex items-center gap-2 rounded-full bg-card px-3 py-2 shadow-md"
            >
              <span className="text-sm font-semibold text-foreground">Previsualizar</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Eye className="h-4 w-4" />
              </span>
            </button>
            <button
              disabled={publishing}
              onClick={() => { setFabOpen(false); onPublish(); }}
              className="flex items-center gap-2 rounded-full bg-card px-3 py-2 shadow-md disabled:opacity-50"
            >
              <span className="text-sm font-semibold text-foreground">
                {publishing ? `${publishLabel}…` : publishLabel}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
              </span>
            </button>
          </div>
        )}
        <button
          onClick={() => setFabOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-primary-foreground shadow-lg"
        >
          <span className="text-sm font-bold">Acciones</span>
          {fabOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          <Menu className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default StepEventSummary;
