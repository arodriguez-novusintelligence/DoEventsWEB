import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  extractVenueImageUrls,
  fetchEventDetail,
  fetchUserInvitations,
  getVenueById,
  resolveImageUrl,
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
  const location = useLocation();
  const openState = (location.state || {}) as { openEventId?: string; invitationId?: string };
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

  const openInvitation = useCallback(async (inv: InvitationEvent) => {
    setSelected(inv);
    const eventId = String(inv.id || '').trim();
    if (!eventId) {
      showToast('La invitación no tiene evento asociado', 'error');
      return;
    }
    setDetailLoading(true);
    try {
      const detail = await fetchEventDetail(eventId);
      if (!detail?.event) {
        showToast('No se pudo cargar el resumen del evento', 'error');
        return;
      }

      let venueOptions: { name?: string; address?: string; images?: string[] } | undefined;
      const venueId = detail.event.venueId;
      if (venueId) {
        try {
          const venue = await getVenueById(venueId);
          const images = extractVenueImageUrls(venue as Record<string, unknown>)
            .map((url) => resolveImageUrl(url) || url)
            .filter(Boolean);
          venueOptions = {
            name: venue.name,
            address: venue.address || undefined,
            images,
          };
        } catch {
          // venue opcional
        }
      }

      const enriched = eventDetailToInvitationEvent(
        detail,
        venueOptions ? { venue: venueOptions } : undefined,
      );
      setSelected({
        ...enriched,
        receivedAt: inv.receivedAt || enriched.receivedAt,
        inviter: inv.inviter || enriched.inviter,
        status: inv.status || enriched.status,
      });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'No se pudo cargar el resumen del evento',
        'error',
      );
    } finally {
      setDetailLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!openState.openEventId || selected || loading) return;
    const match = invitations.find((inv) => inv.id === openState.openEventId);
    if (match) {
      void openInvitation(match);
    }
  }, [openState.openEventId, invitations, loading, selected, openInvitation]);

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
