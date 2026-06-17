import React from 'react';
import type { FeedEventItem, UserEventItem } from '../types/events';
import { resolveDisplayLocation } from '../lib/formatMapLocation';
import { RecommendedEventCard } from './RecommendedEventCard';

type EventItem = FeedEventItem | UserEventItem;

export interface RecommendedEventsSectionProps {
  title: string;
  subtitle?: string;
  events: EventItem[];
  onEventClick?: (eventId: string) => void;
  onOrganizerClick?: (userId: string) => void;
  onSeeMore?: () => void;
}

function formatDate(item: EventItem): string {
  return [item.fechaIni, item.horaIni].filter(Boolean).join(' - ');
}

function formatLocation(item: EventItem): string {
  const feedItem = item as FeedEventItem;
  return resolveDisplayLocation({
    direccion: feedItem.direccion,
    ciudad: item.ciudad,
    departamento: item.departamento,
    pais: feedItem.pais,
  });
}

function categoryLabel(ev: EventItem): string | undefined {
  return (ev as FeedEventItem).Categoria || ev.nombre;
}

export const RecommendedEventsSection: React.FC<RecommendedEventsSectionProps> = ({
  title,
  subtitle,
  events,
  onEventClick,
  onOrganizerClick,
  onSeeMore,
}) => {
  if (!events.length) return null;

  return (
    <section className="de-wall-section de-wall-section--carousel">
      <div className="de-wall-section__header">
        <div>
          <h2 className="de-wall-section__title">{title}</h2>
          {subtitle && <p className="de-wall-section__subtitle">{subtitle}</p>}
        </div>
        {onSeeMore && (
          <button type="button" className="de-wall-section__more" onClick={onSeeMore}>
            Ver más →
          </button>
        )}
      </div>
      <div className="de-wall-scroll">
        {events.map((ev) => (
          <RecommendedEventCard
            key={ev.id}
            title={ev.nombre}
            imageUrl={ev.imagen}
            dateLine={formatDate(ev)}
            locationLine={formatLocation(ev)}
            categoryLabel={categoryLabel(ev)}
            organizerName={'organizerName' in ev ? ev.organizerName : undefined}
            organizerAvatar={'organizerAvatar' in ev ? ev.organizerAvatar : undefined}
            organizerUserId={'userId' in ev ? ev.userId : undefined}
            onClick={() => onEventClick?.(ev.id)}
            onOrganizerClick={onOrganizerClick}
          />
        ))}
        {onSeeMore && (
          <button type="button" className="de-rec-event-card de-rec-event-card--more" onClick={onSeeMore}>
            <span>Ver más eventos</span>
            <strong>→</strong>
          </button>
        )}
      </div>
    </section>
  );
};

export default RecommendedEventsSection;
