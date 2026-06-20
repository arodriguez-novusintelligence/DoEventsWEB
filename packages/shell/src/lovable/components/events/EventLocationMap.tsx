import { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';

interface Props {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number) => void;
}

declare global {
  interface Window {
    google?: any;
    __initEventLocationMap?: () => void;
  }
}

const GOOGLE_MAPS_CALLBACK = '__initEventLocationMap';
let scriptPromise: Promise<void> | null = null;

const loadGoogleMaps = () => {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    window[GOOGLE_MAPS_CALLBACK] = () => resolve();
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      || import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=${GOOGLE_MAPS_CALLBACK}&channel=${channel}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
  return scriptPromise;
};

const EventLocationMap = ({ lat, lng, onPick }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);
    setReady(false);
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.maps) return;
        const map = new window.google.maps.Map(containerRef.current, {
          center: { lat, lng },
          zoom: 15,
          disableDefaultUI: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map,
        });
        map.addListener('click', (e: any) => {
          if (!e.latLng) return;
          onPick(e.latLng.lat(), e.latLng.lng());
        });
        mapRef.current = map;
        markerRef.current = marker;
        setReady(true);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey]);

  useEffect(() => {
    if (!ready || !mapRef.current || !markerRef.current) return;
    const pos = { lat, lng };
    mapRef.current.setCenter(pos);
    markerRef.current.setPosition(pos);
  }, [lat, lng, ready]);

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-border bg-muted">
      {!ready && !loadError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 animate-pulse bg-muted/80">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Cargando mapa…</span>
        </div>
      )}
      {loadError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-muted px-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <p className="text-xs font-medium text-foreground">No se pudo cargar el mapa</p>
          <p className="text-[10px] text-muted-foreground">
            Verifica la clave de Google Maps o ingresa la dirección manualmente.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-1 gap-1.5 rounded-full"
            onClick={() => {
              scriptPromise = null;
              setRetryKey((k) => k + 1);
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reintentar
          </Button>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
};

export default EventLocationMap;
