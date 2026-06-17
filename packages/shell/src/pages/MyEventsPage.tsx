import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  cancelEvent,
  deleteEvent,
  duplicateEvent,
  rescheduleEvent,
  EVENTS_CACHE_INVALIDATED_EVENT,
  fetchUserEvents,
  invalidateEventsCache,
  invalidateDiscoverCache,
  Loader,
  isDraftPublishStatus,
  resolveDisplayEventStatus,
  resolveDisplayLocation,
  resolveEventImageUrl,
  RootState,
  UserEventItem,
  useToast,
  canEditEventByStatus,
  isEventScheduleInFuture,
  suggestFutureDuplicateDates,
  toApiEventDate,
} from '@doevents/shared';
import MyEventsView, { type MyEventItem } from '@lovable/components/feed/MyEventsView';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';

function isDeletedUserEvent(ev: UserEventItem): boolean {
  return String(ev.estatus || '').trim().toUpperCase() === 'DELETED';
}

function filterVisibleUserEvents(items: UserEventItem[]): UserEventItem[] {
  return items.filter((ev) => !isDeletedUserEvent(ev));
}

function formatEventDate(item: { fechaIni?: string; horaIni?: string }): string {
  return [item.fechaIni, item.horaIni].filter(Boolean).join(' - ');
}

function formatLocation(item: { direccion?: string; ciudad?: string; departamento?: string }): string {
  return resolveDisplayLocation({
    direccion: item.direccion,
    ciudad: item.ciudad,
    departamento: item.departamento,
  });
}

function toMyEventItem(ev: UserEventItem): MyEventItem {
  const schedule = {
    fechaIni: ev.fechaIni,
    fechaFin: ev.fechaFin,
    horaIni: ev.horaIni,
    horaFin: ev.horaFin,
  };
  const status = isDraftPublishStatus(ev.estatus)
    ? 'borrador' as const
    : (resolveDisplayEventStatus({
      estatus: ev.estatus,
      ...schedule,
    }) as MyEventItem['status']);
  return {
    id: ev.id,
    image: resolveEventImageUrl(ev.imagen) || '',
    title: ev.nombre,
    date: formatEventDate(ev),
    location: formatLocation(ev),
    description: ev.descripcion,
    status,
    canEdit: canEditEventByStatus(status, schedule),
    canCancel:
      String(ev.estatus || '').toLowerCase() === 'activo'
      && canEditEventByStatus('activo', schedule),
  };
}

