import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchUserEvents, RootState } from '@doevents/shared';
import StatsEventListView from '@lovable/components/stats/StatsEventListView';
import { userEventsToStatsRooms } from '../lovable-bridge/statsAdapter';
import type { EventChatRoom } from '@lovable/data/chatData';

export const ProfileStatsPage: React.FC = () => {
  const navigate = useNavigate();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventChatRoom[]>([]);

  useEffect(() => {
    if (!userId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchUserEvents(userId, { forceNetwork: true, allEvents: true })
      .then((res) => {
        if (!cancelled) {
          setEvents(userEventsToStatsRooms(res.data?.datosEvento || []));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setEvents([]);
          setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar los eventos');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <StatsEventListView
      events={events}
      loading={loading}
      loadError={loadError}
      onBack={() => navigate('/profile')}
    />
  );
};

export default ProfileStatsPage;
