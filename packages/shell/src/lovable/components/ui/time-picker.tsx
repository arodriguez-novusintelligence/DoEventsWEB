import * as React from "react";
import { Button } from "@lovable/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@lovable/components/ui/popover";
import { ScrollArea } from "@lovable/components/ui/scroll-area";
import { Clock } from "lucide-react";
import { cn } from "@lovable/lib/utils";

interface TimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const TimePicker = React.forwardRef<HTMLButtonElement, TimePickerProps>(
  ({ value, onChange, placeholder = "Seleccionar hora", className }, ref) => {
    const [open, setOpen] = React.useState(false);
    
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
    const minutes = ["00", "15", "30", "45"];

    const [selectedHour, selectedMinute] = React.useMemo(() => {
      if (!value) return ["", ""];
      const [h, m] = value.split(":");
      return [h || "", m || ""];
    }, [value]);

    const handleHourSelect = (hour: string) => {
      const newMinute = selectedMinute || "00";
      onChange?.(`${hour}:${newMinute}`);
    };

    const handleMinuteSelect = (minute: string) => {
      const newHour = selectedHour || "12";
      onChange?.(`${newHour}:${minute}`);
      setOpen(false);
    };

    const formatDisplayTime = (time: string) => {
      if (!time) return "";
      const [h, m] = time.split(":");
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${m} ${ampm}`;
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              className
            )}
          >
            <Clock className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            {value ? formatDisplayTime(value) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Hours */}
            <div className="border-r border-border">
              <div className="px-3 py-2 text-sm font-medium text-muted-foreground border-b border-border">
                Hora
              </div>
              <ScrollArea className="h-[200px]">
                <div className="p-1">
                  {hours.map((hour) => (
                    <Button
                      key={hour}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-center",
                        selectedHour === hour && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                      )}
                      onClick={() => handleHourSelect(hour)}
                    >
                      {hour}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            {/* Minutes */}
            <div>
              <div className="px-3 py-2 text-sm font-medium text-muted-foreground border-b border-border">
                Min
              </div>
              <ScrollArea className="h-[200px]">
                <div className="p-1">
                  {minutes.map((minute) => (
                    <Button
                      key={minute}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-center",
                        selectedMinute === minute && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                      )}
                      onClick={() => handleMinuteSelect(minute)}
                    >
                      {minute}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

TimePicker.displayName = "TimePicker";

export { TimePicker };
