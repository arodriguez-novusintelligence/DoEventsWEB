import React from 'react';
import type { EventPersonInfo } from '@doevents/shared';
import { UserAvatar } from '@doevents/shared';

function personName(person?: EventPersonInfo | null, fallback = 'Usuario'): string {
  if (!person) return fallback;
  return [person.name, person.lastName].filter(Boolean).join(' ').trim()
    || person.user?.trim()
    || fallback;
}

function StarRating({ value }: { value: number }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="de-event-person__stars" aria-label={`Calificación ${value}`}>
      {stars.map((star) => (
        <span key={star} className={star <= Math.round(value) ? 'de-event-person__star--on' : ''}>★</span>
      ))}
    </div>
  );
}

export interface EventPersonCardProps {
  person?: EventPersonInfo | null;
  fallbackName?: string;
}

export const EventPersonCard: React.FC<EventPersonCardProps> = ({ person, fallbackName = 'Usuario' }) => {
  const name = personName(person, fallbackName);
  const rating = person?.calificacionPromedio ?? person?.calificacion ?? 0;
  const eventsCount = person?.eventosRealizados ?? person?.totalEventos ?? 0;
  const experience = person?.experiencia ?? 0;

  return (
    <article className="de-event-person">
      <div className="de-event-person__left">
        <UserAvatar
          name={name}
          imageUrl={person?.fotoPerfilUrl}
          size={68}
          className="de-event-person__avatar"
        />
        <p className="de-event-person__name">{name}</p>
      </div>
      <div className="de-event-person__right">
        <p className="de-event-person__label">Calificación</p>
        <StarRating value={rating} />
        <div className="de-event-person__stats">
          <div>
            <strong>{eventsCount}</strong>
            <span>Eventos realizados</span>
          </div>
          <div>
            <strong>%{experience}</strong>
            <span>Experiencia</span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default EventPersonCard;
