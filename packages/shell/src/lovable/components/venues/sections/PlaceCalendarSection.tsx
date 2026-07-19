import { useState } from 'react';
import { Input } from '@lovable/components/ui/input';
import { Switch } from '@lovable/components/ui/switch';
import { TimePicker } from '@lovable/components/ui/time-picker';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@lovable/components/ui/select';
import { X, CalendarRange } from 'lucide-react';
import { cn } from '@lovable/lib/utils';
import { newWizardId } from '@doevents/shared';
import { usePlaceForm } from '@lovable/components/places/placeFormContext';
import CalendarPlanner from '@lovable/components/services/CalendarPlanner';

const monedas = ['COP', 'USD', 'EUR', 'MXN'];
const tiposCobroPredefinidos = ['Por día', 'Por noche', 'Por hora', 'Por evento', 'Por persona'];
const tiposCobroServicio = ['Por hora', 'Por día', 'Por servicio', 'Por persona', 'Por evento'];
const serviciosConCostoOptions = [
  'Decoración',
  'Servicio de limpieza',
  'Servicio de catering',
  'Fotografía y video',
  'Transporte',
  'Hospedaje',
];

const weekDayChips = [
  { idx: 1, label: 'Lunes' },
  { idx: 2, label: 'Martes' },
  { idx: 3, label: 'Miércoles' },
  { idx: 4, label: 'Jueves' },
  { idx: 5, label: 'Viernes' },
  { idx: 6, label: 'Sábado' },
  { idx: 0, label: 'Domingo' },
];
const monthChips = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function parseBasePrice(value: string): number {
  const n = parseInt(value.replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

const formatPriceLong = (price: number): string =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(price);

const underlineInput =
  'border-0 border-b border-border rounded-none px-0 h-10 focus-visible:ring-0 focus-visible:border-primary bg-transparent shadow-none';

const PlaceCalendarSection = () => {
  const { form, update } = usePlaceForm();
  const basePrice = parseBasePrice(form.pricing.perDay);
  const [serviciosOn, setServiciosOn] = useState(form.addonServices.length > 0);

  const selectedWeekdays = form.calendarWeekdays;
  const selectedMonths = form.calendarMonths;

  const blockedCount = form.blockedDates.length
    + Object.values(form.datePrices).filter((entry) => entry.blocked).length;
  const customPriceCount = Object.values(form.datePrices).filter(
    (entry) => entry.price?.trim() && parseBasePrice(entry.price) !== basePrice,
  ).length;

  const addServicio = (name: string) => {
    if (form.addonServices.some((s) => s.name === name)) return;
    update({
      addonServices: [
        ...form.addonServices,
        {
          id: newWizardId(),
          name,
          description: name,
          price: 0,
          unit: 'día',
        },
      ],
    });
    setServiciosOn(true);
  };

  const removeServicio = (id: string) => {
    const next = form.addonServices.filter((s) => s.id !== id);
    update({ addonServices: next });
    if (!next.length) setServiciosOn(false);
  };

  const updServicio = (id: string, patch: Partial<typeof form.addonServices[0]>) => {
    update({
      addonServices: form.addonServices.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  return (
    <div className="min-w-0 space-y-5">
      <div className="space-y-5 rounded-2xl border border-border bg-card p-4">
        <div>
          <h3 className="text-base font-semibold">Precio base por día</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Este precio se mostrará en todos los días del calendario por defecto
          </p>
        </div>

        <div className="grid grid-cols-[90px_1fr] items-end gap-4">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Moneda</p>
            <Select
              value={form.pricing.currency}
              onValueChange={(currency) => update({ pricing: { ...form.pricing, currency } })}
            >
              <SelectTrigger className={cn(underlineInput, 'h-9')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {monedas.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Precio por día</p>
            <Input
              type="text"
              inputMode="numeric"
              value={form.pricing.perDay ? `$${formatPriceLong(parseBasePrice(form.pricing.perDay))}` : ''}
              onChange={(e) => {
                const n = parseInt(e.target.value.replace(/\D/g, ''), 10);
                update({
                  pricing: { ...form.pricing, perDay: Number.isFinite(n) ? String(n) : '' },
                  rentalUnit: 'day',
                });
              }}
              placeholder="$0"
              className={cn(underlineInput, 'text-right font-semibold')}
            />
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs text-muted-foreground">Tipo de cobro</p>
          <Select
            value={form.chargeType}
            onValueChange={(chargeType) => update({ chargeType, rentalUnit: 'day' })}
          >
            <SelectTrigger className={cn(underlineInput, 'h-9')}>
              <SelectValue placeholder="Selecciona el tipo de cobro" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {tiposCobroPredefinidos.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <h3 className="mb-3 px-1 text-base font-semibold">Calendario de disponibilidad y precios</h3>
        <div className="rounded-2xl border border-border bg-card p-4">
          <CalendarPlanner
            selectedDates={form.selectedDates}
            onDatesChange={(selectedDates) => update({ selectedDates, rentalUnit: 'day' })}
            blockedDates={form.blockedDates}
            onBlockedDatesChange={(blockedDates) => update({ blockedDates })}
            startTime={form.globalStartTime}
            endTime={form.globalEndTime}
            onStartTimeChange={(globalStartTime) => update({ globalStartTime })}
            onEndTimeChange={(globalEndTime) => update({ globalEndTime })}
            basePriceCost={form.pricing.perDay}
            basePriceCurrency={form.pricing.currency === 'USD' ? 'US$' : '$'}
            datePrices={form.datePrices}
            onDatePricesChange={(datePrices) => update({ datePrices })}
            allowCustomDayPricing
            showAllDaysWithBasePrice
          />
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Precio base aplicado
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/50" /> Bloqueados {blockedCount}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              {' '}
              Precio personalizado {customPriceCount}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between bg-primary/10 px-4 py-3">
          <h3 className="text-sm font-semibold">Resumen calendar planner</h3>
          <CalendarRange className="h-4 w-4 text-primary" />
        </div>
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Precio base</span>
            <span className="text-sm font-semibold">${formatPriceLong(basePrice)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Tipo de cobro</span>
            <span className="text-sm text-muted-foreground">{form.chargeType || '—'}</span>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Configuración del calendario</p>
            <div className="space-y-3 rounded-xl bg-secondary/30 p-3">
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Día (s)</p>
                <div className="flex flex-wrap gap-2">
                  {selectedWeekdays.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Sin selección</span>
                  ) : (
                    weekDayChips
                      .filter((d) => selectedWeekdays.includes(d.idx))
                      .map((d) => (
                        <span key={d.idx} className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
                          {d.label}
                        </span>
                      ))
                  )}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Mes (s)</p>
                <div className="flex flex-wrap gap-2">
                  {selectedMonths.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Sin selección</span>
                  ) : (
                    selectedMonths.map((i) => (
                      <span key={i} className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
                        {monthChips[i]}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
          {form.addonServices.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Servicios adicionales</p>
              <div className="space-y-2">
                {form.addonServices.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2">
                    <span className="text-sm">{s.name}</span>
                    <div className="text-right">
                      <p className="text-sm font-semibold">$ {formatPriceLong(s.price)}</p>
                      <p className="text-[11px] text-muted-foreground">{s.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div>
          <h3 className="text-base font-semibold">Horario de reserva</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Define la hora de inicio y fin para las reservas
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Hora de check in</p>
            <TimePicker
              value={form.globalStartTime}
              onChange={(globalStartTime) => update({ globalStartTime })}
              placeholder="00:00 A.M"
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Hora check out</p>
            <TimePicker
              value={form.globalEndTime}
              onChange={(globalEndTime) => update({ globalEndTime })}
              placeholder="00:00 A.M"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Servicios adicionales con costo</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Agrega los servicios con costo adicional y define su precio por día o por servicio
            </p>
          </div>
          <Switch
            checked={serviciosOn}
            onCheckedChange={(on) => {
              setServiciosOn(on);
              if (!on) update({ addonServices: [] });
            }}
          />
        </div>

        {serviciosOn && (
          <div className="animate-fade-in space-y-3">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Tipo de servicio</p>
              <Select value="" onValueChange={(v) => v && addServicio(v)}>
                <SelectTrigger className={cn(underlineInput, 'h-9')}>
                  <SelectValue placeholder="Selecciona el tipo de servicio" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {serviciosConCostoOptions
                    .filter((name) => !form.addonServices.some((s) => s.name === name))
                    .map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {form.addonServices.map((s) => (
              <div key={s.id} className="space-y-2 rounded-xl border border-border bg-background p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{s.name}</span>
                  <button type="button" onClick={() => removeServicio(s.id)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-0.5 text-[11px] text-muted-foreground">$</p>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={s.price ? formatPriceLong(s.price) : ''}
                      onChange={(e) => {
                        const n = parseInt(e.target.value.replace(/\D/g, ''), 10);
                        updServicio(s.id, { price: Number.isFinite(n) ? n : 0 });
                      }}
                      placeholder="0.0"
                      className={cn(underlineInput, 'h-8')}
                    />
                  </div>
                  <div>
                    <Select
                      value={s.unit}
                      onValueChange={(unit) => updServicio(s.id, { unit: unit as typeof s.unit })}
                    >
                      <SelectTrigger className={cn(underlineInput, 'h-8')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {tiposCobroServicio.map((t) => {
                          const unit = t === 'Por día' ? 'día' : t.replace('Por ', '').toLowerCase();
                          return (
                            <SelectItem key={t} value={unit}>{t}</SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceCalendarSection;
