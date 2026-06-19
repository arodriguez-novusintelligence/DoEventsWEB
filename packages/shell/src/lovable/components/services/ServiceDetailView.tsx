import { ServiceFormData, DAYS_FULL } from '@lovable/data/servicesData';
import {
  ChevronLeft,
  Briefcase,
  Clock,
  DollarSign,
  CalendarDays,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { useState } from 'react';
import BookingSheet, { BookingData } from '@lovable/components/services/BookingSheet';
import PaymentGatewaySheet from '@lovable/components/services/PaymentGatewaySheet';
import { toast } from 'sonner';
import DetailSocialActions from '../../../components/DetailSocialActions';
import MediaGalleryLightbox from '../../../components/MediaGalleryLightbox';

interface Props {
  service: ServiceFormData;
  onBack: () => void;
  coverImageUrl?: string;
  galleryUrls?: string[];
  description?: string;
  locationLabel?: string;
  providerUserId?: string;
  rating?: number;
  reviewCount?: number;
  providerName?: string;
  onRate?: (rating: number, comment?: string) => Promise<void>;
  liveBooking?: {
    serviceId: string;
    userId: string;
    buyer?: { firstName: string; lastName: string; email: string };
    providerUserId?: string;
  };
  canReserve?: boolean;
  onRequireLogin?: () => void;
  onOpenProvider?: () => void;
  onLike?: () => void;
  onChat?: () => void;
  onReply?: () => void;
  onShare?: () => void;
  liked?: boolean;
}

const ServiceDetailView = ({
  service,
  onBack,
  coverImageUrl,
  galleryUrls = [],
  description,
  locationLabel,
  providerUserId,
  rating = 0,
  reviewCount = 0,
  providerName,
  onRate,
  liveBooking,
  canReserve = false,
  onRequireLogin,
  onOpenProvider,
  onLike,
  onChat,
  onReply,
  onShare,
  liked,
}: Props) => {
  const [openBooking, setOpenBooking] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const images = [
    ...(coverImageUrl ? [coverImageUrl] : []),
    ...galleryUrls.filter((url) => url && url !== coverImageUrl),
    ...service.gallery.map((g) => g.preview || g.url).filter(Boolean),
  ].filter((url, i, arr) => arr.indexOf(url) === i);

  const sector = service.sectors[0] || 'Servicio';
  const allActivities = service.sectors.flatMap((s) =>
    (service.activities[s] || []).map((act) => ({ sector: s, activity: act }))
  );
  const cheapest = allActivities.reduce<{ cost: number; currency: string } | null>(
    (best, { sector: s, activity }) => {
      const p = service.activityPricing[`${s}::${activity}`];
      if (!p || !p.cost) return best;
      const n = Number(p.cost);
      return !best || n < best.cost ? { cost: n, currency: p.currency } : best;
    },
    null
  );

  const days = service.selectedDays
    .map((sel, i) => (sel ? DAYS_FULL[i] : null))
    .filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-lg pb-32">
      <div className="px-4 pt-4">
        <button onClick={onBack} className="flex items-center gap-1 text-primary font-medium mb-3">
          <ChevronLeft className="h-5 w-5" />
          Atrás
        </button>
      </div>

      <div className="px-4">
        <div className="relative rounded-2xl overflow-hidden">
          {images.length > 0 ? (
            <button
              type="button"
              className="block w-full"
              onClick={() => setGalleryOpen(true)}
            >
              <img
                src={images[activeImage] || images[0]}
                alt={providerName || sector}
                className="w-full h-56 object-cover"
              />
            </button>
          ) : (
            <div className="flex h-56 w-full items-center justify-center bg-muted text-sm text-muted-foreground">
              Sin foto del servicio
            </div>
          )}
          <span className="absolute top-3 left-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            Servicio
          </span>
        </div>
        {images.length > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {images.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setActiveImage(i)}
                className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${i === activeImage ? 'border-primary' : 'border-transparent'}`}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 mt-4">
        <h1 className="text-2xl font-extrabold text-primary leading-tight">{providerName || sector}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {allActivities.map((a) => a.activity).join(' · ')}
        </p>
        {(description || service.refundPolicy) && description !== service.refundPolicy && description !== locationLabel && (
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">{description}</p>
        )}
        {locationLabel && locationLabel !== description && (
          <p className="mt-2 text-xs text-muted-foreground">📍 {locationLabel}</p>
        )}
        {providerUserId && onOpenProvider && (
          <button
            type="button"
            onClick={onOpenProvider}
            className="mt-2 text-xs font-semibold text-primary"
          >
            Ver perfil del proveedor
          </button>
        )}

        <DetailSocialActions
          className="mt-3"
          onLike={onLike}
          onChat={onChat}
          onReply={onReply}
          onShare={onShare}
          liked={liked}
        />
      </div>

      {/* Resumen */}
      <div className="px-4 mt-4 space-y-4">
        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="h-5 w-5 text-primary" />
            <h3 className="font-bold">Actividades y tarifas</h3>
          </div>
          <ul className="space-y-2.5">
            {allActivities.map(({ sector: s, activity }) => {
              const p = service.activityPricing[`${s}::${activity}`];
              return (
                <li key={`${s}-${activity}`} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{activity}</span>
                  {p?.cost && (
                    <span className="font-semibold text-primary">
                      {p.currency} {Number(p.cost).toLocaleString()} · {p.pricingType}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-bold">Horario</h3>
          </div>
          <p className="text-sm">
            {service.globalStartTime} - {service.globalEndTime}
          </p>
          {days.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">Disponible: {days.join(', ')}</p>
          )}
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h3 className="font-bold">Disponibilidad</h3>
          </div>
          <p className="text-sm">
            {service.selectedDates.length} fecha(s) disponibles
            {service.blockedDates.length > 0 && ` · ${service.blockedDates.length} bloqueada(s)`}
          </p>
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="font-bold">Política de reembolso</h3>
          </div>
          <p className="text-sm">{service.refundPolicy}</p>
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-5 w-5 fill-primary text-primary" />
            <span className="font-bold">{rating > 0 ? rating.toFixed(1) : 'Sin calificaciones'}</span>
            <span className="text-sm text-muted-foreground">
              {reviewCount > 0 ? `(${reviewCount} reseñas)` : '(aún sin reseñas)'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Calificación promedio del proveedor.</p>
          {onRate && (
            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  className="p-1"
                  onClick={() => { void onRate(s); }}
                >
                  <Star className={`h-6 w-6 ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky CTA */}
      {canReserve && (
      <div className="fixed bottom-20 left-0 right-0 px-4 z-20">
        <div className="mx-auto max-w-lg flex items-center gap-3 rounded-full bg-primary px-5 py-3 shadow-lg">
          {cheapest && (
            <div className="text-primary-foreground text-sm">
              <p className="text-[10px] uppercase opacity-80">Desde</p>
              <p className="font-bold">
                {cheapest.currency} {cheapest.cost.toLocaleString()}
              </p>
            </div>
          )}
          <button
            onClick={() => {
              if (!liveBooking) {
                onRequireLogin?.();
                return;
              }
              setOpenBooking(true);
            }}
            className="ml-auto rounded-full bg-white px-5 py-2.5 text-sm font-bold text-primary"
          >
            Reservar servicio
          </button>
        </div>
      </div>
      )}

      <BookingSheet
        open={openBooking}
        onOpenChange={setOpenBooking}
        service={service}
        liveBooking={liveBooking}
        onProceedToPayment={(data) => {
          setBookingData(data);
          setOpenBooking(false);
          setShowPayment(true);
        }}
      />
      <PaymentGatewaySheet
        open={showPayment}
        onOpenChange={(o) => { setShowPayment(o); if (!o) setBookingData(null); }}
        booking={bookingData}
        sellerName={providerName}
        onSuccess={() => {
          toast.success('¡Reserva confirmada!');
          setShowPayment(false);
          setBookingData(null);
        }}
      />

      <MediaGalleryLightbox
        images={images}
        initialIndex={activeImage}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        title={providerName || sector}
      />
    </div>
  );
};

export default ServiceDetailView;
