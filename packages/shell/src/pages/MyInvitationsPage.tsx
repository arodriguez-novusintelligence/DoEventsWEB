import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  fetchEventDetail,
  fetchUserInvitations,
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<InvitationEvent[]>([]);
  const [selected, setSelected] = useState<InvitationEvent | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadInvitations = useCallback(async () => {
    if (!userId) {
      setInvitations([]);
      setLoading(false);
      setLoadError(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchUserInvitations(userId);
      setInvitations((data.invitations || []).map(apiInvitationToLovable));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar invitaciones';
      setLoadError(message);
      setInvitations([]);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [userId, showToast]);

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

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

  if (selected) {
    if (detailLoading) {
      return (
        <MyInvitationsView
          invitations={[]}
          loading
          onBack={() => setSelected(null)}
        />
      );
    }
    return (
      <InvitationEventDetailView
        event={selected}
        onBack={() => setSelected(null)}
        onMapClick={() => navigate('/map')}
        onPurchase={() => selected.id && navigate(`/events/${selected.id}/checkout`)}
        onSuccess={() => showToast('Compra realizada', 'success')}
      />
    );
  }

  return (
    <MyInvitationsView
      invitations={invitations}
      loading={loading}
      loadError={loadError}
      onRetry={() => void loadInvitations()}
      onBack={() => navigate('/profile')}
      onOpenInvitation={(inv) => { void openInvitation(inv); }}
    />
  );
};

export default MyInvitationsPage;
