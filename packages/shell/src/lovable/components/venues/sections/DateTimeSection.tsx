import { useState } from "react";
import { Button } from "@lovable/components/ui/button";
import { Input } from "@lovable/components/ui/input";
import { Switch } from "@lovable/components/ui/switch";
import { TimePicker } from "@lovable/components/ui/time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@lovable/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  CalendarRange,
  DollarSign,
  Check,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  getDay,
  startOfYear,
  endOfYear,
  getYear,
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@lovable/lib/utils";

interface ServicioConCosto {
  nombre: string;
  costo: number;
  tipoCobro: string;
}
interface DayConfig {
  date: Date;
  price?: number;
  blocked: boolean;
}

const monedas = ["COP", "USD", "EUR", "MXN"];
const tiposCobroPredefinidos = ["Por día", "Por noche", "Por hora", "Por evento", "Por persona"];
const tiposCobroServicio = ["Por hora", "Por día", "Por servicio", "Por persona", "Por evento"];
const serviciosConCostoOptions = [
  "Decoración",
  "Servicio de limpieza",
  "Servicio de catering",
  "Fotografía y video",
  "Transporte",
  "Hospedaje",
];

const weekDayChips = [
  { idx: 1, label: "Lunes" },
  { idx: 2, label: "Martes" },
  { idx: 3, label: "Miércoles" },
  { idx: 4, label: "Jueves" },
  { idx: 5, label: "Viernes" },
  { idx: 6, label: "Sabado" },
  { idx: 0, label: "Domingo" },
];
const monthChips = [
  "Enero", "Febrero", "Marzo",
  "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre",
  "Octubre", "Noviembre", "Diciembre",
];

const underlineInput =
  "border-0 border-b border-border rounded-none px-0 h-10 focus-visible:ring-0 focus-visible:border-primary bg-transparent shadow-none";

const formatPrice = (price: number): string => {
  if (price >= 1000000) return `$${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)}M`;
  if (price >= 1000) return `$${Math.round(price / 1000)}K`;
  return `$${price}`;
};

const formatPriceLong = (price: number): string =>
  new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(price);

