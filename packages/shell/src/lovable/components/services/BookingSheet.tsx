import { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, ShoppingCart, Plus, Check, X, CalendarDays, Clock,
  Loader2, AlertCircle, Sparkles, Brush, Music, Camera, UtensilsCrossed, Flower2,
  User, RotateCcw, HelpCircle, CreditCard, type LucideIcon,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@lovable/components/ui/sheet';
import { Button } from '@lovable/components/ui/button';
import { Switch } from '@lovable/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@lovable/components/ui/accordion';
import { cn } from '@lovable/lib/utils';
import { ServiceFormData } from '@lovable/data/servicesData';
import {
  fetchServiceBookingAvailability,
} from '@doevents/shared';

interface LiveServiceBookingConfig {
  serviceId: string;
  userId: string;
  buyer?: { firstName: string; lastName: string; email: string };
}

interface BookingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceFormData;
  serviceDisplayName?: string;
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
  activityKey?: string;
  activityName?: string;
  pricingType?: string;
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
  icon?: LucideIcon;
  subtitle?: string;
  unit?: 'evento' | 'dia' | 'día';
}

function resolveServiceIcon(name: string): LucideIcon {
  const normalized = name.toLowerCase();
  if (normalized.includes('decor')) return Sparkles;
  if (normalized.includes('limpieza') || normalized.includes('clean')) return Brush;
  if (normalized.includes('dj') || normalized.includes('música') || normalized.includes('musica')) return Music;
  if (normalized.includes('foto') || normalized.includes('photo')) return Camera;
  if (normalized.includes('cater') || normalized.includes('comida') || normalized.includes('banqu')) return UtensilsCrossed;
  if (normalized.includes('flor')) return Flower2;
  return ShoppingCart;
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
const BookingSheet = ({
  open,
  onOpenChange,
  service,
  serviceDisplayName,
  onProceedToPayment,
  liveBooking,
  additionalServiceOptions,
}: BookingSheetProps) => {
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
      setAdditionalServices(additionalServiceOptions.map((item) => ({
        ...item,
        quantity: 0,
        icon: resolveServiceIcon(item.name),
        subtitle: item.subtitle || item.name,
        unit: item.unit || 'dia',
      })));
      return;
    }
    setAdditionalServices([]);
  }, [open, additionalServiceOptions]);

  const allActivities = useMemo(
    () => service.sectors.flatMap((sector) =>
      (service.activities[sector] || []).map((activity) => ({ sector, activity })),
    ),
    [service.sectors, service.activities],
  );
  const defaultActivityKey = allActivities[0] ? `${allActivities[0].sector}::${allActivities[0].activity}` : '';
  const [selectedActivityKey, setSelectedActivityKey] = useState(defaultActivityKey);

  useEffect(() => {
    if (!open) return;
    setSelectedActivityKey(defaultActivityKey);
    setStartDate(null);
    setEndDate(null);
    setSingleDay(false);
  }, [open, defaultActivityKey]);

  const [reservedDates, setReservedDates] = useState<Set<string>>(new Set());
  const [loadingAvailability, setLoadingAvailability] = useState(false);

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

  const selectedPricing = service.activityPricing[selectedActivityKey];
  const basePrice = selectedPricing ? Number(selectedPricing.cost) || 0 : 0;
  const currency = selectedPricing?.currency || 'COP';
  const pricingType = selectedPricing?.pricingType || 'Por día';
  const selectedActivityName = selectedActivityKey.includes('::')
    ? selectedActivityKey.split('::')[1]
    : selectedActivityKey;
  const servicePhoto = service.servicePhoto || service.coverImageUrl || service.coverImagePreview;

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

  const toggleAdditionalService = (idx: number) => {
    setAdditionalServices((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        return { ...s, quantity: s.quantity > 0 ? 0 : 1 };
      }),
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

  const serviceName = serviceDisplayName?.trim()
    || service.sectors[0]
    || service.sectors.join(', ')
    || 'Servicio';

  const handleProceed = () => {
    if (!startDate || !endDate || !selectedActivityKey) return;
    onProceedToPayment({
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
      activityKey: selectedActivityKey,
      activityName: selectedActivityName,
      pricingType,
      startTime: service.globalStartTime,
      endTime: service.globalEndTime,
      serviceId: liveBooking?.serviceId,
    });
  };

  const addedServicesCount = additionalServices.filter((s) => s.quantity > 0).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] overflow-y-auto rounded-t-3xl px-0 pb-0">
        <SheetHeader className="border-b border-border px-5 pb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => onOpenChange(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-muted-foreground shadow-sm hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <SheetTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <CalendarDays className="h-5 w-5 text-primary" />
              </span>
              Reservar servicio
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="px-5 py-4 space-y-5">
          {!isLive && (
            <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-semibold text-primary">Vista previa</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Inicia sesión para reservar fechas reales y generar una orden de pago.
                </p>
              </div>
            </div>
          )}
          <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
            <div className="flex aspect-[16/9] items-center justify-center bg-accent/40">
              {servicePhoto ? (
                <img src={servicePhoto} alt="Foto del servicio" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <User className="h-8 w-8" />
                  <span className="text-xs">Sin foto</span>
                </div>
              )}
            </div>
            <div className="space-y-2 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{serviceName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{service.globalStartTime} — {service.globalEndTime}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl bg-card p-4 shadow-sm">
            <div>
              <h4 className="text-sm font-bold text-foreground">Selecciona la actividad</h4>
              <p className="text-[11px] text-muted-foreground">
                Elige el servicio y actividad a reservar. El precio se calcula según tu elección.
              </p>
            </div>
            {service.sectors.map((sector) => {
              const acts = service.activities[sector] || [];
              if (acts.length === 0) return null;
              return (
                <div key={sector}>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">{sector}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {acts.map((act) => {
                      const k = `${sector}::${act}`;
                      const p = service.activityPricing[k];
                      const active = selectedActivityKey === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setSelectedActivityKey(k)}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                            active
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-card text-foreground hover:border-primary/40',
                          )}
                        >
                          {act}
                          {p?.cost ? (
                            <span className={cn('ml-1.5 opacity-80', active ? 'text-primary-foreground' : 'text-primary')}>
                              · {formatCurrency(Number(p.cost), p.currency)}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">Valor de la reserva</span>
              <div className="text-right">
                <p className="text-base font-bold text-foreground">{formatCurrency(basePrice, currency)}</p>
                <p className="text-[10px] text-muted-foreground">IVA incluido · {pricingType.toLowerCase()}</p>
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
              <div key={label} className="rounded-xl border border-border/60 bg-card px-3 py-2.5">
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
              <div className="mb-2 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                Actualizando disponibilidad…
              </div>
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

          {/* Additional services — toggle inline (Lovable) */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-bold text-foreground">Servicios adicionales</h4>
              </div>
              {addedServicesCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  {addedServicesCount} agregado{addedServicesCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Toca para agregar o quitar. El valor se suma al total de la reserva.
            </p>

            {additionalServices.length > 0 ? (
              <div className="space-y-2">
                {additionalServices.map((as, idx) => {
                  const Icon = as.icon ?? resolveServiceIcon(as.name);
                  const added = as.quantity > 0;
                  const unitLabel = as.unit === 'evento' ? 'Por evento' : 'Por día';
                  return (
                    <button
                      key={as.name}
                      type="button"
                      onClick={() => toggleAdditionalService(idx)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all',
                        added
                          ? 'border-primary bg-gradient-to-r from-primary to-primary/85 text-primary-foreground shadow-sm'
                          : 'border-border bg-card hover:border-primary/40 hover:bg-accent/40',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                          added ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary',
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn('truncate text-sm font-semibold', added ? 'text-primary-foreground' : 'text-foreground')}>
                          {as.name}
                        </p>
                        <p className={cn('truncate text-[11px]', added ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                          {as.subtitle ? `${as.subtitle} · ${unitLabel}` : unitLabel}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end">
                        <span className={cn('text-sm font-bold', added ? 'text-primary-foreground' : 'text-foreground')}>
                          {formatCurrency(as.pricePerDay, currency)}
                        </span>
                        <span
                          className={cn(
                            'mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold',
                            added ? 'text-primary-foreground' : 'text-primary',
                          )}
                        >
                          {added ? (
                            <>
                              <Check className="h-3 w-3" /> Agregado
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" /> Agregar
                            </>
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-primary/25 bg-secondary/30 px-4 py-6 text-center">
                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                  <ShoppingCart className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">No hay servicios adicionales</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Este servicio no ofrece complementos por el momento.
                </p>
              </div>
            )}

            {addedServicesCount > 0 && (
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">Subtotal servicios</span>
                <span className="text-sm font-bold text-foreground">{formatCurrency(additionalTotal, currency)}</span>
              </div>
            )}
          </div>

          {startDate && endDate && (() => {
            const activeAdds = additionalServices.filter((s) => s.quantity > 0);
            const addsTotal = activeAdds.reduce((sum, s) => sum + s.pricePerDay * s.quantity * totalDays, 0);
            return (
              <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <h4 className="text-sm font-bold text-foreground">Resumen de pago</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Reserva ({totalDays} día{totalDays !== 1 ? 's' : ''})
                    </span>
                    <span className="font-semibold text-foreground">{formatCurrency(basePrice * totalDays, currency)}</span>
                  </div>
                  {activeAdds.length > 0 && (
                    <>
                      <p className="pt-1 text-[13px] font-semibold text-foreground">Servicios adicionales</p>
                      {activeAdds.map((s) => (
                        <div key={s.name} className="flex justify-between">
                          <span className="text-muted-foreground">
                            {s.name}{s.quantity > 1 ? ` × ${s.quantity}` : ''}
                          </span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(s.pricePerDay * s.quantity * totalDays, currency)}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between border-t border-dashed border-border pt-2">
                        <span className="text-muted-foreground">Subtotal servicios</span>
                        <span className="font-semibold text-foreground">{formatCurrency(addsTotal, currency)}</span>
                      </div>
                    </>
                  )}
                  <div className="mt-1 flex justify-between border-t border-border pt-2">
                    <span className="text-muted-foreground">Subtotal reserva</span>
                    <span className="font-semibold text-foreground">{formatCurrency(subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Comisión del servicio (12%)</span>
                    <span className="font-medium text-foreground">{formatCurrency(commission, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA sobre comisión (19%)</span>
                    <span className="font-medium text-foreground">{formatCurrency(commissionIva, currency)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-base font-bold text-foreground">Valor total</span>
                    <span className="text-lg font-extrabold text-primary">{formatCurrency(bookingTotal, currency)}</span>
                  </div>
                  <p className="text-right text-[11px] text-muted-foreground">IVA incluido</p>
                </div>
              </div>
            );
          })()}

          {service.refundPolicy && (
            <div className="rounded-2xl bg-card p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-foreground">Política de reembolso</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{service.refundPolicy}</p>
                </div>
              </div>
            </div>
          )}

          {service.faqs && service.faqs.filter((f) => f.question).length > 0 && (
            <div className="rounded-2xl bg-card p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Preguntas frecuentes</h4>
              </div>
              <Accordion type="single" collapsible className="divide-y divide-border">
                {service.faqs
                  .filter((f) => f.question)
                  .map((f, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="border-0">
                      <AccordionTrigger className="py-2 text-sm text-foreground hover:no-underline">
                        {f.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-xs text-muted-foreground">
                        {f.answer || 'Sin respuesta.'}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
              </Accordion>
            </div>
          )}

          <Button
            className="w-full gap-2 rounded-full py-6 text-base font-semibold"
            disabled={!startDate || !endDate || !selectedActivityKey}
            onClick={handleProceed}
          >
            <CreditCard className="h-5 w-5" />
            {!selectedActivityKey
              ? 'Selecciona una actividad'
              : startDate && endDate
              ? `Reservar — ${formatCurrency(bookingTotal, currency)}`
              : 'Selecciona las fechas'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BookingSheet;
