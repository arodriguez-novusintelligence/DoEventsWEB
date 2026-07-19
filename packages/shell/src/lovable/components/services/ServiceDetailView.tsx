import { ServiceFormData, DAYS_FULL } from '@lovable/data/servicesData';
import {
  ChevronLeft,
  Briefcase,
  Clock,
  DollarSign,
  CalendarDays,
  ShieldCheck,
  Star,
  MapPin,
} from 'lucide-react';
import { useState } from 'react';
import BookingSheet, { BookingData } from '@lovable/components/services/BookingSheet';
import BookingReviewSheet from '@lovable/components/services/BookingReviewSheet';
import { createServiceBooking } from '@doevents/shared';
import { toast } from 'sonner';
import { buildServicePaymentNavigation } from '../../../lovable-bridge/serviceReservationBridge';
import { useNavigate } from 'react-router-dom';
import DetailSocialActions from '../../../components/DetailSocialActions';
import DetailMediaCarousel from '@lovable/components/common/DetailMediaCarousel';

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
  onEditService?: () => void;
  initialOpenBooking?: boolean;
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
  onEditService,
  initialOpenBooking = false,
  onRequireLogin,
  onOpenProvider,
  onLike,
  onChat,
  onReply,
  onShare,
  liked,
}: Props) => {
  const navigate = useNavigate();
  const [openBooking, setOpenBooking] = useState(initialOpenBooking);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [confirmingBooking, setConfirmingBooking] = useState(false);

  const providerInitials = (providerName || 'Proveedor')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'PR';

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

  const SectionIcon = ({ icon: Icon }: { icon: React.ElementType }) => (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
      <Icon className="h-5 w-5 text-primary" />
    </span>
  );

  const days = service.selectedDays
    .map((sel, i) => (sel ? DAYS_FULL[i] : null))
    .filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-lg pb-32">
      <div className="px-4 pt-4">
        <button onClick={onBack} className="flex items-center gap-1 text-primary font-extrabold mb-3">
          <ChevronLeft className="h-5 w-5" />
          Atrás
        </button>
      </div>

      <div className="px-4">
        <DetailMediaCarousel
          images={images}
          alt={providerName || sector}
          frameClassName="h-56"
          badge={(
            <span className="absolute left-3 top-3 z-10 rounded-full bg-primary px-3 py-1 text-xs font-extrabold text-primary-foreground shadow-sm">
              Servicio
            </span>
          )}
          emptyFallback={(
            <div className="flex h-56 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/25 border-border/60 bg-muted text-sm text-muted-foreground shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <Briefcase className="h-7 w-7 text-primary" />
              </div>
              <span className="font-extrabold text-foreground">Sin foto del servicio</span>
            </div>
          )}
        />
      </div>

      <div className="px-4 mt-4">
        <h1 className="text-2xl font-extrabold text-primary leading-tight">{providerName || sector}</h1>
        <p className="mt-1 text-sm font-extrabold text-muted-foreground">
          {allActivities.map((a) => a.activity).join(' · ')}
        </p>
        {(description || service.refundPolicy) && description !== service.refundPolicy && description !== locationLabel && (
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">{description}</p>
        )}
        {locationLabel && locationLabel !== description && (
          <p className="mt-2 flex items-center gap-1 text-xs font-extrabold text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            {locationLabel}
          </p>
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
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <SectionIcon icon={Briefcase} />
            <h3 className="font-extrabold">Actividades y tarifas</h3>
          </div>
          <ul className="space-y-2.5">
            {allActivities.map(({ sector: s, activity }) => {
              const p = service.activityPricing[`${s}::${activity}`];
              return (
                <li key={`${s}-${activity}`} className="flex items-center justify-between text-sm">
                  <span className="font-extrabold text-foreground">{activity}</span>
                  {p?.cost && (
                    <span className="font-extrabold text-primary">
                      {p.currency} {Number(p.cost).toLocaleString()} · {p.pricingType}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <SectionIcon icon={Clock} />
            <h3 className="font-extrabold">Horario</h3>
          </div>
          <p className="text-sm font-extrabold text-foreground">
            {service.globalStartTime} - {service.globalEndTime}
          </p>
          {days.length > 0 && (
            <p className="text-xs font-extrabold text-muted-foreground mt-1">Disponible: {days.join(', ')}</p>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <SectionIcon icon={CalendarDays} />
            <h3 className="font-extrabold">Disponibilidad</h3>
          </div>
          <p className="text-sm font-extrabold text-foreground">
            {service.selectedDates.length} fecha(s) disponibles
            {service.blockedDates.length > 0 && ` · ${service.blockedDates.length} bloqueada(s)`}
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <SectionIcon icon={ShieldCheck} />
            <h3 className="font-extrabold">Política de reembolso</h3>
          </div>
          <p className="text-sm font-extrabold text-foreground">{service.refundPolicy}</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-5 w-5 fill-primary text-primary" />
            <span className="font-extrabold">{rating > 0 ? rating.toFixed(1) : 'Sin calificaciones'}</span>
            <span className="text-sm font-extrabold text-muted-foreground">
              {reviewCount > 0 ? `(${reviewCount} reseñas)` : '(aún sin reseñas)'}
            </span>
          </div>
          <p className="text-xs font-extrabold text-muted-foreground">Calificación promedio del proveedor.</p>
          {onRate && (
            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  className="rounded-full p-1 ring-2 ring-primary/20 hover:bg-primary/5 transition-colors"
                  onClick={() => { void onRate(s); }}
                >
                  <Star className={`h-6 w-6 ${s <= Math.round(rating) ? 'fill-primary text-primary' : 'text-muted'}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Perfil del Proveedor */}
        <div>
          <h3 className="mb-2 text-base font-bold text-foreground">Perfil del Proveedor</h3>
          <button
            type="button"
            onClick={() => onOpenProvider?.()}
            disabled={!onOpenProvider}
            className="block w-full rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm transition hover:shadow-md active:scale-[0.99] disabled:cursor-default"
            aria-label="Ver perfil del proveedor"
          >
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {providerInitials}
                </div>
                <p className="mt-2 text-sm font-bold text-foreground">{providerName || 'Proveedor'}</p>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-sm text-muted-foreground">Calificación</p>
                <div className="mt-1 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i <= Math.round(rating) ? 'fill-primary text-primary' : 'text-primary'}`}
                    />
                  ))}
                </div>
                <div className="mt-3 grid w-full grid-cols-2 gap-6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{reviewCount > 0 ? reviewCount : '—'}</p>
                    <p className="text-xs text-muted-foreground">Reseñas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{rating > 0 ? rating.toFixed(1) : 'Nuevo'}</p>
                    <p className="text-xs text-muted-foreground">Calificación</p>
                  </div>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Sticky CTA */}
      {(canReserve || onEditService) && (
      <div className="fixed bottom-20 left-0 right-0 px-4 z-20">
        <div className="mx-auto max-w-lg flex items-center gap-2 rounded-full bg-primary px-4 py-3 shadow-sm ring-2 ring-primary/20">
          {cheapest && canReserve && (
            <div className="text-primary-foreground text-sm shrink-0">
              <p className="text-[10px] uppercase opacity-80">Desde</p>
              <p className="font-extrabold">
                {cheapest.currency} {cheapest.cost.toLocaleString()}
              </p>
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            {onEditService && (
              <button
                type="button"
                onClick={onEditService}
                className="rounded-full border-2 border-primary-foreground/80 bg-transparent px-4 py-2.5 text-sm font-extrabold text-primary-foreground"
              >
                Editar
              </button>
            )}
            {canReserve && (
              <button
                type="button"
                onClick={() => {
                  if (!liveBooking) {
                    onRequireLogin?.();
                    return;
                  }
                  setOpenBooking(true);
                }}
                className="rounded-full bg-primary-foreground px-5 py-2.5 text-sm font-extrabold text-primary shadow-sm"
              >
                {liveBooking ? 'Contratar servicio' : 'Inicia sesión'}
              </button>
            )}
          </div>
        </div>
      </div>
      )}

      <BookingSheet
        open={openBooking}
        onOpenChange={setOpenBooking}
        service={service}
        serviceDisplayName={providerName}
        liveBooking={liveBooking}
        onProceedToPayment={(data) => {
          setBookingData(data);
          setOpenBooking(false);
          setShowReview(true);
        }}
      />
      <BookingReviewSheet
        open={showReview}
        onOpenChange={(open) => {
          setShowReview(open);
          if (!open) setBookingData(null);
        }}
        booking={bookingData}
        address={locationLabel || service.locationLabel}
        defaultBuyer={liveBooking?.buyer}
        confirming={confirmingBooking}
        onBack={() => {
          setShowReview(false);
          setOpenBooking(true);
        }}
        onConfirm={(buyer) => {
          if (!liveBooking?.serviceId || !liveBooking.userId || !bookingData) {
            onRequireLogin?.();
            return;
          }
          setConfirmingBooking(true);
          void createServiceBooking({
            serviceId: liveBooking.serviceId,
            userId: liveBooking.userId,
            startDate: bookingData.startDate,
            endDate: bookingData.endDate,
            additionalServices: bookingData.additionalServices,
            activityKey: bookingData.activityKey,
            activityName: bookingData.activityName,
            buyer,
          })
            .then((result) => {
              setShowReview(false);
              setBookingData(null);
              buildServicePaymentNavigation(navigate, {
                orderId: result.orderId,
                bookingId: result.bookingId,
                totalAmount: result.total_amount,
                expiredAtTs: result.expired_at_ts,
                startDate: bookingData.startDate,
                endDate: bookingData.endDate,
                serviceId: liveBooking.serviceId,
                serviceName: providerName || bookingData.serviceName,
                additionalServices: bookingData.additionalServices,
                days: bookingData.days,
                currency: bookingData.currency,
              });
            })
            .catch((err) => {
              toast.error(err instanceof Error ? err.message : 'No se pudo crear la reserva');
            })
            .finally(() => setConfirmingBooking(false));
        }}
      />
    </div>
  );
};

export default ServiceDetailView;
