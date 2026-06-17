import React from 'react';
import { EventCard } from './EventCard';
import { EventCardHorizontal } from './EventCardHorizontal';
import { resolveDisplayLocation } from '../lib/formatMapLocation';
import type { FeedEventItem, UserEventItem } from '../types/events';

type EventItem = FeedEventItem | UserEventItem;

export interface EventSectionProps {
  title: string;
  subtitle?: string;
  events: EventItem[];
  variant?: 'vertical' | 'horizontal' | 'list';
  onEventClick?: (eventId: string) => void;
  onSeeMore?: () => void;
}

function formatEventDate(item: { fechaIni?: string; horaIni?: string }): string {
  return [item.fechaIni, item.horaIni].filter(Boolean).join(' - ');
}

function formatLocation(item: { direccion?: string; ciudad?: string; departamento?: string }): string {
  return resolveDisplayLocation({
    direccion: (item as FeedEventItem).direccion,
    ciudad: item.ciudad,
    departamento: item.departamento,
  });
}

export const EventSection: React.FC<EventSectionProps> = ({
  title,
  subtitle,
  events,
  variant = 'vertical',
  onEventClick,
  onSeeMore,
}) => {
  if (!events.length) return null;

  if (variant === 'list') {
    return (
      <ul className="de-event-list">
        {events.map((ev) => (
          <li key={ev.id}>
            <EventCardHorizontal
              title={ev.nombre}
              imageUrl={ev.imagen}
              dateLine={formatEventDate(ev)}
              locationLine={formatLocation(ev)}
              description={ev.descripcion}
              organizerName={'organizerName' in ev ? ev.organizerName : undefined}
              organizerAvatar={'organizerAvatar' in ev ? ev.organizerAvatar : undefined}
              onClick={() => onEventClick?.(ev.id)}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="de-wall-section">
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
      <div className={variant === 'horizontal' ? 'de-wall-scroll de-wall-scroll--rows' : 'de-wall-scroll'}>
        {events.map((ev) =>
          variant === 'horizontal' ? (
            <EventCardHorizontal
              key={ev.id}
              className="de-event-card-h--scroll"
              title={ev.nombre}
              imageUrl={ev.imagen}
              dateLine={formatEventDate(ev)}
              locationLine={formatLocation(ev)}
              description={ev.descripcion}
              organizerName={'organizerName' in ev ? ev.organizerName : undefined}
              organizerAvatar={'organizerAvatar' in ev ? ev.organizerAvatar : undefined}
              onClick={() => onEventClick?.(ev.id)}
            />
          ) : (
            <EventCard
              key={ev.id}
              title={ev.nombre}
              imageUrl={ev.imagen}
              dateLine={formatEventDate(ev)}
              locationLine={formatLocation(ev)}
              description={ev.descripcion}
              organizerName={'organizerName' in ev ? ev.organizerName : undefined}
              organizerAvatar={'organizerAvatar' in ev ? ev.organizerAvatar : undefined}
              badge={'estatus' in ev && ev.estatus === 'PUBLICADO' ? 'Publicado' : undefined}
              onClick={() => onEventClick?.(ev.id)}
            />
          ),
        )}
      </div>
    </section>
  );
};
