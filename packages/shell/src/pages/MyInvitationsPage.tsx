import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  EventInvitation,
  fetchEventDetail,
  fetchUserInvitations,
  Loader,
  respondToUserInvitation,
  RootState,
  useToast,
} from '@doevents/shared';
import MyInvitationsView from '@lovable/components/invitations/MyInvitationsView';
import InvitationEventDetailView from '@lovable/components/invitations/InvitationEventDetailView';
import type { InvitationEvent } from '@lovable/data/invitationsData';
import { apiInvitationToLovable } from '../lovable-bridge/invitationsAdapter';
import { eventDetailToInvitationEvent } from '../lovable-bridge/eventDetailAdapter';

export const MyInvitationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<InvitationEvent[]>([]);
  const [selected, setSelected] = useState<InvitationEvent | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchUserInvitations(userId)
      .then((data) => {
        setInvitations((data.invitations || []).map(apiInvitationToLovable));
      })
      .catch((err) => showToast(err instanceof Error ? err.message : 'Error al cargar invitaciones', 'error'))
      .finally(() => setLoading(false));
  }, [userId, showToast]);

  const openInvitation = async (inv: InvitationEvent) => {
    setSelected(inv);
    if (!inv.id) return;
    setDetailLoading(true);
    try {
      const detail = await fetchEventDetail(inv.id);
      if (detail) {
        setSelected(eventDetailToInvitationEvent(detail));
      }
    } catch {
      // mantener vista resumida de la invitación
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <Loader />
      </div>
    );
  }

  if (selected) {
    if (detailLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-secondary">
          <Loader />
        </div>
      );
    }
    return (
      <InvitationEventDetailView
        event={selected}
        onBack={() => setSelected(null)}
        onMapClick={() => navigate('/map')}
      />
    );
  }

  return (
    <MyInvitationsView
      invitations={invitations}
      onBack={() => navigate('/profile')}
      onOpenInvitation={(inv) => { void openInvitation(inv); }}
    />
  );
};

export default MyInvitationsPage;
