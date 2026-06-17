import React from 'react';
import { resolveEventImageUrl } from '../lib/resolveImageUrl';
import { SafeImage } from './SafeImage';
import { UserAvatar } from './UserAvatar';

export interface EventCardHorizontalProps {
  title: string;
  imageUrl?: string;
  dateLine?: string;
  locationLine?: string;
  description?: string;
  organizerName?: string;
  organizerAvatar?: string;
  className?: string;
  onClick?: () => void;
}

export const EventCardHorizontal: React.FC<EventCardHorizontalProps> = ({
  title,
  imageUrl,
  dateLine,
  locationLine,
  description,
  organizerName,
  organizerAvatar,
  className = '',
  onClick,
}) => {
  const hasImage = Boolean(imageUrl);

  return (
    <button type="button" className={`de-event-card-h ${className}`.trim()} onClick={onClick}>
      {hasImage && (
        <div className="de-event-card-h__image-wrap">
          <SafeImage
            src={imageUrl}
            alt={title}
            className="de-event-card-h__image"
            loading="lazy"
            fallbackSrc={resolveEventImageUrl()}
          />
        </div>
      )}
      <div className="de-event-card-h__body">
        {(organizerName || organizerAvatar) && (
          <div className="de-event-card-h__organizer">
            <UserAvatar name={organizerName} imageUrl={organizerAvatar} size={24} />
            <span>{organizerName || 'Organizador'}</span>
          </div>
        )}
        <h3 className="de-event-card-h__title">{title}</h3>
        {dateLine && <p className="de-event-card-h__date">{dateLine}</p>}
        {locationLine && <p className="de-event-card-h__location">{locationLine}</p>}
        {description && (
          <p className="de-event-card-h__desc">
            {description.length > 120 ? `${description.slice(0, 120)}…` : description}
          </p>
        )}
      </div>
    </button>
  );
};
