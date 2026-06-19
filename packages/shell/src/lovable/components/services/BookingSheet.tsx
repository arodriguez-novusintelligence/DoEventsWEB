import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart, Minus, Plus, X, CalendarDays, Clock, CreditCard } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@lovable/components/ui/sheet';
import { Button } from '@lovable/components/ui/button';
import { Switch } from '@lovable/components/ui/switch';
import { cn } from '@lovable/lib/utils';
import { ServiceFormData } from '@lovable/data/servicesData';
import {
  createServiceBooking,
  fetchServiceBookingAvailability,
} from '@doevents/shared';
import { toast } from 'sonner';
import BookingReviewSheet from './BookingReviewSheet';

interface LiveServiceBookingConfig {
  serviceId: string;
  userId: string;
  buyer?: { firstName: string; lastName: string; email: string };
}

interface BookingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceFormData;
  onProceedToPayment: (booking: BookingData) => void;
  liveBooking?: LiveServiceBookingConfig;
  additionalServiceOptions?: AdditionalService[];
}

export interface BookingData {
  startDate: string;
  endDate: string;
  days: number;
  basePrice: number;
  currency: string;
  additionalServices: AdditionalService[];
  subtotal: number;
  commission: number;
  commissionIva: number;
  total: number;
  serviceName: string;
  startTime: string;
  endTime: string;
  serviceId?: string;
  orderId?: string;
  bookingId?: string;
  expiredAtTs?: number;
}

