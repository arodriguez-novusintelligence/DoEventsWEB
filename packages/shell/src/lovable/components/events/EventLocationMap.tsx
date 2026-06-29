import { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsScript } from '@doevents/shared';

interface Props {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number) => void;
}

const EventLocationMap = ({ lat, lng, onPick }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMapsScript('__initEventLocationMap')
      .then((googleMaps) => {
        if (cancelled || !containerRef.current) return;
        const map = new googleMaps.maps.Map(containerRef.current, {
          center: { lat, lng },
          zoom: 15,
          disableDefaultUI: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        const marker = new googleMaps.maps.Marker({
          position: { lat, lng },
          map,
        });
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
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
