import React from 'react';
import { resolveEventImageUrl } from '../lib/resolveImageUrl';
import { SafeImage } from './SafeImage';
import { UserAvatar } from './UserAvatar';

export interface EventCardProps {
  title: string;
  imageUrl?: string;
  dateLine?: string;
  locationLine?: string;
  description?: string;
  badge?: string;
  organizerName?: string;
  organizerAvatar?: string;
  onClick?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  title,
  imageUrl,
  dateLine,
  locationLine,
  description,
  badge,
  organizerName,
  organizerAvatar,
  onClick,
}) => (
  <button type="button" className="de-event-card de-event-card--lovable" onClick={onClick}>
    <div className="de-event-card__image-wrap">
      <SafeImage
        src={imageUrl}
        alt={title}
        className="de-event-card__image"
        loading="lazy"
        fallbackSrc={resolveEventImageUrl()}
      />
      {badge && <span className="de-event-card__badge">{badge}</span>}
    </div>
    <div className="de-event-card__body">
      {(organizerName || organizerAvatar) && (
        <div className="de-event-card__organizer">
          <UserAvatar name={organizerName} imageUrl={organizerAvatar} size={24} />
          <span>{organizerName || 'Organizador'}</span>
        </div>
      )}
      <h3 className="de-event-card__title">{title}</h3>
      {dateLine && <p className="de-event-card__date">📅 {dateLine}</p>}
      {locationLine && <p className="de-event-card__location">📍 {locationLine}</p>}
      {description && (
        <p className="de-event-card__desc">
          {description.length > 90 ? `${description.slice(0, 90)}…` : description}
        </p>
      )}
    </div>
  </button>
);
