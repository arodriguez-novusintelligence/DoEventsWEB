import { useState } from 'react';
import { MapPin, Loader2, AlertCircle, Crosshair } from 'lucide-react';
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
  const [inlineError, setInlineError] = useState<string | null>(null);

  const stored = getStoredUserLocation();
  const displayLabel = label || fallbackCity || 'Indica dónde te encuentras para ver eventos cercanos';
  const sourceHint = stored?.city ? 'Ubicación guardada en tu dispositivo' : null;

  const localizeMe = async () => {
    setLocating(true);
    setInlineError(null);
    try {
      const resolved = await resolveUserLocation({ prompt: true, force: true, fallbackCity });
      if (resolved) {
        onLocationResolved(resolved);
        showToast('Ubicación detectada correctamente', 'success');
        onOpenChange(false);
        return;
      }
      const message = 'Activa la ubicación del navegador o escríbela manualmente';
      setInlineError(message);
      showToast(message, 'error');
    } finally {
      setLocating(false);
    }
  };

  const saveManualCity = async () => {
    const city = manualCity.trim();
    if (!city) {
      const message = 'Indica tu ciudad o municipio';
      setInlineError(message);
      showToast(message, 'error');
      return;
    }
    setSavingManual(true);
    setInlineError(null);
    try {
      const resolved = await resolveManualUserLocation(city);
      if (!resolved) {
        const message = 'No pudimos interpretar esa ubicación. Prueba: Girardot, Melgar, Bogotá…';
        setInlineError(message);
        showToast(message, 'error');
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
    const current = getStoredUserLocation();
    setManualCity(current?.city || fallbackCity || '');
    setInlineError(null);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) openManual();
        else setInlineError(null);
        onOpenChange(next);
      }}
    >
      <SheetContent side="bottom" className="mx-auto max-h-[90dvh] max-w-lg overflow-y-auto rounded-t-3xl p-0">
        <div className="rounded-t-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 px-4 pb-4 pt-4">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 backdrop-blur">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="block text-base font-bold">Cambiar ubicación</span>
                <span className="text-xs font-normal text-muted-foreground">Eventos y descubrimiento cerca de ti</span>
              </div>
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="space-y-4 px-4 pb-6 pt-2">
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ubicación actual</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{displayLabel}</p>
            {sourceHint && (
              <p className="mt-1 text-[10px] text-muted-foreground">{sourceHint}</p>
            )}
          </div>

          {inlineError && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{inlineError}</span>
            </div>
          )}

          <Button
            type="button"
            className="w-full rounded-full py-6 text-base font-bold"
            onClick={localizeMe}
            disabled={locating}
          >
            {locating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Localizando…
              </>
            ) : (
              <>
                <Crosshair className="mr-2 h-4 w-4" />
                Localízame
              </>
            )}
          </Button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">o</span>
            </div>
          </div>

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
              className="rounded-xl"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full"
              onClick={saveManualCity}
              disabled={savingManual}
            >
              {savingManual ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aplicando…
                </>
              ) : (
                'Aplicar ubicación'
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChangeLocationSheet;
