import { useEffect, useRef, useState } from 'react';

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
    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
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

  useEffect(() => {
    let cancelled = false;
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
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || !markerRef.current) return;
    const pos = { lat, lng };
    mapRef.current.setCenter(pos);
    markerRef.current.setPosition(pos);
  }, [lat, lng, ready]);

  return (
    <div
      ref={containerRef}
      className="h-48 w-full overflow-hidden rounded-xl border border-border bg-muted"
    />
  );
};

export default EventLocationMap;