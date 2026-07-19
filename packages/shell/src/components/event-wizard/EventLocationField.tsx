import React, { useCallback, useEffect, useRef, useState } from 'react';
import { geocodePlaceQuery, reverseGeocodePlace, type GeocodedPlace } from '@doevents/shared';
import { loadLeaflet } from '../../lib/loadLeaflet';

interface EventLocationFieldProps {
  ubicacion: string;
  direccion: string;
  latitude: string;
  longitude: string;
  ciudad: string;
  departamento: string;
  onUbicacionChange: (value: string) => void;
  onDireccionChange: (value: string) => void;
  onPlaceResolved: (place: GeocodedPlace) => void;
}

export const EventLocationField: React.FC<EventLocationFieldProps> = ({
  ubicacion,
  direccion,
  latitude,
  longitude,
  ciudad,
  departamento,
  onUbicacionChange,
  onDireccionChange,
  onPlaceResolved,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<{ setView: (c: [number, number], z: number) => void } | null>(null);
  const markerRef = useRef<{ setLatLng: (c: [number, number]) => void } | null>(null);
  const [resolving, setResolving] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [hint, setHint] = useState('');

  const coords = latitude && longitude
    ? { lat: Number(latitude), lng: Number(longitude) }
    : null;

  const applyPlace = useCallback((place: GeocodedPlace) => {
    onPlaceResolved(place);
    setHint(place.label);
  }, [onPlaceResolved]);

  const resolveQuery = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setResolving(true);
    try {
      const place = await geocodePlaceQuery(trimmed);
      if (place) applyPlace(place);
    } finally {
      setResolving(false);
    }
  }, [applyPlace]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (ubicacion.trim().length >= 3) resolveQuery(ubicacion);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [ubicacion, resolveQuery]);

  useEffect(() => {
    if (!showMap) return;
    let cancelled = false;

    void loadLeaflet().then((L) => {
      if (cancelled || !mapRef.current) return;

      const start = coords || { lat: 4.711, lng: -74.0721 };
      if (!mapInstance.current) {
        const map = L.map(mapRef.current, { zoomControl: true });
        map.setView([start.lat, start.lng], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);
        const marker = L.marker([start.lat, start.lng], { draggable: true });
        marker.addTo(map);
        marker.on('dragend', async () => {
          const pos = marker.getLatLng();
          const place = await reverseGeocodePlace(pos.lat, pos.lng);
          if (place) applyPlace(place);
          else onPlaceResolved({
            lat: pos.lat,
            lng: pos.lng,
            label: `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`,
          });
        });
        map.on('click', async (ev) => {
          marker.setLatLng([ev.latlng.lat, ev.latlng.lng]);
          const place = await reverseGeocodePlace(ev.latlng.lat, ev.latlng.lng);
          if (place) applyPlace(place);
          else onPlaceResolved({
            lat: ev.latlng.lat,
            lng: ev.latlng.lng,
            label: `${ev.latlng.lat.toFixed(4)}, ${ev.latlng.lng.toFixed(4)}`,
          });
        });
        mapInstance.current = map;
        markerRef.current = marker;
      } else if (coords) {
        mapInstance.current.setView([coords.lat, coords.lng], 13);
        markerRef.current?.setLatLng([coords.lat, coords.lng]);
      }
    }).catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [showMap, coords, applyPlace, onPlaceResolved]);

  useEffect(() => {
    if (coords && markerRef.current) {
      markerRef.current.setLatLng([coords.lat, coords.lng]);
      mapInstance.current?.setView([coords.lat, coords.lng], 13);
    }
  }, [latitude, longitude, coords]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const place = await reverseGeocodePlace(pos.coords.latitude, pos.coords.longitude);
      if (place) applyPlace(place);
      else onPlaceResolved({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        label: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
      });
    });
  };

  return (
    <div className="de-event-location">
      <label className="de-field">
        <span className="de-field__label">Ubicación *</span>
        <input
          className="de-field__input"
          placeholder="Ej: Bogotá, Medellín, Girardot..."
          value={ubicacion}
          onChange={(e) => onUbicacionChange(e.target.value)}
        />
        {resolving && <small className="de-event-location__hint">Buscando ubicación...</small>}
        {!resolving && hint && <small className="de-event-location__hint">{hint}</small>}
        {(ciudad || departamento) && (
          <small className="de-event-location__resolved">
            Ciudad detectada: {ciudad}{departamento ? `, ${departamento}` : ''}
          </small>
        )}
      </label>

      <label className="de-field">
        <span className="de-field__label">Dirección del evento</span>
        <input
          className="de-field__input"
          placeholder="Calle, número, lugar específico"
          value={direccion}
          onChange={(e) => onDireccionChange(e.target.value)}
        />
      </label>

      <div className="de-event-location__map-actions">
        <button type="button" className="de-search-bar__btn" onClick={() => setShowMap((v) => !v)}>
          {showMap ? 'Ocultar mapa' : 'Ubicar en mapa'}
        </button>
        <button type="button" className="de-search-bar__btn" onClick={handleUseMyLocation}>
          Usar mi ubicación
        </button>
      </div>

      {showMap && (
        <div className="de-event-location__map" ref={mapRef} role="application" aria-label="Mapa de ubicación del evento" />
      )}
    </div>
  );
};

export default EventLocationField;
