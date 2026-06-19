import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ChevronLeft,
  MapPin,
  Home,
  Users,
  PartyPopper,
  Star,
  Calendar as CalendarIcon,
  Mail,
  CheckCircle2,
  CreditCard,
  Lock,
  Plus,
  Briefcase,
} from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import { Switch } from '@lovable/components/ui/switch';
import { toast } from 'sonner';
import type { PublishedVenueDraft } from './VenueCreator';
import VenueDetails from './detail/VenueDetails';
import { buildVenueFromDetail } from '../../../lovable-bridge/buildVenueFromDetail';
import { useNotifyPurchase } from '@lovable/lib/useNotifyPurchase';
import {
  createVenueBooking,
  fetchServiceById,
  fetchVenueBookingAvailability,
  type VenueAddonService,
  type VenueDayStatus,
} from '@doevents/shared';
import type { ServiceFormData } from '@lovable/data/servicesData';
import BookingSheet, { type BookingData } from '@lovable/components/services/BookingSheet';
import PaymentGatewaySheet from '@lovable/components/services/PaymentGatewaySheet';
import { apiServiceToForm, serviceDisplayName } from '../../../lovable-bridge/serviceFormMapper';
import type { ParsedVenueAmenities } from '../../../lovable-bridge/venuesAdapter';
import DetailSocialActions from '../../../components/DetailSocialActions';

interface LiveBookingConfig {
  venueId: string;
  userId: string;
  pricePerDay: number;
  checkIn?: string;
  checkOut?: string;
  buyerProfile?: { firstName: string; lastName: string; email: string };
  venueName?: string;
  previewOnly?: boolean;
  onPaymentReady: (payload: {
    orderId: string;
    bookingId: string;
    totalAmount: number;
    expiredAtTs: number;
    selectedDates: string[];
  }) => void;
}

interface VenueDisplayMeta {
  rating?: number;
  reviewCount?: number;
  hostName?: string;
  hostEmail?: string;
}

interface Props {
  venue: PublishedVenueDraft;
  venueDetail?: import('@doevents/shared').VenueDetail | null;
  venueAmenities?: ParsedVenueAmenities;
  hostProfile?: { name?: string; email?: string; phone?: string };
  venueRating?: number;
  venueReviewCount?: number;
  onBack: () => void;
  onFinish: () => void;
  liveBooking?: LiveBookingConfig;
  addonServices?: VenueAddonService[];
  venueMeta?: VenueDisplayMeta;
  readOnly?: boolean;
  ownerActions?: ReactNode;
  onRequireLogin?: () => void;
  onLike?: () => void;
  onChat?: () => void;
  onReply?: () => void;
  onShare?: () => void;
  liked?: boolean;
}

type Step = 'detail' | 'confirm' | 'payment' | 'success';

const BASE_PRICE_PER_DAY = 1_250_000;
const COMMISSION_RATE = 0.12;
const IVA_RATE = 0.19;

type AdditionalService = VenueAddonService;

function mapAddonServices(services: VenueAddonService[]): AdditionalService[] {
  return services.map((service) => ({
    ...service,
    unit: service.unit === 'dia' ? 'día' : service.unit,
  }));
}

