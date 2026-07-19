import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import DetailMediaCarousel from '../common/DetailMediaCarousel';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  Clock,
  Shapes,
  Tag,
  Users,
  Building2,
  Heart,
  MessageSquare,
  Share2,
  Reply,
  ChevronDown,
  ChevronUp,
  MapPin,
  Play,
  ExternalLink,
  Star,
  ShieldCheck,
  ArrowRight,
  Home as HomeIcon,
  User as UserIcon,
} from 'lucide-react';
import { InvitationEvent, InvitationPerson } from '@lovable/data/invitationsData';
import { UserAvatar } from '@doevents/shared';
import { toast } from 'sonner';
import EventFAQView from './EventFAQView';
import RefundPolicyView from './RefundPolicyView';
import TicketPurchaseFlow from './TicketPurchaseFlow';

interface Props {
  event: InvitationEvent;
  onBack: () => void;
  onSuccess?: () => void;
  onPurchase?: () => void;
  onPurchaseStart?: () => void;
  onPurchaseEnd?: () => void;
  onChat?: () => void;
  onShare?: () => void;
  onLike?: () => void;
  onReply?: () => void;
  liked?: boolean;
  canPurchase?: boolean;
  onPublish?: () => void;
  publishing?: boolean;
  onMapClick?: () => void;
  contentBottomPadding?: string;
  servicesSection?: ReactNode;
}

