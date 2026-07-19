import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, MapPin, ShieldCheck, Calendar, HelpCircle, Clock, Home,
  ChevronDown, ChevronUp, Save, Eye, Megaphone, Pencil, ExternalLink, Loader2,
  Ticket as TicketIcon, Copy, Check, Star, X,
} from 'lucide-react';
import {
  UserAvatar,
  fetchEventPromoCodes,
  isPlatformAdmin,
  fetchUserById,
  fetchUserStats,
  getPersistedUserDisplayName,
  resolveCategoryDisplayLabel,
  resolveUserDisplayName,
  resolveImageUrl,
  resolveVenueTypeDisplayLabel,
} from '@doevents/shared';
import type { EventPromoCodesPayload } from '@doevents/shared';
import { EventFormData, EventHost, REFUND_POLICY_OPTIONS, SEATING_CURRENCIES } from '@lovable/data/eventFormData';
import { resolveMapSearchQuery } from '@doevents/shared';
import { PULEP_PORTAL_URL } from '@lovable/lib/pulepColombia';
import { SeatingPreview } from './StepEventLocation';
import { toast } from 'sonner';

interface StepEventSummaryProps {
  formData: EventFormData;
  onEdit?: (step: number) => void;
  onSave: () => void;
  onPreview: () => void;
  onPublish: () => void;
  publishing?: boolean;
  publishLabel?: string;
  viewerUserId?: string;
  platformRole?: string;
}

type SectionKey =
  | 'main' | 'location' | 'access' | 'date' | 'faqs' | 'agenda';

interface SectionDef { key: SectionKey; label: string; icon: any; editStep: number; }

type ProfilePerson = {
  id?: string;
  name: string;
  role?: string;
  username?: string;
  email?: string;
  avatar?: string;
  initials?: string;
  rating?: number;
  eventsCount?: number;
  experiencePct?: number;
};

type PersonStats = {
  rating: number;
  eventsCount: number;
  experiencePct: number;
};

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

function resolveAnfitriones(
  hosts: EventHost[],
  organizer: EventHost | null,
  ownerUserId?: string,
  viewerUserId?: string,
): EventHost[] {
  const organizerIds = new Set(
    [organizer?.id, ownerUserId, viewerUserId].filter(Boolean).map(String),
  );
  return hosts.filter((h) => {
    if (h.role === 'organizer') return false;
    if (organizerIds.has(String(h.id))) return false;
    return true;
  });
}

