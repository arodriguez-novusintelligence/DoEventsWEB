import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Landmark,
  Loader2,
  MapPin,
  RefreshCw,
  Wrench,
} from 'lucide-react';
import {
  fetchEventRefundsStatistics,
  useToast,
  type EventRefundsStatisticsResponse,
} from '@doevents/shared';
import type { EventChatRoom } from '@lovable/data/chatData';
import RefundsView from '@lovable/components/stats/RefundsView';
import { cn } from '@lovable/lib/utils';
import { formatCop } from '../../../pages/admin/AdminLayout';

type FilterId = 'all' | 'pending';
type ReservationFilter = 'all' | 'event' | 'venue' | 'service';

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Con pendientes' },
];

const TYPE_FILTERS: Array<{ id: ReservationFilter; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'event', label: 'Eventos' },
  { id: 'venue', label: 'Lugares' },
  { id: 'service', label: 'Servicios' },
];

const TYPE_LABELS = {
  event: 'Evento',
  venue: 'Lugar',
  service: 'Servicio',
} as const;

const safeNum = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const safeSum = (items: Array<{ pendingAmount?: number; completedAmount?: number; pendingCount?: number; completedCount?: number; rejectedCount?: number }>, key: 'pendingAmount' | 'completedAmount' | 'pendingCount' | 'completedCount' | 'rejectedCount') =>
  items.reduce((sum, item) => sum + safeNum(item[key]), 0);

function toEventRoom(item: NonNullable<EventRefundsStatisticsResponse['events']>[number]): EventChatRoom {
  return {
    id: item.eventId,
    eventId: item.eventId,
    eventName: item.eventName || item.eventId,
    eventDate: item.eventStartDate || '',
    eventDateRaw: item.eventStartDate,
    eventStatus: 'activo',
    lastMessage: '',
    lastMessageTime: '',
    unreadCount: 0,
    attendees: [],
    messages: [],
  };
}

