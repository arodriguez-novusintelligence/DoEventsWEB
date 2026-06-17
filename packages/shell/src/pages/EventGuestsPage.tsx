import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

export const EventGuestsPage: React.FC = () => {
  const { eventId = '' } = useParams();

  return (
    <Navigate
      to="/guests"
      replace
      state={{
        eventId,
        openInvitation: true,
      }}
    />
  );
};

export default EventGuestsPage;
