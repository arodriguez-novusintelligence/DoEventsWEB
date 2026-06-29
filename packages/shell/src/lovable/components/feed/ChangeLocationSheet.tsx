/// <reference types="google.maps" />
import { useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, MapPin, Search, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@lovable/components/ui/sheet';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import { toast } from 'sonner';

let googleMapsPromise: Promise<typeof google> | null = null;
function loadGoogleMaps(): Promise<typeof google> {
  if (googleMapsPromise) return googleMapsPromise;
  googleMapsPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('No window'));
    if ((window as any).google?.maps) return resolve((window as any).google);
    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    if (!key) return reject(new Error('Missing Google Maps browser key'));
    (window as any).__initGoogleMaps = () => resolve((window as any).google);
    const existing = document.querySelector('script[data-gmaps-loader="1"]');
    if (existing) {
      const check = setInterval(() => {
        if ((window as any).google?.maps) {
          clearInterval(check);
          resolve((window as any).google);
        }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.dataset.gmapsLoader = '1';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&libraries=places&callback=__initGoogleMaps${channel ? `&channel=${channel}` : ''}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

export interface SelectedLocation {
  label: string;
  city?: string;
  country?: string;
  detail?: string;
  lat: number;
  lng: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: SelectedLocation | null;
  onSelect: (loc: SelectedLocation) => void;
}

interface Suggestion {
  placeId: string;
  primary: string;
  secondary: string;
}

const DEFAULT_CENTER = { lat: 4.7110, lng: -74.0721 }; // Bogotá

const ChangeLocationSheet = ({ open, onOpenChange, initial, onSelect }: Props) => {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const sessionTokenRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [current, setCurrent] = useState<SelectedLocation | null>(initial ?? null);

  // Load map when opened
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadGoogleMaps()
      .then(async (google) => {
        if (cancelled || !mapEl.current) return;
        const start = current ? { lat: current.lat, lng: current.lng } : DEFAULT_CENTER;
        const map = new google.maps.Map(mapEl.current, {
          center: start,
          zoom: current ? 15 : 12,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
        });
        mapRef.current = map;
        if (current) {
          markerRef.current = new google.maps.Marker({ map, position: start });
        }
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          placeMarker(lat, lng);
          reverseGeocode(lat, lng);
        });
        try {
          const { AutocompleteSessionToken } = (await google.maps.importLibrary('places')) as any;
          sessionTokenRef.current = new AutocompleteSessionToken();
        } catch {/* ignore */}
        setLoaded(true);
      })
      .catch((e) => setError(e.message));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      mapRef.current = null;
      markerRef.current = null;
      setLoaded(false);
      setSuggestions([]);
      setSearch('');
    }
  }, [open]);

  const placeMarker = (lat: number, lng: number) => {
    const google = (window as any).google;
    if (!google || !mapRef.current) return;
    if (markerRef.current) markerRef.current.setMap(null);
    markerRef.current = new google.maps.Marker({ map: mapRef.current, position: { lat, lng } });
    mapRef.current.panTo({ lat, lng });
    if ((mapRef.current.getZoom() ?? 0) < 14) mapRef.current.setZoom(15);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    const google = (window as any).google;
    if (!google?.maps?.Geocoder) {
      await fallbackGeocode(lat, lng);
      return;
    }
    setCurrent({ label: 'Buscando dirección…', lat, lng });
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, async (results: any, status: any) => {
      if (status === 'OK' && results && results[0]) {
        const comps = results[0].address_components;
        const city = comps.find((c: any) => c.types.includes('locality'))?.long_name ??
                     comps.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name ?? '';
        const region = comps.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name ?? '';
        const country = comps.find((c: any) => c.types.includes('country'))?.long_name ?? '';
        let address = results[0].formatted_address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        address = address.replace(/^[A-Z0-9]{4}\+[A-Z0-9]{2,3},\s*/, '');
        setCurrent({ label: address, city: city || undefined, country: country || undefined, detail: region || undefined, lat, lng });
      } else {
        await fallbackGeocode(lat, lng);
      }
    });
  };

  const fallbackGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=es`,
        { headers: { 'User-Agent': 'MiApp/1.0' } }
      );
      const data = await res.json();
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
      const country = data.address?.country || '';
      const label = city || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setCurrent({ label, city: city || undefined, country: country || undefined, lat, lng });
    } catch {
      setCurrent({ label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng });
    }
  };

  // Debounced autocomplete
  useEffect(() => {
    if (!loaded) return;
    if (!search.trim()) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        setSearching(true);
        const google = (window as any).google;
        const { AutocompleteSuggestion } = (await google.maps.importLibrary('places')) as any;
        const { suggestions: res } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: search,
          sessionToken: sessionTokenRef.current,
        });
        const list: Suggestion[] = (res ?? []).slice(0, 6).map((s: any) => {
          const p = s.placePrediction;
          return {
            placeId: p?.placeId ?? '',
            primary: p?.mainText?.text ?? p?.text?.text ?? '',
            secondary: p?.secondaryText?.text ?? '',
          };
        }).filter((s: Suggestion) => s.placeId);
        setSuggestions(list);
      } catch (e: any) {
        // silent
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [search, loaded]);

  const handlePickSuggestion = async (s: Suggestion) => {
    try {
      const google = (window as any).google;
      const { Place } = (await google.maps.importLibrary('places')) as any;
      const place = new Place({ id: s.placeId, requestedLanguage: 'es' });
      await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'] });
      const loc = place.location;
      if (!loc) return;
      const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
      const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
      placeMarker(lat, lng);
      const label = place.displayName || s.primary || place.formattedAddress || 'Ubicación';
      const comps = place.addressComponents || [];
      const city = comps.find((c: any) => c.types?.includes('locality'))?.longText ??
                   comps.find((c: any) => c.types?.includes('administrative_area_level_2'))?.longText ?? '';
      const country = comps.find((c: any) => c.types?.includes('country'))?.longText ?? '';
      const detail = place.formattedAddress || s.secondary || undefined;
      setCurrent({ label, city: city || undefined, country: country || undefined, detail, lat, lng });
      setSearch(label);
      setSuggestions([]);
    } catch {
      toast.error('No se pudo obtener el lugar');
    }
  };

  const handleUseCurrent = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Tu dispositivo no soporta geolocalización');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        placeMarker(lat, lng);
        const google = (window as any).google;
        if (google?.maps?.Geocoder) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
            if (status === 'OK' && results && results[0]) {
              const comps = results[0].address_components;
              const city = comps.find((c: any) => c.types.includes('locality'))?.long_name ??
                           comps.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name ?? '';
              const country = comps.find((c: any) => c.types.includes('country'))?.long_name ?? '';
              setCurrent({ label: results[0].formatted_address || 'Mi ubicación actual', city: city || undefined, country: country || undefined, lat, lng });
            } else {
              setCurrent({ label: 'Mi ubicación actual', lat, lng });
            }
            setLocating(false);
          });
        } else {
          setCurrent({ label: 'Mi ubicación actual', lat, lng });
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error('Permiso de ubicación denegado. Actívalo en los ajustes del navegador.');
        } else {
          toast.error('No se pudo obtener tu ubicación');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSave = () => {
    if (!current) {
      toast.error('Selecciona una ubicación en el mapa');
      return;
    }
    onSelect(current);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" /> Cambiar ubicación
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-2 shrink-0 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar dirección, barrio o ciudad"
              className="pl-9"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseCurrent}
            disabled={locating}
            className="w-full"
          >
            {locating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Crosshair className="h-4 w-4 mr-2" />}
            Usar mi ubicación actual
          </Button>
        </div>

        <div className="relative flex-1 min-h-0">
          {suggestions.length > 0 && (
            <div className="absolute z-10 left-4 right-4 top-2 rounded-xl border bg-popover shadow-lg overflow-hidden">
              {suggestions.map((s) => (
                <button
                  key={s.placeId}
                  type="button"
                  onClick={() => handlePickSuggestion(s)}
                  className="w-full text-left px-3 py-2 hover:bg-muted/60 flex items-start gap-2 border-b last:border-b-0"
                >
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.primary}</p>
                    {s.secondary && <p className="text-xs text-muted-foreground truncate">{s.secondary}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
          <div ref={mapEl} className="absolute inset-0 bg-muted" />
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-destructive">
              {error}
            </div>
          )}
          {!loaded && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="border-t bg-background px-4 py-3 shrink-0 space-y-3">
          {current && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium truncate">{current.label}</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={!current}>
              Guardar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChangeLocationSheet;