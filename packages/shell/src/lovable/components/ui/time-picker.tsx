import * as React from "react";
import { Button } from "@lovable/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@lovable/components/ui/popover";
import { Clock } from "lucide-react";
import { cn } from "@lovable/lib/utils";

interface TimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

function normalizeTimeValue(value?: string): { hour: string; minute: string } {
  if (!value?.trim()) return { hour: "", minute: "" };
  const trimmed = value.trim();

  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hour = Math.min(23, Math.max(0, parseInt(match24[1], 10)));
    return {
      hour: String(hour).padStart(2, "0"),
      minute: match24[2],
    };
  }

  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const minute = match12[2];
    const ampm = match12[3].toUpperCase();
    if (ampm === "PM" && hour < 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    return { hour: String(hour).padStart(2, "0"), minute };
  }

  const loose = trimmed.match(/(\d{1,2}):(\d{2})/);
  if (loose) {
    const hour = Math.min(23, Math.max(0, parseInt(loose[1], 10)));
    return { hour: String(hour).padStart(2, "0"), minute: loose[2] };
  }

  return { hour: "", minute: "" };
}

function formatDisplayTime(time: string) {
  if (!time) return "";
  const { hour, minute } = normalizeTimeValue(time);
  if (!hour) return time;
  return `${hour}:${minute}`;
}

function TimePickerColumns({
  selectedHour,
  selectedMinute,
  onHourSelect,
  onMinuteSelect,
}: {
  selectedHour: string;
  selectedMinute: string;
  onHourSelect: (hour: string) => void;
  onMinuteSelect: (minute: string) => void;
}) {
  return (
    <div className="flex min-h-[220px] w-full">
      <div className="flex-1 border-r border-border">
        <div className="border-b border-border px-3 py-2 text-sm font-medium text-muted-foreground">
          Hora
        </div>
        <div className="max-h-[220px] overflow-y-auto overscroll-contain p-1">
          {HOURS.map((hour) => (
            <Button
              key={hour}
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-center",
                selectedHour === hour && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )}
              onClick={() => onHourSelect(hour)}
            >
              {hour}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex-1">
        <div className="border-b border-border px-3 py-2 text-sm font-medium text-muted-foreground">
          Min
        </div>
        <div className="max-h-[220px] overflow-y-auto overscroll-contain p-1">
          {MINUTES.map((minute) => (
            <Button
              key={minute}
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-center",
                selectedMinute === minute && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )}
              onClick={() => onMinuteSelect(minute)}
            >
              {minute}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

const TimePicker = React.forwardRef<HTMLButtonElement, TimePickerProps>(
  ({ value, onChange, placeholder = "Seleccionar hora", className }, ref) => {
    const [open, setOpen] = React.useState(false);
    const normalized = React.useMemo(() => normalizeTimeValue(value), [value]);
    const selectedHour = normalized.hour;
    const selectedMinute = normalized.minute;

    const handleHourSelect = (hour: string) => {
      const newMinute = selectedMinute || "00";
      onChange?.(`${hour}:${newMinute}`);
    };

    const handleMinuteSelect = (minute: string) => {
      const newHour = selectedHour || "08";
      onChange?.(`${newHour}:${minute}`);
      setOpen(false);
    };

    const triggerButton = (
      <Button
        ref={ref}
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn(
          "w-full justify-start text-left font-normal",
          !value && "text-muted-foreground",
          className,
        )}
      >
        <Clock className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
        {value ? formatDisplayTime(value) : placeholder}
      </Button>
    );

    const columns = (
      <TimePickerColumns
        selectedHour={selectedHour}
        selectedMinute={selectedMinute}
        onHourSelect={handleHourSelect}
        onMinuteSelect={handleMinuteSelect}
      />
    );

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] min-w-0 p-0"
          align="start"
          sideOffset={4}
        >
          {columns}
        </PopoverContent>
      </Popover>
    );
  },
);

TimePicker.displayName = "TimePicker";

export { TimePicker };
