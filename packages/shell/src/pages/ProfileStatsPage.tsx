import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchUserEvents, Loader, RootState } from '@doevents/shared';
import StatsEventListView from '@lovable/components/stats/StatsEventListView';
import { userEventsToStatsRooms } from '../lovable-bridge/statsAdapter';
import type { EventChatRoom } from '@lovable/data/chatData';

export const ProfileStatsPage: React.FC = () => {
  const navigate = useNavigate();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventChatRoom[]>([]);

  useEffect(() => {
    if (!userId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchUserEvents(userId, { forceNetwork: true, allEvents: true })
      .then((res) => {
        if (!cancelled) {
          setEvents(userEventsToStatsRooms(res.data?.datosEvento || []));
        }
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <StatsEventListView events={events} onBack={() => navigate('/profile')} />
    </div>
  );
};

export default ProfileStatsPage;