const StarRow = ({ value = 0 }: { value?: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i <= value ? 'fill-primary text-primary' : 'text-primary'}`}
      />
    ))}
  </div>
);

const PersonAvatar = ({ person, size = 64 }: { person: ProfilePerson; size?: number }) => {
  const avatarUrl = person.avatar ? resolveImageUrl(person.avatar) || person.avatar : '';
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={person.name}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <UserAvatar
      name={person.name}
      userId={person.id}
      size={size}
      className="shrink-0"
    />
  );
};

const PersonCard = ({
  person,
}: {
  person: ProfilePerson;
}) => {
  const navigate = useNavigate();

  const openProfile = () => {
    if (!person.id) {
      toast.error('Este perfil no está disponible');
      return;
    }
    navigate(`/users/${encodeURIComponent(person.id)}`);
  };

  return (
    <button
      type="button"
      onClick={openProfile}
      className="block w-full rounded-2xl bg-card p-4 text-left shadow-sm ring-1 ring-border/50 transition hover:bg-card/80 hover:shadow-md active:scale-[0.99]"
      aria-label={`Ver perfil de ${person.name}`}
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-4">
        <div className="flex min-w-[72px] flex-col items-center">
          <PersonAvatar person={person} />
          <p className="mt-2 max-w-[96px] truncate text-center text-sm font-bold text-foreground">
            {person.name}
          </p>
        </div>
        <div className="min-w-0 text-center">
          <p className="text-2xl font-bold leading-none text-foreground">{person.eventsCount ?? 0}</p>
          <p className="mt-1 text-xs text-muted-foreground">Eventos realizados</p>
        </div>
        <div className="flex flex-col items-end text-right">
          <p className="text-xs text-muted-foreground">Calificación</p>
          <StarRow value={person.rating} />
          <p className="mt-3 text-lg font-bold leading-none text-foreground">%{person.experiencePct ?? 0}</p>
          <p className="mt-1 text-xs text-muted-foreground">Experiencia</p>
        </div>
      </div>
    </button>
  );
};

function toProfilePerson(
  host: EventHost | null | undefined,
  roleLabel: string,
  stats?: Partial<PersonStats>,
): ProfilePerson {
  return {
    id: host?.id,
    name: host?.name || roleLabel,
    role: roleLabel,
    username: host?.username,
    email: host?.email,
    avatar: host?.avatar,
    initials: host?.initials || host?.name?.slice(0, 2).toUpperCase(),
    rating: Math.max(0, Math.min(5, Math.round(stats?.rating ?? 0))),
    eventsCount: stats?.eventsCount ?? 0,
    experiencePct: Math.max(0, Math.min(100, Math.round(stats?.experiencePct ?? 0))),
  };
}


const StepEventSummary = ({
  formData,
  onEdit,
  onSave,
  onPreview,
  onPublish,
  publishing,
  publishLabel = 'Publicar',
  viewerUserId,
  platformRole,
}: StepEventSummaryProps) => {
  const [organizerProfile, setOrganizerProfile] = useState<EventHost | null>(null);
  const [personStats, setPersonStats] = useState<Record<string, PersonStats>>({});
  const [lightbox, setLightbox] = useState<string | null>(null);

  const canViewPromoCodes = Boolean(
    formData.persistedEventId
    && viewerUserId
    && (viewerUserId === formData.ownerUserId || isPlatformAdmin(platformRole)),
  );

  useEffect(() => {
    const organizerId = formData.ownerUserId || viewerUserId;
    const fromHosts = formData.hosts.find((h) => h.role === 'organizer');
    let cancelled = false;

    const loadStats = async (userId: string) => {
      const [profileData, stats] = await Promise.all([
        fetchUserById(userId).catch(() => null),
        fetchUserStats(userId).catch(() => null),
      ]);
      if (cancelled) return { profileData, stats: null as PersonStats | null };
      const eventsCount = Number(
        stats?.eventosRealizados
        ?? stats?.eventosFinalizados
        ?? stats?.totalEventos
        ?? 0,
      );
      const rating = Number(
        stats?.calificacionPromedio
        ?? profileData?.calificacion
        ?? 0,
      );
      const experiencePct = Number(
        stats?.experienciaEventosRealizados
        ?? profileData?.experiencia
        ?? 0,
      );
      const nextStats: PersonStats = {
        rating: Math.max(0, Math.min(5, Math.round(rating))),
        eventsCount: Math.max(0, eventsCount),
        experiencePct: Math.max(0, Math.min(100, Math.round(experiencePct))),
      };
      setPersonStats((prev) => ({ ...prev, [userId]: nextStats }));
      return { profileData, stats: nextStats };
    };

    if (fromHosts) {
      setOrganizerProfile(fromHosts);
      if (fromHosts.id) {
        void loadStats(fromHosts.id).then(({ profileData }) => {
          if (cancelled || !profileData) return;
          setOrganizerProfile((prev) => ({
            ...(prev || fromHosts),
            name: prev?.name || resolveUserDisplayName(profileData) || fromHosts.name,
            email: prev?.email || profileData.email || fromHosts.email,
            avatar: prev?.avatar || profileData.imagen || fromHosts.avatar,
            username: prev?.username
              || (profileData.username ? `@${profileData.username}` : fromHosts.username),
            phone: prev?.phone || profileData.phone || fromHosts.phone,
            countryCode: prev?.countryCode || profileData.countryCode || fromHosts.countryCode,
          }));
        });
      }
      return () => { cancelled = true; };
    }
    if (!organizerId) {
      setOrganizerProfile({
        id: 'organizer',
        role: 'organizer',
        name: getPersistedUserDisplayName() || 'Organizador',
      });
      return () => { cancelled = true; };
    }

    void loadStats(organizerId)
      .then(({ profileData }) => {
        if (cancelled) return;
        if (!profileData) {
          setOrganizerProfile({
            id: organizerId,
            role: 'organizer',
            name: getPersistedUserDisplayName() || 'Organizador',
          });
          return;
        }
        setOrganizerProfile({
          id: profileData.id || organizerId,
          role: 'organizer',
          name: resolveUserDisplayName(profileData) || getPersistedUserDisplayName() || 'Organizador',
          email: profileData.email || undefined,
          phone: profileData.phone || undefined,
          countryCode: profileData.countryCode || undefined,
          avatar: profileData.imagen || undefined,
          username: profileData.username ? `@${profileData.username}` : undefined,
          source: 'platform',
        });
      })
      .catch(() => {
        if (!cancelled) {
          setOrganizerProfile({
            id: organizerId,
            role: 'organizer',
            name: getPersistedUserDisplayName() || 'Organizador',
          });
        }
      });

    return () => { cancelled = true; };
  }, [formData.hosts, formData.ownerUserId, viewerUserId]);

  useEffect(() => {
    const hostIds = Array.from(new Set(
      formData.hosts
        .filter((h) => h.role !== 'organizer' && h.id)
        .map((h) => String(h.id)),
    ));
    if (!hostIds.length) return;
    let cancelled = false;
    hostIds.forEach((hostId) => {
      void Promise.all([
        fetchUserById(hostId).catch(() => null),
        fetchUserStats(hostId).catch(() => null),
      ]).then(([profileData, stats]) => {
        if (cancelled) return;
        const eventsCount = Number(
          stats?.eventosRealizados
          ?? stats?.eventosFinalizados
          ?? stats?.totalEventos
          ?? 0,
        );
        const rating = Number(stats?.calificacionPromedio ?? profileData?.calificacion ?? 0);
        const experiencePct = Number(
          stats?.experienciaEventosRealizados ?? profileData?.experiencia ?? 0,
        );
        setPersonStats((prev) => {
          const next = {
            rating: Math.max(0, Math.min(5, Math.round(rating))),
            eventsCount: Math.max(0, eventsCount),
            experiencePct: Math.max(0, Math.min(100, Math.round(experiencePct))),
          };
          const current = prev[hostId];
          if (
            current
            && current.rating === next.rating
            && current.eventsCount === next.eventsCount
            && current.experiencePct === next.experiencePct
          ) {
            return prev;
          }
          return { ...prev, [hostId]: next };
        });
      });
    });
    return () => { cancelled = true; };
  }, [formData.hosts]);

  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    main: true, location: true, access: false,
    date: false, faqs: false, agenda: false,
  });

  const toggle = (k: SectionKey) => setOpen((s) => ({ ...s, [k]: !s[k] }));

  const refundLabel = formData.refundPolicy
    ? REFUND_POLICY_OPTIONS.find((o) => o.value === formData.refundPolicy)?.label
    : null;

  const mediaImages = (formData.images || [])
    .map((src) => resolveImageUrl(src) || src)
    .filter(Boolean);

  const renderBody = (k: SectionKey) => {
    switch (k) {
      case 'main': {
        const organizer = organizerProfile
          || formData.hosts.find((h) => h.role === 'organizer')
          || null;
        const anfitriones = resolveAnfitriones(
          formData.hosts,
          organizer,
          formData.ownerUserId,
          viewerUserId,
        );
        const organizerCard = toProfilePerson(
          organizer,
          'Organizador',
          organizer?.id ? personStats[organizer.id] : undefined,
        );
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Field label="Nombre del evento" value={formData.name} />
              <Field label="Tipo" value={formData.type} />
              <Field label="Categoría" value={resolveCategoryDisplayLabel(formData.category)} />
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

            <div>
              <p className="text-sm font-semibold text-primary">Material publicitario del evento</p>
              {mediaImages.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {mediaImages.map((src, i) => (
                    <button
                      key={`${src}-${i}`}
                      type="button"
                      onClick={() => setLightbox(src)}
                      aria-label={`Ver imagen ${i + 1}`}
                    >
                      <img
                        src={src}
                        alt={`Material ${i + 1}`}
                        className="h-20 w-20 cursor-zoom-in rounded-lg object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Sin material publicitario.</p>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-primary">Video del evento</p>
              {formData.videoUrl ? (
                <a
                  href={formData.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background"
                >
                  Ver video en YouTube <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Sin video.</p>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">#Tags</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {formData.tags.length === 0
                  ? <span className="text-xs text-muted-foreground">Sin tags</span>
                  : formData.tags.map((t, i) => <Tag key={i}>#{t}</Tag>)}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-bold text-foreground">Organizador del evento</p>
              <PersonCard person={organizerCard} />
            </div>

            <div>
              <p className="mb-2 text-sm font-bold text-foreground">Anfitrión del evento</p>
              {anfitriones.length > 0 ? (
                <div className="space-y-3">
                  {anfitriones.map((anfitrion) => {
                    const hostCard = toProfilePerson(
                      anfitrion,
                      'Anfitrión',
                      anfitrion.id ? personStats[anfitrion.id] : undefined,
                    );
                    return (
                      <PersonCard
                        key={anfitrion.id}
                        person={hostCard}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No se asignó anfitrión (opcional).
                </p>
              )}
            </div>

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
        const ticketCategories = figures.filter((f) => f.role === 'category');
        const floors = Array.from(new Set(figures.map((f) => f.floor ?? 1))).sort();
        const mapSearchQuery = resolveMapSearchQuery({
          address: l.customAddress,
          name: l.customName,
          city: l.detectedCity,
          lat: l.customLat,
          lng: l.customLng,
        });
        const mapQuery = mapSearchQuery ? encodeURIComponent(mapSearchQuery) : '';
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
              <p className="mt-1 text-sm text-foreground">{resolveVenueTypeDisplayLabel(l.customType) || '—'}</p>
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
                <div className="mt-2 overflow-hidden rounded-xl border border-border/60">
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
                    const priceLabel = cat.priceEnabled && typeof cat.price === 'number' && cat.price > 0
                      ? new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency,
                        maximumFractionDigits: 0,
                      }).format(cat.price)
                      : 'Gratis';
                    return (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5"
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
        const staffById = formData.accessStaff ?? {};
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
                <div key={g.id} className="rounded-2xl border border-border/60 bg-card p-3">
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
                        const u = staffById[uid] ?? (formData.hosts ?? []).find((h) => h.id === uid);
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
                            <UserAvatar name={u.name} imageUrl={u.avatar} userId={u.id} size={40} />
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
          const [hh, mm] = t.split(':');
          if (!hh || Number.isNaN(Number(hh))) return t;
          return `${String(hh).padStart(2, '0')}:${String(mm ?? '00').padStart(2, '0')}`;
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

            {(formData.promoCodes?.length ?? 0) > 0 && (
              <PromoCodesSummary batches={formData.promoCodes!} eventName={formData.name} />
            )}

            {canViewPromoCodes && formData.persistedEventId && !(formData.promoCodes?.length) && (
              <EventPromoCodesLivePanel
                eventId={formData.persistedEventId}
                eventName={formData.name}
                embedded
              />
            )}

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
              <div key={d.id} className="rounded-2xl border border-border/60 bg-card p-3">
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
    <div className="relative pb-8">
      <h2 className="text-xl font-extrabold text-primary">Resumen del evento</h2>

      <div className="mt-4 space-y-3">
        {SECTIONS.map(({ key, label, icon: Icon }) => {
          const isOpen = open[key];
          return (
            <div key={key} className="rounded-2xl bg-card shadow-sm">
              <button
                onClick={() => toggle(key)}
                className="flex w-full items-center gap-3 px-4 py-4 text-left"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
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

      <div className="mt-8 mb-4 flex items-start justify-around gap-4">
        <button
          type="button"
          onClick={onPreview}
          className="flex flex-col items-center gap-2 transition-transform active:scale-95"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <Eye className="h-6 w-6" />
          </span>
          <span className="text-sm font-semibold text-foreground">Previsualizar</span>
        </button>
        <button
          type="button"
          onClick={onSave}
          className="flex flex-col items-center gap-2 transition-transform active:scale-95"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <Save className="h-6 w-6" />
          </span>
          <span className="text-sm font-semibold text-foreground">Guardar</span>
        </button>
        <button
          type="button"
          disabled={publishing}
          onClick={onPublish}
          className="flex flex-col items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
            {publishing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Megaphone className="h-6 w-6" />}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {publishing ? `${publishLabel}…` : publishLabel}
          </span>
        </button>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
          role="presentation"
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightbox}
            alt=""
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

    </div>
  );
};

const EventPromoCodesLivePanel = ({
  eventId,
  eventName,
  embedded = false,
}: {
  eventId: string;
  eventName: string;
  /** Dentro de "Fecha y reembolsos"; no renderizar como acordeón de primer nivel */
  embedded?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EventPromoCodesPayload | null>(null);

  useEffect(() => {
    if (!open || data || loading) return;
    setLoading(true);
    setError(null);
    fetchEventPromoCodes(eventId)
      .then((payload) => setData(payload))
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar'))
      .finally(() => setLoading(false));
  }, [open, eventId, data, loading]);

  const allCodes = (data?.batches || []).flatMap((batch) => batch.codes || []);
  const usedSet = new Set(Object.keys(data?.redemptions || {}));
  const cancelledSet = new Set(Object.keys(data?.cancellationByCode || {}));
  const sharedSet = new Set((data?.shares || []).map((share) => share.promo_code));
  const available = allCodes.filter(
    (code) => !usedSet.has(code) && !cancelledSet.has(code) && !sharedSet.has(code),
  );
  const shared = allCodes.filter(
    (code) => sharedSet.has(code) && !usedSet.has(code) && !cancelledSet.has(code),
  );
  const used = allCodes.filter((code) => usedSet.has(code));

  const body = (
    <div className={embedded ? 'mt-3 space-y-3' : 'border-t border-border/60 px-4 py-3 space-y-3'}>
      {loading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && !error && data && (
        <>
          <p className="text-xs text-muted-foreground">
            Códigos del evento <strong>{eventName || 'sin nombre'}</strong>. Solo visible para el creador y administradores.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-background/50 p-3">
              <p className="text-xs text-muted-foreground">Disponibles</p>
              <p className="text-lg font-bold text-primary">{available.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/50 p-3">
              <p className="text-xs text-muted-foreground">Usados</p>
              <p className="text-lg font-bold text-foreground">{used.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/50 p-3">
              <p className="text-xs text-muted-foreground">Compartidos</p>
              <p className="text-lg font-bold text-indigo-600">{shared.length}</p>
            </div>
          </div>
          {available.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-foreground">Disponibles</p>
              <div className="flex flex-wrap gap-1.5">
                {available.map((code) => (
                  <span key={code} className="rounded-md border border-primary/20 bg-primary/5 px-2 py-1 font-mono text-[11px] font-semibold text-primary">
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}
          {used.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Usados</p>
              <div className="flex flex-wrap gap-1.5">
                {used.map((code) => (
                  <span key={code} className="rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-[11px] text-muted-foreground line-through">
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!allCodes.length && (
            <p className="text-sm text-muted-foreground">Este evento aún no tiene códigos promocionales generados.</p>
          )}
        </>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div>
        <div className="h-px bg-border mb-4" />
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <TicketIcon className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold text-primary">Códigos promocionales</h4>
            {data ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                {allCodes.length}
              </span>
            ) : null}
          </div>
          <ChevronDown className={`h-4 w-4 text-primary transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open ? body : null}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left"
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <TicketIcon className="h-4 w-4" />
        </div>
        <span className="flex-1 text-sm font-semibold text-foreground">Códigos promocionales</span>
        {open ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />}
      </button>
      {open ? body : null}
    </div>
  );
};