export const MyEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<UserEventItem[]>([]);
  const [query, setQuery] = useState('');
  const [rescheduleFor, setRescheduleFor] = useState<MyEventItem | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    reason: '',
  });
  const [duplicateFor, setDuplicateFor] = useState<MyEventItem | null>(null);
  const [duplicateForm, setDuplicateForm] = useState({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  const eventsById = useMemo(
    () => new Map(events.map((ev) => [ev.id, ev])),
    [events],
  );

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((ev) =>
      [ev.nombre, ev.descripcion, ev.ciudad, ev.departamento, ev.estatus]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [events, query]);

  const myEventItems = useMemo(() => filteredEvents.map(toMyEventItem), [filteredEvents]);

  const reload = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const mine = await fetchUserEvents(userId, { forceNetwork: true, allEvents: true });
      setEvents(filterVisibleUserEvents(mine.data?.datosEvento || []));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al cargar eventos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const mine = await fetchUserEvents(userId, { forceNetwork: true, allEvents: true });
        if (!cancelled) setEvents(filterVisibleUserEvents(mine.data?.datosEvento || []));
      } catch (err) {
        if (!cancelled) {
          showToast(err instanceof Error ? err.message : 'Error al cargar eventos', 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    const onReload = () => { void load(); };
    window.addEventListener(EVENTS_CACHE_INVALIDATED_EVENT, onReload);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENTS_CACHE_INVALIDATED_EVENT, onReload);
    };
  }, [userId, showToast]);

  const handleEdit = (ev: MyEventItem) => {
    if (ev.canEdit === false) {
      showToast('Solo los eventos activos que no están en curso se pueden editar. Puedes duplicar este evento.', 'error');
      return;
    }
    navigate(`/events/${ev.id}/edit`);
  };

  const handleOpenDetail = (ev: MyEventItem) => {
    if (!ev.id) {
      showToast('No se pudo abrir el evento', 'error');
      return;
    }
    navigate(`/events/${encodeURIComponent(ev.id)}`);
  };

  const openDuplicate = (ev: MyEventItem) => {
    const source = eventsById.get(ev.id);
    const suggested = suggestFutureDuplicateDates({
      fechaIni: source?.fechaIni,
      fechaFin: source?.fechaFin,
      horaIni: source?.horaIni,
      horaFin: source?.horaFin,
    });
    setDuplicateFor(ev);
    setDuplicateForm(suggested);
  };

  const submitDuplicate = async () => {
    if (!duplicateFor) return;
    const fechaIni = toApiEventDate(duplicateForm.startDate);
    const fechaFin = toApiEventDate(duplicateForm.endDate);
    if (fechaIni.length !== 8 || fechaFin.length !== 8) {
      showToast('Ingresa fechas válidas', 'error');
      return;
    }
    if (!isEventScheduleInFuture({
      fechaIni,
      fechaFin,
      horaIni: duplicateForm.startTime,
      horaFin: duplicateForm.endTime,
    })) {
      showToast('La nueva fecha y hora deben ser futuras', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const result = await duplicateEvent(duplicateFor.id, {
        fechaIni,
        fechaFin,
        horaIni: duplicateForm.startTime || undefined,
        horaFin: duplicateForm.endTime || undefined,
      });
      invalidateEventsCache();
      await reload();
      setDuplicateFor(null);
      if (result.newEventId) {
        showToast('Copia creada. Revisa los datos y publícala.', 'success');
        navigate(`/events/create?resume=${encodeURIComponent(result.newEventId)}`);
      } else {
        showToast('Evento duplicado correctamente.', 'success');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo duplicar', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(true);
    try {
      await deleteEvent(id);
      invalidateEventsCache();
      invalidateDiscoverCache();
      setEvents((prev) => prev.filter((e) => e.id !== id));
      showToast('Evento eliminado', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo eliminar', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (ev: MyEventItem) => {
    if (ev.canCancel === false) {
      showToast('Solo puedes cancelar eventos activos que aún no han comenzado.', 'error');
      return;
    }
    if (!window.confirm(`¿Cancelar el evento "${ev.title}"?`)) return;
    setActionLoading(true);
    try {
      await cancelEvent(ev.id);
      invalidateEventsCache();
      invalidateDiscoverCache();
      await reload();
      showToast('Evento cancelado', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo cancelar', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInvite = (ev: MyEventItem) => {
    navigate('/guests', {
      state: {
        eventId: ev.id,
        openInvitation: true,
      },
    });
  };

  const openReschedule = (ev: MyEventItem) => {
    setRescheduleFor(ev);
    setRescheduleForm({ startDate: '', endDate: '', startTime: '', endTime: '', reason: '' });
  };

  const submitReschedule = async () => {
    if (!rescheduleFor) return;
    const newStartDate = toApiEventDate(rescheduleForm.startDate);
    const newEndDate = toApiEventDate(rescheduleForm.endDate);
    if (newStartDate.length !== 8 || newEndDate.length !== 8) {
      showToast('Ingresa fechas válidas', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await rescheduleEvent({
        eventId: rescheduleFor.id,
        newStartDate,
        newEndDate,
        newStartTime: rescheduleForm.startTime || undefined,
        newEndTime: rescheduleForm.endTime || undefined,
        reason: rescheduleForm.reason || 'Reprogramado por el organizador',
      });
      invalidateEventsCache();
      invalidateDiscoverCache();
      await reload();
      setRescheduleFor(null);
      showToast('Evento reprogramado', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo reprogramar', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  return (
    <>
      <MyEventsView
        events={myEventItems}
        onBack={() => navigate('/profile')}
        onEdit={handleEdit}
        onDuplicate={openDuplicate}
        onDelete={handleDelete}
        onCancel={handleCancel}
        onReschedule={openReschedule}
        onInvite={handleInvite}
        onCreate={() => navigate('/events/create')}
        onOpenDetail={handleOpenDetail}
        actionLoading={actionLoading}
        searchQuery={query}
        onSearchQueryChange={events.length > 0 ? setQuery : undefined}
      />

      {duplicateFor && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 px-4 pb-6">
          <div className="w-full max-w-lg rounded-3xl bg-card p-5 shadow-xl">
            <h2 className="text-lg font-bold text-primary">Duplicar evento</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {duplicateFor.title}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Indica la nueva fecha del evento. No se puede duplicar con fechas pasadas.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-xs font-semibold text-foreground">Fecha inicio</label>
                <Input
                  type="date"
                  value={duplicateForm.startDate}
                  onChange={(e) => setDuplicateForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-xs font-semibold text-foreground">Hora inicio</label>
                <Input
                  type="time"
                  value={duplicateForm.startTime}
                  onChange={(e) => setDuplicateForm((f) => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-xs font-semibold text-foreground">Fecha fin</label>
                <Input
                  type="date"
                  value={duplicateForm.endDate}
                  onChange={(e) => setDuplicateForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-xs font-semibold text-foreground">Hora fin</label>
                <Input
                  type="time"
                  value={duplicateForm.endTime}
                  onChange={(e) => setDuplicateForm((f) => ({ ...f, endTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => setDuplicateFor(null)}>
                Cancelar
              </Button>
              <Button className="flex-1 rounded-full" disabled={actionLoading} onClick={() => { void submitDuplicate(); }}>
                Crear copia
              </Button>
            </div>
          </div>
        </div>
      )}

      {rescheduleFor && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 px-4 pb-6">
          <div className="w-full max-w-lg rounded-3xl bg-card p-5 shadow-xl">
            <h2 className="text-lg font-bold text-primary">Reprogramar evento</h2>
            <p className="mt-1 text-sm text-muted-foreground">{rescheduleFor.title}</p>
            <div className="mt-4 space-y-3">
              <Input
                placeholder="Nueva fecha inicio (DD/MM/AAAA)"
                value={rescheduleForm.startDate}
                onChange={(e) => setRescheduleForm((f) => ({ ...f, startDate: e.target.value }))}
              />
              <Input
                placeholder="Nueva fecha fin (DD/MM/AAAA)"
                value={rescheduleForm.endDate}
                onChange={(e) => setRescheduleForm((f) => ({ ...f, endDate: e.target.value }))}
              />
              <Input
                placeholder="Hora inicio (HH:MM)"
                value={rescheduleForm.startTime}
                onChange={(e) => setRescheduleForm((f) => ({ ...f, startTime: e.target.value }))}
              />
              <Input
                placeholder="Hora fin (HH:MM)"
                value={rescheduleForm.endTime}
                onChange={(e) => setRescheduleForm((f) => ({ ...f, endTime: e.target.value }))}
              />
              <Input
                placeholder="Motivo (opcional)"
                value={rescheduleForm.reason}
                onChange={(e) => setRescheduleForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => setRescheduleFor(null)}>
                Cancelar
              </Button>
              <Button className="flex-1 rounded-full" disabled={actionLoading} onClick={() => { void submitReschedule(); }}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyEventsPage;
