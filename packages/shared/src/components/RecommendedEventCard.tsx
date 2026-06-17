import React from 'react';
import { resolveEventImageUrl } from '../lib/resolveImageUrl';
import { SafeImage } from './SafeImage';
import { UserAvatar } from './UserAvatar';

export interface RecommendedEventCardProps {
  title: string;
  imageUrl?: string;
  dateLine?: string;
  locationLine?: string;
  categoryLabel?: string;
  organizerName?: string;
  organizerAvatar?: string;
  organizerUserId?: string;
  onClick?: () => void;
  onOrganizerClick?: (userId: string) => void;
}

function formatOverlayDate(dateLine?: string): string {
  if (!dateLine) return '';
  const raw = dateLine.split(' - ')[0] || dateLine;
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(6, 8)}/${raw.slice(4, 6)}/${raw.slice(0, 4)}`;
  }
  return raw;
}

export const RecommendedEventCard: React.FC<RecommendedEventCardProps> = ({
  title,
  imageUrl,
  dateLine,
  locationLine,
  categoryLabel,
  organizerName,
  organizerAvatar,
  organizerUserId,
  onClick,
  onOrganizerClick,
}) => {
  const dateText = formatOverlayDate(dateLine);
  const locationText = locationLine || '';

  const hasImage = Boolean(imageUrl);

  return (
    <button type="button" className={`de-rec-event-card${hasImage ? '' : ' de-rec-event-card--no-img'}`} onClick={onClick}>
      {hasImage ? (
        <SafeImage
          src={imageUrl}
          alt={title}
          className="de-rec-event-card__img"
          loading="lazy"
          fallbackSrc={resolveEventImageUrl()}
        />
      ) : (
        <div className="de-rec-event-card__img de-rec-event-card__img--empty" aria-hidden="true" />
      )}
      {organizerName && (
        <div
          className="de-rec-event-card__organizer"
          role={organizerUserId && onOrganizerClick ? 'button' : undefined}
          tabIndex={organizerUserId && onOrganizerClick ? 0 : undefined}
          onClick={(e) => {
            if (!organizerUserId || !onOrganizerClick) return;
            e.stopPropagation();
            onOrganizerClick(organizerUserId);
          }}
          onKeyDown={(e) => {
            if (!organizerUserId || !onOrganizerClick) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onOrganizerClick(organizerUserId);
            }
          }}
        >
          <UserAvatar name={organizerName} imageUrl={organizerAvatar} size={24} />
          <span>{organizerName}</span>
        </div>
      )}
      {categoryLabel && (
        <div className="de-rec-event-card__badges">
          <span className="de-rec-event-card__badge">{categoryLabel}</span>
        </div>
      )}
      <div className="de-rec-event-card__overlay">
        {dateText && <span className="de-rec-event-card__overlay-date">{dateText}</span>}
        <strong>{title}</strong>
        {locationText && (
          <span className="de-rec-event-card__overlay-location">{locationText}</span>
        )}
      </div>
    </button>
  );
};

export default RecommendedEventCard;
