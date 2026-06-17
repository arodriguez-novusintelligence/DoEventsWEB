import React from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@doevents/shared';
import { useTicketCheckout } from '../lovable-bridge/useTicketCheckout';
import { LovableTicketCheckout } from '../lovable/components/checkout/LovableTicketCheckout';

export const TicketCheckoutPage: React.FC = () => {
  const { eventId = '' } = useParams();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const checkout = useTicketCheckout(eventId, userId);

  return <LovableTicketCheckout eventId={eventId} {...checkout} />;
};

export default TicketCheckoutPage;
