import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import MediaGalleryLightbox from '../../../components/MediaGalleryLightbox';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
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

const Stars = ({ value }: { value: number }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${i <= value ? 'fill-primary text-primary' : 'text-primary'}`}
      />
    ))}
  </div>
);

const PersonAvatar = ({ person }: { person: InvitationPerson }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = person.initials
    || person.name.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    || 'DE';
  if (!person.avatar || imgFailed) {
    return (
      <div className="h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center text-lg font-bold text-primary">
        {initials}
      </div>
    );
  }
  return (
    <img
      src={person.avatar}
      alt={person.name}
      className="h-16 w-16 rounded-full object-cover"
      onError={() => setImgFailed(true)}
    />
  );
};

const PersonCard = ({ person }: { person: InvitationPerson }) => {
  const navigate = useNavigate();

  const openProfile = () => {
    if (!person.userId) return;
    navigate(`/users/${encodeURIComponent(person.userId)}`);
  };

  return (
    <div
      className={`rounded-2xl bg-card p-4 shadow-sm${
        person.userId ? ' cursor-pointer transition-shadow hover:shadow-md active:scale-[0.99]' : ''
      }`}
      role={person.userId ? 'button' : undefined}
      tabIndex={person.userId ? 0 : undefined}
      onClick={person.userId ? openProfile : undefined}
      onKeyDown={person.userId ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openProfile();
        }
      } : undefined}
    >
    <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
      <div className="flex flex-col items-center">
        <PersonAvatar person={person} />
        <p className="text-sm font-bold text-foreground mt-2">{person.name}</p>
      </div>
      <div className="flex flex-col items-end">
        <p className="text-sm text-muted-foreground">Calificación</p>
        <Stars value={person.rating} />
        <div className="grid grid-cols-2 gap-6 mt-3 w-full">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{person.eventsCount}</p>
            <p className="text-xs text-muted-foreground">Eventos realizados</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">%{person.experiencePct}</p>
            <p className="text-xs text-muted-foreground">Experiencia</p>
          </div>
        </div>
      </div>
    </div>
    </div>
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
  const images = event.images?.length ? event.images : (event.image ? [event.image] : []);
  const agenda = event.agenda ?? [];
  const venue = event.venue ?? { name: 'Lugar del evento', address: '—', images: [] as string[] };
  const venueImages = venue.images ?? [];

  const [imgIdx, setImgIdx] = useState(0);
  const [likedLocal, setLikedLocal] = useState(false);
  const liked = likedProp ?? likedLocal;
  const [showMore, setShowMore] = useState(true);
  const [showVenueImgs, setShowVenueImgs] = useState(true);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  if (showFAQ) return <EventFAQView onBack={() => setShowFAQ(false)} />;
  if (showPolicy) return <RefundPolicyView onBack={() => setShowPolicy(false)} />;
  if (showPurchase && !onPurchase) {
    return <TicketPurchaseFlow event={event} onBack={() => { setShowPurchase(false); onPurchaseEnd?.(); }} onSuccess={onSuccess} />;
  }

  return (
    <div className={`mx-auto max-w-lg ${contentBottomPadding}`}>
      <div className="px-4 pt-4">
        <button onClick={onBack} className="flex items-center gap-1 text-primary font-medium mb-3">
          <ChevronLeft className="h-5 w-5" />
          Atras
        </button>
      </div>

      {/* Image carousel */}
      <div className="px-4">
        <div className="relative rounded-2xl overflow-hidden">
          {images.length > 0 ? (
            <button
              type="button"
              className="block w-full"
              onClick={() => { setGalleryIndex(imgIdx); setGalleryOpen(true); }}
            >
              <img src={images[imgIdx] || images[0]} alt={event.title} className="w-full h-56 object-cover" />
            </button>
          ) : (
            <div className="flex h-56 w-full items-center justify-center bg-muted text-sm text-muted-foreground">
              Sin imagen
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex justify-center gap-2 mt-3">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === imgIdx ? 'w-8 bg-primary' : 'w-6 bg-primary/30'
                }`}
              />
            ))}
          </div>
        )}
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
            className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 text-primary"
          >
            <Heart className={`h-5 w-5 ${liked ? 'fill-primary' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onChat}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 text-primary"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onReply}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 text-primary"
          >
            <Reply className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onShare}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 text-primary"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Summary card */}
      <div className="px-4 mt-3">
        <div className="rounded-2xl bg-card p-4 shadow-sm space-y-4">
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
                  {day.items.map((it, ii) => (
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

            {/* Venue */}
            <div className="rounded-2xl bg-card p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <HomeIcon className="h-6 w-6 text-primary mt-1" />
                <div className="flex-1">
                  <h4 className="text-base font-bold">{venue.name}</h4>
                  <p className="text-sm text-muted-foreground">{venue.address}</p>
                </div>
              </div>
              {venueImages.length > 0 && (
                <>
                  <button
                    onClick={() => setShowVenueImgs((v) => !v)}
                    className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary"
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
                className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary"
              >
                <MapPin className="h-4 w-4" />
                Ver ubicación en el mapa
              </button>
            </div>

            {/* Video */}
            {event.videoUrl && (
              <div>
                <h3 className="text-base font-bold mb-2">Video del evento</h3>
                <a
                  href={event.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block relative rounded-2xl overflow-hidden bg-black aspect-video"
                >
                  <img
                    src={event.image}
                    alt="video"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90">
                      <Play className="h-6 w-6 text-foreground fill-foreground ml-1" />
                    </span>
                  </span>
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm font-semibold text-white">
                    Ver video en YouTube <ExternalLink className="h-4 w-4" />
                  </span>
                </a>
              </div>
            )}

            {/* Organizer */}
            <div>
              <h3 className="text-base font-bold mb-2">Organizador del evento</h3>
              <PersonCard person={event.organizer} />
            </div>

            {/* Host */}
            <div>
              <h3 className="text-base font-bold mb-2">Anfitrión del evento</h3>
              <PersonCard person={event.host} />
            </div>

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

      <MediaGalleryLightbox
        images={images}
        initialIndex={galleryIndex}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        title={event.title}
      />
    </div>
  );
};

export default InvitationEventDetailView;