const DateTimeSection = () => {
  // Precio base
  const [moneda, setMoneda] = useState("COP");
  const [basePrice, setBasePrice] = useState<number>(1000000);
  const [tipoCobro, setTipoCobro] = useState<string>("Por día");

  // Selección rápida días/meses
  const [quickMode, setQuickMode] = useState<"todos" | "finde" | "custom">("custom");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [allMonths, setAllMonths] = useState(false);

  // Calendario
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dayConfigs, setDayConfigs] = useState<DayConfig[]>([]);

  // Horario
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Servicios
  const [serviciosOn, setServiciosOn] = useState(false);
  const [serviciosConCosto, setServiciosConCosto] = useState<ServicioConCosto[]>([]);

  const toggleWeekday = (idx: number) => {
    setQuickMode("custom");
    setSelectedWeekdays((p) => (p.includes(idx) ? p.filter((d) => d !== idx) : [...p, idx]));
  };
  const toggleMonth = (idx: number) => {
    setAllMonths(false);
    setSelectedMonths((p) => (p.includes(idx) ? p.filter((d) => d !== idx) : [...p, idx]));
  };
  const toggleAllMonths = (val: boolean) => {
    setAllMonths(val);
    setSelectedMonths(val ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : []);
  };
  const pickQuick = (m: "todos" | "finde") => {
    setQuickMode(m);
    if (m === "todos") setSelectedWeekdays([0, 1, 2, 3, 4, 5, 6]);
    if (m === "finde") setSelectedWeekdays([5, 6]);
  };

  const handleAplicar = () => {
    if (selectedWeekdays.length === 0 || selectedMonths.length === 0) return;
    const year = getYear(currentMonth);
    const all = eachDayOfInterval({
      start: startOfYear(new Date(year, 0, 1)),
      end: endOfYear(new Date(year, 0, 1)),
    });
    const matching = all.filter(
      (d) => selectedWeekdays.includes(getDay(d)) && selectedMonths.includes(d.getMonth()),
    );
    const others = dayConfigs.filter((c) => !matching.some((d) => isSameDay(d, c.date)));
    const next = matching.map((d) => ({ date: d, price: basePrice, blocked: false }));
    setDayConfigs([...others, ...next]);
  };

  // Calendario render
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });
  const firstOffset = (getDay(startOfMonth(currentMonth)) + 6) % 7; // Lunes inicio
  const getConfig = (d: Date) => dayConfigs.find((c) => isSameDay(c.date, d));

  const customCount = dayConfigs.filter((c) => c.price !== undefined && c.price !== basePrice).length;
  const blockedCount = dayConfigs.filter((c) => c.blocked).length;
  const availableCount = days.length - blockedCount;

  // Servicios
  const addServicio = (nombre: string) => {
    if (!serviciosConCosto.find((s) => s.nombre === nombre)) {
      setServiciosConCosto([...serviciosConCosto, { nombre, costo: 0, tipoCobro: "Por día" }]);
    }
  };
  const removeServicio = (n: string) =>
    setServiciosConCosto(serviciosConCosto.filter((s) => s.nombre !== n));
  const updServicio = (n: string, patch: Partial<ServicioConCosto>) =>
    setServiciosConCosto(serviciosConCosto.map((s) => (s.nombre === n ? { ...s, ...patch } : s)));

  // chips
  const Chip = ({
    active,
    onClick,
    children,
    size = "md",
  }: {
    active?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
    size?: "sm" | "md";
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full font-medium transition-colors",
        size === "md" ? "px-4 py-1.5 text-sm" : "px-3 py-1 text-xs",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-primary/10 text-primary hover:bg-primary/15",
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-5">
      {/* ============ Precio base ============ */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-5">
        <div>
          <h3 className="text-base font-semibold">Precio base por día</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Este precio se mostrará en todos los días del calendario por defecto
          </p>
        </div>

        <div className="grid grid-cols-[90px_1fr] gap-4 items-end">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Moneda</p>
            <Select value={moneda} onValueChange={setMoneda}>
              <SelectTrigger className={cn(underlineInput, "h-9")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {monedas.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Precio por día</p>
            <Input
              type="text"
              inputMode="numeric"
              value={basePrice ? `$${formatPriceLong(basePrice)}` : ""}
              onChange={(e) => {
                const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
                setBasePrice(isNaN(n) ? 0 : n);
              }}
              placeholder="$0"
              className={cn(underlineInput, "text-right font-semibold")}
            />
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Tipo de cobro</p>
          <Select value={tipoCobro} onValueChange={setTipoCobro}>
            <SelectTrigger className={cn(underlineInput, "h-9")}>
              <SelectValue placeholder="Selecciona el tipo de cobro" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {tiposCobroPredefinidos.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ============ Calendario de disponibilidad y precios ============ */}
      <div>
        <h3 className="text-base font-semibold mb-3 px-1">
          Calendario de disponibilidad y precios
        </h3>

        <div className="rounded-2xl bg-card border border-border p-4 space-y-5">
          {/* Quick selectors */}
          <div>
            <p className="text-sm text-foreground mb-3">
              Selecciona los días a los cuales quieres aplicar el precio base
            </p>
            <div className="flex items-center gap-6 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="quick-days"
                  checked={quickMode === "todos"}
                  onChange={() => pickQuick("todos")}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm">Todos los días</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="quick-days"
                  checked={quickMode === "finde"}
                  onChange={() => pickQuick("finde")}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm">Fines de semana</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {weekDayChips.map((d) => (
                <Chip
                  key={d.idx}
                  active={selectedWeekdays.includes(d.idx)}
                  onClick={() => toggleWeekday(d.idx)}
                >
                  {d.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Meses */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-foreground pr-2">
                Selecciona los meses a los cuales quieres aplicar el precio base
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={allMonths} onCheckedChange={toggleAllMonths} />
                <span className="text-sm">Todos</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {monthChips.map((m, i) => (
                <Chip key={m} active={selectedMonths.includes(i)} onClick={() => toggleMonth(i)}>
                  {m}
                </Chip>
              ))}
            </div>
          </div>

          <Button className="w-full rounded-full h-11" onClick={handleAplicar}>
            Aplicar
          </Button>

          <div className="h-px bg-border" />

          {/* Calendario */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: es })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                <div
                  key={i}
                  className="text-center text-xs font-medium text-muted-foreground py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstOffset }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {days.map((day) => {
                const cfg = getConfig(day);
                const price = cfg?.price ?? basePrice;
                const blocked = cfg?.blocked;
                const filled = !!cfg && !blocked;
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      const exists = getConfig(day);
                      if (exists) {
                        setDayConfigs(dayConfigs.filter((c) => !isSameDay(c.date, day)));
                      } else {
                        setDayConfigs([...dayConfigs, { date: day, price: basePrice, blocked: false }]);
                      }
                    }}
                    className={cn(
                      "aspect-square rounded-lg flex flex-col items-center justify-center text-xs leading-tight transition-colors",
                      filled
                        ? "bg-primary text-primary-foreground"
                        : blocked
                          ? "bg-destructive/20 text-destructive line-through"
                          : "bg-secondary/40 text-foreground hover:bg-secondary",
                    )}
                  >
                    <span className="font-semibold">{format(day, "d").padStart(2, "0")}</span>
                    <span className={cn("text-[10px] mt-0.5", filled ? "opacity-90" : "text-muted-foreground")}>
                      {formatPrice(price)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Disponible {availableCount}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive/50" /> Bloqueado {blockedCount}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Precio personalizado {customCount > 0 ? formatPrice(basePrice) : "$ 0"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ Resumen Calendar Planner ============ */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between bg-primary/10 px-4 py-3">
          <h3 className="text-sm font-semibold">Resumen calendar planner</h3>
          <CalendarRange className="w-4 h-4 text-primary" />
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Precio base</span>
            <span className="text-sm font-semibold">${formatPriceLong(basePrice)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Tipo de cobro</span>
            <span className="text-sm text-muted-foreground">{tipoCobro || "—"}</span>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Configuración del calendario</p>
            <div className="rounded-xl bg-secondary/30 p-3 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Día (s)</p>
                <div className="flex flex-wrap gap-2">
                  {selectedWeekdays.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Sin selección</span>
                  ) : (
                    weekDayChips
                      .filter((d) => selectedWeekdays.includes(d.idx))
                      .map((d) => (
                        <span
                          key={d.idx}
                          className="px-3 py-1 rounded-full text-xs bg-primary text-primary-foreground"
                        >
                          {d.label}
                        </span>
                      ))
                  )}
                </div>
                {customCount > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <p className="text-[11px] text-muted-foreground">
                      {customCount} día (s) con Precio personalizado
                    </p>
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      $ {formatPriceLong(basePrice)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Mes (s)</p>
                <div className="flex flex-wrap gap-2">
                  {selectedMonths.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Sin selección</span>
                  ) : (
                    selectedMonths.map((i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-xs bg-primary text-primary-foreground"
                      >
                        {monthChips[i]}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {serviciosConCosto.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Servicios adicionales</p>
              <div className="space-y-2">
                {serviciosConCosto.map((s) => (
                  <div
                    key={s.nombre}
                    className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2"
                  >
                    <span className="text-sm">{s.nombre}</span>
                    <div className="text-right">
                      <p className="text-sm font-semibold">$ {formatPriceLong(s.costo)}</p>
                      <p className="text-[11px] text-muted-foreground">{s.tipoCobro}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============ Horario de reserva ============ */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <div>
          <h3 className="text-base font-semibold">Horario de reserva</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Define la hora de inicio y fin para las reservas
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Hora de check in</p>
            <TimePicker value={startTime} onChange={setStartTime} placeholder="00:00 A.M" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Hora check out</p>
            <TimePicker value={endTime} onChange={setEndTime} placeholder="00:00 A.M" />
          </div>
        </div>
      </div>

      {/* ============ Servicios adicionales con costo ============ */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Servicios adicionales con costo</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Agrega los servicios con costo adicional y define su precio por día o por servicio
            </p>
          </div>
          <Switch checked={serviciosOn} onCheckedChange={setServiciosOn} />
        </div>

        {serviciosOn && (
          <div className="space-y-3 animate-fade-in">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tipo de servicio</p>
              <Select value="" onValueChange={(v) => v && addServicio(v)}>
                <SelectTrigger className={cn(underlineInput, "h-9")}>
                  <SelectValue placeholder="Selecciona el tipo de servicio" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {serviciosConCostoOptions
                    .filter((s) => !serviciosConCosto.find((sc) => sc.nombre === s))
                    .map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {serviciosConCosto.map((s) => (
              <div
                key={s.nombre}
                className="rounded-xl border border-border p-3 space-y-2 bg-background"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{s.nombre}</span>
                  <button
                    type="button"
                    onClick={() => removeServicio(s.nombre)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">$</p>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={s.costo ? formatPriceLong(s.costo) : ""}
                      onChange={(e) => {
                        const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
                        updServicio(s.nombre, { costo: isNaN(n) ? 0 : n });
                      }}
                      placeholder="0.0"
                      className={cn(underlineInput, "h-8")}
                    />
                  </div>
                  <div>
                    <Select
                      value={s.tipoCobro}
                      onValueChange={(v) => updServicio(s.nombre, { tipoCobro: v })}
                    >
                      <SelectTrigger className={cn(underlineInput, "h-8")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {tiposCobroServicio.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
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

export default DateTimeSection;
