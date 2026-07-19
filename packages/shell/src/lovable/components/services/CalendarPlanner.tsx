import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Check, X } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import { cn } from '@lovable/lib/utils';

interface DatePriceOverride {
  price?: string;
  blocked?: boolean;
}

interface CalendarPlannerProps {
  selectedDates: string[];
  onDatesChange: (dates: string[]) => void;
  blockedDates: string[];
  onBlockedDatesChange: (dates: string[]) => void;
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  priceLabel?: string;
  basePriceCost?: string;
  basePriceCurrency?: string;
  datePrices?: Record<string, DatePriceOverride>;
  onDatePricesChange?: (next: Record<string, DatePriceOverride>) => void;
  allowCustomDayPricing?: boolean;
  /** Muestra precio base en cada día del mes (modo publicación de lugares). */
  showAllDaysWithBasePrice?: boolean;
}

// selectedDates is used only for UI multi-selection before blocking.
// ALL days are available by default; only blockedDates = unavailable.

const DAY_HEADERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatPrice(cost: string) {
  if (!cost) return '';
  const num = Number(cost);
  if (num >= 1000) return `$${Math.round(num / 1000)}K`;
  return `$${num.toLocaleString()}`;
}

const CalendarPlanner = ({
  selectedDates,
  onDatesChange,
  blockedDates,
  onBlockedDatesChange,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  basePriceCost = '',
  basePriceCurrency = '$',
  datePrices = {},
  onDatePricesChange,
  allowCustomDayPricing = false,
  showAllDaysWithBasePrice = false,
}: CalendarPlannerProps) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [multiSelect, setMultiSelect] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [editAction, setEditAction] = useState<'block' | 'price'>('price');
  const [customPriceInput, setCustomPriceInput] = useState('');

  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);
  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const priceDisplay = formatPrice(basePriceCost);

  const resolveDayPrice = (dateStr: string) => {
    const override = datePrices[dateStr]?.price;
    if (override?.trim()) return formatPrice(override);
    return priceDisplay;
  };

  const selectedMonthDates = selectedDates.filter((d) => {
    const [y, m] = d.split('-').map(Number);
    return y === viewYear && m === viewMonth + 1;
  });

  const applyEditToSelection = () => {
    const monthDates = selectedMonthDates;
    if (!monthDates.length) return;

    if (editAction === 'block') {
      const newBlocked = [...blockedDates, ...monthDates.filter((d) => !blockedDates.includes(d))];
      onBlockedDatesChange(newBlocked);
    } else if (allowCustomDayPricing && onDatePricesChange && customPriceInput.trim()) {
      const next = { ...datePrices };
      monthDates.forEach((d) => {
        next[d] = { ...(next[d] || {}), price: customPriceInput.trim() };
      });
      onDatePricesChange(next);
    }

    onDatesChange(selectedDates.filter((d) => !monthDates.includes(d)));
    setShowEditPanel(false);
    setCustomPriceInput('');
  };

  const weeks = useMemo(() => {
    const rows: (number | null)[][] = [];
    let row: (number | null)[] = Array(firstDayOfWeek).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      row.push(d);
      if (row.length === 7) {
        rows.push(row);
        row = [];
      }
    }
    if (row.length > 0) {
      while (row.length < 7) row.push(null);
      rows.push(row);
    }
    return rows;
  }, [viewYear, viewMonth, daysInMonth, firstDayOfWeek]);

  const toggleDate = (day: number) => {
    const ds = toDateStr(viewYear, viewMonth, day);
    if (selectedSet.has(ds)) {
      onDatesChange(selectedDates.filter((d) => d !== ds));
    } else {
      onDatesChange([...selectedDates, ds]);
    }
  };

  const selectWeekdays = () => {
    const dates: string[] = [...selectedDates];
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(viewYear, viewMonth, d).getDay();
      const ds = toDateStr(viewYear, viewMonth, d);
      if (dow >= 1 && dow <= 5 && !dates.includes(ds)) dates.push(ds);
    }
    onDatesChange(dates);
  };

  const selectWeekends = () => {
    const dates: string[] = [...selectedDates];
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(viewYear, viewMonth, d).getDay();
      const ds = toDateStr(viewYear, viewMonth, d);
      if ((dow === 0 || dow === 5 || dow === 6) && !dates.includes(ds)) dates.push(ds);
    }
    onDatesChange(dates);
  };

  const selectAllMonth = () => {
    const dates: string[] = [...selectedDates];
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = toDateStr(viewYear, viewMonth, d);
      if (!dates.includes(ds)) dates.push(ds);
    }
    onDatesChange(dates);
  };

  const clearSelection = () => {
    // Remove only dates from current month
    const filtered = selectedDates.filter((d) => {
      const [y, m] = d.split('-').map(Number);
      return !(y === viewYear && m === viewMonth + 1);
    });
    onDatesChange(filtered);
  };

  // Count selected dates in current month
  const selectedInMonth = selectedDates.filter((d) => {
    const [y, m] = d.split('-').map(Number);
    return y === viewYear && m === viewMonth + 1;
  }).length;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="space-y-6">
      {/* Base price display */}
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-foreground">Precio base por día</h4>
        <p className="text-xs text-muted-foreground">Este precio se mostrará en todos los días del calendario por defecto</p>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 w-fit">
          <span className="text-sm text-muted-foreground">{basePriceCurrency}</span>
          <span className="text-sm font-medium text-foreground">
            {basePriceCost ? Number(basePriceCost).toLocaleString() : '—'}
          </span>
        </div>
      </div>

      {/* Time selection */}
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-foreground">Horario del servicio</h4>
        <p className="text-xs text-muted-foreground">Define la hora de inicio y fin del servicio</p>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Hora inicio (check in)</label>
            <Input
              type="time"
              className="mt-1"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Hora fin (check out)</label>
            <Input
              type="time"
              className="mt-1"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-foreground">Calendario de disponibilidad y precios</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          {showAllDaysWithBasePrice
            ? 'Todos los días del mes muestran el precio base. Selecciona días para un precio especial o para bloquearlos.'
            : (
              <>
                Por defecto <span className="font-semibold text-foreground">todos los días están disponibles</span>. Selecciona los días que quieras bloquear y presiona &apos;Editar selección&apos;.
              </>
            )}
        </p>

        {/* Quick select buttons */}
        <div className="mt-3 flex flex-wrap gap-2">
          {multiSelect ? (
            <Button
              variant="default"
              size="sm"
              className="gap-1.5 rounded-full text-xs"
              onClick={() => { setMultiSelect(false); clearSelection(); }}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Cancelar selección
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-full text-xs"
              onClick={() => setMultiSelect(true)}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Selección múltiple
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5 rounded-full text-xs" onClick={selectWeekends}>
            <CalendarDays className="h-3.5 w-3.5" />
            Fines de semana (V/S)
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-full text-xs" onClick={selectWeekdays}>
            <CalendarDays className="h-3.5 w-3.5" />
            Días de la semana
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-full text-xs" onClick={selectAllMonth}>
            Seleccionar todo el mes
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-full text-xs" onClick={clearSelection}>
            Limpiar
          </Button>
          {selectedInMonth > 0 && (
            <Button
              variant={allowCustomDayPricing ? 'default' : 'destructive'}
              size="sm"
              className="gap-1.5 rounded-full text-xs"
              onClick={() => {
                setEditAction(allowCustomDayPricing ? 'price' : 'block');
                setShowEditPanel(!showEditPanel);
              }}
            >
              Editar selección ({selectedInMonth})
            </Button>
          )}
        </div>

        {/* Month navigation */}
        <div className="mt-4 flex items-center justify-between">
          <button onClick={prevMonth} className="p-1 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-foreground">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth} className="p-1 text-muted-foreground hover:text-foreground">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="mt-3 grid grid-cols-7 text-center">
          {DAY_HEADERS.map((d, i) => (
            <span key={i} className="py-1 text-xs font-medium text-muted-foreground">{d}</span>
          ))}
        </div>

        {/* Day grid */}
        <div className="mt-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 text-center">
              {week.map((day, di) => {
                if (day === null) return <div key={di} className="py-2" />;
                const ds = toDateStr(viewYear, viewMonth, day);
                const isSelected = selectedSet.has(ds);
                const isBlocked = blockedSet.has(ds);
                const isToday = ds === todayStr;
                const dayPriceLabel = resolveDayPrice(ds);
                const hasCustomPrice = Boolean(datePrices[ds]?.price?.trim());
                return (
                  <button
                    key={di}
                    onClick={() => toggleDate(day)}
                    className={cn(
                      'flex flex-col items-center justify-center py-2 text-xs transition-colors rounded-lg mx-0.5 my-0.5 relative',
                      isBlocked
                        ? 'bg-destructive/10 text-muted-foreground line-through'
                        : isSelected
                          ? 'bg-accent text-accent-foreground font-semibold ring-2 ring-primary'
                          : 'bg-primary/5 hover:bg-primary/15 text-foreground',
                      isToday && !isSelected && !isBlocked && 'bg-primary/15 ring-1 ring-primary/40'
                    )}
                  >
                    {isSelected && !isBlocked && (
                      <div className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    )}
                    {isBlocked && (
                      <div className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-destructive flex items-center justify-center">
                        <X className="h-2.5 w-2.5 text-destructive-foreground" />
                      </div>
                    )}
                    <span className={cn('text-sm', isToday && 'font-bold text-primary', isBlocked && 'text-muted-foreground')}>{day}</span>
                    {isBlocked ? (
                      <span className="mt-0.5 text-[10px] text-destructive font-medium">Bloq.</span>
                    ) : dayPriceLabel ? (
                      <span className={cn('mt-0.5 text-[10px] font-medium', hasCustomPrice ? 'text-primary' : 'text-muted-foreground')}>
                        {dayPriceLabel}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Edit selection panel */}
        {showEditPanel && selectedInMonth > 0 && (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{selectedInMonth} días seleccionados</p>
                <p className="text-sm font-bold text-foreground">¿Qué deseas hacer con estos días?</p>
              </div>
              <button type="button" onClick={() => setShowEditPanel(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {allowCustomDayPricing && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditAction('price')}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-xs font-semibold',
                    editAction === 'price' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card',
                  )}
                >
                  Precio especial
                </button>
                <button
                  type="button"
                  onClick={() => setEditAction('block')}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-xs font-semibold',
                    editAction === 'block' ? 'border-destructive bg-destructive/10 text-destructive' : 'border-border bg-card',
                  )}
                >
                  Bloquear
                </button>
              </div>
            )}

            {editAction === 'price' && allowCustomDayPricing ? (
              <div className="mt-3 space-y-2">
                <label className="text-xs text-muted-foreground">Precio por día para la selección</label>
                <Input
                  type="number"
                  min={0}
                  placeholder={basePriceCost || 'Ej: 3500000'}
                  value={customPriceInput}
                  onChange={(e) => setCustomPriceInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Ideal para fines de semana, festivos o fechas de alta demanda.
                </p>
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                <p className="text-xs text-muted-foreground">Acción</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
                  <span className="text-sm font-semibold text-foreground">Bloquear días (no disponible)</span>
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button variant="outline" className="rounded-full gap-1.5" onClick={() => setShowEditPanel(false)}>
                <X className="h-3.5 w-3.5" />
                Cancelar
              </Button>
              <Button
                variant={editAction === 'block' ? 'destructive' : 'default'}
                className="rounded-full gap-1.5"
                disabled={editAction === 'price' && allowCustomDayPricing && !customPriceInput.trim()}
                onClick={applyEditToSelection}
              >
                {editAction === 'block' ? `Bloquear ${selectedInMonth} días` : 'Aplicar precio'}
              </Button>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-primary/20 border border-primary/40" />
            <span>Disponible (por defecto)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-destructive/10 border border-destructive/30" />
            <span>Bloqueado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-accent ring-2 ring-primary" />
            <span>Seleccionado</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPlanner;
