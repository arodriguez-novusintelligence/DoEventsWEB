import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

/** Compatibilidad: /places/:id/reserve redirige al detalle unificado con reserva integrada. */
export const PlaceReservePage: React.FC = () => {
  const { venueId = '' } = useParams();
  return <Navigate to={`/places/${encodeURIComponent(venueId)}`} replace />;
};

export default PlaceReservePage;
