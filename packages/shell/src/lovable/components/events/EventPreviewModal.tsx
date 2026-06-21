import { useState } from 'react';
import { X, ChevronLeft, Calendar, Clock, Tag, Users, MapPin, Home as HomeIcon, ShieldCheck, ArrowRight, Star, Play, Eye } from 'lucide-react';
import { EventFormData, REFUND_POLICY_OPTIONS } from '@lovable/data/eventFormData';

interface EventPreviewModalProps {
  open: boolean;
  onClose: () => void;
  data: EventFormData;
}

const Field = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div>
    <div className="flex items-center gap-1.5 text-sm text-foreground">
      <Icon className="h-4 w-4 text-primary" />
      <span className="font-extrabold">{label}</span>
    </div>
    <div className="mt-1 text-sm text-foreground">{value || '—'}</div>
  </div>
);

const formatDate = (d: string) => {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    if (isNaN(+dt)) return d;
    return dt.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return d; }
};

const EventPreviewModal = ({ open, onClose, data }: EventPreviewModalProps) => {
  const [showDetail, setShowDetail] = useState(true);
  const [showVenueImgs, setShowVenueImgs] = useState(true);
  if (!open) return null;

  const heroImg = data.images[0];
  const refundLabel = data.refundPolicy
    ? REFUND_POLICY_OPTIONS.find((o) => o.value === data.refundPolicy)?.label
    : '—';
  const venueImgs = data.location.customImages ?? [];
  const seatingFigures = data.location.seatingMap?.figures ?? [];

  return (
    <div className="fixed inset-0 z-[250] bg-black/50 overflow-y-auto">
      <div className="mx-auto min-h-screen max-w-lg bg-secondary">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-secondary px-4 pt-4 pb-3 shadow-sm">
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20 text-primary">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
            <Eye className="h-5 w-5 text-primary" />
          </span>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl bg-card ring-2 ring-primary/20 text-muted-foreground shadow-sm">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pb-12">
          {/* Hero */}
          <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
            {heroImg ? (
              <img src={heroImg} alt={data.name} className="h-44 w-full object-cover" />
            ) : (
              <div className="flex h-44 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-muted">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                  <Eye className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm font-extrabold text-foreground">Sin imagen</p>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
              <Eye className="h-5 w-5 text-primary" />
            </span>
            <h1 className="text-2xl font-extrabold text-primary leading-tight">{data.name || 'Sin nombre'}</h1>
          </div>
          <div className="mt-2">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">
              {data.persistedEventId ? 'Borrador guardado' : 'Vista previa — borrador'}
            </span>
          </div>

          {/* Preview-only notice */}
          <div className="mt-3 flex items-center justify-between rounded-xl border border-border/60 bg-primary/5 px-3 py-2 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Vista previa — las interacciones estarán disponibles al publicar</p>
          </div>

          {/* Date / details card */}
          <div className="mt-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <Field icon={Calendar} label="Fecha" value={`Inicio\n${formatDate(data.startDate)}\n\nFin\n${formatDate(data.endDate)}`} />
              <Field icon={Clock} label="Hora" value={`Inicio\n${data.startTime || '—'}\n\nFin\n${data.endTime || '—'}`} />
            </div>
            <div className="my-4 border-t border-border/60" />
            <div className="grid grid-cols-2 gap-4">
              <Field icon={Tag} label="Categoría" value={data.category} />
              <Field icon={Tag} label="Clase de evento" value={data.eventClass === 'public' ? 'Público' : 'Privado'} />
              <Field icon={Users} label="Aforo" value={data.capacity} />
              <Field icon={HomeIcon} label="Tipo de lugar" value={data.location.customType || '—'} />
            </div>
            <div className="mt-4 text-center">
              <button onClick={() => setShowDetail((v) => !v)} className="text-sm font-extrabold text-primary">
                {showDetail ? 'Más detalle del evento  -' : 'Más detalle del evento  +'}
              </button>
            </div>
          </div>

          {showDetail && (
            <>
              {/* Descripción */}
              <div className="mt-4">
                <h3 className="text-sm font-extrabold text-foreground">Descripción de evento</h3>
                <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">{data.description || '—'}</p>
              </div>

              {/* Agenda */}
              {data.agenda.length > 0 && (
                <div className="mt-6 space-y-4">
                  {data.agenda.map((day, i) => (
                    <div key={day.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <div className="text-base font-extrabold text-foreground">Agenda Día {i + 1}</div>
                          <div className="text-xs text-muted-foreground">{day.name || formatDate(day.date)}</div>
                        </div>
                      </div>
                      <div className="mt-4 space-y-3 border-l-2 border-primary/30 pl-4">
                        {day.activities.map((a) => (
                          <div key={a.id} className="rounded-xl bg-secondary p-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
                              <Clock className="h-3 w-3" /> {a.startTime} - {a.endTime}
                            </span>
                            <div className="mt-2 text-sm text-foreground">{a.description}</div>
                            {a.responsible && (
                              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" /> {a.responsible.name}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Lugar */}
              <div className="mt-6 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20 text-primary">
                    <HomeIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-extrabold text-foreground">{data.location.customName || '—'}</div>
                    <div className="text-xs text-muted-foreground">{data.location.customAddress || data.location.detectedCity}</div>
                  </div>
                </div>
                {(venueImgs.length > 0 || seatingFigures.length > 0) && (
                  <button onClick={() => setShowVenueImgs((v) => !v)} className="mt-3 flex items-center gap-1 text-sm font-extrabold text-primary">
                    {showVenueImgs ? '∧ Ocultar imágenes del lugar' : '∨ Ver imágenes del lugar'}
                  </button>
                )}
                {showVenueImgs && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {venueImgs.map((src, i) => (
                      <img key={i} src={src} className="h-20 w-20 rounded-lg object-cover" />
                    ))}
                    {seatingFigures.length > 0 && (
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-secondary text-[10px] text-muted-foreground text-center">
                        Mapa de butacas
                      </div>
                    )}
                  </div>
                )}
                <p className="mt-3 flex items-center gap-1 text-sm font-extrabold text-muted-foreground">
                  <MapPin className="h-4 w-4" /> Ubicación visible al publicar el evento
                </p>
              </div>

              {/* Video */}
              {data.videoUrl && (
                <div className="mt-6">
                  <h3 className="text-sm font-extrabold text-foreground">Video del evento</h3>
                  <div className="mt-2 relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex h-44 items-center justify-center bg-foreground/10">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-card/90 text-foreground ring-2 ring-primary/20">
                        <Play className="h-5 w-5" />
                      </div>
                    </div>
                    <a href={data.videoUrl} target="_blank" rel="noreferrer" className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-card px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                      Ver video en YouTube ↗
                    </a>
                  </div>
                </div>
              )}

              {/* Organizador */}
              <div className="mt-6">
                <h3 className="text-sm font-extrabold text-foreground">Organizador del evento</h3>
                <div className="mt-2 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 ring-2 ring-primary/20 text-base font-extrabold text-primary">
                      {(data.hosts[0]?.initials || 'TU').slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <div className="font-extrabold text-foreground">{data.hosts[0]?.name || 'Organizador'}</div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Estadísticas del organizador disponibles tras publicar el evento.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Anfitriones */}
              {data.hosts.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-extrabold text-foreground">Anfitrión del evento</h3>
                  {data.hosts.map((h) => (
                    <div key={h.id} className="mt-2 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 ring-2 ring-primary/20 text-base font-extrabold text-primary">{h.initials || h.name?.slice(0,2).toUpperCase()}</div>
                        <div className="flex-1">
                          <div className="font-extrabold text-foreground">{h.name}</div>
                          {h.role && <div className="text-xs text-muted-foreground">{h.role}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* FAQs */}
              {data.faqs.length > 0 && (
                <div className="mt-6 rounded-2xl border border-border/60 bg-card p-4 shadow-sm flex items-center justify-between">
                  <span className="font-extrabold text-foreground">Preguntas frecuentes</span>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
              )}

              {/* Reembolsos */}
              <div className="mt-4 rounded-2xl border border-border/60 bg-primary/10 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="font-bold">Solicita tu reembolso</span>
                </div>
                <p className="mt-2 text-sm text-foreground">{refundLabel}</p>
                <button className="mt-3 w-full rounded-full bg-card py-2.5 text-sm font-extrabold text-primary shadow-sm">
                  Ver política de reembolsos →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventPreviewModal;
