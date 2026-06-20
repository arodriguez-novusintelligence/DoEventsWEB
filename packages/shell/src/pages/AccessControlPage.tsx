import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  fetchOrganizerStaffSummary,
  fetchStaffAssignments,
  fetchUserEvents,
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const loadEvents = useCallback(async () => {
    if (!userId) {
      setEvents([]);
      setLoading(false);
      setLoadError(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [userEventsRes, staffSummary, assignments] = await Promise.all([
        fetchUserEvents(userId, { allEvents: true }),
        fetchOrganizerStaffSummary(userId),
        fetchStaffAssignments(userId),
      ]);
      const list = userEventsRes.data?.datosEvento || [];
      const mine = mergeOrganizerStaffSummary(list, staffSummary);
      const assigned = staffAssignmentsToAccessEvents(assignments);
      const assignedIds = new Set(assigned.map((e) => e.id));
      setEvents([
        ...mine.filter((e) => !assignedIds.has(e.id)),
        ...assigned,
      ]);
    } catch {
      setEvents([]);
      setLoadError('No se pudieron cargar los eventos de control de acceso');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents, reloadKey]);

  return (
    <AccessControlListView
      events={events}
      loading={loading}
      loadError={loadError}
      onRetry={() => setReloadKey((k) => k + 1)}
      onBack={() => navigate('/')}
      onConfigureEvent={(ev) => navigate(`/events/${ev.id}`)}
      onAssignEvent={() => navigate('/events/create')}
    />
  );
};

export default AccessControlPage;