// Build calendar from venue amenities when not in live booking mode
const buildPreviewDayMap = (
  year: number,
  month: number,
  amenities?: { availability?: { selectedDates?: string[]; blockedDates?: string[] } },
  pricePerDay = 0,
): Record<string, { status: 'available' | 'reserved' | 'unavailable'; pricePerDay: number }> => {
  const blocked = new Set(amenities?.availability?.blockedDates || []);
  const selected = amenities?.availability?.selectedDates || [];
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const map: Record<string, { status: 'available' | 'reserved' | 'unavailable'; pricePerDay: number }> = {};
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = `${prefix}-${String(day).padStart(2, '0')}`;
    const hasSelected = selected.length === 0 || selected.includes(iso);
    map[String(day)] = {
      status: blocked.has(iso) ? 'unavailable' : (hasSelected ? 'available' : 'unavailable'),
      pricePerDay,
    };
  }
  return map;
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const VenueDetailReservation = ({
  venue,
  venueDetail,
  venueAmenities,
  hostProfile,
  venueRating,
  venueReviewCount,
  onBack,
  onFinish,
  liveBooking,
  addonServices,
  venueMeta,
  readOnly = false,
  ownerActions,
  onRequireLogin,
  onLike,
  onChat,
  onReply,
  onShare,
  liked,
}: Props) => {
  const isLive = Boolean(liveBooking);
  const isPreview = Boolean(liveBooking?.previewOnly);
  const additionalServices = useMemo(
    () => mapAddonServices(addonServices || []),
    [addonServices],
  );
  const notifyPurchase = useNotifyPurchase();
  const [step, setStep] = useState<Step>('detail');
  const [byDay, setByDay] = useState(true);
  const [selectedIsoDates, setSelectedIsoDates] = useState<string[]>([]);
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth() + 1);
  const [liveDayMap, setLiveDayMap] = useState<Record<string, { status: VenueDayStatus; pricePerDay: number }>>({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [lastBookingId, setLastBookingId] = useState<string | null>(null);
  const [hireBookingOpen, setHireBookingOpen] = useState(false);
  const [hireServiceForm, setHireServiceForm] = useState<ServiceFormData | null>(null);
  const [hireServiceId, setHireServiceId] = useState('');
  const [hireProviderName, setHireProviderName] = useState('');
  const [serviceBookingData, setServiceBookingData] = useState<BookingData | null>(null);
  const [showServicePayment, setShowServicePayment] = useState(false);
  const [loadingHireService, setLoadingHireService] = useState<string | null>(null);
  const [buyer, setBuyer] = useState({
    firstName: liveBooking?.buyerProfile?.firstName || '',
    lastName: liveBooking?.buyerProfile?.lastName || '',
    email: liveBooking?.buyerProfile?.email || '',
  });
  const [card, setCard] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  const previewDayMap = useMemo(
    () => (isLive ? liveDayMap : buildPreviewDayMap(calendarYear, calendarMonth, venueAmenities, pricePerDay)),
    [isLive, liveDayMap, calendarYear, calendarMonth, venueAmenities, pricePerDay],
  );
  const venueFull = useMemo(
    () => buildVenueFromDetail(venue, {
      venue: venueDetail,
      amenities: venueAmenities,
      hostName: hostProfile?.name || venueMeta?.hostName,
      hostEmail: hostProfile?.email || venueMeta?.hostEmail,
      hostPhone: hostProfile?.phone,
      addonServices: addonServices,
      rating: venueRating ?? venueMeta?.rating,
      reviewCount: venueReviewCount ?? venueMeta?.reviewCount,
    }),
    [venue, venueDetail, venueAmenities, hostProfile, addonServices, venueMeta, venueRating, venueReviewCount],
  );
  const pricePerDay = liveBooking?.pricePerDay ?? BASE_PRICE_PER_DAY;
  const checkIn = liveBooking?.checkIn || '12:00';
  const checkOut = liveBooking?.checkOut || '15:00';

  useEffect(() => {
    if (!liveBooking) return;
    let cancelled = false;
    setLoadingAvailability(true);
    fetchVenueBookingAvailability(liveBooking.venueId, calendarYear, calendarMonth)
      .then((data) => {
        if (cancelled) return;
        if (data?.days) {
          setLiveDayMap(data.days);
          return;
        }
        const selected = venueAmenities?.availability?.selectedDates || [];
        const blocked = new Set(venueAmenities?.availability?.blockedDates || []);
        const fallback: Record<string, { status: VenueDayStatus; pricePerDay: number }> = {};
        selected.forEach((iso) => {
          if (!iso.startsWith(`${calendarYear}-${String(calendarMonth).padStart(2, '0')}`)) return;
          const day = Number(iso.split('-')[2]);
          if (!day) return;
          fallback[String(day)] = {
            status: blocked.has(iso) ? 'unavailable' : 'available',
            pricePerDay: liveBooking.pricePerDay,
          };
        });
        setLiveDayMap(fallback);
      })
      .finally(() => {
        if (!cancelled) setLoadingAvailability(false);
      });
    return () => { cancelled = true; };
  }, [liveBooking, calendarYear, calendarMonth, venueAmenities, liveBooking?.pricePerDay]);

  const shiftCalendarMonth = (delta: number) => {
    const date = new Date(calendarYear, calendarMonth - 1 + delta, 1);
    setCalendarYear(date.getFullYear());
    setCalendarMonth(date.getMonth() + 1);
  };

  const toggleIsoDate = (iso: string, status: VenueDayStatus) => {
    if (status !== 'available') return;
    setSelectedIsoDates((prev) =>
      prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso].sort(),
    );
  };

  const handleHireService = async (serviceId: string) => {
    if (readOnly) return;
    if (!liveBooking?.userId) {
      onRequireLogin?.();
      return;
    }
    if (loadingHireService) return;
    setLoadingHireService(serviceId);
    try {
      const data = await fetchServiceById(serviceId);
      if (!data) {
        toast.error('Servicio no disponible');
        return;
      }
      setHireServiceId(data.serviceId);
      setHireProviderName(serviceDisplayName(data));
      setHireServiceForm(apiServiceToForm(data));
      setHireBookingOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo cargar el servicio');
    } finally {
      setLoadingHireService(null);
    }
  };

  const numDays = selectedIsoDates.length;
  const reservationValue = numDays > 0 ? pricePerDay * numDays : 0;
  const subtotalReserva = reservationValue;
  const commission = Math.round(subtotalReserva * COMMISSION_RATE);
  const commissionIva = Math.round(commission * IVA_RATE);
  const total = subtotalReserva + commission + commissionIva;
  const fmt = (n: number) => `$ ${n.toLocaleString('es-CO')}`;
  const reservationNumber = lastBookingId
    ? lastBookingId.slice(-6).toUpperCase()
    : '—';
  const hostDisplayName = hostProfile?.name || venueMeta?.hostName || 'Anfitrión';
  const hostDisplayEmail = hostProfile?.email || venueMeta?.hostEmail || '';
  const formatIsoDisplay = (iso: string) => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleSubmitLiveBooking = async () => {
    if (!liveBooking || submittingBooking) return;
    if (isPreview || !liveBooking.userId) {
      onRequireLogin?.();
      return;
    }
    if (!selectedIsoDates.length) {
      toast.error('Selecciona al menos un día disponible');
      return;
    }
    if (!buyer.email?.trim()) {
      toast.error('Ingresa tu correo electrónico');
      return;
    }
    setSubmittingBooking(true);
    try {
      const result = await createVenueBooking({
        venueId: liveBooking.venueId,
        userId: liveBooking.userId,
        selectedDates: selectedIsoDates,
        buyer,
      });
      liveBooking.onPaymentReady({
        orderId: result.orderId,
        bookingId: result.bookingId,
        totalAmount: result.total_amount,
        expiredAtTs: result.expired_at_ts,
        selectedDates: selectedIsoDates,
      });
      setLastBookingId(result.bookingId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear la reserva');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const calendarCells = useMemo(() => {
    const firstWeekday = new Date(calendarYear, calendarMonth - 1, 1).getDay();
    const offset = (firstWeekday + 6) % 7;
    const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate();
    const cells: Array<{ iso?: string; day?: number; status?: VenueDayStatus; price?: number }> = [];
    for (let i = 0; i < offset; i += 1) cells.push({});
    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (isLive) {
        const info = liveDayMap[iso];
        cells.push({
          iso,
          day,
          status: info?.status || 'unavailable',
          price: info?.pricePerDay || pricePerDay,
        });
      } else {
        const info = previewDayMap[String(day)];
        cells.push({
          iso,
          day,
          status: info?.status || 'unavailable',
          price: info?.pricePerDay || pricePerDay,
        });
      }
    }
    return cells;
  }, [isLive, calendarYear, calendarMonth, liveDayMap, previewDayMap, pricePerDay]);

  // ─────────── DETAIL STEP ───────────
  if (step === 'detail') {
    return (
      <div className="min-h-screen bg-secondary pb-32">
        {/* Hero */}
        <div className="relative h-64 w-full overflow-hidden">
          <img src={venue.image} alt={venue.name} className="h-full w-full object-cover" />
          <button
            onClick={onBack}
            className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 shadow-sm backdrop-blur"
            aria-label="Volver"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="absolute bottom-3 right-3 rounded-full bg-foreground/70 px-2.5 py-0.5 text-[11px] font-medium text-background">
            1/3
          </div>
        </div>

        <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">
          {/* Summary card */}
          <section className="rounded-2xl bg-card p-4 shadow-sm">
            <h1 className="text-xl font-bold text-foreground">{venue.name}</h1>
            <p className="mt-1 text-sm text-foreground/80">{venue.address}</p>

            <DetailSocialActions
              className="mt-3"
              onLike={onLike}
              onChat={onChat}
              onReply={onReply}
              onShare={onShare}
              liked={liked}
            />

            <div className="mt-4 flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2">
              <span className="flex items-center gap-2 text-sm text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                {venue.sector || 'Antioquia'}
              </span>
              <button className="text-xs font-semibold text-primary">Como llegar ›</button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2">
                <Home className="h-4 w-4 text-primary" />
                <div className="leading-tight">
                  <p className="text-[10px] uppercase text-muted-foreground">Tipo de lugar</p>
                  <p className="text-xs font-semibold text-foreground">{venue.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2">
                <Users className="h-4 w-4 text-primary" />
                <div className="leading-tight">
                  <p className="text-[10px] uppercase text-muted-foreground">Aforo</p>
                  <p className="text-xs font-semibold text-foreground">{venue.capacity}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2">
                <PartyPopper className="h-4 w-4 text-primary" />
                <div className="leading-tight">
                  <p className="text-[10px] uppercase text-muted-foreground">Opiniones</p>
                  <p className="text-xs font-semibold text-foreground">{venueMeta?.reviewCount ?? 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <div className="leading-tight">
                  <p className="text-[10px] uppercase text-muted-foreground">Calificación</p>
                  <p className="text-xs font-semibold text-foreground">
                    {venueMeta?.rating && venueMeta.rating > 0 ? venueMeta.rating.toFixed(1) : 'Nuevo'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Price */}
          <section className="rounded-2xl bg-card p-4 shadow-sm">
            <p className="text-sm font-medium text-primary">Valor Reserva</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{fmt(pricePerDay)}</p>
            <p className="text-[11px] text-muted-foreground">IVA incluido / por día</p>
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3">
              <div>
                <p className="text-[11px] text-muted-foreground">Check in</p>
                <p className="text-sm font-semibold text-foreground">{checkIn}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Check out</p>
                <p className="text-sm font-semibold text-foreground">{checkOut}</p>
              </div>
            </div>
          </section>

          {/* Calendar */}
          <section className="rounded-2xl bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Calendario de reserva</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                Por un día
                <Switch checked={byDay} onCheckedChange={setByDay} />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button type="button" className="text-muted-foreground" onClick={() => shiftCalendarMonth(-1)}>‹</button>
              <p className="text-sm font-semibold text-foreground">
                {`${MONTH_NAMES[calendarMonth - 1]} ${calendarYear}`}
              </p>
              <button type="button" className="text-muted-foreground" onClick={() => shiftCalendarMonth(1)}>›</button>
            </div>

            {loadingAvailability && isLive && (
              <p className="mt-2 text-center text-xs text-muted-foreground">Cargando disponibilidad…</p>
            )}

            <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1">
              {calendarCells.map((cell, idx) => {
                if (!cell.iso || !cell.day) {
                  return <div key={`empty-${idx}`} />;
                }
                const selected = selectedIsoDates.includes(cell.iso);
                const status = cell.status || 'unavailable';
                const base = 'rounded-md py-1.5 text-[10px] font-semibold leading-tight';
                let cls = '';
                if (status === 'reserved') cls = 'bg-rose-100 text-rose-600';
                else if (status === 'unavailable') cls = 'bg-muted text-muted-foreground';
                else if (selected) cls = 'bg-primary text-primary-foreground';
                else cls = 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200';
                const priceLabel = cell.price
                  ? `$${Math.round(cell.price / 1000)}K`
                  : '';
                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => toggleIsoDate(cell.iso!, status)}
                    disabled={status !== 'available' || readOnly}
                    className={`${base} ${cls}`}
                  >
                    <div>{String(cell.day).padStart(2, '0')}</div>
                    <div className="text-[8px] opacity-80">{priceLabel}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Disponible
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Reservado
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground" /> No disponible
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <div>
                <p className="text-xs text-muted-foreground">Días seleccionados</p>
                <p className="text-xs font-semibold text-foreground">
                  Subtotal días (IVA incluido)
                </p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-primary">
                  {selectedIsoDates.length}
                </p>
                <p className="text-sm font-bold text-foreground">
                  {fmt(reservationValue)}
                </p>
              </div>
            </div>
          </section>

          {/* Servicios publicados */}
          <section className="rounded-2xl bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Servicios adicionales</p>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {additionalServices.length} disponibles
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Contrata servicios publicados para complementar tu evento en este lugar.
            </p>

            {additionalServices.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-6 text-center text-xs text-muted-foreground">
                Aún no hay servicios publicados disponibles cerca de este lugar.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {additionalServices.map((s) => {
                  const isLoading = loadingHireService === s.id;
                  return (
                    <div
                      key={s.id}
                      className="flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3 text-left"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card">
                        {s.imageUrl ? (
                          <img
                            src={s.imageUrl}
                            alt={s.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Briefcase className="h-5 w-5 text-primary" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-tight text-foreground">{s.name}</p>
                        <p className="text-[11px] leading-tight text-muted-foreground line-clamp-2">
                          {s.description}
                          {s.distanceKm != null ? ` · ${s.distanceKm.toFixed(1)} km` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold leading-tight text-foreground">{fmt(s.price)}</p>
                        {!readOnly && (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => { void handleHireService(s.id); }}
                            className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-primary disabled:opacity-50"
                          >
                            <Plus className="h-3 w-3" />
                            {isLoading ? 'Cargando…' : 'Agregar'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Información adicional del lugar (acordeón con todo el detalle) */}
          <section className="rounded-2xl bg-card px-4 shadow-sm">
            <VenueDetails venue={venueFull} />
          </section>

          {/* Host */}
          <section className="rounded-2xl bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold text-foreground">Datos del Host</p>
            <p className="mt-2 text-[11px] text-muted-foreground">Correo electrónico</p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-primary">
                {venueMeta?.hostEmail || 'Contacto disponible tras reservar'}
              </p>
              <Mail className="h-4 w-4 text-primary" />
            </div>
            {venueMeta?.hostName && (
              <p className="mt-1 text-xs text-muted-foreground">{venueMeta.hostName}</p>
            )}
          </section>

          {ownerActions}

          {!readOnly && (
          <Button
            onClick={() => {
              if (isPreview || !liveBooking?.userId) {
                onRequireLogin?.();
                return;
              }
              const hasDates = selectedIsoDates.length > 0;
              if (!hasDates) {
                toast.error('Selecciona al menos un día disponible');
                return;
              }
              setStep('confirm');
            }}
            className="w-full rounded-full py-6 text-base font-semibold"
          >
            Reservar lugar
          </Button>
          )}
        </div>
      </div>
    );
  }

  // ─────────── CONFIRM STEP ───────────
  if (step === 'confirm') {
    const startLabel = selectedIsoDates[0] ? formatIsoDisplay(selectedIsoDates[0]) : '—';
    const endLabel = selectedIsoDates[selectedIsoDates.length - 1]
      ? formatIsoDisplay(selectedIsoDates[selectedIsoDates.length - 1])
      : '—';
    return (
      <div className="min-h-screen bg-secondary pb-32">
        <div className="sticky top-0 z-10 bg-secondary px-4 pt-4 pb-2">
          <button onClick={() => setStep('detail')} className="flex items-center gap-1 text-sm font-medium text-primary">
            <ChevronLeft className="h-4 w-4" /> Volver
          </button>
        </div>

        <div className="mx-auto max-w-lg space-y-4 px-4 pt-2">
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">Confirmación de reserva</h2>
            <p className="mt-1 text-sm font-medium text-primary">{venue.name}</p>
          </div>

          <section className="rounded-2xl bg-card p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <CalendarIcon className="h-3.5 w-3.5 text-primary" /> Fecha de inicio
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {startLabel}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <CalendarIcon className="h-3.5 w-3.5 text-primary" /> Fecha de fin
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {endLabel}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <p className="text-sm text-foreground">Número de días</p>
              <p className="text-sm font-bold text-foreground">{numDays}</p>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm text-foreground">Dirección</p>
              <p className="text-sm font-medium text-foreground">{venue.address}</p>
            </div>
          </section>

          <section className="rounded-2xl bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold text-foreground">Resumen de pago</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground">Reserva ({numDays} día{numDays > 1 ? 's' : ''})</span>
                <span className="font-semibold text-foreground">{fmt(reservationValue)}</span>
              </div>

              <div className="mt-2 flex justify-between border-t border-border pt-2">
                <span className="text-foreground">Subtotal reserva</span>
                <span className="font-semibold text-foreground">{fmt(subtotalReserva)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground">Comisión del servicio (12%)</span>
                <span className="font-semibold text-foreground">{fmt(commission)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground">IVA sobre comisión (19%)</span>
                <span className="font-semibold text-foreground">{fmt(commissionIva)}</span>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm font-semibold text-foreground">Valor total</span>
                <span className="text-lg font-bold text-primary">{fmt(total)}</span>
              </div>
              <p className="text-right text-[10px] text-muted-foreground">IVA incluido</p>
            </div>
          </section>


          <section className="rounded-2xl bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold text-foreground">Datos del comprador</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground">Nombre</label>
                <Input
                  value={buyer.firstName}
                  onChange={(e) => setBuyer({ ...buyer, firstName: e.target.value })}
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Apellido</label>
                <Input
                  value={buyer.lastName}
                  onChange={(e) => setBuyer({ ...buyer, lastName: e.target.value })}
                  className="mt-1 h-9"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-[11px] text-muted-foreground">Correo electrónico</label>
              <Input
                value={buyer.email}
                onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
                className="mt-1 h-9"
              />
            </div>
          </section>

          <Button
            onClick={() => {
              if (isPreview || !liveBooking?.userId) {
                onRequireLogin?.();
                return;
              }
              if (isLive) {
                void handleSubmitLiveBooking();
                return;
              }
              setStep('payment');
            }}
            disabled={submittingBooking}
            className="w-full rounded-full py-6 text-base font-semibold"
          >
            {submittingBooking ? 'Creando reserva…' : isLive ? 'Continuar al pago' : 'Reservar'}
          </Button>
        </div>
      </div>
    );
  }

  // ─────────── PAYMENT STEP ───────────
  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-secondary pb-32">
        <div className="sticky top-0 z-10 bg-secondary px-4 pt-4 pb-2">
          <button onClick={() => setStep('confirm')} className="flex items-center gap-1 text-sm font-medium text-primary">
            <ChevronLeft className="h-4 w-4" /> Volver
          </button>
        </div>

        <div className="mx-auto max-w-lg space-y-4 px-4 pt-2">
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">Pasarela de pago</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              <Lock className="mr-1 inline h-3 w-3" />
              Pago seguro encriptado
            </p>
          </div>

          <section className="rounded-2xl bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Total a pagar</p>
              <p className="text-2xl font-bold text-primary">{fmt(total)}</p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {venue.name} · {numDays} día(s)
            </p>
          </section>

          <section className="rounded-2xl bg-card p-4 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CreditCard className="h-4 w-4 text-primary" /> Tarjeta de crédito / débito
            </p>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-[11px] text-muted-foreground">Número de tarjeta</label>
                <Input
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: e.target.value })}
                  className="mt-1 h-10"
                  placeholder="1234 5678 9012 3456"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Nombre en la tarjeta</label>
                <Input
                  value={card.name}
                  onChange={(e) => setCard({ ...card, name: e.target.value })}
                  className="mt-1 h-10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-muted-foreground">Vencimiento</label>
                  <Input
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                    className="mt-1 h-10"
                    placeholder="MM/AA"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">CVV</label>
                  <Input
                    value={card.cvv}
                    onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                    className="mt-1 h-10"
                    placeholder="123"
                    inputMode="numeric"
                  />
                </div>
              </div>
            </div>
          </section>

          <Button
            onClick={() => {
              if (!card.number.trim() || !card.name.trim() || !card.expiry.trim() || !card.cvv.trim()) {
                toast.error('Completa los datos de la tarjeta');
                return;
              }
              toast.success('Pago aprobado ✓');
              notifyPurchase({
                kind: 'venue',
                itemName: venue.name,
                sellerName: hostDisplayName,
                sellerEmail: hostDisplayEmail,
                buyerName: `${buyer.firstName} ${buyer.lastName}`.trim() || buyer.email,
                buyerEmail: buyer.email,
                amount: fmt(total),
              });
              setTimeout(() => setStep('success'), 400);
            }}
            className="w-full rounded-full py-6 text-base font-semibold"
          >
            <Lock className="mr-2 h-4 w-4" />
            Pagar {fmt(total)}
          </Button>
        </div>
      </div>
    );
  }

  // ─────────── SUCCESS STEP ───────────
  return (
    <div className="min-h-screen bg-secondary pb-12">
      <div className="sticky top-0 z-10 bg-secondary px-4 pt-4 pb-2">
        <button onClick={onFinish} className="flex items-center gap-1 text-sm font-medium text-primary">
          <ChevronLeft className="h-4 w-4" /> Volver
        </button>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-2">
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 className="h-20 w-20 text-emerald-500" strokeWidth={2} />
          <h2 className="mt-3 text-2xl font-bold text-foreground">¡Felicidades!</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tu reserva está lista</p>
          {reservationNumber !== '—' ? (
            <p className="mt-3 text-sm text-foreground">
              No de reserva:{' '}
              <span className="ml-1 rounded-md bg-primary/10 px-2 py-0.5 font-bold text-primary">
                {reservationNumber}
              </span>
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Recibirás el número de reserva por correo electrónico.
            </p>
          )}
        </div>

        <section className="rounded-2xl bg-card p-4 shadow-sm">
          <p className="text-center text-base font-semibold text-primary">{venue.name}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-muted-foreground">Desde el…</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                {selectedIsoDates[0] ? formatIsoDisplay(selectedIsoDates[0]) : '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Hasta el…</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                {selectedIsoDates[selectedIsoDates.length - 1]
                  ? formatIsoDisplay(selectedIsoDates[selectedIsoDates.length - 1])
                  : '—'}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span>Número de días</span>
              <span className="font-bold text-foreground">{numDays}</span>
            </div>
            <div className="flex justify-between">
              <span>Dirección</span>
              <span className="font-medium text-foreground">{venue.address}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span>Valor de la reserva ({numDays} día{numDays > 1 ? 's' : ''}):</span>
              <span className="font-semibold text-foreground">{fmt(reservationValue)}</span>
            </div>
            <div className="flex justify-between border-t border-dashed border-border pt-2">
              <span>Subtotal reserva:</span>
              <span className="font-semibold text-foreground">{fmt(subtotalReserva)}</span>
            </div>
            <div className="flex justify-between">
              <span>Comisión del servicio (12%):</span>
              <span className="font-semibold text-foreground">{fmt(commission)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA sobre comisión (19%):</span>
              <span className="font-semibold text-foreground">{fmt(commissionIva)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-bold text-foreground">Valor total pagado:</span>
              <span className="text-lg font-bold text-primary">{fmt(total)}</span>
            </div>
          </div>
        </section>


        <section className="rounded-2xl bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Datos del comprador</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground">Nombre</p>
              <p className="font-medium text-foreground">{buyer.firstName}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Apellido</p>
              <p className="font-medium text-foreground">{buyer.lastName}</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">Correo electrónico</p>
          <p className="text-sm font-medium text-primary">{buyer.email}</p>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Próximos pasos</p>
          {[
            'Recibirás un correo con todos los detalles de tu reserva',
            'El host te contactará con las instrucciones de llegada al lugar',
            'Presenta el número de reserva al momento de llegar',
          ].map((txt, i) => (
            <div key={i} className="mt-3 flex items-start gap-3 border-t border-border pt-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-xs leading-relaxed text-foreground">{txt}</p>
            </div>
          ))}
        </section>

        <Button onClick={onFinish} className="w-full rounded-full py-6 text-base font-semibold">
          Ir al inicio
        </Button>
      </div>
    </div>
  );
};

export default VenueDetailReservation;
