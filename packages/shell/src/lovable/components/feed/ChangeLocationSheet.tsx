import { useState } from 'react';
import { MapPin } from 'lucide-react';
import {
  getStoredUserLocation,
  resolveManualUserLocation,
  resolveUserLocation,
  StoredUserLocation,
  useToast,
} from '@doevents/shared';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@lovable/components/ui/sheet';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';

interface ChangeLocationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label?: string | null;
  fallbackCity?: string;
  onLocationResolved: (location: StoredUserLocation) => void;
}

export const ChangeLocationSheet = ({
  open,
  onOpenChange,
  label,
  fallbackCity,
  onLocationResolved,
}: ChangeLocationSheetProps) => {
  const { showToast } = useToast();
  const [manualCity, setManualCity] = useState(fallbackCity || '');
  const [locating, setLocating] = useState(false);
  const [savingManual, setSavingManual] = useState(false);

  const displayLabel = label || fallbackCity || 'Indica dónde te encuentras para ver eventos cercanos';

  const localizeMe = async () => {
    setLocating(true);
    try {
      const resolved = await resolveUserLocation({ prompt: true, force: true, fallbackCity });
      if (resolved) {
        onLocationResolved(resolved);
        showToast('Ubicación detectada correctamente', 'success');
        onOpenChange(false);
        return;
      }
      showToast('Activa la ubicación del navegador o escríbela manualmente', 'error');
    } finally {
      setLocating(false);
    }
  };

  const saveManualCity = async () => {
    const city = manualCity.trim();
    if (!city) {
      showToast('Indica tu ciudad o municipio', 'error');
      return;
    }
    setSavingManual(true);
    try {
      const resolved = await resolveManualUserLocation(city);
      if (!resolved) {
        showToast('No pudimos interpretar esa ubicación. Prueba: Girardot, Melgar, Bogotá…', 'error');
        return;
      }
      onLocationResolved(resolved);
      showToast(`Ubicación aplicada: ${resolved.label || resolved.city}`, 'success');
      onOpenChange(false);
    } finally {
      setSavingManual(false);
    }
  };

  const openManual = () => {
    const stored = getStoredUserLocation();
    setManualCity(stored?.city || fallbackCity || '');
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) openManual();
        onOpenChange(next);
      }}
    >
      <SheetContent side="bottom" className="max-w-lg mx-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Cambiar ubicación
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">{displayLabel}</p>

          <Button
            type="button"
            className="w-full rounded-full"
            onClick={localizeMe}
            disabled={locating}
          >
            {locating ? 'Localizando…' : 'Localízame'}
          </Button>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="manual-city">
              O escribe tu ciudad
            </label>
            <Input
              id="manual-city"
              placeholder="Ej: Girardot, Melgar, Bogotá…"
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveManualCity();
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full"
              onClick={saveManualCity}
              disabled={savingManual}
            >
              {savingManual ? 'Aplicando…' : 'Aplicar ubicación'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChangeLocationSheet;
