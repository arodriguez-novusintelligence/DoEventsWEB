import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, AlertCircle, Crosshair } from 'lucide-react';
import {
  applyGeocodedPlaceAsUserLocation,
  getStoredUserLocation,
  resolveManualUserLocation,
  resolveUserLocation,
  searchPlaceSuggestions,
  StoredUserLocation,
  useToast,
  type GeocodedPlace,
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
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodedPlace[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestSeq = useRef(0);

  const stored = getStoredUserLocation();
  const displayLabel = label || fallbackCity || 'Indica dónde te encuentras para ver eventos cercanos';
  const sourceHint = stored?.city ? 'Ubicación guardada en tu dispositivo' : null;

  useEffect(() => () => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
  }, []);

  const fetchSuggestions = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    setLoadingSuggestions(true);
    const seq = ++suggestSeq.current;

    suggestTimer.current = setTimeout(async () => {
      try {
        const items = await searchPlaceSuggestions(trimmed, 8);
        if (seq !== suggestSeq.current) return;
        setSuggestions(items);
      } finally {
        if (seq === suggestSeq.current) setLoadingSuggestions(false);
      }
    }, 280);
  };

  const applyPlace = (place: GeocodedPlace) => {
    const resolved = applyGeocodedPlaceAsUserLocation(place);
    setManualCity(place.label);
    setSuggestions([]);
    setShowSuggestions(false);
    setInlineError(null);
    onLocationResolved(resolved);
    showToast(`Ubicación aplicada: ${resolved.label || resolved.city}`, 'success');
    onOpenChange(false);
  };

  const localizeMe = async () => {
    setLocating(true);
    setInlineError(null);
    setShowSuggestions(false);
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

    if (suggestions.length === 1) {
      applyPlace(suggestions[0]);
      return;
    }

    setSavingManual(true);
    setInlineError(null);
    try {
      const resolved = await resolveManualUserLocation(city);
      if (!resolved) {
        const message = suggestions.length > 1
          ? 'Hay varias ubicaciones con ese nombre. Selecciona una de la lista.'
          : 'No pudimos interpretar esa ubicación. Incluye ciudad y país, por ejemplo: Santo Domingo, República Dominicana o Bogotá, Colombia.';
        setInlineError(message);
        setShowSuggestions(true);
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
    const initial = current?.label || current?.city || fallbackCity || '';
    setManualCity(initial);
    setInlineError(null);
    setSuggestions([]);
    setShowSuggestions(false);
    if (initial.trim().length >= 2) fetchSuggestions(initial);
  };

  const handleManualInput = (value: string) => {
    setManualCity(value);
    setInlineError(null);
    setShowSuggestions(true);
    fetchSuggestions(value);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) openManual();
        else {
          setInlineError(null);
          setSuggestions([]);
          setShowSuggestions(false);
        }
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
              Busca tu ciudad o municipio
            </label>
            <Input
              id="manual-city"
              placeholder="Ej: Santo Domingo, Bogotá, Miami…"
              value={manualCity}
              onChange={(e) => handleManualInput(e.target.value)}
              onFocus={() => {
                setShowSuggestions(true);
                if (manualCity.trim().length >= 2) fetchSuggestions(manualCity);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveManualCity();
              }}
              className="rounded-xl"
              autoComplete="off"
            />

            {showSuggestions && (loadingSuggestions || suggestions.length > 0) && (
              <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
                {loadingSuggestions && (
                  <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Buscando ubicaciones…
                  </div>
                )}
                {!loadingSuggestions && suggestions.length > 0 && (
                  <ul>
                    {suggestions.map((place) => (
                      <li key={`${place.lat}-${place.lng}-${place.label}`}>
                        <button
                          type="button"
                          className="flex w-full items-start gap-2 border-b border-border/40 px-3 py-2.5 text-left last:border-b-0 hover:bg-muted/60"
                          onClick={() => applyPlace(place)}
                        >
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-foreground">{place.label}</span>
                            {place.country && place.country !== place.label && (
                              <span className="block text-[11px] text-muted-foreground">{place.country}</span>
                            )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {!loadingSuggestions && showSuggestions && manualCity.trim().length >= 2 && suggestions.length === 0 && (
              <p className="px-1 text-[11px] text-muted-foreground">
                No encontramos coincidencias. Prueba agregar el país, por ejemplo: Santo Domingo, República Dominicana.
              </p>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full"
              onClick={saveManualCity}
              disabled={savingManual || loadingSuggestions}
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
