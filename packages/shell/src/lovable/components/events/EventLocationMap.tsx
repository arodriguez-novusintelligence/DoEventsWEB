import { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsScript } from '@doevents/shared';

interface Props {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number) => void;
  /** Cuando es true, el usuario puede tocar/arrastrar el pin para fijar la ubicación. */
  pickMode?: boolean;
}

const EventLocationMap = ({ lat, lng, onPick, pickMode = false }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const onPickRef = useRef(onPick);
  const pickModeRef = useRef(pickMode);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    pickModeRef.current = pickMode;
  }, [pickMode]);

  useEffect(() => {
    let cancelled = false;
    let clickListener: google.maps.MapsEventListener | null = null;
    let dragListener: google.maps.MapsEventListener | null = null;

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
          gestureHandling: 'greedy',
          draggableCursor: pickModeRef.current ? 'crosshair' : undefined,
          draggingCursor: pickModeRef.current ? 'crosshair' : undefined,
        });
        const marker = new googleMaps.maps.Marker({
          position: { lat, lng },
          map,
          draggable: pickModeRef.current,
          animation: pickModeRef.current ? googleMaps.maps.Animation.DROP : undefined,
        });

        const emitPick = (nextLat: number, nextLng: number) => {
          marker.setPosition({ lat: nextLat, lng: nextLng });
          onPickRef.current(nextLat, nextLng);
        };

        clickListener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!pickModeRef.current || !e.latLng) return;
          emitPick(e.latLng.lat(), e.latLng.lng());
        });

        dragListener = marker.addListener('dragend', () => {
          if (!pickModeRef.current) return;
          const position = marker.getPosition();
          if (!position) return;
          emitPick(position.lat(), position.lng());
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
      if (clickListener) clickListener.remove();
      if (dragListener) dragListener.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || !markerRef.current) return;
    const pos = { lat, lng };
    mapRef.current.setCenter(pos);
    markerRef.current.setPosition(pos);
  }, [lat, lng, ready]);

  useEffect(() => {
    if (!ready || !mapRef.current || !markerRef.current) return;
    markerRef.current.setDraggable(pickMode);
    mapRef.current.setOptions({
      draggableCursor: pickMode ? 'crosshair' : undefined,
      draggingCursor: pickMode ? 'crosshair' : undefined,
    });
    if (pickMode && window.google?.maps?.Animation) {
      markerRef.current.setAnimation(window.google.maps.Animation.BOUNCE);
      window.setTimeout(() => {
        markerRef.current?.setAnimation(null);
      }, 1400);
    }
  }, [pickMode, ready]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={`h-56 w-full overflow-hidden rounded-xl border bg-muted ${
          pickMode ? 'border-primary ring-2 ring-primary/30' : 'border-border'
        }`}
      />
      {pickMode && (
        <div className="pointer-events-none absolute inset-x-2 top-2 rounded-lg bg-foreground/85 px-3 py-2 text-center text-[11px] font-semibold leading-snug text-background shadow-sm">
          Toca el mapa o arrastra el pin para fijar la ubicación exacta
        </div>
      )}
    </div>
  );
};

export default EventLocationMap;