/** Panel de reembolsos — API real (eventos, lugares y servicios). */
export const AdminRefundsPanel = ({ embedded = false }: { embedded?: boolean }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterId>('all');
  const [typeFilter, setTypeFilter] = useState<ReservationFilter>('all');
  const [data, setData] = useState<EventRefundsStatisticsResponse | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventChatRoom | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchEventRefundsStatistics({ limit: 200 });
      setData(result);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al cargar reembolsos', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const reservations = useMemo(
    () => (data?.events || []).filter((item) => item.eventName || item.eventExists),
    [data?.events],
  );

  const filtered = useMemo(() => {
    let list = reservations;
    if (typeFilter !== 'all') {
      list = list.filter((item) => (item.reservationType || 'event') === typeFilter);
    }
    if (filter === 'pending') {
      list = list.filter((item) => item.pendingCount > 0);
    }
    return list;
  }, [filter, reservations, typeFilter]);

  const global = useMemo(() => ({
    events: reservations.length,
    pending: safeSum(reservations, 'pendingCount'),
    completed: safeSum(reservations, 'completedCount'),
    rejected: safeSum(reservations, 'rejectedCount'),
    totalAmount: safeSum(reservations, 'completedAmount'),
    pendingAmount: safeSum(reservations, 'pendingAmount'),
  }), [reservations]);

  const openDetail = (item: NonNullable<EventRefundsStatisticsResponse['events']>[number]) => {
    const type = item.reservationType || 'event';
    if (type !== 'event') {
      showToast(`Detalle de reembolsos para ${TYPE_LABELS[type].toLowerCase()} disponible desde la reserva`, 'success');
      return;
    }
    if (!item.eventExists && !item.eventName) {
      showToast('Esta reserva ya no está disponible en la plataforma', 'error');
      return;
    }
    setSelectedEvent(toEventRoom(item));
  };

  if (selectedEvent) {
    return <RefundsView event={selectedEvent} onBack={() => setSelectedEvent(null)} />;
  }

  return (
    <div className={embedded ? 'mx-auto max-w-4xl space-y-5' : 'min-h-screen bg-background pb-24'}>
      {!embedded && (
        <div className="rounded-b-3xl bg-gradient-to-br from-primary via-primary to-accent px-4 pb-8 pt-4 text-primary-foreground">
          <button
            type="button"
            onClick={() => navigate('/admin?tab=home')}
            className="-ml-2 mb-2 flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-primary-foreground/90 transition hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver al panel
          </button>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary-foreground/15 p-3 backdrop-blur">
              <RefreshCw className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Reembolsos</h1>
              <p className="text-sm text-primary-foreground/80">
                Reembolsos de eventos, lugares y servicios
              </p>
            </div>
          </div>
        </div>
      )}

      {embedded && (
        <div className="flex items-center gap-3">
          <RefreshCw className="h-7 w-7 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Reembolsos</h2>
            <p className="text-sm text-muted-foreground">
              Reembolsos de eventos, lugares y servicios
            </p>
          </div>
        </div>
      )}

      <div className={embedded ? 'space-y-5' : 'mx-auto max-w-4xl space-y-5 p-4'}>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent/50 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Actualizar
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando reembolsos…</p>
          </div>
        )}

        {!loading && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Reservas</p>
                <p className="text-xl font-bold">{global.events}</p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Pendientes</p>
                <p className="text-xl font-bold text-amber-700">{global.pending}</p>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Completados</p>
                <p className="text-xl font-bold text-primary">{global.completed}</p>
              </div>
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive">Rechazados</p>
                <p className="text-xl font-bold text-destructive">{global.rejected}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Total reembolsado</p>
                <p className="text-lg font-bold text-primary">{formatCop(global.totalAmount)}</p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center gap-1.5 text-amber-600">
                  <Landmark className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wide">Monto pendiente</span>
                </div>
                <p className="text-lg font-bold text-amber-600">{formatCop(global.pendingAmount)}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
              <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    filter === f.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50',
                  )}
                >
                  {f.label}
                </button>
              ))}
              <span className="mx-1 h-4 w-px bg-border" />
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTypeFilter(f.id)}
                  className={cn(
                    'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    typeFilter === f.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filtered.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No hay reembolsos que coincidan con el filtro.
                </div>
              )}
              {filtered.map((item) => {
                const type = item.reservationType || 'event';
                const TypeIcon = type === 'venue' ? MapPin : type === 'service' ? Wrench : RefreshCw;
                const canOpen = type === 'event' && (item.eventExists || item.eventName);

                return (
                  <button
                    key={`${type}-${item.reservationId || item.eventId}`}
                    type="button"
                    onClick={() => openDetail(item)}
                    disabled={!canOpen}
                    className={cn(
                      'w-full rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors',
                      canOpen ? 'hover:border-primary/40 hover:bg-accent/20' : 'cursor-default opacity-95',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <TypeIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{item.eventName || item.eventId}</p>
                            <span className="mt-1 inline-flex rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {TYPE_LABELS[type]}
                            </span>
                          </div>
                          {canOpen && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                        </div>
                        {item.eventStatus && (
                          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {item.eventStatus}
                            </span>
                          </div>
                        )}

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.pendingCount > 0 && (
                            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                              {item.pendingCount} pendiente{item.pendingCount !== 1 ? 's' : ''}
                            </span>
                          )}
                          {item.completedCount > 0 && (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                              {item.completedCount} procesada{item.completedCount !== 1 ? 's' : ''}
                            </span>
                          )}
                          {item.rejectedCount > 0 && (
                            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                              {item.rejectedCount} rechazada{item.rejectedCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-3">
                          <div>
                            <p className="text-muted-foreground">Pendiente</p>
                            <p className="font-semibold">{formatCop(safeNum(item.pendingAmount))}</p>
                          </div>
                          <div>
                            <p className="inline-flex items-center gap-1 text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              Completado
                            </p>
                            <p className="font-semibold text-primary">{formatCop(safeNum(item.completedAmount))}</p>
                          </div>
                          {item.pendingCount > 0 && (
                            <div>
                              <p className="inline-flex items-center gap-1 text-muted-foreground">
                                <AlertTriangle className="h-3 w-3" />
                                Solicitudes
                              </p>
                              <p className="font-semibold text-amber-700">{item.pendingCount}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminRefundsPanel;
