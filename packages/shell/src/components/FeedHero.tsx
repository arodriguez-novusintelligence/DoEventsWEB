import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchUserById,
  resolveUserLocation,
  StoredUserLocation,
  useToast,
} from '@doevents/shared';

export interface FeedHeroProps {
  userId?: string | null;
  label: string | null;
  profileCity?: string;
  recommendedCount?: number;
  onLocationResolved: (location: StoredUserLocation) => void;
}

function LocationPinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
  );
}

export const FeedHero: React.FC<FeedHeroProps> = ({
  userId,
  label,
  profileCity,
  recommendedCount = 0,
  onLocationResolved,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [locating, setLocating] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [profileLocation, setProfileLocation] = useState(profileCity || '');

  useEffect(() => {
    if (!userId) {
      setFirstName('');
      return;
    }
    let cancelled = false;
    fetchUserById(userId)
      .then((profile) => {
        if (cancelled || !profile) return;
        const name = profile.nombre?.trim() || profile.username?.trim() || '';
        setFirstName(name.split(' ')[0] || name);
        if (profile.ciudad) setProfileLocation(profile.ciudad);
      })
      .catch(() => {
        if (!cancelled) setFirstName('');
      });
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (profileCity) setProfileLocation(profileCity);
  }, [profileCity]);

  const displayLabel = label || profileLocation || 'Indica tu ubicación';

  const handleChangeLocation = async () => {
    setLocating(true);
    try {
      const fromDevice = await resolveUserLocation({
        prompt: true,
        force: true,
        deviceOnly: true,
      });
      if (fromDevice) {
        onLocationResolved(fromDevice);
        showToast('Ubicación del dispositivo aplicada', 'success');
        return;
      }
      const fromProfile = await resolveUserLocation({
        profileCity: profileLocation,
        force: true,
        prompt: false,
        deviceOnly: false,
      });
      if (fromProfile) {
        onLocationResolved(fromProfile);
        showToast(
          profileLocation
            ? `Usando tu ubicación de perfil: ${fromProfile.label || profileLocation}`
            : 'No pudimos obtener tu ubicación. Configúrala en tu perfil.',
          profileLocation ? 'success' : 'error',
        );
        return;
      }
      showToast('Configura tu ubicación actual en tu perfil', 'error');
    } finally {
      setLocating(false);
    }
  };

  const greeting = firstName ? `¡Hola, ${firstName}!` : '¡Hola!';

  return (
    <section className="de-feed-hero de-feed-hero--compact">
      <div className="de-feed-hero__blob de-feed-hero__blob--tr" aria-hidden="true" />
      <div className="de-feed-hero__blob de-feed-hero__blob--bl" aria-hidden="true" />

      <div className="de-feed-hero__inner">
        <div className="de-feed-hero__location-row">
          <div className="de-feed-hero__location-main">
            <span className="de-feed-hero__pin" aria-hidden="true">
              <LocationPinIcon />
            </span>
            <div className="de-feed-hero__location-text">
              <p className="de-feed-hero__location-label">Tu ubicación</p>
              <p className="de-feed-hero__location-value">{displayLabel}</p>
            </div>
          </div>
          <button
            type="button"
            className="de-feed-hero__change-btn"
            onClick={handleChangeLocation}
            disabled={locating}
          >
            {locating ? '…' : 'Cambiar'}
          </button>
        </div>

        <div className="de-feed-hero__greeting">
          <h1>{greeting} <span aria-hidden="true">👋</span></h1>
          <p>Descubre qué está pasando hoy cerca de ti</p>
        </div>

        <button
          type="button"
          className="de-feed-hero__search"
          onClick={() => navigate('/search')}
        >
          <SearchIcon />
          <span>Buscar eventos, lugares o categorías…</span>
        </button>

        <div className="de-feed-hero__stats de-feed-hero__stats--compact">
          <div className="de-feed-hero__stat">
            <strong>{recommendedCount || '—'}</strong>
            <span>Cerca</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeedHero;
