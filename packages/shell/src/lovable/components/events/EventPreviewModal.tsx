import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, Calendar, Clock, Tag, Users, MapPin, Home as HomeIcon, ShieldCheck, ArrowRight, Play, Eye } from 'lucide-react';
import {
  fetchUserById,
  getPersistedUserDisplayName,
  resolveCategoryDisplayLabel,
  resolveUserDisplayName,
  resolveVenueTypeDisplayLabel,
} from '@doevents/shared';
import { EventFormData, EventHost, REFUND_POLICY_OPTIONS } from '@lovable/data/eventFormData';

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
    <div className="mt-1 whitespace-pre-line text-sm font-extrabold text-foreground">{value || '—'}</div>
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

function resolvePreviewAnfitriones(
  hosts: EventHost[],
  organizer: EventHost | null,
  ownerUserId?: string,
): EventHost[] {
  const organizerIds = new Set(
    [organizer?.id, ownerUserId].filter(Boolean).map(String),
  );
  return (hosts || []).filter((host) => {
    if (host.role === 'organizer') return false;
    if (organizerIds.has(String(host.id))) return false;
    return Boolean(host.name || host.email);
  });
}

const EventPreviewModal = ({ open, onClose, data }: EventPreviewModalProps) => {
  const [showDetail, setShowDetail] = useState(false);
  const [showVenueImgs, setShowVenueImgs] = useState(true);
  const [organizerProfile, setOrganizerProfile] = useState<EventHost | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setShowDetail(false);
    setShowVenueImgs(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fromHosts = (data.hosts || []).find((host) => host.role === 'organizer') || null;
    const organizerId = data.ownerUserId || fromHosts?.id;
    if (!organizerId) {
      setOrganizerProfile(fromHosts);
      return;
    }
    if (fromHosts?.name?.trim()) {
      setOrganizerProfile(fromHosts);
      return;
    }
    let cancelled = false;
    void fetchUserById(organizerId)
      .then((profile) => {
        if (cancelled) return;
        if (!profile) {
          setOrganizerProfile({
            id: organizerId,
            name: getPersistedUserDisplayName() || 'Organizador',
            role: 'organizer',
          });
          return;
        }
        setOrganizerProfile({
          id: organizerId,
          name: resolveUserDisplayName(profile) || getPersistedUserDisplayName() || 'Organizador',
          email: profile.email,
          phone: profile.phone,
          countryCode: profile.countryCode,
          avatar: profile.avatarUrl,
          role: 'organizer',
        });
      })
      .catch(() => {
        if (!cancelled) {
          setOrganizerProfile({
            id: organizerId,
            name: getPersistedUserDisplayName() || 'Organizador',
            role: 'organizer',
          });
        }
      });
    return () => { cancelled = true; };
  }, [open, data.hosts, data.ownerUserId]);

  if (!open) return null;

  const organizer = organizerProfile
    || (data.hosts || []).find((host) => host.role === 'organizer')
    || null;
  const anfitriones = resolvePreviewAnfitriones(data.hosts || [], organizer, data.ownerUserId);

  const heroImg = (data.images || [])[0];
  const refundLabel = data.refundPolicy
    ? REFUND_POLICY_OPTIONS.find((o) => o.value === data.refundPolicy)?.label
    : '—';
  const venueImgs = data.location?.customImages ?? [];
  const seatingFigures = data.location?.seatingMap?.figures ?? [];
  const agenda = data.agenda || [];
  const faqs = data.faqs || [];
  const categoryLabel = resolveCategoryDisplayLabel(data.category);
  const venueTypeLabel = resolveVenueTypeDisplayLabel(data.location?.customType);

  const toggleDetail = () => {
    setShowDetail((prev) => {
      const next = !prev;
      if (next) {
        queueMicrotask(() => {
          detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/50 overflow-y-auto">
      <div className="mx-auto min-h-screen max-w-lg bg-secondary">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-secondary px-4 pt-4 pb-3 shadow-sm">
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20 text-primary">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
            <Eye className="h-5 w-5 text-primary" />
          </span>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl bg-card ring-2 ring-primary/20 text-muted-foreground shadow-sm">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pb-12">
          {/* Hero */}
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            {heroImg ? (
              <img src={heroImg} alt={data.name} className="h-44 w-full object-cover" />
            ) : (
              <div className="flex h-44 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 border-border/60 bg-muted shadow-sm">
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
            <p className="text-xs font-extrabold text-muted-foreground">Vista previa — las interacciones estarán disponibles al publicar</p>
          </div>

          {/* Date / details card */}
          <div className="mt-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <Field icon={Calendar} label="Fecha" value={`Inicio\n${formatDate(data.startDate)}\n\nFin\n${formatDate(data.endDate)}`} />
              <Field icon={Clock} label="Hora" value={`Inicio\n${data.startTime || '—'}\n\nFin\n${data.endTime || '—'}`} />
            </div>
            <div className="my-4 border-t border-border/60" />
            <div className="grid grid-cols-2 gap-4">
              <Field icon={Tag} label="Categoría" value={categoryLabel} />
              <Field icon={Tag} label="Clase de evento" value={data.eventClass === 'public' ? 'Público' : 'Privado'} />
              <Field icon={Users} label="Aforo" value={String(data.capacity || '—')} />
              <Field icon={HomeIcon} label="Tipo de lugar" value={venueTypeLabel} />
            </div>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={toggleDetail}
                className="inline-flex min-h-11 items-center justify-center px-4 py-2 text-sm font-extrabold text-primary"
              >
                {showDetail ? 'Más detalle del evento  -' : 'Más detalle del evento  +'}
              </button>
            </div>
          </div>

          {showDetail && (
            <div ref={detailRef} className="scroll-mt-4">
              {/* Descripción */}
              <div className="mt-4">
                <h3 className="text-sm font-extrabold text-foreground">Descripción de evento</h3>
                <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">{data.description || '—'}</p>
              </div>

              {/* Agenda */}
              {agenda.length > 0 && (
                <div className="mt-6 space-y-4">
                  {agenda.map((day, i) => (
                    <div key={day.id || i} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <div className="text-base font-extrabold text-foreground">Agenda Día {i + 1}</div>
                          <div className="text-xs text-muted-foreground">{day.name || formatDate(day.date)}</div>
                        </div>
                      </div>
                      <div className="mt-4 space-y-3 border-l-2 border-primary/30 pl-4">
                        {(day.activities || []).map((a, ai) => (
                          <div key={a.id || ai} className="rounded-xl border border-border/60 bg-secondary p-3 shadow-sm">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-extrabold text-primary">
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
                    <div className="font-extrabold text-foreground">{data.location?.customName || '—'}</div>
                    <div className="text-xs text-muted-foreground">{data.location?.customAddress || data.location?.detectedCity}</div>
                  </div>
                </div>
                {(venueImgs.length > 0 || seatingFigures.length > 0) && (
                  <button type="button" onClick={() => setShowVenueImgs((v) => !v)} className="mt-3 flex min-h-10 items-center gap-1 text-sm font-extrabold text-primary">
                    {showVenueImgs ? '∧ Ocultar imágenes del lugar' : '∨ Ver imágenes del lugar'}
                  </button>
                )}
                {showVenueImgs && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {venueImgs.map((src, i) => (
                      <img key={i} src={src} className="h-20 w-20 rounded-lg border border-border/60 object-cover shadow-sm" />
                    ))}
                    {seatingFigures.length > 0 && (
                      <div className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-border/60 bg-secondary text-center text-[10px] text-muted-foreground shadow-sm">
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
                    <a href={data.videoUrl} target="_blank" rel="noreferrer" className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-card px-3 py-1 text-xs font-extrabold text-foreground shadow-sm ring-2 ring-primary/20">
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
                      {(organizer?.initials || organizer?.name?.slice(0, 2) || 'TU').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-extrabold text-foreground">{organizer?.name || 'Organizador'}</div>
                      {organizer?.email && (
                        <p className="mt-1 text-xs text-muted-foreground">{organizer.email}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        Estadísticas del organizador disponibles tras publicar el evento.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {anfitriones.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-extrabold text-foreground">Anfitrión del evento</h3>
                  {anfitriones.map((host) => (
                    <div key={host.id} className="mt-2 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 ring-2 ring-primary/20 text-base font-extrabold text-primary">
                          {(host.initials || host.name?.slice(0, 2) || 'AN').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-extrabold text-foreground">{host.name}</div>
                          {host.email && <div className="text-xs text-muted-foreground">{host.email}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* FAQs */}
              {faqs.length > 0 && (
                <div className="mt-6 rounded-2xl border border-border/60 bg-card p-4 shadow-sm flex items-center justify-between">
                  <span className="font-extrabold text-foreground">Preguntas frecuentes</span>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
              )}

              {/* Reembolsos */}
              <div className="mt-4 rounded-2xl border border-border/60 bg-primary/10 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="font-extrabold">Solicita tu reembolso</span>
                </div>
                <p className="mt-2 text-sm font-extrabold text-foreground">{refundLabel}</p>
                <button type="button" className="mt-3 w-full rounded-full bg-card py-2.5 text-sm font-extrabold text-primary shadow-sm">
                  Ver política de reembolsos →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventPreviewModal;