function resolveVideoEmbedUrl(url?: string): string | null {
  const raw = String(url || '').trim();
  if (!raw) return null;
  const ytMatch = raw.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

function youtubeThumbnailFromUrl(videoUrl?: string): string | undefined {
  const match = videoUrl?.trim().match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i,
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : undefined;
}

const Stars = ({ value }: { value: number }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${i <= value ? 'fill-primary text-primary' : 'fill-transparent text-primary'}`}
      />
    ))}
  </div>
);

const PersonAvatar = ({ person }: { person: InvitationPerson }) => {
  return (
    <UserAvatar
      name={person.name}
      imageUrl={person.avatar}
      userId={person.userId}
      size={64}
      className="shrink-0 rounded-full object-cover"
    />
  );
};

const PersonCard = ({ person }: { person: InvitationPerson }) => {
  const navigate = useNavigate();

  const openProfile = () => {
    if (!person.userId) {
      toast.error('Este perfil no está disponible');
      return;
    }
    navigate(`/users/${encodeURIComponent(person.userId)}`);
  };

  return (
    <button
      type="button"
      onClick={openProfile}
      className="block w-full rounded-2xl bg-card p-4 text-left shadow-sm transition hover:bg-card/80 hover:shadow-md active:scale-[0.99]"
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
          <p className="text-sm text-muted-foreground">Calificación</p>
          <Stars value={person.rating || 0} />
          <p className="mt-3 text-lg font-bold leading-none text-foreground">{person.experiencePct ?? 0}%</p>
          <p className="mt-1 text-xs text-muted-foreground">Experiencia</p>
        </div>
      </div>
    </button>
  );
};

const InvitationEventDetailView = ({
  event,
  onBack,
  onSuccess,
  onPurchase,
  onPurchaseStart,
  onPurchaseEnd,
  onChat,
  onShare,
  onLike,
  onReply,
  liked: likedProp,
  canPurchase = true,
  onPublish,
  publishing,
  onMapClick,
  contentBottomPadding = 'pb-32',
  servicesSection,
}: Props) => {
  const navigate = useNavigate();
  const images = event.images?.length ? event.images : (event.image ? [event.image] : []);
  const agenda = event.agenda ?? [];
  const venue = event.venue ?? { name: 'Lugar del evento', address: '—', images: [] as string[] };
  const venueImages = venue.images ?? [];
  const venueLat = Number(venue.latitude);
  const venueLng = Number(venue.longitude);
  const hasVenueCoords = Number.isFinite(venueLat) && Number.isFinite(venueLng);
  const mapQuery = hasVenueCoords
    ? `${venueLat},${venueLng}`
    : [venue.address, venue.name]
      .map((v) => (v || '').trim())
      .filter((v) => v && v !== '—')
      .join(', ');
  const mapEmbedSrc = mapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed`
    : null;
  const hasLocationInfo = Boolean(mapEmbedSrc)
    || Boolean(venue.name && venue.name !== 'Lugar del evento')
    || Boolean(venue.address && venue.address !== '—');

  const [likedLocal, setLikedLocal] = useState(false);
  const liked = likedProp ?? likedLocal;
  const [showMore, setShowMore] = useState(true);
  const [showVenueImgs, setShowVenueImgs] = useState(true);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);

  if (showFAQ) return <EventFAQView onBack={() => setShowFAQ(false)} />;
  if (showPolicy) return <RefundPolicyView onBack={() => setShowPolicy(false)} />;
  if (showPurchase && !onPurchase && !event.id) {
    return <TicketPurchaseFlow event={event} onBack={() => { setShowPurchase(false); onPurchaseEnd?.(); }} onSuccess={onSuccess} />;
  }

  return (
    <div className={`mx-auto max-w-lg ${contentBottomPadding}`}>
      <div className="sticky top-[60px] z-40 border-b border-border/40 bg-secondary/95 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-primary font-semibold"
        >
          <ChevronLeft className="h-5 w-5" />
          Volver
        </button>
      </div>

      {/* Image carousel — swipe lateral */}
      <div className="px-4 pt-4">
        <DetailMediaCarousel
          images={images}
          alt={event.title}
          frameClassName="h-56"
          emptyFallback={(
            <div className="flex h-56 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-muted">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <CalendarDays className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Sin imagen del evento</p>
            </div>
          )}
        />
      </div>

      {/* Title + state */}
      <div className="px-4 mt-4">
        <h1 className="text-2xl font-extrabold text-primary leading-tight">{event.title}</h1>
        <span className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Estado: {event.state}
        </span>

        {/* Action row */}
        <div className="flex items-center justify-end gap-3 mt-3">
          <button
            type="button"
            onClick={() => {
              if (onLike) onLike();
              else setLikedLocal((v) => !v);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 transition-transform active:scale-95"
          >
            <Heart className={`h-5 w-5 ${liked ? 'fill-primary text-primary' : 'text-primary'}`} />
          </button>
          <button
            type="button"
            onClick={onChat}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 transition-transform active:scale-95"
          >
            <MessageSquare className="h-5 w-5 text-primary" />
          </button>
          <button
            type="button"
            onClick={onReply}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 transition-transform active:scale-95"
          >
            <Reply className="h-5 w-5 text-primary" />
          </button>
          <button
            type="button"
            onClick={onShare}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 transition-transform active:scale-95"
          >
            <Share2 className="h-5 w-5 text-primary" />
          </button>
        </div>
      </div>

      {/* Summary card */}
      <div className="px-4 mt-3">
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-bold">Fecha</span>
              </div>
              <p className="text-xs text-muted-foreground">Inicio</p>
              <p className="text-sm font-medium">{event.startDate}</p>
              <p className="text-xs text-muted-foreground mt-2">Fin</p>
              <p className="text-sm font-medium">{event.endDate}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 mb-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-bold">Hora</span>
              </div>
              <p className="text-xs text-muted-foreground">Inicio</p>
              <p className="text-sm font-medium">{event.startTime}</p>
              <p className="text-xs text-muted-foreground mt-2">Fin</p>
              <p className="text-sm font-medium">{event.endTime}</p>
            </div>
          </div>

          <div className="border-t border-border" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Shapes className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Categoría</span>
              </div>
              <p className="text-sm font-medium mt-1">{event.category}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Tag className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Clase de evento</span>
              </div>
              <p className="text-sm font-medium mt-1">{event.eventClass}</p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Aforo</span>
              </div>
              <p className="text-sm font-medium mt-1">{event.capacity}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Tipo de lugar</span>
              </div>
              <p className="text-sm font-medium mt-1">{event.venueType}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ubicación — siempre visible con mapa embebido */}
      {hasLocationInfo && (
        <div className="px-4 mt-5">
          <div className="rounded-2xl overflow-hidden border border-border/60 bg-card shadow-sm">
            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold">Ubicación</h3>
            </div>
            {mapEmbedSrc && (
              <div className="relative mx-4 aspect-video overflow-hidden rounded-xl bg-secondary/30">
                <iframe
                  src={mapEmbedSrc}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0"
                  title="Ubicación del evento"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start gap-3">
                <HomeIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-foreground">{venue.name}</h4>
                  {venue.address && venue.address !== '—' && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{venue.address}</p>
                  )}
                </div>
              </div>
              {venueImages.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowVenueImgs((v) => !v)}
                    className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary"
                  >
                    {showVenueImgs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {showVenueImgs ? 'Ocultar' : 'Ver'} imágenes del lugar
                  </button>
                  {showVenueImgs && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {venueImages.map((img, i) => (
                        <img key={i} src={img} alt="" className="h-24 w-24 rounded-xl object-cover" />
                      ))}
                    </div>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={() => (onMapClick ? onMapClick() : toast.info('Abriendo mapa...'))}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/5 py-2.5 text-sm font-semibold text-primary"
              >
                <ExternalLink className="h-4 w-4" />
                Ver ubicación en el mapa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Más detalle del evento */}
      <div className="px-4 mt-5">
        <button
          onClick={() => setShowMore((v) => !v)}
          className="w-full flex items-center justify-end gap-1 text-primary font-semibold"
        >
          Más detalle del evento {showMore ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showMore && (
          <div className="mt-4 space-y-5">
            <div>
              <h3 className="text-base font-bold mb-1">Descripción de evento</h3>
              <p className="text-sm text-foreground">{event.description}</p>
            </div>

            {servicesSection}

            <div className="border-t border-border" />

            {/* Agenda */}
            {agenda.map((day, di) => (
              <div key={di} className="rounded-2xl bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-primary" />
                  <div>
                    <h4 className="text-lg font-bold">Agenda {day.dayLabel}</h4>
                    <p className="text-xs text-muted-foreground">{day.dateLabel}</p>
                  </div>
                </div>
                <div className="mt-4 relative pl-5 space-y-3 border-l-2 border-primary/40">
                  {(day.items ?? []).map((it, ii) => (
                    <div key={ii} className="relative">
                      <span className="absolute -left-[26px] top-3 h-3 w-3 rounded-full bg-primary" />
                      <div className="rounded-xl bg-muted/40 border border-border p-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {it.startTime} - {it.endTime}
                        </span>
                        <p className="mt-2 text-sm font-medium">{it.title}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <UserIcon className="h-3.5 w-3.5" />
                          {it.responsible}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Hashtags */}
            {event.tags && event.tags.length > 0 && (
              <div>
                <h3 className="text-base font-bold mb-2">Hashtags</h3>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary"
                    >
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Video */}
            {event.videoUrl && (
              <div>
                <h3 className="text-base font-bold mb-2">Video del evento</h3>
                {resolveVideoEmbedUrl(event.videoUrl) ? (
                  <div className="overflow-hidden rounded-2xl bg-black aspect-video">
                    <iframe
                      title={`Video de ${event.title}`}
                      src={resolveVideoEmbedUrl(event.videoUrl) || ''}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <a
                    href={event.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block relative rounded-2xl overflow-hidden bg-black aspect-video"
                  >
                    <img
                      src={youtubeThumbnailFromUrl(event.videoUrl) || event.image}
                      alt="Video del evento"
                      className="w-full h-full object-cover opacity-80"
                    />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-card/90 ring-2 ring-primary/20">
                        <Play className="h-6 w-6 text-foreground fill-foreground ml-1" />
                      </span>
                    </span>
                    <span className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm font-semibold text-white">
                      Ver video <ExternalLink className="h-4 w-4" />
                    </span>
                  </a>
                )}
              </div>
            )}

            {/* Organizer */}
            <div>
              <h3 className="text-base font-bold mb-2">Organizador del evento</h3>
              <PersonCard person={event.organizer} />
            </div>

            {/* Host */}
            {event.host?.name?.trim()
              && event.host.name.trim().toLowerCase() !== (event.organizer?.name || '').trim().toLowerCase()
              && event.host.name.trim().toLowerCase() !== 'anfitrión'
              && event.host.name.trim().toLowerCase() !== 'anfitrion' && (
              <div>
                <h3 className="text-base font-bold mb-2">Anfitrión del evento</h3>
                <PersonCard person={event.host} />
              </div>
            )}

            {/* FAQ */}
            <button
              onClick={() => setShowFAQ(true)}
              className="w-full flex items-center justify-between rounded-2xl bg-card px-4 py-4 shadow-sm"
            >
              <span className="font-bold">Preguntas frecuentes</span>
              <ChevronRight className="h-5 w-5 text-primary" />
            </button>

            {/* Refund */}
            <div className="rounded-2xl bg-primary/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </span>
                <span className="font-bold text-primary">Solicita tu reembolso</span>
              </div>
              <p className="text-sm text-foreground">{event.refundPolicy}</p>
              <button
                onClick={() => setShowPolicy(true)}
                className="mt-3 w-full rounded-xl bg-card py-3 text-sm font-semibold text-primary flex items-center justify-center gap-2"
              >
                Ver política de reembolsos <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-20 left-0 right-0 px-4 z-20">
        <div className="mx-auto max-w-lg space-y-2">
          {onPublish && (
            <button
              type="button"
              onClick={onPublish}
              disabled={publishing}
              className="w-full flex items-center justify-center gap-2 rounded-full border-2 border-primary bg-card py-3 text-sm font-bold text-primary shadow-sm disabled:opacity-60"
            >
              {publishing ? 'Publicando…' : 'Publicar evento'}
            </button>
          )}
          {canPurchase && (
            <button
              type="button"
              onClick={() => {
                if (onPurchase) {
                  onPurchaseStart?.();
                  onPurchase();
                  onPurchaseEnd?.();
                } else if (event.id) {
                  onPurchaseStart?.();
                  navigate(`/events/${event.id}/checkout`);
                  onPurchaseEnd?.();
                } else {
                  setShowPurchase(true);
                  onPurchaseStart?.();
                }
              }}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg active:scale-[0.98] transition-all"
            >
              Conseguir boletas <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvitationEventDetailView;
