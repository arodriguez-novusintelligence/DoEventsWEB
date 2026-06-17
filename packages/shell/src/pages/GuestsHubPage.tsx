import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@doevents/shared';
import GuestManagementView from '@lovable/components/guests/GuestManagementView';
import { useApiGuests } from '../lovable-bridge/useApiGuests';

interface GuestsLocationState {
  eventId?: string;
  openInvitation?: boolean;
}

export const GuestsHubPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const guestsController = useApiGuests(userId || undefined);
  const [navState] = useState<GuestsLocationState>(
    () => (location.state as GuestsLocationState | null) || {},
  );

  useEffect(() => {
    if (location.state && Object.keys(location.state as object).length > 0) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  return (
    <GuestManagementView
      onBack={() => navigate(-1)}
      guestsController={guestsController}
      userId={userId || undefined}
      initialEventId={navState.eventId}
      autoOpenInvitation={navState.openInvitation}
    />
  );
};

export default GuestsHubPage;
