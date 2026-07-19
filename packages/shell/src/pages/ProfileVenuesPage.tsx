import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  deleteVenue,
  fetchOwnerProfileVenues,
  invalidateVenuesCache,
  Loader,
  patchProfilePageCounts,
  RootState,
  useToast,
} from '@doevents/shared';
import MyVenuesView from '@lovable/components/venues/MyVenuesView';
import type { PublishedVenueDraft } from '@lovable/components/venues/VenueCreator';
import { nearbyVenueToPublishedDraft } from '../lovable-bridge/venuesAdapter';

export const ProfileVenuesPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState<PublishedVenueDraft[]>([]);

  const reload = useCallback(async () => {
    if (!userId) {
      setVenues([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchOwnerProfileVenues(userId);
      setVenues(data.map(nearbyVenueToPublishedDraft));
      patchProfilePageCounts(userId, { myVenuesCount: data.length });
    } catch {
      setVenues([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleDelete = async (venue: PublishedVenueDraft) => {
    if (!userId) return;
    try {
      await deleteVenue(venue.id, userId);
      invalidateVenuesCache();
      setVenues((prev) => {
        const next = prev.filter((v) => v.id !== venue.id);
        if (userId) patchProfilePageCounts(userId, { myVenuesCount: next.length });
        return next;
      });
      showToast('Lugar eliminado', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo eliminar', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <Loader />
      </div>
    );
  }

  return (
    <MyVenuesView
      venues={venues}
      onBack={() => navigate('/profile')}
      onOpenVenue={(venue) => navigate(`/places/${venue.id}`)}
      onCreateVenue={() => navigate('/places/publish')}
      onEditVenue={(venue) => navigate(`/places/${venue.id}/edit`)}
      onDeleteVenue={handleDelete}
      onVenuePublished={(venue) => {
        setVenues((prev) => [venue, ...prev]);
        showToast('Lugar publicado', 'success');
      }}
      onGoToWall={() => navigate('/')}
    />
  );
};

export default ProfileVenuesPage;
