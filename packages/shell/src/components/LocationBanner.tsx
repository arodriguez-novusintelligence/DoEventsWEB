import React, { useState } from 'react';
import {
  getStoredUserLocation,
  resolveManualUserLocation,
  resolveUserLocation,
  StoredUserLocation,
  useToast,
} from '@doevents/shared';

export interface LocationBannerProps {
  label: string | null;
  fallbackCity?: string;
  onLocationResolved: (location: StoredUserLocation) => void;
}

function LocationPinIcon() {
  return (
    <svg className="de-feed-location-bar__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
        fill="currentColor"
      />
    </svg>
  );
}

export const LocationBanner: React.FC<LocationBannerProps> = ({
  label,
  fallbackCity,
  onLocationResolved,
}) => {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [manualCity, setManualCity] = useState(fallbackCity || '');
  const [locating, setLocating] = useState(false);
  const [savingManual, setSavingManual] = useState(false);

  const localizeMe = async () => {
    setLocating(true);
    try {
      const resolved = await resolveUserLocation({ prompt: true, force: true, fallbackCity });
      if (resolved) {
        onLocationResolved(resolved);
        showToast('Ubicación detectada correctamente', 'success');
        setEditing(false);
        return;
      }
      showToast('Activa la ubicación del navegador o escríbela manualmente', 'error');
      setEditing(true);
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
        showToast('No pudimos interpretar esa ubicación. Incluye ciudad y país.', 'error');
        return;
      }
      onLocationResolved(resolved);
      showToast(`Ubicación aplicada: ${resolved.label || resolved.city}`, 'success');
      setEditing(false);
    } finally {
      setSavingManual(false);
    }
  };

  const displayLabel = label || fallbackCity || 'Indica dónde te encuentras para ver eventos cercanos';

  return (
    <div className="de-feed-location-bar">
      <div className="de-feed-location-bar__main">
        <LocationPinIcon />
        <div className="de-feed-location-bar__copy">
          <strong>Ubicación</strong>
          <p>{displayLabel}</p>
        </div>
        <button
          type="button"
          className="de-feed-location-bar__localize"
          onClick={localizeMe}
          disabled={locating}
        >
          {locating ? 'Localizando…' : 'Localízame'}
        </button>
      </div>

      <div className="de-feed-location-bar__actions">
        <button
          type="button"
          className="de-feed-location-bar__btn de-feed-location-bar__btn--ghost"
          onClick={() => {
            const stored = getStoredUserLocation();
            setManualCity(stored?.city || fallbackCity || '');
            setEditing((v) => !v);
          }}
        >
          {editing ? 'Cancelar' : 'Escribir ubicación'}
        </button>
      </div>

      {editing && (
        <div className="de-feed-location-bar__edit">
          <input
            type="text"
            placeholder="Ej: Girardot, Melgar, Bogotá…"
            value={manualCity}
            onChange={(e) => setManualCity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveManualCity();
            }}
            aria-label="Ubicación manual"
          />
          <button type="button" onClick={saveManualCity} disabled={savingManual}>
            {savingManual ? '…' : 'Aplicar'}
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationBanner;
