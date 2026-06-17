import { useState, useMemo } from "react";
import { Button } from "@lovable/components/ui/button";
import { Switch } from "@lovable/components/ui/switch";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Minus, ShoppingCart } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay, isBefore, startOfDay, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@lovable/lib/utils";
import { VenueData, DayConfig, PaidService } from "@lovable/types/venue";

interface ServiceSelection {
  service: PaidService;
  quantity: number;
}

interface ReservationSectionProps {
  venue: VenueData;
  onReserve: (startDate: Date, endDate: Date | null, selectedServices: ServiceSelection[]) => void;
}

const ReservationSection = ({ venue, onReserve }: ReservationSectionProps) => {
  const [isSingleDay, setIsSingleDay] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [selectedServices, setSelectedServices] = useState<ServiceSelection[]>([]);

  const weekDays = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sáb"];
  const today = startOfDay(new Date());

  const getDaysInMonth = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
  };

  const getFirstDayOfMonth = (date: Date) => {
    return getDay(startOfMonth(date));
  };

  const isDayBlocked = (date: Date): boolean => {
    const config = venue.dayConfigs.find((c) => isSameDay(new Date(c.date), date));
    return config?.blocked ?? false;
  };

  const isPastDay = (date: Date): boolean => {
    return isBefore(date, today);
  };

  const handleDayClick = (date: Date) => {
    if (isPastDay(date) || isDayBlocked(date)) return;

    if (isSingleDay) {
      setStartDate(date);
      setEndDate(null);
    } else {
      if (!startDate || selectingEnd) {
        if (!startDate) {
          setStartDate(date);
          setSelectingEnd(true);
        } else {
          if (isBefore(date, startDate)) {
            setEndDate(startDate);
            setStartDate(date);
          } else {
            setEndDate(date);
          }
          setSelectingEnd(false);
        }
      } else {
        setStartDate(date);
        setEndDate(null);
        setSelectingEnd(true);
      }
    }
  };

  const isInRange = (date: Date): boolean => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isSelected = (date: Date): boolean => {
    if (startDate && isSameDay(date, startDate)) return true;
    if (endDate && isSameDay(date, endDate)) return true;
    return false;
  };

  const days = getDaysInMonth(currentMonth);
  const firstDayOffset = getFirstDayOfMonth(currentMonth);

  const formatDateDisplay = (date: Date | null) => {
    if (!date) return "00/00/0000";
    return format(date, "dd/MM/yyyy");
  };

  // Calculate number of days
  const numberOfDays = useMemo(() => {
    if (!startDate) return 0;
    if (isSingleDay || !endDate) return 1;
    return differenceInDays(endDate, startDate) + 1;
  }, [startDate, endDate, isSingleDay]);

  // Handle service quantity changes
  const updateServiceQuantity = (service: PaidService, delta: number) => {
    setSelectedServices(prev => {
      const existing = prev.find(s => s.service.name === service.name);
      if (existing) {
        const newQuantity = existing.quantity + delta;
        if (newQuantity <= 0) {
          return prev.filter(s => s.service.name !== service.name);
        }
        return prev.map(s => 
          s.service.name === service.name 
            ? { ...s, quantity: newQuantity }
            : s
        );
      } else if (delta > 0) {
        return [...prev, { service, quantity: 1 }];
      }
      return prev;
    });
  };

  const getServiceQuantity = (service: PaidService) => {
    return selectedServices.find(s => s.service.name === service.name)?.quantity || 0;
  };

  // Calculate total cost
  const totalCost = useMemo(() => {
    const baseTotal = venue.basePrice * numberOfDays;
    const servicesTotal = selectedServices.reduce((acc, s) => {
      return acc + (s.service.price * s.quantity * numberOfDays);
    }, 0);
    const subtotal = baseTotal + servicesTotal;
    const serviceCharge = subtotal * 0.10; // 10% service charge
    return { baseTotal, servicesTotal, subtotal, serviceCharge, total: subtotal + serviceCharge };
  }, [venue.basePrice, numberOfDays, selectedServices]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-4 py-4 border-t border-border">
      <h3 className="font-semibold">Reservar el lugar</h3>

      {/* Single day toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm">Reservar por un día</span>
        <Switch
          checked={isSingleDay}
          onCheckedChange={(checked) => {
            setIsSingleDay(checked);
            setEndDate(null);
            setSelectingEnd(false);
          }}
        />
      </div>

      {/* Date inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Desde el..</label>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="w-full mt-1 flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-secondary/50 transition-colors"
          >
            <span className={startDate ? "text-foreground" : "text-muted-foreground"}>
              {formatDateDisplay(startDate)}
            </span>
            <CalendarIcon className="w-4 h-4 text-primary ml-auto" />
          </button>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Hasta el..</label>
          <button
            onClick={() => !isSingleDay && setShowCalendar(!showCalendar)}
            disabled={isSingleDay}
            className={cn(
              "w-full mt-1 flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm transition-colors",
              isSingleDay ? "opacity-50 cursor-not-allowed" : "hover:bg-secondary/50"
            )}
          >
            <span className={endDate ? "text-foreground" : "text-muted-foreground"}>
              {formatDateDisplay(endDate)}
            </span>
            <CalendarIcon className="w-4 h-4 text-primary ml-auto" />
          </button>
        </div>
      </div>

      {/* Calendar */}
      {showCalendar && (
        <div className="bg-card rounded-xl border border-border overflow-hidden animate-in slide-in-from-top-2">
          {/* Month navigation */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/30">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-semibold capitalize">
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

          {/* Week days header */}
          <div className="grid grid-cols-7 border-b border-border">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 p-2 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOffset }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {/* Day cells */}
            {days.map((day) => {
              const isBlocked = isDayBlocked(day);
              const isPast = isPastDay(day);
              const isDisabled = isBlocked || isPast;
              const selected = isSelected(day);
              const inRange = isInRange(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  disabled={isDisabled}
                  className={cn(
                    "aspect-square rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    isDisabled && "text-muted-foreground/40 cursor-not-allowed",
                    !isDisabled && "hover:bg-primary/10",
                    selected && "bg-primary text-primary-foreground",
                    inRange && !selected && "bg-primary/20",
                    isToday(day) && !selected && "ring-1 ring-primary"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Paid Services Selection */}
      {venue.paidServices && venue.paidServices.length > 0 && startDate && (
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" />
            <h4 className="font-medium text-sm">Servicios adicionales (por día)</h4>
          </div>
          <div className="space-y-2">
            {venue.paidServices.map((service) => {
              const quantity = getServiceQuantity(service);
              return (
                <div
                  key={service.name}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-all",
                    quantity > 0 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{service.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(service.price)} / día
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateServiceQuantity(service, -1)}
                      disabled={quantity === 0}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateServiceQuantity(service, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cost Summary */}
      {startDate && (
        <div className="space-y-2 pt-4 border-t border-border">
          <h4 className="font-medium text-sm">Resumen de costos</h4>
          <div className="bg-secondary/30 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Lugar ({numberOfDays} {numberOfDays === 1 ? "día" : "días"})
              </span>
              <span>{formatCurrency(totalCost.baseTotal)}</span>
            </div>
            {selectedServices.map(s => (
              <div key={s.service.name} className="flex justify-between">
                <span className="text-muted-foreground">
                  {s.service.name} (x{s.quantity} × {numberOfDays}d)
                </span>
                <span>{formatCurrency(s.service.price * s.quantity * numberOfDays)}</span>
              </div>
            ))}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cargos por servicio (10%)</span>
              <span>{formatCurrency(totalCost.serviceCharge)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(totalCost.total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-2 pt-2">
        <Button
          variant="outline"
          className="w-full border-primary text-primary hover:bg-primary/10"
          onClick={() => startDate && setShowCalendar(true)}
        >
          Consultar disponibilidad
        </Button>
        <Button
          className="w-full"
          onClick={() => startDate && onReserve(startDate, endDate, selectedServices)}
          disabled={!startDate}
        >
          Reservar lugar
        </Button>
      </div>
    </div>
  );
};

export default ReservationSection;