interface AdditionalService {
  name: string;
  pricePerDay: number;
  quantity: number;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DAY_HEADERS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatCurrency(amount: number, currency = 'COP') {
  return `${currency === 'USD' ? 'US$' : currency === 'EUR' ? '€' : '$'} ${amount.toLocaleString('es-CO')}`;
}

function parseDateStr(ds: string): Date {
  const [y, m, d] = ds.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Additional services come from props/API — no mock data in runtime
const BookingSheet = ({ open, onOpenChange, service, onProceedToPayment, liveBooking, additionalServiceOptions }: BookingSheetProps) => {
  const isLive = Boolean(liveBooking?.serviceId && liveBooking?.userId);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [singleDay, setSingleDay] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [additionalServices, setAdditionalServices] = useState<AdditionalService[]>([]);
  useEffect(() => {
    if (!open) return;
    if (additionalServiceOptions?.length) {
      setAdditionalServices(additionalServiceOptions.map((item) => ({ ...item, quantity: 0 })));
      return;
    }
    setAdditionalServices([]);
  }, [open, additionalServiceOptions]);
  const [reservedDates, setReservedDates] = useState<Set<string>>(new Set());
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const blockedSet = useMemo(() => {
    const set = new Set(service.blockedDates || []);
    reservedDates.forEach((d) => set.add(d));
    return set;
  }, [service.blockedDates, reservedDates]);

  useEffect(() => {
    if (!open || !isLive || !liveBooking?.serviceId) return;
    let cancelled = false;
    setLoadingAvailability(true);
    fetchServiceBookingAvailability(
      liveBooking.serviceId,
      viewYear,
      viewMonth + 1,
    )
      .then((data) => {
        if (cancelled) return;
        const reserved = new Set<string>();
        Object.entries(data.days || {}).forEach(([iso, info]) => {
          if (info.status === 'reserved' || info.status === 'unavailable') {
            reserved.add(iso);
          }
        });
        setReservedDates(reserved);
      })
      .catch(() => {
        if (!cancelled) setReservedDates(new Set());
      })
      .finally(() => {
        if (!cancelled) setLoadingAvailability(false);
      });
    return () => { cancelled = true; };
  }, [open, isLive, liveBooking?.serviceId, viewYear, viewMonth]);

  // Get base price from highest activity pricing
  const allActivities = service.sectors.flatMap((sector) =>
    (service.activities[sector] || []).map((act) => ({ sector, activity: act }))
  );
  const highestPricing = allActivities.reduce<{ cost: number; currency: string } | null>((best, { sector, activity }) => {
    const p = service.activityPricing[`${sector}::${activity}`];
    if (!p || !p.cost) return best;
    const num = Number(p.cost);
    if (!best || num > best.cost) return { cost: num, currency: p.currency };
    return best;
  }, null);
  const basePrice = highestPricing?.cost || 0;
  const currency = highestPricing?.currency || 'COP';

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const weeks = useMemo(() => {
    const rows: (number | null)[][] = [];
    let row: (number | null)[] = Array(firstDayOfWeek).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      row.push(d);
      if (row.length === 7) { rows.push(row); row = []; }
    }
    if (row.length > 0) { while (row.length < 7) row.push(null); rows.push(row); }
    return rows;
  }, [viewYear, viewMonth, daysInMonth, firstDayOfWeek]);

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const isPast = (ds: string) => ds < todayStr;

  const isInRange = (ds: string) => {
    if (!startDate || !endDate) return false;
    return ds >= startDate && ds <= endDate;
  };

  const handleDayClick = (day: number) => {
    const ds = toDateStr(viewYear, viewMonth, day);
    if (blockedSet.has(ds) || isPast(ds)) return;

    if (singleDay) {
      setStartDate(ds);
      setEndDate(ds);
      return;
    }

    if (!startDate || (startDate && endDate)) {
      setStartDate(ds);
      setEndDate(null);
    } else {
      if (ds < startDate) {
        setEndDate(startDate);
        setStartDate(ds);
      } else {
        setEndDate(ds);
      }
    }
  };

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = parseDateStr(startDate);
    const end = parseDateStr(endDate);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const additionalTotal = additionalServices.reduce(
    (sum, s) => sum + s.pricePerDay * s.quantity * totalDays, 0
  );
  const subtotal = basePrice * totalDays + additionalTotal;
  const COMMISSION_RATE = 0.12;
  const IVA_RATE = 0.19;
  const commission = Math.round(subtotal * COMMISSION_RATE);
  const commissionIva = Math.round(commission * IVA_RATE);
  const bookingTotal = subtotal + commission + commissionIva;

  const updateQuantity = (idx: number, delta: number) => {
    setAdditionalServices((prev) =>
      prev.map((s, i) => i === idx ? { ...s, quantity: Math.max(0, s.quantity + delta) } : s)
    );
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  const serviceName = service.sectors.join(', ');

  const handleProceed = async () => {
    if (!startDate || !endDate) return;
    const payload: BookingData = {
      startDate,
      endDate,
      days: totalDays,
      basePrice,
      currency,
      additionalServices: additionalServices.filter((s) => s.quantity > 0),
      subtotal,
      commission,
      commissionIva,
      total: bookingTotal,
      serviceName,
      startTime: service.globalStartTime,
      endTime: service.globalEndTime,
      serviceId: liveBooking?.serviceId,
    };

    if (!isLive || !liveBooking) {
      onProceedToPayment(payload);
      return;
    }

    const buyer = liveBooking.buyer;
    if (!buyer?.email?.trim()) {
      toast.error('Debes iniciar sesión con un correo válido para reservar');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createServiceBooking({
        serviceId: liveBooking.serviceId,
        userId: liveBooking.userId,
        startDate,
        endDate,
        additionalServices: payload.additionalServices,
        buyer,
      });
      onProceedToPayment({
        ...payload,
        orderId: result.orderId,
        bookingId: result.bookingId,
        expiredAtTs: result.expired_at_ts,
        total: result.total_amount,
        subtotal: result.pricing.subtotalReserva,
        commission: result.pricing.commission,
        commissionIva: result.pricing.commissionIva,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] overflow-y-auto rounded-t-3xl px-0 pb-0">
        <SheetHeader className="border-b border-border px-5 pb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => onOpenChange(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <SheetTitle className="text-base font-bold text-foreground">Reservar servicio</SheetTitle>
          </div>
        </SheetHeader>

        <div className="px-5 py-4 space-y-5">
          {/* Service info */}
          <div className="rounded-2xl bg-card p-4 shadow-sm space-y-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">{serviceName}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{service.globalStartTime} — {service.globalEndTime}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2 mt-2">
              <span className="text-sm text-muted-foreground">Valor de la reserva</span>
              <div className="text-right">
                <p className="text-base font-bold text-foreground">{formatCurrency(basePrice, currency)}</p>
                <p className="text-[10px] text-muted-foreground">IVA incluido · por día</p>
              </div>
            </div>
          </div>

          {/* Single day toggle */}
          <div className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 shadow-sm">
            <span className="text-sm font-medium text-foreground">Reservar por un día</span>
            <Switch
              checked={singleDay}
              onCheckedChange={(v) => {
                setSingleDay(v);
                if (v && startDate) setEndDate(startDate);
                else setEndDate(null);
              }}
            />
          </div>

          {/* Date display */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Desde el..', value: startDate },
              { label: 'Hasta el..', value: singleDay ? startDate : endDate },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-border bg-card px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <div className="mt-1 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    {value ? value.split('-').reverse().join('/') : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Calendar */}
          <div className="rounded-2xl bg-card p-4 shadow-sm">
            {/* Nav */}
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevMonth} className="p-1 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-bold text-foreground">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button onClick={nextMonth} className="p-1 text-muted-foreground hover:text-foreground">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {loadingAvailability && isLive && (
              <p className="mb-2 text-center text-[11px] text-muted-foreground">Actualizando disponibilidad…</p>
            )}

            {/* Day headers */}
            <div className="grid grid-cols-7 text-center mb-1">
              {DAY_HEADERS.map((d) => (
                <span key={d} className="py-1 text-[11px] font-medium text-muted-foreground">{d}</span>
              ))}
            </div>

            {/* Days */}
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 text-center">
                {week.map((day, di) => {
                  if (day === null) return <div key={di} className="py-2" />;
                  const ds = toDateStr(viewYear, viewMonth, day);
                  const isBlocked = blockedSet.has(ds);
                  const past = isPast(ds);
                  const isStart = ds === startDate;
                  const isEnd = ds === endDate || (singleDay && ds === startDate);
                  const inRange = isInRange(ds);
                  const isToday = ds === todayStr;
                  const disabled = isBlocked || past;

                  return (
                    <button
                      key={di}
                      onClick={() => !disabled && handleDayClick(day)}
                      disabled={disabled}
                      className={cn(
                        'relative flex h-10 w-full items-center justify-center text-sm transition-colors',
                        disabled && 'opacity-30 cursor-not-allowed',
                        (isStart || isEnd) && 'bg-primary text-primary-foreground font-bold rounded-full z-10',
                        inRange && !isStart && !isEnd && 'bg-primary/20 text-foreground',
                        isStart && !isEnd && 'rounded-r-none',
                        isEnd && !isStart && 'rounded-l-none',
                        !disabled && !isStart && !isEnd && !inRange && 'hover:bg-accent text-foreground',
                        isToday && !isStart && !isEnd && 'ring-1 ring-primary rounded-full',
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground border-t border-border pt-3">
              <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full bg-primary" /><span>Inicio/Fin</span></div>
              <div className="flex items-center gap-1"><div className="h-3 w-3 rounded bg-primary/20" /><span>En rango</span></div>
              <div className="flex items-center gap-1"><div className="h-3 w-3 rounded bg-muted opacity-40" /><span>No disponible</span></div>
            </div>
          </div>

          {/* Additional services — only when provided by API/props */}
          {additionalServices.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Servicios adicionales (por día)</h4>
            </div>
            <div className="space-y-2">
              {additionalServices.map((as, idx) => (
                <div key={as.name} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{as.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(as.pricePerDay, currency)} / día</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(idx, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-4 text-center text-sm font-bold text-foreground">{as.quantity}</span>
                    <button
                      onClick={() => updateQuantity(idx, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Booking summary */}
          {startDate && endDate && (
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 space-y-2">
              <h4 className="text-sm font-bold text-foreground">Resumen de la reserva</h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{formatCurrency(basePrice, currency)} × {totalDays} día{totalDays !== 1 ? 's' : ''}</span>
                  <span className="font-medium">{formatCurrency(basePrice * totalDays, currency)}</span>
                </div>
                {additionalServices.filter((s) => s.quantity > 0).map((s) => (
                  <div key={s.name} className="flex justify-between">
                    <span className="text-muted-foreground">{s.name} ×{s.quantity} ×{totalDays}d</span>
                    <span className="font-medium">{formatCurrency(s.pricePerDay * s.quantity * totalDays, currency)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-dashed border-border pt-2 mt-1">
                  <span className="text-muted-foreground">Subtotal reserva</span>
                  <span className="font-semibold text-foreground">{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comisión del servicio (12%)</span>
                  <span className="font-medium">{formatCurrency(commission, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA sobre comisión (19%)</span>
                  <span className="font-medium">{formatCurrency(commissionIva, currency)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 mt-2">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-bold text-primary text-base">{formatCurrency(bookingTotal, currency)}</span>
                </div>
              </div>
            </div>
          )}


          {/* CTA */}
          <Button
            className="w-full rounded-full py-6 text-base font-semibold gap-2"
            disabled={!startDate || !endDate || submitting}
            onClick={() => {
              if (isLive && liveBooking) setShowReview(true);
              else void handleProceed();
            }}
          >
            <CreditCard className="h-5 w-5" />
            {submitting
              ? 'Creando reserva…'
              : startDate && endDate
                ? `Reservar — ${formatCurrency(bookingTotal, currency)}`
                : 'Selecciona las fechas'}
          </Button>
        </div>
      </SheetContent>

      <BookingReviewSheet
        open={showReview}
        onOpenChange={setShowReview}
        confirming={submitting}
        summary={{
          title: serviceName,
          subtitle: `${service.globalStartTime} — ${service.globalEndTime}`,
          startDate,
          endDate,
          total: bookingTotal,
          currency,
          lines: [
            { label: 'Días reservados', value: String(totalDays) },
            { label: 'Subtotal', value: formatCurrency(subtotal, currency) },
            { label: 'Comisión + IVA', value: formatCurrency(commission + commissionIva, currency) },
          ],
        }}
        onConfirm={() => {
          setShowReview(false);
          void handleProceed();
        }}
      />
    </Sheet>
  );
};

export default BookingSheet;
