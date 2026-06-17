import React from 'react';
import {
  FeedEventItem,
  formatShortEventDate,
  isEventThisWeek,
  parseAttendeeCount,
  resolveEventImageUrl,
  SafeImage,
  UserAvatar,
} from '@doevents/shared';

export interface TrendingEventsSectionProps {
  events: FeedEventItem[];
  onEventClick?: (eventId: string) => void;
  onOrganizerClick?: (userId: string) => void;
}

export function buildTrendingEvents(events: FeedEventItem[], limit = 5): FeedEventItem[] {
  return [...events]
    .filter((ev) => isEventThisWeek(ev.fechaIni))
    .sort((a, b) => {
      const diff = parseAttendeeCount(b.aforo) - parseAttendeeCount(a.aforo);
      if (diff !== 0) return diff;
      return (a.distancia ?? 9999) - (b.distancia ?? 9999);
    })
    .slice(0, limit);
}

export const TrendingEventsSection: React.FC<TrendingEventsSectionProps> = ({
  events,
  onEventClick,
  onOrganizerClick,
}) => {
  const trending = buildTrendingEvents(events);
  if (!trending.length) return null;

  return (
    <section className="de-trending-section">
      <div className="de-trending-section__header">
        <span className="de-trending-section__icon" aria-hidden="true">📈</span>
        <h2>Tendencia esta semana</h2>
      </div>
      <ul className="de-trending-list">
        {trending.map((ev, index) => {
          const attendees = parseAttendeeCount(ev.aforo);
          const hasImage = Boolean(ev.imagen);
          return (
            <li key={ev.id}>
              <button
                type="button"
                className="de-trending-card"
                onClick={() => onEventClick?.(ev.id)}
              >
                <div className="de-trending-card__thumb">
                  {hasImage ? (
                    <SafeImage
                      src={ev.imagen}
                      alt={ev.nombre}
                      className="de-trending-card__img"
                      loading="lazy"
                      fallbackSrc={resolveEventImageUrl()}
                    />
                  ) : (
                    <div className="de-trending-card__img de-trending-card__img--placeholder" />
                  )}
                  <span className="de-trending-card__rank">#{index + 1}</span>
                </div>
                <div className="de-trending-card__body">
                  {ev.organizerName && ev.userId && (
                    <button
                      type="button"
                      className="de-trending-card__organizer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOrganizerClick?.(ev.userId!);
                      }}
                    >
                      <UserAvatar
                        name={ev.organizerName}
                        imageUrl={ev.organizerAvatar}
                        size={22}
                      />
                      <span>{ev.organizerName}</span>
                    </button>
                  )}
                  <p className="de-trending-card__date">{formatShortEventDate(ev.fechaIni)}</p>
                  <h3>{ev.nombre}</h3>
                  <p className="de-trending-card__attendees">
                    👥 {attendees > 0 ? attendees : '—'} asistentes
                  </p>
                </div>
                <span className="de-trending-card__chev" aria-hidden="true">›</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default TrendingEventsSection;
