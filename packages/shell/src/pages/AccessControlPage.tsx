import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  fetchOrganizerStaffSummary,
  fetchStaffAssignments,
  fetchUserEvents,
  Loader,
  RootState,
} from '@doevents/shared';
import AccessControlListView from '@lovable/components/access/AccessControlListView';
import {
  mergeOrganizerStaffSummary,
  staffAssignmentsToAccessEvents,
} from '../lovable-bridge/accessAdapter';

export const AccessControlPage: React.FC = () => {
  const navigate = useNavigate();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [events, setEvents] = useState<ReturnType<typeof mergeOrganizerStaffSummary>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([
      fetchUserEvents(userId, { allEvents: true }),
      fetchOrganizerStaffSummary(userId),
      fetchStaffAssignments(userId),
    ])
      .then(([userEventsRes, staffSummary, assignments]) => {
        if (cancelled) return;
        const list = userEventsRes.data?.datosEvento || [];
        const mine = mergeOrganizerStaffSummary(list, staffSummary);
        const assigned = staffAssignmentsToAccessEvents(assignments);
        const assignedIds = new Set(assigned.map((e) => e.id));
        const merged = [
          ...mine.filter((e) => !assignedIds.has(e.id)),
          ...assigned,
        ];
        setEvents(merged);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId]);

  if (loading && !events.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <Loader />
      </div>
    );
  }

  return (
    <AccessControlListView
      events={events}
      onBack={() => navigate('/')}
      onConfigureEvent={(ev) => navigate(`/events/${ev.id}`)}
      onAssignEvent={() => navigate('/events/create')}
    />
  );
};

export default AccessControlPage;