const PromoCodesSummary = ({
  batches,
  eventName,
}: {
  batches: NonNullable<EventFormData['promoCodes']>;
  eventName: string;
}) => {
  const [open, setOpen] = useState(false);
  const [openBatch, setOpenBatch] = useState<string | null>(batches[0]?.id ?? null);
  const [copied, setCopied] = useState<string | null>(null);
  const total = batches.reduce((acc, b) => acc + b.codes.length, 0);

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <TicketIcon className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-bold text-primary">Códigos promocionales</h4>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{total}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-primary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">
            Comparte estos códigos con tus clientes para que apliquen el descuento al comprar.
          </p>
          <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
            <p className="text-xs leading-relaxed text-foreground">
              La gestión completa —compartir, cancelar y ver uso— está en{' '}
              <strong>Mis estadísticas → {eventName || 'evento'} → Códigos promocionales</strong>.
            </p>
          </div>
          {batches.map((b) => {
            const isBatchOpen = openBatch === b.id;
            return (
              <div key={b.id} className="rounded-xl border border-border bg-background/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="text-sm font-bold text-foreground">
                      {b.currency} $ {b.value.toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Códigos</p>
                    <p className="text-sm font-bold text-foreground">{b.codes.length}</p>
                  </div>
                </div>
                {b.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{b.description}</p>
                )}
                <button
                  type="button"
                  onClick={() => setOpenBatch(isBatchOpen ? null : b.id)}
                  className="mt-2 flex w-full items-center justify-between rounded-lg bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary"
                >
                  <span>{isBatchOpen ? 'Ocultar códigos' : 'Ver códigos'}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isBatchOpen ? 'rotate-180' : ''}`} />
                </button>
                {isBatchOpen && (
                  <div className="mt-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => copy(b.codes.join('\n'), `${b.id}-all`)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-3 py-1.5 text-xs font-bold text-primary"
                    >
                      {copied === `${b.id}-all` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      Copiar todos
                    </button>
                    <div className="grid grid-cols-2 gap-1.5">
                      {b.codes.map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => copy(code, code)}
                          className="flex items-center justify-between rounded-md border border-border bg-card px-2 py-1 text-[11px]"
                        >
                          <span className="font-mono font-semibold text-foreground">{code}</span>
                          {copied === code ? (
                            <Check className="h-3 w-3 text-primary" />
                          ) : (
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StepEventSummary;
